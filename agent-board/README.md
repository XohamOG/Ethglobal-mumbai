# Agent Board (GitHub Issue #1 Communication)

The **Agent Board** provides a decentralized, reliable, cross-machine coordination mechanism for the ETHGlobal Mumbai team. All three developer agents communicate asynchronously via comments on a centralized GitHub Issue:

🔗 **Central Board**: [ETHGlobal Mumbai Issue #1](https://github.com/XohamOG/Ethglobal-mumbai/issues/1)

---

## 🏛️ Local Runtime Directory Architecture

To guarantee strict isolation and prevent accidental commits of local state, each PC maintains its own local **`agent-board/runtime/`** directory.

```text
agent-board/
├── board.py            # Shared CLI interface
├── poller.py           # Shared background polling daemon
├── config.example.json # Shared configuration template
├── README.md           # Documentation
│
└── runtime/            # ⚠️ LOCAL TO EACH PC (IGNORED BY GIT)
    ├── config.json     # Local machine configuration
    ├── inbox.json      # Local received messages inbox
    └── state.json      # Local synchronization checkpoint & comment ID
```

### Why `runtime/`?
1. **Clean Git Hygiene**: The entire `runtime/` directory is excluded in `.gitignore`. No local files can ever be accidentally staged or committed.
2. **Independent Comment Tracking**: Each PC maintains its own `runtime/state.json` recording its independent `last_comment_id`. This guarantees that polling on one PC never interferes with or skips messages for another PC.
3. **Dedicated Inbox**: Messages received for the local agent are cleanly stored in `runtime/inbox.json`.

---

## 🛠️ Prerequisites & Installation

### 1. Python 3.9+
The Agent Board uses only the Python standard library. **No external `pip` dependencies are required.**
Verify your Python installation:
```powershell
python --version
```

### 2. GitHub CLI (`gh`)
The Agent Board relies on the official GitHub CLI for authentication and API communication.
- **Install on Windows** (via winget or Scoop):
  ```powershell
  winget install --id GitHub.cli
  ```
  *(Or download the installer from [cli.github.com](https://cli.github.com/))*
- **Install on macOS**:
  ```bash
  brew install gh
  ```
- **Install on Linux**:
  ```bash
  sudo apt install gh
  ```

### 3. Authenticate GitHub CLI
Each developer must authenticate their GitHub account:
```powershell
gh auth login
```
Select:
1. `GitHub.com`
2. `HTTPS`
3. Authenticate with a web browser (or paste a personal token with `repo` scope).

Verify authentication:
```powershell
gh auth status
```

---

## ⚙️ Configuration Setup

1. Create your local `runtime/` folder and copy the template:
   ```powershell
   New-Item -ItemType Directory -Path agent-board/runtime -Force
   Copy-Item agent-board/config.example.json agent-board/runtime/config.json
   ```
   *(Or on Linux/macOS: `mkdir -p agent-board/runtime && cp agent-board/config.example.json agent-board/runtime/config.json`)*

2. Edit `agent-board/runtime/config.json` for your assigned machine:

### PC 1 — Frontend (`XohamOG`)
```json
{
  "repo": "XohamOG/Ethglobal-mumbai",
  "issue_number": 1,
  "username": "XohamOG",
  "poll_interval": 10
}
```

### PC 2 — Smart Contracts & CRE (`Ishapalkar`)
```json
{
  "repo": "XohamOG/Ethglobal-mumbai",
  "issue_number": 1,
  "username": "Ishapalkar",
  "poll_interval": 10
}
```

### PC 3 — Graph Infrastructure & Storage (`vedaXD`)
```json
{
  "repo": "XohamOG/Ethglobal-mumbai",
  "issue_number": 1,
  "username": "vedaXD",
  "poll_interval": 10
}
```

---

## 🚀 Usage

### 1. Verify Environment & Issue Access
```powershell
python agent-board/board.py check
```

### 2. Send a Targeted Message
Send a message addressed to a specific agent:
```powershell
python agent-board/board.py send Ishapalkar "Contract ABI for LineageRegistry is ready for review."
```
*(Handles handles with or without `@`, e.g. `Ishapalkar` or `@Ishapalkar`)*

### 3. Broadcast to All Agents
Broadcast an announcement to `@all`:
```powershell
python agent-board/board.py broadcast "Frontend mock service is up on localhost:3000."
```

### 4. Assign a Task
Assign a tracked task to an agent:
```powershell
python agent-board/board.py task TASK-001 vedaXD "Implement Arkiv Node Schema" "Define node and edge schemas for token swaps in storage/arkiv."
```

### 5. Update Task Status
Update the status of an assigned task:
```powershell
python agent-board/board.py status TASK-001 IN_PROGRESS "Started schema definition in storage/arkiv."
```
Supported status values:
- `READY`
- `IN_PROGRESS`
- `BLOCKED`
- `REVIEW`
- `DONE` (or `COMPLETED`)

### 6. Inspect & Clear Local Inbox
- **View incoming messages**:
  ```powershell
  python agent-board/board.py inbox
  ```
- **Clear displayed messages**:
  ```powershell
  python agent-board/board.py inbox --clear
  ```

---

## 📡 Running the Poller

The poller continuously monitors Issue #1 for messages addressed to your username or `@all`.

### Start the Poller
Open a dedicated terminal window and run:
```powershell
python agent-board/poller.py
```

### Poller Options
- `--verbose` / `-v`: Print status on every poll cycle.
- `--interval <seconds>`: Override default 10-second polling interval.
- `--once`: Run a single poll check and exit.

```powershell
python agent-board/poller.py --verbose --interval 5
```

### Stop the Poller
Press `Ctrl+C` in the poller terminal. The poller shuts down gracefully without data loss.

---

## 🔒 Safety Guarantees

1. **No Code Execution**: The poller and board CLI **strictly store and display message text**. They never execute terminal commands, shell scripts, or instructions received through comments.
2. **Autonomous Isolation**: The poller does not attempt to launch, trigger, or wake Antigravity or any AI agent runtime.
3. **First-Run Baseline**: On initial run, the poller records the latest comment ID as baseline in `runtime/state.json` and does not treat historical comments as unread messages.
4. **Idempotency & Deduplication**: Messages are tracked by unique GitHub Comment ID to prevent duplicate inbox entries.

---

## ❓ Troubleshooting

| Issue | Cause | Resolution |
|---|---|---|
| `gh: command not found` | GitHub CLI is not installed or not in system PATH | Install `gh` and restart your terminal. |
| `GitHub CLI error: Not Logged In` | `gh` session expired or unauthenticated | Run `gh auth login` and complete the browser prompt. |
| `Configuration file not found` | `agent-board/runtime/config.json` has not been created | Copy `config.example.json` to `agent-board/runtime/config.json`. |
| `Could not resolve to an Issue` | Issue #1 inaccessible or repository invitation not accepted | Ensure you have accepted the repository invite from `XohamOG` and can view `https://github.com/XohamOG/Ethglobal-mumbai/issues/1`. |
| Rate limit exceeded | Polling too frequently on unauthenticated requests | Ensure `gh auth login` is active; authenticated requests have a 5,000 req/hr limit. |
