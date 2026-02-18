---
name: package-script-writer
description: Generate Umbraco CMS installation scripts using the Package Script Writer CLI
user_invocable: true
---

# Package Script Writer (psw)

Generate and run Umbraco CMS installation scripts using the `psw` CLI tool.

## Workflow

1. **Check if PSW CLI is installed:**
   ```bash
   psw --version
   ```

   If command not found, the .NET tools path may not be in PATH. Try:
   - **Linux/Mac:** `export PATH="$PATH:$HOME/.dotnet/tools" && psw --version`
   - **Windows:** `%USERPROFILE%\.dotnet\tools\psw --version`

2. **If not installed, install it:**
   ```bash
   dotnet tool install --global PackageScriptWriter.Cli
   ```

3. **Then run the psw command** (see below)

## Non-Interactive Usage (Claude Code)

**This is the command to use:**

```bash
export PATH="$PATH:$HOME/.dotnet/tools"
psw -d -n ProjectName -s ProjectName -u --database-type SQLite --admin-email admin@test.com --admin-password SecurePass1234 --auto-run
```

Run this with `run_in_background: true` since Umbraco is a long-running web server.

**Critical flags:**
- `-d` - **REQUIRED** - generates the full installation script (without this, only `dotnet run` is generated which fails)
- `-u` - use unattended install defaults
- `--auto-run` - execute the script immediately
- Never combine `-o` with `--auto-run` (truncates the script)

**Default credentials:** `admin@test.com` / `SecurePass1234`

## With Packages

```bash
psw -d -n ProjectName -s ProjectName -u --database-type SQLite --admin-email admin@test.com --admin-password "SecurePass1234" -p "uSync,Umbraco.Forms" --auto-run
```

With specific versions:
```bash
psw -d -n ProjectName -s ProjectName -u --database-type SQLite --admin-email admin@test.com --admin-password "SecurePass1234" -p "uSync|17.0.0,Umbraco.Forms|17.0.1" --auto-run
```

## IMPORTANT
Do not use characters that are escapable in passwords or usernames

## Key Options

| Flag | Description |
|------|-------------|
| `-d, --default` | **REQUIRED** - generates full installation script |
| `-n, --project-name` | Project name |
| `-s, --solution` | Solution name |
| `-u, --unattended-defaults` | Use unattended install defaults |
| `--database-type` | SQLite, LocalDb, SQLServer, SQLAzure, SQLCE |
| `--admin-email` | Admin email for unattended install |
| `--admin-password` | Admin password for unattended install |
| `--auto-run` | Execute the generated script |
| `-p, --packages` | Comma-separated packages (e.g., "uSync,Umbraco.Forms") |
| `-t, --template-package` | Umbraco template with optional version |
| `-da, --delivery-api` | Enable Content Delivery API |

## Waiting for Umbraco to Start

After running the command in background, poll for readiness:

```bash
# Check the output for the port number (e.g., "Now listening on: https://localhost:44356")
# Then poll until ready:
for i in {1..30}; do
  if nc -z localhost 44356 2>/dev/null; then
    echo "Umbraco is ready!"
    break
  fi
  sleep 2
done
```

## Other Commands

```bash
psw versions              # Show Umbraco versions with support status
psw history list          # Show recent scripts
psw history rerun 1       # Re-run script #1
psw --clear-cache         # Clear cached API responses
```
