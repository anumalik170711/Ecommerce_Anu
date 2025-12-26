// ============================================
// SHOPEASE E-COMMERCE APPLICATION
// JavaScript for UI functionality
// ALL APIs CONNECTED TO DATABASE
// ============================================

// API Base URL
const API_BASE = '';

// State Management
let currentUser = null;
let authToken = null;
let cart = [];
let products = [];
let currentAddressId = null;
let pendingOrderId = null;
let pendingPaymentData = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check for saved auth
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Load cart from database
        loadCartFromDB();
    }
    
    // Load products on start
    loadProducts();
});

// ============================================
// NAVIGATION
// ============================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    
    // Show selected section
    const section = document.getElementById(`${sectionName}Section`);
    if (section) {
        section.style.display = 'block';
        
        // Load data based on section
        if (sectionName === 'products') loadProducts();
        if (sectionName === 'cart') loadCartFromDB();
        if (sectionName === 'orders') loadOrders();
    }
}

// ============================================
// AUTHENTICATION
// ============================================

async function register(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phoneNumber: document.getElementById('regPhone').value
    };
    
    try {
        showToast('Creating account...', 'info');
        
        const response = await fetch(`${API_BASE}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Registration response:', data);
            showToast('✅ Account created! Check database: SELECT * FROM user_table;');
            closeModal('registerModal');
            showModal('loginModal');
            document.getElementById('registerForm').reset();
        } else {
            const error = await response.text();
            showToast('Registration failed: ' + error, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
}

async function login(event) {
    event.preventDefault();
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    try {
        showToast('Logging in...', 'info');
        
        const response = await fetch(`${API_BASE}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            currentUser = { id: data.userId, email: credentials.email };
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthUI();
            closeModal('loginModal');
            showToast(`✅ Welcome! User ID: ${data.userId}`);
            document.getElementById('loginForm').reset();
            
            // Load user's cart from database
            loadCartFromDB();
        } else {
            showToast('Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    cart = [];
    currentAddressId = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    updateAuthUI();
    updateCartCount();
    showSection('home');
    showToast('Logged out successfully');
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = `User ID: ${currentUser.id}`;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// ============================================
// PRODUCTS - Connected to /api/products
// ============================================

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading products from database...</span>
        </div>
    `;
    
    try {
        // API returns paginated result - fetch with larger page size
        const response = await fetch(`${API_BASE}/api/products?page=0&size=50`);
        
        if (response.ok) {
            const pageData = await response.json();
            // Extract content array from paginated response
            products = pageData.content || pageData;
            console.log('Products loaded from DB:', products);
            renderProducts(products);
            showToast(`✅ Loaded ${products.length} products. Check: SELECT * FROM product_table;`, 'info');
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>No products in database. Add products first!</p>
                <p style="font-size: 0.9rem; color: #666;">
                    Run in psql: INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id) 
                    VALUES (1, 'iPhone 15', 'Latest smartphone', 999.99, 50, 1);
                </p>
            </div>
        `;
    }
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('productsGrid');
    
    if (!productsToRender || productsToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No products in database</p>
                <p style="font-size: 0.85rem; color: #888;">
                    Add products via API or database
                </p>
            </div>
        `;
        return;
    }
    
    const icons = {
        'Electronics': 'fa-laptop',
        'Clothing': 'fa-tshirt',
        'Books': 'fa-book',
        'default': 'fa-box'
    };
    
    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-category="${product.categoryName || 'Other'}">
            <div class="product-image">
                <i class="fas ${icons[product.categoryName] || icons['default']}"></i>
                <span class="product-badge">ID: ${product.id}</span>
            </div>
            <div class="product-info">
                <div class="product-category">${product.categoryName || 'General'}</div>
                <h3 class="product-name">${product.name || product.productName}</h3>
                <p class="product-description">${product.description || 'No description'}</p>
                <div class="product-footer">
                    <span class="product-price">$${(product.price || 0).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name || product.productName}', ${product.price})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts(category) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (category === 'all') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.categoryName === category);
        renderProducts(filtered);
    }
}

// ============================================
// CART - Connected to /api/cart
// ============================================

async function addToCart(productId, productName, price) {
    if (!currentUser) {
        showToast('Please login first', 'warning');
        showModal('loginModal');
        return;
    }
    
    try {
        showToast('Adding to cart...', 'info');
        
        // Call the API to add to cart in database
        const response = await fetch(`${API_BASE}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                productId: productId,
                quantity: 1
            })
        });
        
        if (response.ok) {
            const cartData = await response.json();
            console.log('Cart updated in DB:', cartData);
            
            // Reload cart from database
            await loadCartFromDB();
            
            showToast(`✅ Added to cart! Check DB: SELECT * FROM cart_items;`);
        } else {
            const error = await response.text();
            showToast('Failed to add to cart: ' + error, 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Failed to add to cart', 'error');
    }
}

