#!/bin/bash
# Phase A Diagnostics - Global Single-Run Protected
# Runs every 30 minutes (cron schedule)

LOCK_FILE="/tmp/openclaw-global-job.lock"
LOCK_TIMEOUT=2700  # 45 minutes in seconds
CURRENT_TS=$(date +%s)
WORKSPACE="/root/.openclaw/workspace"
TEMP_OUT=$(mktemp)

# Cleanup on exit
cleanup_lock() {
    [[ -f "$LOCK_FILE" ]] && rm -f "$LOCK_FILE" 2>/dev/null
}
cleanup_temp() {
    [[ -f "$TEMP_OUT" ]] && rm -f "$TEMP_OUT" 2>/dev/null
}
trap cleanup_temp EXIT
# Note: Lock removal is only done on successful completion or stale detection

# --- Lock Mechanism ---
if [[ -f "$LOCK_FILE" ]]; then
    LOCK_TS=$(cat "$LOCK_FILE" 2>/dev/null || echo "0")
    LOCK_AGE=$((CURRENT_TS - LOCK_TS))
    
    if [[ -n "$LOCK_TS" && "$LOCK_AGE" -lt "$LOCK_TIMEOUT" ]]; then
        echo "[$(date -Iseconds)] DIAGNOSTIC SKIPPED: Lock file exists (age: ${LOCK_AGE}s, threshold: ${LOCK_TIMEOUT}s)" | tee -a "$TEMP_OUT"
        cleanup_temp
        exit 0
    else
        echo "[$(date -Iseconds)] DIAGNOSTIC CONTINUE: Stale lock detected (age: ${LOCK_AGE}s), clearing and proceeding" | tee -a "$TEMP_OUT"
        rm -f "$LOCK_FILE" 2>/dev/null
    fi
fi

# Set lock
echo "$CURRENT_TS" > "$LOCK_FILE" 2>/dev/null || {
    echo "[$(date -Iseconds)] WARNING: Cannot create lock file at $LOCK_FILE"
}
{
# ==================== PHASE A DIAGNOSTICS ====================

echo "================================================"
echo "PHASE A DIAGNOSTICS REPORT"
echo "Workspace: $WORKSPACE"
echo "Timestamp: $(date -Iseconds)"
echo "================================================"

# --- System Resources (non-fatal) ---
echo ""
echo "[SYSTEM RESOURCES]"

# Disk usage
echo "Disk Usage:"
df -h / 2>/dev/null | grep -E "^Filesystem|/dev/" || echo "  (df not available)"

# Memory info
echo ""
echo "Memory:"
if [[ -f /proc/meminfo ]]; then
    grep -E "^(Mem|Swap)" /proc/meminfo 2>/dev/null | while read line; do echo "  $line"; done
else
    free -h 2>/dev/null || echo "  (memory info not available)"
fi

# Load average
echo ""
echo "Load Average:"
cat /proc/loadavg 2>/dev/null | awk '{print "  1min: " $1 " | 5min: " $2 " | 15min: " $3}' || uptime 2>/dev/null | sed 's/.*load average(s*//' || echo "  (load info not available)"

# --- Git Status (non-fatal) ---
echo ""
echo "[GIT CLEANLINESS]"
if command -v git &>/dev/null && [[ -d "$WORKSPACE/.git" ]]; then
    cd "$WORKSPACE" 2>/dev/null || true
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "  Branch: $BRANCH"
    
    # Status summary
    STATUS=$(git status --porcelain 2>/dev/null)
    if [[ -z "$STATUS" ]]; then
        echo "  Status: clean"
    else
        echo "  Status: modified/uncommitted files present"
        COUNT=$(echo "$STATUS" | wc -l)
        echo "  Changed files: $COUNT"
    fi
    
    # Last commit
    LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "(none)")
    echo "  Last commit: $LAST_COMMIT"
else
    echo "  (git not available or not a git repository)"
fi

# --- Process Check (non-fatal) ---
echo ""
echo "[PROCESS CHECK]"
# Check for openclaw gateway process (if applicable)
OPENCOUNT=$(pgrep -c openclaw 2>/dev/null || echo "0")
NODECOUNT=$(pgrep -c node 2>/dev/null || echo "0")
NPMCOUNT=$(pgrep -c npm 2>/dev/null || echo "0")
echo "  openclaw processes: $OPENCOUNT"
echo "  node processes: $NODECOUNT"
echo "  npm processes: $NPMCOUNT"

# --- Port Check (non-fatal) ---
echo ""
echo "[PORT CHECK]"
if command -v ss &>/dev/null || command -v netstat &>/dev/null; then
    # Common service ports (non-fatal if can't check)
    PORTS="3000 8080 80 443"
    for PORT in $PORTS; do
        if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
            echo "  Port $PORT: listening"
        elif netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
            echo "  Port $PORT: listening"
        else
            echo "  Port $PORT: not listening"
        fi
    done
else
    echo "  (ss/netstat not available for port checking)"
fi

# --- Path/Tool Availability (non-fatal) ---
echo ""
echo "[TOOL AVAILABILITY]"
TOOLS="git node npm curl npx openclaw"
for TOOL in $TOOLS; do
    if command -v "$TOOL" &>/dev/null; then
        VERSION=$($TOOL --version 2>/dev/null | head -1 || echo "version unknown")
        echo "  $TOOL: available ($VERSION)"
    else
        echo "  $TOOL: not found"
    fi
done

# --- Workspace Health ---
echo ""
echo "[WORKSPACE HEALTH]"
if [[ -d "$WORKSPACE" ]]; then
    echo "  Workspace exists: yes"
    SIZE=$(du -sh "$WORKSPACE" 2>/dev/null | cut -f1 || echo "unknown")
    echo "  Total size: $SIZE"
    FILECOUNT=$(find "$WORKSPACE" -type f 2>/dev/null | wc -l || echo "unknown")
    echo "  File count: $FILECOUNT"
    
    # Check for key directories
    for DIR in "scripts" "memory" ".openclaw" "src"; do
        if [[ -d "$WORKSPACE/$DIR" ]]; then
            echo "  $DIR/: present"
        else
            echo "  $DIR/: absent"
        fi
    done
else
    echo "  Workspace exists: NO (CRITICAL)"
fi

echo ""
echo "================================================"
echo "Phase A diagnostics complete at $(date -Iseconds)"
echo "================================================"

# Remove lock on completion (only if we created it)
[[ -f "$LOCK_FILE" ]] && rm -f "$LOCK_FILE" 2>/dev/null

} 2>&1 | tee -a "$TEMP_OUT"

# Output final
if [[ -f "$TEMP_OUT" ]]; then
    # Copy to logfile
    LOGFILE="$WORKSPACE/memory/diagnostics-$(date +%Y%m%d).log"
    mkdir -p "$WORKSPACE/memory" 2>/dev/null || true
    cat "$TEMP_OUT" >> "$LOGFILE" 2>/dev/null || true
fi

exit 0
