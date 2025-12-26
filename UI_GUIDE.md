# 🛒 ShopEase E-Commerce UI Guide

## Overview

The ShopEase UI is a modern web interface that connects to all your backend REST APIs and stores data in the PostgreSQL database. Every action you perform in the UI is reflected in the database.

---

## 📁 UI Files Location

```
src/main/resources/static/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Styles
└── js/
    └── app.js          # JavaScript (ALL API calls)
```

---

## 🚀 Running the Application

### Step 1: Start PostgreSQL
```bash
# Make sure PostgreSQL is running
# Connect and verify database exists
psql -U postgres
CREATE DATABASE e_com;  -- if not exists
\q
```

### Step 2: Start the Spring Boot Application
```bash
cd /Users/sunilkumarmahakur/Downloads/ecommerce4-Updated
./mvnw spring-boot:run
```

### Step 3: Open the UI
Open your browser and go to:
```
http://localhost:8080
```

---

## 🔗 API Endpoints Connected to UI

| Feature | API Endpoint | Method | Description |
|---------|-------------|--------|-------------|
| Register | `/api/users/register` | POST | Creates user in `user_table` |
| Login | `/api/users/login` | POST | Returns userId & JWT token |
| Products | `/api/products?page=0&size=50` | GET | Fetches from `product_table` |
| Add to Cart | `/api/cart/add` | POST | Adds item to `cart_items` |
| View Cart | `/api/cart/{userId}` | GET | Gets cart from `carts` & `cart_items` |
| Update Qty | `/api/cart/update/{cartItemId}` | PUT | Updates quantity in DB |
| Remove Item | `/api/cart/remove/{cartItemId}` | DELETE | Removes from `cart_items` |
| Add Address | `/api/addresses/{userId}` | POST | Saves to `addresses` table |
| Place Order | `/api/orders/place` | POST | Creates order in `orders` & `order_items` |
| View Orders | `/api/orders/user/{userId}` | GET | Gets orders from `orders` table |

---

## 🗄️ Database Verification

### Quick Access
Click the **green database icon** (bottom-left of the UI) to see all verification queries.

### Manual Verification
```bash
# Connect to database
psql -U postgres -d e_com
```

### Verify Each Feature:

#### 1. User Registration
```sql
SELECT * FROM user_table;
```
**Expected:** New row with name, email, hashed password, phone_number

#### 2. Products
```sql
SELECT * FROM product_table;
SELECT * FROM category_table;
```
**Expected:** All products displayed in UI

#### 3. Cart Operations
```sql
-- View cart
SELECT * FROM carts;

-- View cart items
SELECT ci.*, p.product_name, p.price 
FROM cart_items ci 
JOIN product_table p ON ci.product_id = p.product_id;
```
**Expected:** Items added via UI appear here

#### 4. Address
```sql
SELECT * FROM addresses;
```
**Expected:** Address created during checkout

#### 5. Orders
```sql
-- View orders
SELECT * FROM orders;

-- View order items
SELECT oi.*, p.product_name 
FROM order_items oi 
JOIN product_table p ON oi.product_id = p.product_id;
```
**Expected:** Order details after checkout

---

## 🧪 Testing Flow

### Complete Test Journey:

1. **Register a User**
   - Click "Register" → Fill form → Submit
   - Verify: `SELECT * FROM user_table;`

2. **Login**
   - Click "Login" → Enter credentials → Submit
   - Note: User ID shown in navbar

3. **Browse Products**
   - Click "Products" → See all products from DB
   - Filter by category

4. **Add to Cart**
   - Click "+" button on products
   - Verify: `SELECT * FROM cart_items;`

5. **View Cart**
   - Click "Cart" in navbar
   - See items pulled from database

6. **Update Quantity**
   - Click +/- buttons
   - Verify: `SELECT * FROM cart_items;`

7. **Checkout**
   - Click "Proceed to Checkout"
   - Fill shipping address
   - Select payment method
   - Place order

8. **Verify Order**
   - Go to "Orders" section
   - Verify: `SELECT * FROM orders;`
   - Verify: `SELECT * FROM order_items;`

---

## 📊 Database Schema Reference

