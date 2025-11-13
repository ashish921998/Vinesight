# Warehouse Feature - Manual Testing Guide

## Setup Instructions

### 1. Apply Database Migration

```bash
# If using Supabase CLI locally
supabase db push

# OR manually in Supabase Dashboard → SQL Editor
# Copy and paste contents of: supabase/migrations/20251113_warehouse_inventory.sql
```

### 2. Add Test Data (Optional)

```bash
# In Supabase SQL Editor, run:
# Copy contents from: supabase/test_data_warehouse.sql
```

### 3. Start Development Server

```bash
npm run dev
```

---

## Test Cases

### ✅ TEST 1: Access Warehouse Page

**Steps:**
1. Navigate to `http://localhost:3000/warehouse`
2. Should see "Warehouse" page with header

**Expected Results:**
- ✅ Page loads without errors
- ✅ "Add Item" button visible
- ✅ Empty state message if no items (or list of items if test data loaded)
- ✅ Navigation sidebar shows "Warehouse" link with Package icon

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 2: Add Fertilizer to Warehouse

**Steps:**
1. Click "+ Add Item" button
2. Select Type: **Fertilizer**
3. Enter:
   - Name: `NPK 19:19:19`
   - Quantity: `100`
   - Unit: `kg`
   - Unit Price: `50`
   - Reorder Quantity: `20`
   - Notes: `Test fertilizer`
4. Click "Add Item"

**Expected Results:**
- ✅ Modal closes
- ✅ Success toast: "Item added successfully"
- ✅ Item appears in warehouse list
- ✅ Shows: "100 kg • ₹50/kg • Reorder: 20 kg"
- ✅ Total Value displayed: ₹5,000
- ✅ Badge shows "Fertilizer"

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 3: Add Spray to Warehouse

**Steps:**
1. Click "+ Add Item"
2. Select Type: **Spray**
3. Enter:
   - Name: `Imidacloprid`
   - Quantity: `5`
   - Unit: `liter`
   - Unit Price: `800`
   - Reorder Quantity: `2`
4. Click "Add Item"

**Expected Results:**
- ✅ Item appears with "Spray" badge
- ✅ Shows: "5 liter • ₹800/L"
- ✅ Total Value: ₹4,000

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 4: Low Stock Alert

**Steps:**
1. Click "+ Add Item"
2. Add fertilizer with quantity BELOW reorder level:
   - Name: `Urea`
   - Quantity: `15`
   - Unit: `kg`
   - Reorder Quantity: `20`
3. Save

**Expected Results:**
- ✅ Item shows "Low Stock" red badge
- ✅ Card has orange border/background
- ✅ Appears in "Low Stock Alerts" section at top of page
- ✅ Alert shows: "15 kg remaining (Reorder at: 20 kg)"
- ✅ "Add Stock" button visible in alert

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 5: Quick Add Stock

**Steps:**
1. Find NPK item (100 kg)
2. Click "Add Stock" button
3. Enter Quantity: `50`
4. Review preview (should show "150 kg")
5. Click "Add Stock"

**Expected Results:**
- ✅ Modal closes
- ✅ Toast: "Added 50 kg to NPK 19:19:19. New quantity: 150 kg"
- ✅ Item now shows 150 kg
- ✅ Total value updated to ₹7,500

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 6: Edit Warehouse Item

**Steps:**
1. Click Edit (pencil icon) on any item
2. Change unit price from ₹50 to ₹55
3. Click "Update"

**Expected Results:**
- ✅ Modal closes
- ✅ Toast: "Item updated successfully"
- ✅ Item shows new price
- ✅ Total value recalculated

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 7: Delete Warehouse Item

**Steps:**
1. Click Delete (trash icon) on any item
2. Confirm deletion in popup

**Expected Results:**
- ✅ Item removed from list
- ✅ Toast: "Item deleted successfully"
- ✅ Inventory summary updated

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 8: Filter by Type

**Steps:**
1. Ensure you have both fertilizers and sprays
2. Click "Fertilizers" filter button
3. Click "Sprays" filter button
4. Click "All Items" button

**Expected Results:**
- ✅ Fertilizers filter: Only shows fertilizer items
- ✅ Sprays filter: Only shows spray items
- ✅ All Items: Shows everything
- ✅ Counter shows correct count for each filter

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 9: Inventory Summary

**Steps:**
1. Scroll to bottom of warehouse page

**Expected Results:**
- ✅ Summary card visible
- ✅ Shows Total Items count
- ✅ Shows Fertilizers count
- ✅ Shows Sprays count
- ✅ Shows Total Value (sum of quantity × price)
- ✅ All numbers are accurate

**Status:** [ ] Pass / [ ] Fail

---

## Integration Tests (Warehouse ↔ Farm Logs)

