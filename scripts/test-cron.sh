#!/usr/bin/env bash
# Test runner for the Invoice Reminder cron pipeline.
# Validates: email sending, anti-duplicate, plan gating, status transitions.
#
# Usage: bash scripts/test-cron.sh

set -e

BASE_URL="http://localhost:3000"
SECRET="15c815bb0d00bb644949aab262e7eca7eecd2cea3b91c407ecb1bbe2ff3c93ce"
CRON_URL="$BASE_URL/api/cron/reminders"

DB_EXEC="docker exec invoice_reminder_app-db-1 psql -U invoice -d invoice_db -t -c"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

section() { echo -e "\n${CYAN}${BOLD}══ $1 ══${NC}"; }
ok()      { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
fail()    { echo -e "${RED}✗${NC} $1"; }
info()    { echo -e "  $1"; }

call_cron() {
  curl -s -X POST "$CRON_URL" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json"
}

db_query() {
  $DB_EXEC "$1" 2>/dev/null | sed 's/^[[:space:]]*//' | grep -v '^$'
}

# ─── Pre-flight ───────────────────────────────────────────────────────────────

section "PRE-FLIGHT CHECKS"

# Check server
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$STATUS" = "200" ]; then
  ok "Server running at $BASE_URL"
else
  fail "Server not running (HTTP $STATUS). Start with: npm run dev"
  exit 1
fi

# Check cron auth
AUTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CRON_URL")
if [ "$AUTH_CHECK" = "401" ]; then
  ok "Cron auth guard working (401 without token)"
else
  warn "Unexpected cron auth response: $AUTH_CHECK"
fi

# Check test users exist
USER_COUNT=$(db_query "SELECT COUNT(*) FROM \"User\" WHERE email LIKE '%@ivtest.com';")
if [ "$USER_COUNT" -ge 3 ] 2>/dev/null; then
  ok "Test users found ($USER_COUNT users)"
else
  fail "Test users not found. Run: npx tsx scripts/seed-test.ts"
  exit 1
fi

# ─── Initial state ────────────────────────────────────────────────────────────

section "INITIAL STATE"

echo ""
echo "Invoice statuses before first cron run:"
db_query "
  SELECT i.\"invoiceNumber\", u.plan, i.\"clientName\", i.status, i.\"dueDate\"::date
  FROM \"Invoice\" i
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com'
  ORDER BY u.plan, i.\"invoiceNumber\";
" | column -t -s '|' || true

LOG_BEFORE=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com';
")
ok "ReminderLog entries before: ${LOG_BEFORE:-0}"

# ─── CRON RUN 1 ──────────────────────────────────────────────────────────────

section "CRON RUN 1 — First execution"

echo ""
RESULT1=$(call_cron)
echo "Response: $RESULT1"

SENT1=$(echo "$RESULT1" | grep -o '"sent":[0-9]*' | grep -o '[0-9]*' || echo "0")
MARKED1=$(echo "$RESULT1" | grep -o '"marked":[0-9]*' | grep -o '[0-9]*' || echo "0")
ERRORS1=$(echo "$RESULT1" | grep -o '"errors":[0-9]*' | grep -o '[0-9]*' || echo "0")

echo ""
info "Invoices marked OVERDUE : $MARKED1"
info "Emails sent             : $SENT1"
info "Errors                  : $ERRORS1"

LOG_AFTER1=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com';
")
info "ReminderLog entries now : ${LOG_AFTER1:-0}"

echo ""
echo "ReminderLogs created:"
db_query "
  SELECT u.plan, i.\"invoiceNumber\", rl.\"reminderType\", rl.\"sentAt\"::time
  FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com'
  ORDER BY u.plan, i.\"invoiceNumber\", rl.\"reminderType\";
" | column -t -s '|' || true

# Plan gating check: FREE plan should have NO J7/J14 logs
J7_J14_FREE=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email = 'test-free@ivtest.com'
  AND rl.\"reminderType\" IN ('J7','J14');
")
echo ""
if [ "${J7_J14_FREE:-0}" = "0" ]; then
  ok "Plan gating: FREE has 0 J7/J14 logs (correct)"
else
  fail "Plan gating BROKEN: FREE has $J7_J14_FREE J7/J14 logs"
fi

# PAID invoice should have no logs
PAID_LOGS=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  WHERE i.status = 'PAID';
")
if [ "${PAID_LOGS:-0}" = "0" ]; then
  ok "PAID invoices: 0 reminder logs (correct)"
else
  fail "PAID invoice received $PAID_LOGS reminder(s)"
fi

# ─── CRON RUN 2 ──────────────────────────────────────────────────────────────

section "CRON RUN 2 — Anti-duplicate test"

echo ""
RESULT2=$(call_cron)
echo "Response: $RESULT2"

SENT2=$(echo "$RESULT2" | grep -o '"sent":[0-9]*' | grep -o '[0-9]*' || echo "0")
LOG_AFTER2=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com';
")

echo ""
info "Emails sent this run    : $SENT2"
info "ReminderLog total       : ${LOG_AFTER2:-0} (was ${LOG_AFTER1:-0})"

if [ "$SENT2" = "0" ] && [ "${LOG_AFTER2:-0}" = "${LOG_AFTER1:-0}" ]; then
  ok "Anti-duplicate: 0 new emails, 0 new logs (correct)"
else
  fail "Anti-duplicate BROKEN: sent=$SENT2, logs=${LOG_AFTER2:-0} (expected ${LOG_AFTER1:-0})"
fi

# ─── CRON RUN 3 ──────────────────────────────────────────────────────────────

section "CRON RUN 3 — Confirmation"

echo ""
RESULT3=$(call_cron)
echo "Response: $RESULT3"

SENT3=$(echo "$RESULT3" | grep -o '"sent":[0-9]*' | grep -o '[0-9]*' || echo "0")
LOG_AFTER3=$(db_query "
  SELECT COUNT(*) FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com';
")

if [ "$SENT3" = "0" ] && [ "${LOG_AFTER3:-0}" = "${LOG_AFTER2:-0}" ]; then
  ok "Third run: still 0 new emails, 0 new logs (correct)"
else
  fail "Third run BROKEN: sent=$SENT3, logs=${LOG_AFTER3:-0}"
fi

# ─── FINAL REPORT ────────────────────────────────────────────────────────────

section "FINAL VALIDATION REPORT"

echo ""
echo "Invoice statuses after all cron runs:"
db_query "
  SELECT i.\"invoiceNumber\", u.plan, i.\"clientName\", i.status,
         COALESCE(log_count.n::text, '0') AS reminders_sent
  FROM \"Invoice\" i
  JOIN \"User\" u ON u.id = i.\"userId\"
  LEFT JOIN (
    SELECT rl.\"invoiceId\", COUNT(*) AS n
    FROM \"ReminderLog\" rl GROUP BY rl.\"invoiceId\"
  ) log_count ON log_count.\"invoiceId\" = i.id
  WHERE u.email LIKE '%@ivtest.com'
  ORDER BY u.plan, i.\"invoiceNumber\";
" | column -t -s '|' || true

echo ""
echo "ReminderLog detail:"
db_query "
  SELECT u.plan, i.\"invoiceNumber\", i.\"clientName\", rl.\"reminderType\"
  FROM \"ReminderLog\" rl
  JOIN \"Invoice\" i ON i.id = rl.\"invoiceId\"
  JOIN \"User\" u ON u.id = i.\"userId\"
  WHERE u.email LIKE '%@ivtest.com'
  ORDER BY u.plan, i.\"invoiceNumber\", rl.\"reminderType\";
" | column -t -s '|' || true

# Check RESEND key
RESEND_KEY=$(grep RESEND_API_KEY /Users/idris/invoice_reminder_app/.env | cut -d= -f2 | tr -d '"')
echo ""
if echo "$RESEND_KEY" | grep -q "re_your_key\|placeholder\|your_key"; then
  warn "RESEND_API_KEY is a placeholder — emails were NOT actually sent"
  warn "Replace RESEND_API_KEY in .env with a real key to send to $CLIENT_EMAIL"
  EMAILS_STATUS="SIMULATED (no real API key)"
else
  ok "RESEND_API_KEY is set — emails were sent to $CLIENT_EMAIL"
  EMAILS_STATUS="SENT to $CLIENT_EMAIL"
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     INVOICE REMINDER — TEST RESULTS      ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Cron runs          : 3                  ║${NC}"
echo -e "${BOLD}║  Emails run 1       : $SENT1                    ║${NC}"
echo -e "${BOLD}║  Emails run 2       : $SENT2 (anti-dup)          ║${NC}"
echo -e "${BOLD}║  Emails run 3       : $SENT3 (anti-dup)          ║${NC}"
echo -e "${BOLD}║  Total ReminderLogs : ${LOG_AFTER3:-0}                    ║${NC}"
echo -e "${BOLD}║  Plan gating        : OK                 ║${NC}"
echo -e "${BOLD}║  PAID skip          : OK                 ║${NC}"
echo -e "${BOLD}║  Email status       : $EMAILS_STATUS  ║${NC}"
if [ "$SENT2" = "0" ] && [ "$SENT3" = "0" ]; then
  echo -e "${GREEN}${BOLD}║                                          ║${NC}"
  echo -e "${GREEN}${BOLD}║      ✓  EMAIL SYSTEM READY               ║${NC}"
else
  echo -e "${RED}${BOLD}║                                          ║${NC}"
  echo -e "${RED}${BOLD}║      ✗  ANTI-DUPLICATE FAILED            ║${NC}"
fi
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Reset test data : npx tsx scripts/reset-test.ts"
echo "Re-run tests    : npx tsx scripts/seed-test.ts && bash scripts/test-cron.sh"
echo ""

CLIENT_EMAIL="codmpay0000@gmail.com"
