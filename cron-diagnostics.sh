#!/bin/bash
# Supply-chain-claw Phase A diagnostics
# Lock file ensures single-run globally across workspace

LOCK_FILE="/tmp/openclaw-global-job.lock"
LOCK_TIMEOUT_MIN=45
LOCK_TIMEOUT_SEC=$((LOCK_TIMEOUT_MIN * 60))

# Check for existing lock
if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE_SEC=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || stat -f %m "$LOCK_FILE") ))
    
    if [ "$LOCK_AGE_SEC" -lt "$LOCK_TIMEOUT_SEC" ]; then
        echo "[SKIP] Lock file fresh (${LOCK_AGE_SEC}s old < ${LOCK_TIMEOUT_SEC}s timeout). Another job may be running."
        exit 0
    else
        echo "[STALE LOCK] Lock file aged ${LOCK_AGE_SEC}s, clearing..."
        rm -f "$LOCK_FILE"
    fi
fi

# Create/update lock
echo $$ > "$LOCK_FILE"
touch "$LOCK_FILE"

# Cleanup lock on exit
cleanup() { rm -f "$LOCK_FILE"; }
trap cleanup EXIT INT TERM

REPORT=""
REPORT+="=== Supply-chain-claw Phase A Diagnostics ===
"
REPORT+="Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Workspace: /root/.openclaw/workspace

"

# --- System Resources (non-fatal) ---
REPORT+="--- System Resources ---
"

# Disk usage
if command -v df >/dev/null 2>&1; then
    REPORT+="Disk Usage:
$(df -h 2>/dev/null | head -5)
"
else
    REPORT+="[SKIP] df not available
"
fi

# Memory usage
if [ -r /proc/meminfo ]; then
    MEM_TOTAL=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')
    MEM_FREE=$(grep MemFree /proc/meminfo 2>/dev/null | awk '{print $2}')
    MEM_AVAIL=$(grep MemAvailable /proc/meminfo 2>/dev/null | awk '{print $2}')
    REPORT+="
Memory (kB):
  Total: ${MEM_TOTAL:-N/A}
  Free: ${MEM_FREE:-N/A}
  Available: ${MEM_AVAIL:-N/A}
"
else
    REPORT+="[SKIP] /proc/meminfo not readable
"
fi

# Load average
if [ -r /proc/loadavg ]; then
    REPORT+="
Load Average: $(cat /proc/loadavg 2>/dev/null || echo 'N/A')
"
else
    REPORT+="[SKIP] /proc/loadavg not readable
"
fi

# --- Git Status (non-fatal) ---
REPORT+="
--- Git Status ---
"
cd /root/.openclaw/workspace 2>/dev/null || {
    REPORT+="[SKIP] Cannot access workspace
"
    echo -e "$REPORT"
    exit 0
}

if command -v git >/dev/null 2>&1 && [ -d .git ]; then
    GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo 'N/A')
    GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l)
    GIT_UNPUSHED=$(git log --branches --not --remotes --oneline 2>/dev/null | wc -l)
    
    REPORT+="Branch: $GIT_BRANCH
"
    REPORT+="Uncommitted changes: $GIT_STATUS
"
    REPORT+="Unpushed commits: $GIT_UNPUSHED
"
    
    if [ "$GIT_STATUS" -eq 0 ] && [ "$GIT_UNPUSHED" -eq 0 ]; then
        REPORT+="Status: ✓ Clean
"
    else
        REPORT+="Status: ⚠ Modifications detected
"
    fi
else
    REPORT+="[SKIP] Git not available or not a repository
"
fi

# --- Process Check (non-fatal) ---
REPORT+="
--- Process / Port Check ---
"

if command -v ps >/dev/null 2>&1; then
    REPORT+="Process count: $(ps aux 2>/dev/null | wc -l) (approx)
"
else
    REPORT+="[SKIP] ps not available
"
fi

if command -v netstat >/dev/null 2>&1; then
    LISTENING=$(netstat -tln 2>/dev/null | grep LISTEN | wc -l)
    REPORT+="Listening ports: $LISTENING
"
elif command -v ss >/dev/null 2>&1; then
    LISTENING=$(ss -tln 2>/dev/null | grep LISTEN | wc -l)
    REPORT+="Listening ports: $LISTENING
"
else
    REPORT+="[SKIP] netstat/ss not available
"
fi

# --- Optional Path/Tool Checks (non-fatal) ---
REPORT+="
--- Tool Availability ---
"
for tool in node python python3 docker docker-compose curl; do
    if command -v $tool >/dev/null 2>&1; then
        VERSION=$($tool --version 2>/dev/null | head -1 || echo 'version unknown')
        REPORT+="✓ $tool: $VERSION
"
    else
        REPORT+="✗ $tool: not found
"
    fi
done

REPORT+="
--- Node/NPM Specific ---
"
if [ -f package.json ]; then
    REPORT+="package.json: ✓ present
"
    if command -v npm >/dev/null 2>&1; then
        REPORT+="node_modules: $(test -d node_modules && echo '✓ present' || echo '✗ missing')
"
    fi
else
    REPORT+="[SKIP] No package.json found
"
fi

REPORT+="
--- Workspace Structure ---
"
REPORT+="Top-level entries: $(ls -1A 2>/dev/null | wc -l)
"
for dir in src lib bin scripts cron memory; do
    if [ -d "$dir" ]; then
        REPORT+="  ✓ $dir/ directory present ($(find "$dir" -type f 2>/dev/null | wc -l) files)
"
    else
        REPORT+="  ✗ $dir/ directory missing
"
    fi
done

# --- Summary ---
REPORT+="
=== End of Diagnostics ===
Lock cleared. Next run in 30 minutes.
"

echo -e "$REPORT"
exit 0