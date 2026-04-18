echo "=== SECTION 1 ==="
[ -d backend ] && grep -r "final_price\|vendor_cost" backend/domains/finance/ | wc -l || echo "0 (No backend dir)"

echo "=== SECTION 2 ==="
[ -d backend ] && grep -r "from('visas')\|from(\"visas\")" backend/domains/operations/ | wc -l || echo "0 (No backend dir)"

echo "=== SECTION 3 ==="
grep -rn "get_booking_hub" src/ backend/ 2>/dev/null

echo "=== SECTION 5 ==="
echo "--- TAIL ---"
npx tsc --noEmit 2>&1 | tail -5
echo "--- ERRORS ---"
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's/(.*$//' | sort -u

echo "=== SECTION 7 ==="
ls supabase/migrations/ | sort

echo "=== SECTION 8 & 9 ==="
for f in \
  src/features/crm/pages/LeadsPage.tsx \
  src/features/crm/pages/LeadDetailPage.tsx \
  src/features/crm/pages/CustomersPage.tsx \
  src/features/crm/pages/CustomerDetailPage.tsx \
  src/features/finance/pages/QuotationsPage.tsx \
  src/features/finance/pages/QuoteBuilderPage.tsx \
  src/features/finance/pages/QuotationDetailPage.tsx \
  src/features/finance/pages/InvoicesPage.tsx \
  src/features/finance/pages/InvoiceBuilderPage.tsx \
  src/features/finance/pages/InvoiceDetailPage.tsx \
  src/features/operations/pages/BookingsPage.tsx \
  src/features/operations/pages/BookingDetailPage.tsx \
  src/features/operations/pages/ItineraryBuilderPage.tsx \
  src/features/operations/pages/ItinerariesPage.tsx \
  src/features/operations/pages/VisaDetailPage.tsx \
  src/features/operations/pages/VisaListPage.tsx \
  src/features/tasks/pages/TasksPage.tsx \
  src/features/settings/pages/SettingsPage.tsx \
  src/features/dashboard/pages/DashboardPage.tsx \
  src/features/public/pages/PublicItineraryPage.tsx \
  src/utils/currency.ts \
  src/utils/time.ts \
  src/utils/mask.ts; do
  if [ -f "$f" ]; then echo "YES $f"; else echo "NO $f"; fi
done

echo "=== SECTION 10 ==="
cat package.json | grep -E '"@dnd-kit|"@supabase|"react|"tailwind|"sonner'
npm ls --depth=0 2>&1 | grep "UNMET\|missing" || echo "NONE"

