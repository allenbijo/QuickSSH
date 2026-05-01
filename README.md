<p align="center">
  <img src="resources/icon.ico" alt="Quick SSH" width="96" />
</p>

# Quick SSH

A cross-platform desktop app for managing SSH port forwards. Group multiple forwards under named aliases and toggle them on or off with a single click.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

---

## What it does

Quick SSH reads your `~/.ssh/config`, lets you pick SSH hosts, and manages `ssh -L` tunnel processes for you. No terminal juggling — one toggle per alias.

- Group multiple port forwards into a named alias
- Start/stop all forwards in a group with one toggle
- Watch real-time status (connecting → connected → error)
- Open an interactive SSH terminal session inside the app
- Configure a custom SSH config path in Settings

---

## Prerequisites

| Requirement | Notes |
|---|---|
| OpenSSH client | Must be on `PATH` as `ssh`. Comes with Windows 10+, macOS, and most Linux distros. |
| SSH config with hosts | App reads `~/.ssh/config` to populate the host selector. |

No other runtime is required when using a pre-built release.

---

## Installation

### Pre-built releases

Download from the [Releases](../../releases) page:

| Platform | File |
|---|---|
| Windows | `Quick SSH-*.exe` (NSIS installer) or `.zip` |
| macOS | `Quick SSH-*.dmg` |
| Linux | `Quick SSH-*.AppImage`, `.deb`, or `.tar.gz` |

#### macOS note

The DMG is ad-hoc signed (no Apple Developer certificate). macOS Gatekeeper will block it on first open.

**To bypass Gatekeeper:**
1. Open Finder and locate the `.app` (inside the mounted DMG or your Applications folder).
2. Right-click (or Control-click) the `.app` → **Open**.
3. Click **Open** in the dialog that appears.

You only need to do this once. Subsequent launches work normally.

Alternatively, via Terminal:
```sh
xattr -dr com.apple.quarantine /Applications/Quick SSH.app
```

---

## First launch

1. Open Quick SSH.
2. Click the **Settings** gear icon (top-right).
3. Verify the SSH config path (defaults to `~/.ssh/config`). Change it if your config is elsewhere.
4. The **Detected SSH Hosts** table shows all non-wildcard hosts found in the config. If it is empty, check the path.
5. Navigate back to **Tunnels** (click the gear again).

---

## Creating an alias

1. Click **New Alias** (or **Create Alias** on the empty state screen).
2. Enter a name (e.g. `Production DB`).
3. Fill in one or more port forwards:
   - **Local Port** — port on your machine (e.g. `5432`)
   - **Remote Port** — port on the remote server (e.g. `5432`)
   - **Remote Host** — host the remote server connects to (e.g. `localhost` or `db.internal`)
   - **SSH Host** — pick a host from the dropdown (populated from your SSH config)
4. Click **Add** to add more forwards to the same alias.
5. Click **Create Alias**.

This is equivalent to running:
```sh
ssh -N -L 5432:localhost:5432 prod-server
```

---

## Using tunnels

| Action | How |
|---|---|
| Connect | Toggle the switch on an alias card to the right (green) |
| Disconnect | Toggle the switch back to the left |
| Disconnect all | Click **Disconnect All** in the title bar |
| Reconnect | Click the **↺** icon on an active alias card |
| Edit | Click the **pencil** icon |
| Delete | Click the **trash** icon |
| Terminal | Click the **terminal** icon — opens an interactive SSH shell in a panel at the bottom |

**Status indicators:**

| Color | Meaning |
|---|---|
| Green dot | Connected |
| Yellow dot (pulsing) | Connecting |
| Red dot | Error (hover to see error in title bar) |
| Grey dot | Disconnected |

---

## Settings

| Setting | Description |
|---|---|
| SSH Config Path | Path to your SSH config file. Leave blank to use `~/.ssh/config`. |
| Default Local Port | Starting port number used when creating a new forward. Increments by 1 for each additional forward. |

Click **Refresh Hosts** after changing the config path.

---

## Building from source

**Requirements:** Node.js 18+, npm.

```sh
git clone https://github.com/yourusername/port-forward.git
cd port-forward
npm install
npm run dev        # development mode with hot reload
```

```sh
npm run build      # compile only
npm run package    # compile + create distributable in dist/
```

### Platform-specific packaging

```sh
npx electron-builder --win    # Windows NSIS + zip
npx electron-builder --mac    # macOS DMG (ad-hoc signed)
npx electron-builder --linux  # AppImage + deb + tar.gz
```

Linux packaging requires `rpm` and `fakeroot`:
```sh
sudo apt-get install -y rpm fakeroot
```

---

## Troubleshooting

**App won't open on macOS** — See the [Gatekeeper bypass](#macos-note) instructions above.

**No hosts in the dropdown** — Check Settings → SSH Config Path. The file must contain `Host` entries without wildcards.

**Tunnel shows error immediately** — SSH could not connect. Common causes:
- Host unreachable / wrong hostname
- Wrong user or identity file
- Port already in use locally (`Address already in use`)
- SSH key passphrase prompt needed — run `ssh-add` first so ssh-agent handles it, or configure `IdentityFile` in your SSH config

**Terminal shows garbled output** — The terminal emulates `xterm-256color`. If the remote shell outputs unexpected characters, run `export TERM=xterm-256color` in the remote shell.

**Tunnel appears connected but forwarding doesn't work** — SSH reports connected after 2.5 seconds regardless of actual forwarding success. If a local port is already bound, SSH exits but the 2.5s window may have already passed. Check with `lsof -i :PORT` (macOS/Linux) or `netstat -ano | findstr PORT` (Windows).

---

## Security notes

- The app uses your system `ssh` binary. All SSH options (keys, agents, jump hosts, known_hosts) are handled by your existing SSH setup.
- New host keys are auto-accepted (`StrictHostKeyChecking=accept-new`). On first connect to a new host, verify the fingerprint manually via a separate `ssh` call if the connection is to a sensitive target.
- No credentials are stored by this app. Key passphrases are handled by `ssh-agent` or SSH's own passphrase prompt.

---

## License

MIT