```
┌─────────────────┐     ┌─────────────────┐
│   user_table    │     │  category_table │
├─────────────────┤     ├─────────────────┤
│ id              │     │ category_id     │
│ name            │     │ category_name   │
│ email           │     └─────────────────┘
│ password        │              │
│ phone_number    │              │
│ create_at       │              ▼
│ updated_at      │     ┌─────────────────┐
└────────┬────────┘     │  product_table  │
         │              ├─────────────────┤
         │              │ product_id      │
         ▼              │ product_name    │
┌─────────────────┐     │ description     │
│     carts       │     │ price           │
├─────────────────┤     │ stock_present   │
│ cart_id         │     │ category_id     │
│ user_id         │     └────────┬────────┘
└────────┬────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│   cart_items    │◄─────────────┘
├─────────────────┤
│ cart_item_id    │
│ cart_id         │
│ product_id      │
│ quantity        │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   addresses     │     │     orders      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ order_id        │
│ street          │     │ user_id         │
│ city            │     │ total_amount    │
│ state           │     │ status          │
│ zipcode         │     │ created_at      │
│ country         │     └────────┬────────┘
│ user_id         │              │
└─────────────────┘              ▼
                        ┌─────────────────┐
                        │   order_items   │
                        ├─────────────────┤
                        │ order_item_id   │
                        │ order_id        │
                        │ product_id      │
                        │ quantity        │
                        │ price           │
                        └─────────────────┘
```

---

## ⚠️ Troubleshooting

### Products Not Loading?
```sql
-- Check if products exist
SELECT COUNT(*) FROM product_table;

-- If empty, add sample products:
INSERT INTO category_table (category_id, category_name) VALUES (1, 'Electronics');
INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id) 
VALUES (1, 'iPhone 15', 'Latest Apple smartphone', 999.99, 50, 1);
```

### Cart Not Saving?
1. Make sure you're logged in (check User ID in navbar)
2. Check browser console (F12) for errors
3. Verify: `SELECT * FROM cart_items WHERE cart_id = (SELECT cart_id FROM carts WHERE user_id = YOUR_USER_ID);`

### Order Failing?
1. Ensure cart has items
2. Check if address is being created: `SELECT * FROM addresses ORDER BY id DESC LIMIT 1;`
3. View console for API errors

### Login Issues?
- Check credentials match: `SELECT email FROM user_table;`
- Password is hashed, cannot be viewed directly

---

## 🎨 UI Features

### Database Verification Panel
- **Location:** Bottom-left green database icon
- **Purpose:** Quick access to all SQL queries
- **Usage:** Click to toggle, copy queries to run in psql

### Toast Notifications
- Show success/error messages
- Include helpful DB query hints

### Real-time Cart Count
- Updates automatically after add/remove
- Synced with database

---

## 📝 API Response Examples

### Register Response
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890"
}
```

### Login Response
```json
{
  "userId": 1,
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Cart Response
```json
{
  "cartId": 1,
  "items": [
    {
      "cartItemId": 1,
      "productId": 1,
      "productName": "iPhone 15",
      "price": 999.99,
      "quantity": 2
    }
  ],
  "totalAmount": 1999.98
}
```

### Order Response
```json
{
  "orderId": 1,
  "totalAmount": 1999.98,
  "status": "PENDING",
  "items": [
    {
      "productId": 1,
      "productName": "iPhone 15",
      "quantity": 2,
      "price": 999.99
    }
  ]
}
```

---

## 🔄 Refresh Database Panel

The green database button at the bottom-left of the screen shows all SQL queries you can run to verify data:

| Table | Query |
|-------|-------|
| Users | `SELECT * FROM user_table;` |
| Products | `SELECT * FROM product_table;` |
| Categories | `SELECT * FROM category_table;` |
| Carts | `SELECT * FROM carts;` |
| Cart Items | `SELECT * FROM cart_items;` |
| Addresses | `SELECT * FROM addresses;` |
| Orders | `SELECT * FROM orders;` |
| Order Items | `SELECT * FROM order_items;` |

---

## ✅ Summary

All UI operations are now connected to the database:

| Action | Database Table |
|--------|---------------|
| Register | `user_table` |
| Login | Validates against `user_table` |
| View Products | `product_table` + `category_table` |
| Add to Cart | `cart_items` |
| Update Cart | `cart_items` |
| Remove from Cart | `cart_items` |
| Add Address | `addresses` |
| Place Order | `orders` + `order_items` |
| View Orders | `orders` + `order_items` |

Happy Testing! 🎉