async function loadCartFromDB() {
    if (!currentUser) {
        cart = [];
        updateCartCount();
        renderCart();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/cart/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const cartData = await response.json();
            console.log('Cart from DB:', cartData);
            
            // Map cart items from API response
            cart = (cartData.items || []).map(item => ({
                cartItemId: item.cartItemId,
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity
            }));
            
            updateCartCount();
            renderCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
        updateCartCount();
    }
}

async function updateQuantity(cartItemId, change) {
    if (!currentUser) return;
    
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        await removeFromCart(cartItemId);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/cart/update/${cartItemId}?quantity=${newQuantity}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            await loadCartFromDB();
            showToast('Cart updated! Check DB: SELECT * FROM cart_items;');
        }
    } catch (error) {
        console.error('Update quantity error:', error);
    }
}

async function removeFromCart(cartItemId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/cart/remove/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            await loadCartFromDB();
            showToast('Item removed! Check DB: SELECT * FROM cart_items;');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (!currentUser) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Please login to view cart</p>
                <button class="btn btn-primary" onclick="showModal('loginModal')">Login</button>
            </div>
        `;
        return;
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <p style="font-size: 0.85rem; color: #888;">
                    Cart data is stored in: carts & cart_items tables
                </p>
                <button class="btn btn-primary" onclick="showSection('products')">
                    <i class="fas fa-shopping-bag"></i> Browse Products
                </button>
            </div>
        `;
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('totalAmount').textContent = '$0.00';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="fas fa-box"></i>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.productName}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <small style="color: #888;">Cart Item ID: ${item.cartItemId}</small>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity(${item.cartItemId}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.cartItemId}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.cartItemId})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `$${subtotal.toFixed(2)}`;
}

// ============================================
// CHECKOUT & ORDERS - Connected to /api/orders
// ============================================

function checkout() {
    if (!currentUser) {
        showToast('Please login to checkout', 'warning');
        showModal('loginModal');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }
    
    showModal('checkoutModal');
}

