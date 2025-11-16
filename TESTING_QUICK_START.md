# Quick Start: Testing Checkout Upsell Modal

## Setup

No additional setup required! The feature is fully integrated into the existing application.

## Testing Steps

### Step 1: Start the Application
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Step 2: Login as Customer
1. Navigate to http://localhost:3000/customer/login
2. Enter any room number (e.g., "101")
3. Click Login

### Step 3: Add Items to Cart

#### Test Scenario A: Missing Drinks
1. Navigate to "Restaurant" or "Food & Beverages"
2. Add food items (burgers, pizza, pasta, etc.) - DO NOT add drinks
3. Go to Cart
4. Click "Checkout"
5. **Expected**: Modal appears saying "Thirsty? Add a drink to complete your meal!"

#### Test Scenario B: Missing Desserts  
1. Add food + drinks - NO desserts
2. Click "Checkout"
3. **Expected**: Modal appears saying "Craving something sweet? Add a dessert to your order!"

#### Test Scenario C: No Upsell Needed
1. Add food + drinks + desserts (or just drinks)
2. Click "Checkout"
3. **Expected**: Modal does NOT appear, checkout completes immediately

### Step 4: Interact with Modal

#### Option A: Add an Item
1. When modal appears, click "Add" on any item
2. **Expected**:
   - Item is added to cart total
   - Modal closes
   - Checkout completes
   - Success message appears

#### Option B: Skip Upsell
1. When modal appears, click "No Thanks, Continue"
2. **Expected**:
   - Modal closes
   - Checkout completes
   - Success message appears
   - Added items NOT included

### Step 5: Test All Four Checkout Pages

The upsell modal should work the same way across all pages:

1. **Facilities.js** - Go to Dashboard → Facilities → click cart "Checkout"
2. **FoodAndBeverages.js** - Go to Food & Beverages → add items → "Checkout"
3. **FoodMaster.js** - Go to specific category (Breakfast, Lunch, etc.) → "Checkout"
4. **ContactFrontDesk.js** - Go to Contact Front Desk → add items → "Checkout"

## Expected Behaviors

### ✅ Correct Behaviors

| Scenario | Expected Result |
|----------|-----------------|
| Food only | Shows drink suggestions |
| Food + drinks | Shows dessert suggestions |
| Food + desserts | Shows drink suggestions |
| Food + both | No modal, checkout directly |
| Empty cart | Checkout button disabled |
| Only drinks | No modal, checkout directly |
| Click Add | Item added, modal closes, checkout completes |
| Click No Thanks | Modal closes, checkout completes without adding |
| Click X | Modal closes, checkout completes |
| Mobile view | Modal is responsive, readable |
| API error | Checkout still completes (graceful) |

## Visual Inspection

### Modal Should Display:
- [ ] Semi-transparent black overlay behind modal
- [ ] Centered white modal box
- [ ] Orange/amber gradient header
- [ ] Close button (X) in top right
- [ ] Clear heading ("You Might Have Forgotten Something!")
- [ ] Descriptive message
- [ ] 2-3 product cards with:
  - Product image
  - Product name
  - Category badge
  - Price in ₱
  - "Add" button
- [ ] "No Thanks, Continue" button at bottom
- [ ] Smooth fade-in animation
- [ ] Smooth slide-up animation

### Product Cards Should Show:
- [ ] Thumbnail image (or placeholder if missing)
- [ ] Product name
- [ ] Category name (beverages, desserts, etc.)
- [ ] Price (e.g., ₱150.00)
- [ ] Hover effect (card lifts up slightly)
- [ ] Add button with plus icon

## Debugging Tips

### If Modal Doesn't Appear
1. Check browser console (F12) for errors
2. Check Network tab - look for `/api/cart/:roomNumber/upsell` request
3. Verify response has `showUpsell: true`
4. Verify cart has food items (not just drinks)

### If Add Button Doesn't Work
1. Check console for errors
2. Check Network tab - look for `/api/cart/:roomNumber/items` POST
3. Check that room number is set in localStorage
4. Try refreshing page

### If Styling Looks Wrong
1. Check that `CheckoutUpsellModal.css` exists in frontend/src/Customer/
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+F5)
4. Check browser console for CSS errors

### If Checkout Doesn't Complete
1. Check Network tab - look for `/api/cart/:roomNumber/checkout` POST
2. Check backend logs for errors
3. Verify cart has items before checking out
4. Check browser console for JS errors

## Sample Test Checklist

Print and use this checklist during testing:

```
Test Case: Missing Drinks
[ ] Add food items
[ ] Do NOT add drinks
[ ] Click Checkout
[ ] Modal appears with drink suggestions
[ ] Click Add on a drink
[ ] Item added to cart
[ ] Modal closes
[ ] Checkout completes
[ ] Success message shown

Test Case: Missing Desserts
[ ] Add food items
[ ] Add drinks
[ ] Do NOT add desserts
[ ] Click Checkout
[ ] Modal appears with dessert suggestions
[ ] Click No Thanks, Continue
[ ] Modal closes
[ ] Checkout completes without adding dessert

Test Case: Complete Order
[ ] Add food + drinks + desserts
[ ] Click Checkout
[ ] Modal does NOT appear
[ ] Checkout completes immediately

Test Case: Mobile
[ ] Open browser dev tools (F12)
[ ] Set viewport to iPhone (375x812)
[ ] Go through test cases
[ ] Modal should be readable and usable
[ ] No layout breaks
[ ] Buttons clickable

Test Case: Error Handling
[ ] Manually stop backend server
[ ] Try to checkout
[ ] Error caught gracefully
[ ] Checkout completes anyway
[ ] User sees appropriate message
```

## Database Requirements

Make sure your Food collection has items in these categories:
- **beverages** - drinks like "Coca Cola", "Water", "Juice"
- **desserts** - desserts like "Cake", "Ice Cream", "Brownie"

If no items exist in these categories, the upsell won't trigger. To add test data:

```javascript
// In MongoDB or via admin panel, add:
db.foods.insertMany([
  { name: "Coca Cola", category: "beverages", price: 50, img: "...", available: true },
  { name: "Water", category: "beverages", price: 30, img: "...", available: true },
  { name: "Cake", category: "desserts", price: 150, img: "...", available: true },
  { name: "Ice Cream", category: "desserts", price: 100, img: "...", available: true }
])
```

## Success Criteria

✅ Feature is working if:
1. Modal appears when customer has food but missing drinks/desserts
2. Modal shows appropriate message based on what's missing
3. Add buttons work - items are added to cart
4. Skip button works - checkout completes without adding
5. Checkout completes successfully
6. Feature works on all 4 pages
7. Mobile responsive
8. Graceful error handling

## Support

If you encounter issues:
1. Check console (F12) for errors
2. Check network requests in Network tab
3. Verify backend API is running
4. Check database has proper food items
5. Check .env file has correct API_URL
6. Try clearing localStorage and logging in again

---

**Ready to test?** Follow the steps above and the feature should work seamlessly!