### ✅ TEST 10: Select Fertilizer from Warehouse in Fertigation Form

**Steps:**
1. Go to any farm
2. Click "Add Logs" or equivalent
3. Select "Fertigation" log type
4. In fertilizer name field, look for warehouse options
5. Click "Select from Warehouse" button
6. Should see dropdown with warehouse fertilizers

**Expected Results:**
- ✅ Dropdown shows: "NPK 19:19:19 (150 kg available)"
- ✅ Can select item from dropdown
- ✅ Name field populates with selected item
- ✅ Can still type custom name if needed

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 11: Auto-Deduction from Warehouse (Success Case)

**Prerequisites:**
- Warehouse has: NPK 19:19:19 with 50 kg available

**Steps:**
1. Create Fertigation log
2. Select "NPK 19:19:19" from warehouse dropdown
3. Enter quantity: `10` kg/acre
4. Save log

**Expected Results:**
- ✅ Log saves successfully
- ✅ Toast: "Deducted 10 kg of NPK 19:19:19 from warehouse"
- ✅ Go to /warehouse → NPK now shows 40 kg (50 - 10)
- ✅ Total value recalculated

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 12: Auto-Deduction Insufficient Stock Warning

**Prerequisites:**
- Warehouse has: Urea with only 5 kg available

**Steps:**
1. Create Fertigation log
2. Select "Urea" from warehouse
3. Enter quantity: `10` kg/acre
4. Save log

**Expected Results:**
- ✅ Warning toast: "Insufficient stock. Available: 5 kg, Required: 10 kg"
- ✅ Warehouse quantity remains at 5 kg (no deduction)
- ✅ Log may or may not save (depending on your business logic preference)

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 13: Manual Entry (No Deduction)

**Steps:**
1. Create Fertigation log
2. DO NOT select from warehouse
3. Type custom name: "Custom Mix ABC"
4. Enter quantity: `15` kg/acre
5. Save log

**Expected Results:**
- ✅ Log saves successfully
- ✅ NO warehouse deduction occurs
- ✅ NO toast about warehouse deduction
- ✅ Custom fertilizer name appears in log

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 14: Spray Integration (Similar to Fertigation)

**Steps:**
1. Create Spray log
2. Add chemical → Select from warehouse
3. Choose "Imidacloprid (5 liter available)"
4. Enter quantity: `2` liter
5. Save log

**Expected Results:**
- ✅ Toast: "Deducted 2 liter of Imidacloprid from warehouse"
- ✅ Warehouse shows 3 liter remaining
- ✅ Works same as fertigation

**Status:** [ ] Pass / [ ] Fail

---

## Edge Cases & Error Handling

### ✅ TEST 15: Validation - Empty Fields

**Steps:**
1. Try to add warehouse item with empty name
2. Try to add with negative quantity
3. Try to add with negative price

**Expected Results:**
- ✅ Error toast: "Please enter item name"
- ✅ Error toast: "Please enter a valid quantity"
- ✅ Error toast: "Please enter a valid unit price"
- ✅ Form doesn't submit

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 16: Page Refresh Persistence

**Steps:**
1. Add items to warehouse
2. Refresh browser (F5)

**Expected Results:**
- ✅ All items still visible
- ✅ Data persists in database
- ✅ No data loss

**Status:** [ ] Pass / [ ] Fail

---

### ✅ TEST 17: Multi-User Isolation (RLS)

**Prerequisites:**
- Need 2 different user accounts

**Steps:**
1. Login as User A, add warehouse items
2. Logout, login as User B
3. Check warehouse

**Expected Results:**
- ✅ User B cannot see User A's items
- ✅ Each user has separate inventory
- ✅ RLS working correctly

**Status:** [ ] Pass / [ ] Fail / [ ] Skipped (single user)

---

## Performance Tests

### ✅ TEST 18: Large Inventory

**Steps:**
1. Add 20+ items to warehouse
2. Test page load time
3. Test filtering speed

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Filtering is instant
- ✅ No lag or performance issues

**Status:** [ ] Pass / [ ] Fail / [ ] Skipped

---

## Summary

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| Warehouse UI | /9 | /9 | /9 |
| Integration | /5 | /5 | /5 |
| Edge Cases | /3 | /3 | /3 |
| Performance | /1 | /1 | /1 |
| **TOTAL** | /18 | /18 | /18 |

---

## Known Issues / Notes

_Document any bugs or issues found during testing:_

1.
2.
3.

---

## Screenshots (Optional)

_Attach screenshots of key features:_

- [ ] Warehouse page with items
- [ ] Low stock alert
- [ ] Warehouse select dropdown in fertigation form
- [ ] Success notification after deduction

---

**Tested By:** ___________________
**Date:** ___________________
**Version:** ___________________