async function placeOrder(event) {
    event.preventDefault();
    
    try {
        showToast('Processing order...', 'info');
        
        // Step 1: Create Address
        const addressData = {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipcode: document.getElementById('zipcode').value,
            country: document.getElementById('country').value
        };
        
        console.log('Creating address:', addressData);
        
        const addressResponse = await fetch(`${API_BASE}/api/addresses/${currentUser.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(addressData)
        });
        
        let addressId = 1;
        if (addressResponse.ok) {
            const address = await addressResponse.json();
            addressId = address.id;
            console.log('Address created with ID:', addressId);
        }
        
        // Step 2: Place Order (Status will be PENDING)
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const orderData = {
            userId: currentUser.id,
            addressId: addressId,
            paymentMethod: paymentMethod
        };
        
        console.log('Placing order:', orderData);
        
        const orderResponse = await fetch(`${API_BASE}/api/orders/place`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(orderData)
        });
        
        if (orderResponse.ok) {
            const orderResult = await orderResponse.json();
            console.log('Order placed:', orderResult);
            
            pendingOrderId = orderResult.orderId;
            
            // Clear local cart
            cart = [];
            updateCartCount();
            
            closeModal('checkoutModal');
            document.getElementById('checkoutForm').reset();
            
            // Show payment modal
            showPaymentModal(orderResult.orderId, orderResult.totalAmount, paymentMethod);
            
        } else {
            const error = await orderResponse.text();
            showToast('Order failed: ' + error, 'error');
        }
    } catch (error) {
        console.error('Order error:', error);
        showToast('Order failed. Check console for details.', 'error');
    }
}

// ============================================
// PAYMENT FLOW - Connected to /api/payments
// ============================================

async function showPaymentModal(orderId, amount, method) {
    // Update payment modal content
    document.getElementById('paymentOrderId').textContent = orderId;
    document.getElementById('paymentAmount').textContent = amount.toFixed(2);
    document.getElementById('paymentMethodDisplay').textContent = method;
    document.getElementById('payBtnAmount').textContent = amount.toFixed(2);
    
    // Reset payment form
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentStatus').style.display = 'none';
    document.getElementById('paymentFormContent').style.display = 'block';
    
    // Show modal
    showModal('paymentModal');
    
    // Step 1: Initiate Payment (creates PENDING payment in DB)
    try {
        const response = await fetch(`${API_BASE}/api/payments/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                orderId: orderId,
                method: method
            })
        });
        
        if (response.ok) {
            pendingPaymentData = await response.json();
            console.log('Payment initiated:', pendingPaymentData);
            showToast(`💳 Payment initiated! ID: ${pendingPaymentData.paymentId}. Check: SELECT * FROM payments;`, 'info');
        }
    } catch (error) {
        console.error('Payment initiation error:', error);
    }
}

async function processPayment(event) {
    event.preventDefault();
    
    if (!pendingPaymentData) {
        showToast('Payment not initialized', 'error');
        return;
    }
    
    // Get card details (just for show - not actually processed)
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const cardName = document.getElementById('cardName').value;
    
    // Basic validation
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        showToast('Please fill all card details', 'warning');
        return;
    }
    
    // Show processing state
    document.getElementById('paymentFormContent').style.display = 'none';
    document.getElementById('paymentStatus').style.display = 'block';
    document.getElementById('paymentStatusIcon').className = 'fas fa-spinner fa-spin';
    document.getElementById('paymentStatusText').textContent = 'Processing payment...';
    document.getElementById('paymentStatusIcon').style.color = '#3b82f6';
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Verify Payment (simulates webhook - updates status to SUCCESS)
    try {
        const response = await fetch(`${API_BASE}/api/payments/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                paymentId: pendingPaymentData.paymentId,
                transactionId: pendingPaymentData.transactionId,
                success: true  // Simulate successful payment
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Payment verified:', result);
            
            // Show success state
            document.getElementById('paymentStatusIcon').className = 'fas fa-check-circle';
            document.getElementById('paymentStatusIcon').style.color = '#10b981';
            document.getElementById('paymentStatusText').innerHTML = `
                <strong>Payment Successful!</strong><br>
                <span style="font-size: 0.9rem; color: #666;">
                    Transaction ID: ${result.transactionId}<br>
                    Payment ID: ${result.paymentId}<br>
                    Order Status: CONFIRMED
                </span>
            `;
            
            showToast(`✅ Payment SUCCESS! Order CONFIRMED. Check: SELECT * FROM payments; SELECT * FROM orders;`);
            
            // Show close button
            document.getElementById('paymentCloseBtn').style.display = 'block';
            
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        
        // Show error state
        document.getElementById('paymentStatusIcon').className = 'fas fa-times-circle';
        document.getElementById('paymentStatusIcon').style.color = '#ef4444';
        document.getElementById('paymentStatusText').textContent = 'Payment Failed. Please try again.';
        
        // Show retry button
        document.getElementById('paymentRetryBtn').style.display = 'block';
    }
}

function closePaymentModal() {
    closeModal('paymentModal');
    pendingPaymentData = null;
    pendingOrderId = null;
    showSection('orders');
}

function retryPayment() {
    document.getElementById('paymentStatus').style.display = 'none';
    document.getElementById('paymentFormContent').style.display = 'block';
    document.getElementById('paymentRetryBtn').style.display = 'none';
}

async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    if (!currentUser) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Please login to view orders</p>
                <button class="btn btn-primary" onclick="showModal('loginModal')">Login</button>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading orders from database...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/user/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            console.log('Orders from DB:', orders);
            renderOrders(orders);
            
            if (orders.length > 0) {
                showToast(`Loaded ${orders.length} orders. Check: SELECT * FROM orders;`, 'info');
            }
        } else {
            renderOrders([]);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        renderOrders([]);
    }
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No orders yet</p>
                <p style="font-size: 0.85rem; color: #888;">
                    Orders are stored in: orders & order_items tables
                </p>
                <button class="btn btn-primary" onclick="showSection('products')">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </button>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.orderId}</span>
                <span class="order-status ${(order.status || 'pending').toLowerCase()}">${order.status || 'PENDING'}</span>
            </div>
            <div class="order-details">
                <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Items:</strong> ${order.items ? order.items.length : 0}</p>
                <p class="order-total"><strong>Total:</strong> $${(order.totalAmount || 0).toFixed(2)}</p>
            </div>
            ${order.status === 'PENDING' ? `
                <div class="order-actions">
                    <button class="btn btn-primary pay-now-btn" onclick="payForOrder(${order.orderId}, ${order.totalAmount})">
                        <i class="fas fa-credit-card"></i> Pay Now
                    </button>
                </div>
            ` : order.status === 'CONFIRMED' ? `
                <div class="order-success-badge">
                    <i class="fas fa-check-circle"></i> Payment Complete
                </div>
            ` : ''}
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                <small style="color: #888;">
                    DB: SELECT * FROM orders WHERE order_id = ${order.orderId}; | SELECT * FROM payments WHERE order_id = ${order.orderId};
                </small>
            </div>
        </div>
    `).join('');
}

