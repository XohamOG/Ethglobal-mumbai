#!/usr/bin/env python3
"""
Agent Board Poller (poller.py)
------------------------------
Continuously polls the centralized GitHub Issue for messages addressed to the local agent.
Persists messages to `runtime/inbox.json` and tracks state in `runtime/state.json`.

Usage:
    python poller.py [--config runtime/config.json] [--interval SECONDS] [--once] [--verbose]

Safety Rules:
    - Only receives and stores messages; NEVER executes code or commands from comments.
    - Does NOT attempt to wake or launch Antigravity.
    - Can be stopped gracefully at any time with Ctrl+C.
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

SCRIPT_DIR = Path(__file__).resolve().parent
RUNTIME_DIR = SCRIPT_DIR / "runtime"
DEFAULT_CONFIG_PATH = RUNTIME_DIR / "config.json"
LEGACY_CONFIG_PATH = SCRIPT_DIR / "config.json"
EXAMPLE_CONFIG_PATH = SCRIPT_DIR / "config.example.json"


def get_utc_timestamp() -> str:
    """Return formatted UTC timestamp."""
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def resolve_config_path(config_arg: Optional[Path] = None) -> Path:
    """Resolve config path prioritizing runtime/ then fallback to root agent-board/."""
    if config_arg and config_arg != DEFAULT_CONFIG_PATH and config_arg.is_file():
        return config_arg
    if DEFAULT_CONFIG_PATH.is_file():
        return DEFAULT_CONFIG_PATH
    if LEGACY_CONFIG_PATH.is_file():
        return LEGACY_CONFIG_PATH
    return DEFAULT_CONFIG_PATH


def load_config(config_path: Path) -> Dict[str, Any]:
    """Load configuration from JSON."""
    resolved_path = resolve_config_path(config_path)

    if not resolved_path.is_file():
        RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
        sys.exit(
            f"[-] Configuration file not found at: {resolved_path}\n"
            f"    Please copy {EXAMPLE_CONFIG_PATH} to {DEFAULT_CONFIG_PATH} and set your parameters."
        )

    try:
        with open(resolved_path, "r", encoding="utf-8") as f:
            config = json.load(f)
    except json.JSONDecodeError as err:
        sys.exit(f"[-] Invalid JSON in configuration file: {err}")

    for key in ["repo", "issue_number", "username"]:
        if key not in config or not config[key]:
            sys.exit(f"[-] Missing required configuration key: '{key}' in {resolved_path}")

    config["_config_path"] = resolved_path
    return config


def load_state(state_path: Path) -> Dict[str, Any]:
    """Load poller state from disk."""
    if not state_path.is_file():
        return {}
    try:
        with open(state_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def save_state(state_path: Path, state: Dict[str, Any]) -> None:
    """Save poller state to disk atomically."""
    state_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = state_path.with_suffix(".tmp")
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        temp_path.replace(state_path)
    except OSError as err:
        print(f"[!] Warning: Failed to save state to {state_path}: {err}", file=sys.stderr)


def load_inbox(inbox_path: Path) -> List[Dict[str, Any]]:
    """Load local inbox from disk."""
    if not inbox_path.is_file():
        return []
    try:
        with open(inbox_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def save_inbox(inbox_path: Path, messages: List[Dict[str, Any]]) -> None:
    """Save local inbox to disk atomically."""
    inbox_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = inbox_path.with_suffix(".tmp")
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(messages, f, indent=2)
        temp_path.replace(inbox_path)
    except OSError as err:
        print(f"[!] Warning: Failed to save inbox to {inbox_path}: {err}", file=sys.stderr)


def fetch_comments(repo: str, issue_number: int) -> Optional[List[Dict[str, Any]]]:
    """Fetch comments for the issue via GitHub CLI."""
    try:
        result = subprocess.run(
            ["gh", "api", f"repos/{repo}/issues/{issue_number}/comments", "--paginate"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            timeout=30,
        )
        if result.returncode != 0:
            err = result.stderr.strip() or f"Exit code {result.returncode}"
            print(f"[{get_utc_timestamp()}] [!] GitHub API error: {err}", file=sys.stderr)
            return None

        data = json.loads(result.stdout)
        if isinstance(data, list):
            return data
        return None
    except subprocess.TimeoutExpired:
        print(f"[{get_utc_timestamp()}] [!] Request timed out while fetching comments.", file=sys.stderr)
        return None
    except FileNotFoundError:
        print(f"[{get_utc_timestamp()}] [!] 'gh' executable not found in PATH.", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"[{get_utc_timestamp()}] [!] Unexpected error while fetching comments: {exc}", file=sys.stderr)
        return None


def is_addressed_to_agent(body: str, username: str) -> bool:
    """
    Check if a comment body is addressed to this agent.
    Matches:
      - @username
      - @all
      - TO: @username / TO: username
      - ASSIGNED TO: @username
    """
    clean_name = username.strip().lstrip("@")
    pattern = (
        rf"(?i)("
        rf"@{re.escape(clean_name)}\b|"
        rf"@all\b|"
        rf"TO:\s*@?{re.escape(clean_name)}\b|"
        rf"ASSIGNED\s+TO:\s*@?{re.escape(clean_name)}\b"
        rf")"
    )
    return bool(re.search(pattern, body))


def poll_cycle(
    config: Dict[str, Any],
    state_path: Path,
    inbox_path: Path,
    state: Dict[str, Any],
    verbose: bool = False
) -> Dict[str, Any]:
    """Execute a single polling cycle."""
    repo = config["repo"]
    issue_number = int(config["issue_number"])
    username = config["username"]
    last_comment_id = state.get("last_comment_id", 0)

    comments = fetch_comments(repo, issue_number)
    if comments is None:
        # Network or API error occurred, skip cycle without updating state
        return state

    # Handle first-run initialization: set baseline to latest comment
    if not state.get("initialized"):
        latest_existing_id = max((c.get("id", 0) for c in comments), default=0)
        state["initialized"] = True
        state["last_comment_id"] = latest_existing_id
        state["initialized_at"] = get_utc_timestamp()
        state["last_poll_at"] = get_utc_timestamp()
        save_state(state_path, state)
        if not inbox_path.is_file():
            save_inbox(inbox_path, [])
        print(f"[{get_utc_timestamp()}] [INIT] Baseline established at comment ID #{latest_existing_id}.")
        print(f"[{get_utc_timestamp()}] [INIT] Historical comments skipped. Poller is now actively monitoring.")
        return state

    inbox = load_inbox(inbox_path)
    existing_inbox_ids: Set[int] = {msg.get("id") for msg in inbox if "id" in msg}

    new_messages_found = 0
    highest_seen_id = last_comment_id

    for comment in comments:
        comment_id = comment.get("id", 0)
        highest_seen_id = max(highest_seen_id, comment_id)

        # Skip comments already processed in prior cycles
        if comment_id <= last_comment_id:
            continue

        author = comment.get("user", {}).get("login", "")
        # Ignore comments authored by the current agent
        if author.lower() == username.lower():
            continue

        body = comment.get("body", "")
        # Check if addressed to this agent or @all
        if is_addressed_to_agent(body, username):
            if comment_id not in existing_inbox_ids:
                message_entry = {
                    "id": comment_id,
                    "author": author,
                    "created_at": comment.get("created_at"),
                    "body": body,
                    "url": comment.get("html_url", ""),
                    "received_at": get_utc_timestamp(),
                    "read": False
                }
                inbox.append(message_entry)
                existing_inbox_ids.add(comment_id)
                new_messages_found += 1

                # Clean single-line preview for log
                first_line = body.strip().splitlines()[0] if body.strip() else ""
                preview = (first_line[:60] + "...") if len(first_line) > 60 else first_line
                print(f"[{get_utc_timestamp()}] 🔔 [NEW MESSAGE] From: @{author} (ID: #{comment_id})")
                print(f"    Preview: {preview}")

    # Persist changes
    if new_messages_found > 0:
        save_inbox(inbox_path, inbox)
        print(f"[{get_utc_timestamp()}] [+] {new_messages_found} new message(s) saved to {inbox_path.name}")

    state["last_comment_id"] = highest_seen_id
    state["last_poll_at"] = get_utc_timestamp()
    save_state(state_path, state)

    if verbose and new_messages_found == 0:
        print(f"[{get_utc_timestamp()}] [.] Polled {len(comments)} comment(s). No new messages.")

    return state


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="poller.py",
        description="Continuously poll GitHub Issue for incoming agent messages."
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help="Path to configuration JSON file (default: agent-board/runtime/config.json)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help="Polling interval in seconds (overrides config.json, default: 10)"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single poll cycle and exit"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print verbose status on every poll cycle"
    )

    args = parser.parse_args()
    config = load_config(args.config)
    resolved_config_path = config["_config_path"]
    runtime_dir = resolved_config_path.parent

    poll_interval = args.interval or int(config.get("poll_interval", 10))
    state_path = runtime_dir / "state.json"
    inbox_path = runtime_dir / "inbox.json"

    print("==================================================")
    print(" Agent Board Poller Started")
    print("==================================================")
    print(f"Repository      : {config['repo']}")
    print(f"Issue Number    : #{config['issue_number']}")
    print(f"Agent Identity  : @{config['username']}")
    print(f"Poll Interval   : {poll_interval}s")
    print(f"Runtime Path    : {runtime_dir}")
    print(f"Inbox Storage   : {inbox_path}")
    print(f"State Storage   : {state_path}")
    print("--------------------------------------------------")
    print("Press Ctrl+C to stop the poller gracefully.")
    print("==================================================")

    state = load_state(state_path)

    try:
        while True:
            state = poll_cycle(config, state_path, inbox_path, state, verbose=args.verbose)
            if args.once:
                break
            time.sleep(poll_interval)
    except KeyboardInterrupt:
        print(f"\n[{get_utc_timestamp()}] [INFO] Poller stopped gracefully by user (Ctrl+C).")
        sys.exit(0)


if __name__ == "__main__":
    main()
