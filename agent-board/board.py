#!/usr/bin/env python3
"""
Agent Board CLI (board.py)
--------------------------
Central communication CLI for ETHGlobal Mumbai - DeFi Provenance Graph.
Uses the authenticated GitHub CLI (`gh`) to communicate via GitHub Issue comments.

Local configuration, inbox, and state are isolated in `agent-board/runtime/`
which is completely ignored by Git.

Commands:
    check                                       Check gh CLI authentication and issue access
    send <recipient> <message>                  Send a targeted message to an agent
    broadcast <message>                         Broadcast a message to @all agents
    task <task_id> <recipient> <title> <desc>   Assign a task
    status <task_id> <state> <message>          Update task status
    inbox [--clear]                             View or clear received inbox messages
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

SCRIPT_DIR = Path(__file__).resolve().parent
RUNTIME_DIR = SCRIPT_DIR / "runtime"
DEFAULT_CONFIG_PATH = RUNTIME_DIR / "config.json"
LEGACY_CONFIG_PATH = SCRIPT_DIR / "config.json"
EXAMPLE_CONFIG_PATH = SCRIPT_DIR / "config.example.json"

VALID_STATES = {"READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "COMPLETED", "PENDING", "FAILED"}
KNOWN_AGENTS = {"xohamog", "ishapalkar", "vedaxd", "all"}


def resolve_config_path(config_arg: Optional[Path] = None) -> Path:
    """Resolve config path prioritizing runtime/ then fallback to root agent-board/."""
    if config_arg and config_arg != DEFAULT_CONFIG_PATH and config_arg.is_file():
        return config_arg
    if DEFAULT_CONFIG_PATH.is_file():
        return DEFAULT_CONFIG_PATH
    if LEGACY_CONFIG_PATH.is_file():
        return LEGACY_CONFIG_PATH
    return DEFAULT_CONFIG_PATH


def resolve_inbox_path(config_path: Path) -> Path:
    """Resolve inbox path within the same directory as config."""
    inbox_path = config_path.parent / "inbox.json"
    inbox_path.parent.mkdir(parents=True, exist_ok=True)
    return inbox_path


def load_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
    """Load and validate configuration file."""
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

    required_keys = ["repo", "issue_number", "username"]
    for key in required_keys:
        if key not in config or not config[key]:
            sys.exit(f"[-] Missing required configuration key: '{key}' in {resolved_path}")

    # Attach resolved path for reference
    config["_config_path"] = resolved_path
    return config


def run_gh_command(args: List[str], check: bool = True) -> subprocess.CompletedProcess:
    """Execute a GitHub CLI command safely."""
    try:
        result = subprocess.run(
            ["gh"] + args,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
        )
        if check and result.returncode != 0:
            err_msg = result.stderr.strip() or result.stdout.strip() or f"Exit code {result.returncode}"
            sys.exit(f"[-] GitHub CLI error: {err_msg}")
        return result
    except FileNotFoundError:
        sys.exit(
            "[-] 'gh' (GitHub CLI) executable not found in PATH.\n"
            "    Please install GitHub CLI (https://cli.github.com/) and run 'gh auth login'."
        )


def get_utc_timestamp() -> str:
    """Return formatted UTC timestamp."""
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def clean_handle(handle: str) -> str:
    """Normalize agent handle by removing leading '@'."""
    return handle.strip().lstrip("@")


def validate_recipient(recipient: str) -> str:
    """Validate recipient format."""
    clean = clean_handle(recipient)
    if not clean:
        sys.exit("[-] Recipient handle cannot be empty.")
    if not re.match(r"^[a-zA-Z0-9_-]{1,39}$", clean):
        sys.exit(f"[-] Invalid recipient handle format: '{recipient}'")
    return clean


def validate_state(state: str) -> str:
    """Validate and normalize task state."""
    normalized = state.strip().upper()
    if normalized not in VALID_STATES:
        sys.exit(
            f"[-] Invalid task state: '{state}'.\n"
            f"    Supported states: {', '.join(sorted(VALID_STATES))}"
        )
    return normalized


def post_comment(config: Dict[str, Any], body: str) -> None:
    """Post comment to the configured issue using gh CLI."""
    repo = config["repo"]
    issue_number = str(config["issue_number"])

    print(f"[*] Posting comment to {repo}#issue-{issue_number}...")
    run_gh_command([
        "issue", "comment", issue_number,
        "--repo", repo,
        "--body", body
    ])
    print("[+] Successfully posted to Agent Board!")


# ---------------------------------------------------------------------------
# CLI Commands
# ---------------------------------------------------------------------------

def cmd_check(config: Dict[str, Any]) -> None:
    """Check gh CLI installation, authentication, and issue access."""
    repo = config["repo"]
    issue_number = str(config["issue_number"])
    username = config["username"]
    cfg_file = config.get("_config_path", DEFAULT_CONFIG_PATH)

    print("==================================================")
    print(" Agent Board Diagnostic & Check")
    print("==================================================")
    print(f"Config File Path      : {cfg_file}")
    print(f"Runtime Directory     : {cfg_file.parent}")
    print(f"Configured Repository : {repo}")
    print(f"Configured Issue      : #{issue_number}")
    print(f"Configured Agent      : @{username}")
    print("--------------------------------------------------")

    # 1. Check gh installed & version
    version_res = run_gh_command(["--version"], check=False)
    if version_res.returncode != 0:
        print("[-] GitHub CLI: NOT FOUND")
        sys.exit(1)
    version_line = version_res.stdout.splitlines()[0] if version_res.stdout else "Installed"
    print(f"[+] GitHub CLI         : {version_line}")

    # 2. Check auth status
    auth_res = run_gh_command(["auth", "status"], check=False)
    auth_output = (auth_res.stdout + "\n" + auth_res.stderr).strip()
    if auth_res.returncode != 0 or "Logged in to" not in auth_output:
        print("[-] GitHub Auth Status : FAILED / NOT LOGGED IN")
        print(f"    Details: {auth_output}")
        print("    Please run: gh auth login")
        sys.exit(1)
    print("[+] GitHub Auth Status : LOGGED IN")

    # 3. Check issue access
    issue_res = run_gh_command([
        "issue", "view", issue_number,
        "--repo", repo,
        "--json", "title,state,url"
    ], check=False)

    if issue_res.returncode != 0:
        print(f"[-] Issue Access       : FAILED to access {repo}#{issue_number}")
        print(f"    Error: {issue_res.stderr.strip()}")
        sys.exit(1)

    try:
        issue_data = json.loads(issue_res.stdout)
        print(f"[+] Issue Access       : ACCESSIBLE (State: {issue_data.get('state')})")
        print(f"    Title             : {issue_data.get('title')}")
        print(f"    URL               : {issue_data.get('url')}")
    except json.JSONDecodeError:
        print("[+] Issue Access       : ACCESSIBLE")

    print("--------------------------------------------------")
    print("[+] All Agent Board checks PASSED! System is ready.")
    print("==================================================")


def cmd_send(config: Dict[str, Any], recipient: str, message: str) -> None:
    """Send targeted message."""
    clean_target = validate_recipient(recipient)
    username = config["username"]
    timestamp = get_utc_timestamp()

    body = (
        f"### 📨 Targeted Message\n"
        f"**TO:** @{clean_target}\n"
        f"**FROM:** @{username}\n"
        f"**TIMESTAMP:** {timestamp}\n\n"
        f"@{clean_target} {message.strip()}\n"
    )
    post_comment(config, body)


def cmd_broadcast(config: Dict[str, Any], message: str) -> None:
    """Send broadcast message to @all."""
    username = config["username"]
    timestamp = get_utc_timestamp()

    body = (
        f"### 📢 Broadcast Message\n"
        f"**TO:** @all\n"
        f"**FROM:** @{username}\n"
        f"**TIMESTAMP:** {timestamp}\n\n"
        f"@all {message.strip()}\n"
    )
    post_comment(config, body)


def cmd_task(config: Dict[str, Any], task_id: str, recipient: str, title: str, description: str) -> None:
    """Assign task to an agent."""
    clean_target = validate_recipient(recipient)
    username = config["username"]
    timestamp = get_utc_timestamp()
    clean_task_id = task_id.strip()

    body = (
        f"### 📋 Task Assignment\n"
        f"**TASK:** {clean_task_id}\n"
        f"**TO:** @{clean_target}\n"
        f"**FROM:** @{username}\n"
        f"**TITLE:** {title.strip()}\n"
        f"**STATE:** READY\n"
        f"**TIMESTAMP:** {timestamp}\n\n"
        f"**DESCRIPTION:**\n"
        f"{description.strip()}\n"
    )
    post_comment(config, body)


def cmd_status(config: Dict[str, Any], task_id: str, state: str, message: str) -> None:
    """Update task status."""
    valid_state = validate_state(state)
    username = config["username"]
    timestamp = get_utc_timestamp()
    clean_task_id = task_id.strip()

    body = (
        f"### 🔄 Task Status Update\n"
        f"**STATUS:** {clean_task_id}\n"
        f"**FROM:** @{username}\n"
        f"**STATE:** {valid_state}\n"
        f"**TIMESTAMP:** {timestamp}\n\n"
        f"**MESSAGE:**\n"
        f"{message.strip()}\n"
    )
    post_comment(config, body)


def cmd_inbox(inbox_path: Path, clear: bool = False) -> None:
    """Display or clear inbox messages."""
    if clear:
        if inbox_path.is_file():
            try:
                with open(inbox_path, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)
                print(f"[+] Inbox cleared successfully at {inbox_path}.")
            except OSError as err:
                sys.exit(f"[-] Failed to clear inbox: {err}")
        else:
            print(f"[*] Inbox is already empty ({inbox_path} not found).")
        return

    if not inbox_path.is_file():
        print(f"[*] Inbox is empty (no {inbox_path.name} found). Run poller.py to start receiving messages.")
        return

    try:
        with open(inbox_path, "r", encoding="utf-8") as f:
            messages = json.load(f)
    except json.JSONDecodeError:
        sys.exit(f"[-] Corrupted inbox file at {inbox_path}. Use --clear to reset.")

    if not messages:
        print("[*] Inbox is empty. No new messages.")
        return

    print("==================================================")
    print(f" Agent Board Inbox ({len(messages)} message(s))")
    print(f" Source: {inbox_path}")
    print("==================================================")

    for idx, msg in enumerate(messages, 1):
        msg_id = msg.get("id", "N/A")
        author = msg.get("author", "unknown")
        created_at = msg.get("created_at", "N/A")
        body = msg.get("body", "").strip()
        url = msg.get("url", "")

        print(f"\n[{idx}] Message #{msg_id} | From: @{author} | Date: {created_at}")
        if url:
            print(f"    URL: {url}")
        print("    " + "-" * 46)
        for line in body.splitlines():
            print(f"    {line}")

    print("\n==================================================")
    print("Tip: Use 'python agent-board/board.py inbox --clear' to clear messages.")


# ---------------------------------------------------------------------------
# Argument Parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="board.py",
        description="Agent Board CLI for cross-PC GitHub Issue communication."
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help="Path to configuration JSON file (default: agent-board/runtime/config.json)"
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # check
    subparsers.add_parser("check", help="Check gh CLI authentication and issue access")

    # send <recipient> <message>
    p_send = subparsers.add_parser("send", help="Send a targeted message to an agent")
    p_send.add_argument("recipient", help="Recipient agent handle (e.g. Ishapalkar or @Ishapalkar)")
    p_send.add_argument("message", help="Message body")

    # broadcast <message>
    p_broadcast = subparsers.add_parser("broadcast", help="Broadcast message to all agents (@all)")
    p_broadcast.add_argument("message", help="Broadcast message body")

    # task <task_id> <recipient> <title> <description>
    p_task = subparsers.add_parser("task", help="Assign a task to an agent")
    p_task.add_argument("task_id", help="Unique task identifier (e.g. TASK-001)")
    p_task.add_argument("recipient", help="Agent to assign task to")
    p_task.add_argument("title", help="Short task title")
    p_task.add_argument("description", help="Detailed task description")

    # status <task_id> <state> <message>
    p_status = subparsers.add_parser("status", help="Update task status")
    p_status.add_argument("task_id", help="Task identifier (e.g. TASK-001)")
    p_status.add_argument("state", help=f"Task state ({', '.join(sorted(VALID_STATES))})")
    p_status.add_argument("message", help="Status update notes/message")

    # inbox [--clear]
    p_inbox = subparsers.add_parser("inbox", help="Display received messages in the local inbox")
    p_inbox.add_argument("--clear", action="store_true", help="Clear all stored messages from inbox")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # Determine resolved config path
    config_path = resolve_config_path(args.config)

    # Commands that do not require loading full GitHub config
    if args.command == "inbox":
        inbox_file = resolve_inbox_path(config_path)
        cmd_inbox(inbox_file, clear=args.clear)
        return

    # Commands that require config
    config = load_config(config_path)

    if args.command == "check":
        cmd_check(config)
    elif args.command == "send":
        cmd_send(config, args.recipient, args.message)
    elif args.command == "broadcast":
        cmd_broadcast(config, args.message)
    elif args.command == "task":
        cmd_task(config, args.task_id, args.recipient, args.title, args.description)
    elif args.command == "status":
        cmd_status(config, args.task_id, args.state, args.message)


if __name__ == "__main__":
    main()