// Pay for existing PENDING order
async function payForOrder(orderId, amount) {
    pendingOrderId = orderId;
    showPaymentModal(orderId, amount, 'CARD');
}

// ============================================
// MODALS & TOAST
// ============================================

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    // Update icon based on type
    icon.className = type === 'error' ? 'fas fa-times-circle' : 
                     type === 'warning' ? 'fas fa-exclamation-circle' : 
                     type === 'info' ? 'fas fa-info-circle' :
                     'fas fa-check-circle';
    
    toast.style.background = type === 'error' ? '#ef4444' : 
                              type === 'warning' ? '#f59e0b' : 
                              type === 'info' ? '#3b82f6' :
                              '#10b981';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ============================================
// DATABASE PANEL TOGGLE
// ============================================

function toggleDbPanel() {
    const content = document.querySelector('.db-panel-content');
    content.classList.toggle('show');
}

// ============================================
// DATABASE VERIFICATION HELPER
// ============================================

// Open browser console and run these to check DB
console.log(`
╔════════════════════════════════════════════════════════════╗
║           DATABASE VERIFICATION QUERIES                     ║
╠════════════════════════════════════════════════════════════╣
║ Connect: psql -U postgres -d e_com                         ║
║                                                            ║
║ Users:      SELECT * FROM user_table;                      ║
║ Products:   SELECT * FROM product_table;                   ║
║ Categories: SELECT * FROM category_table;                  ║
║ Carts:      SELECT * FROM carts;                           ║
║ Cart Items: SELECT * FROM cart_items;                      ║
║ Addresses:  SELECT * FROM addresses;                       ║
║ Orders:     SELECT * FROM orders;                          ║
║ Order Items:SELECT * FROM order_items;                     ║
║ Payments:   SELECT * FROM payments;                        ║
╚════════════════════════════════════════════════════════════╝
`);
