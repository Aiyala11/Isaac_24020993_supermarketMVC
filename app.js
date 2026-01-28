const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize Stripe only if secret key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    const stripeModule = require('stripe');
    stripe = stripeModule(process.env.STRIPE_SECRET_KEY);
}

// Initialize PayPal SDK if credentials are available
const paypal = require('@paypal/checkout-server-sdk');
let paypalClient = null;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    const Environment = process.env.NODE_ENV === 'production'
        ? paypal.core.LiveEnvironment
        : paypal.core.SandboxEnvironment;
    const paypalEnv = new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);
}

// Suppress the deprecated util.isArray warning from connect-flash
process.removeAllListeners('warning');
process.on('warning', (warning) => {
    if (warning.code !== 'DEP0044') {
        console.warn(warning.name, warning.message);
    }
});

const app = express();

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION - application will exit');
    console.error(err && err.stack ? err.stack : err);
    setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION - application will exit');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    setTimeout(() => process.exit(1), 100);
});

// Controllers
const UserController = require('./controllers/UserController');
const ProductController = require('./controllers/ProductController');
const CartController = require('./controllers/CartController');
const PaymentController = require('./controllers/PaymentController');
const OrderController = require('./controllers/OrderController');
const AnalyticsController = require('./controllers/AnalyticsController');
const netsService = require('./services/nets');

// Models used in routes
const Category = require('./models/Category');
const Order = require('./models/Order');
const Product = require('./models/Product');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images'),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// View Engine + Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

// Sessions
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
    })
);

app.use(flash());

// Expose flash messages to all views as `messages` and `errors`
app.use((req, res, next) => {
    res.locals.messages = req.flash('success') || [];
    res.locals.errors = req.flash('error') || [];
    next();
});

// Make user available everywhere
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Admin notification badge
app.use((req, res, next) => {
    res.locals.orderCount = 0;

    if (!req.session.user || req.session.user.role !== 'admin') {
        return next();
    }

    Order.getAllOrdersWithUser((err, rows) => {
        if (err) {
            console.error("Notification badge error:", err);
            return next();
        }

        res.locals.orderCount = rows.length;
        next();
    });
});

/* -------------------------
   HOME PAGE
-------------------------- */
app.get('/', (req, res) => {
    const user = req.session.user || null;

    // Show homepage for both guests and logged-in users
    Category.getAll((catErr, categories = []) => {
        if (catErr) {
            console.error('Home category load error:', catErr);
        }

        Product.getFeatured(8, (prodErr, featuredRows = []) => {
            if (prodErr) {
                console.error('Home featured products error:', prodErr);
            }

            const fallbackProducts = [
                { id: 'f1', productName: 'Fresh Apples', price: 3.5, image: 'apples.png', categoryName: 'Groceries' },
                { id: 'f2', productName: 'Bananas Bunch', price: 2.2, image: 'bananas.png', categoryName: 'Groceries' },
                { id: 'f3', productName: 'Gardenia Bread', price: 2.1, image: 'gardeniawhitebreadjumbo.png', categoryName: 'Bakery' },
                { id: 'f4', productName: 'Broccoli Crown', price: 1.9, image: 'broccoli.png', categoryName: 'Groceries' },
                { id: 'f5', productName: 'Organic Milk', price: 4.2, image: 'milk.png', categoryName: 'Dairy' },
                { id: 'f6', productName: 'Tomatoes Pack', price: 3.0, image: 'tomatoes.png', categoryName: 'Groceries' }
            ];

            const featuredProducts = (prodErr || !featuredRows || featuredRows.length === 0)
                ? fallbackProducts
                : featuredRows;
            const safeCategories = catErr ? [] : categories;

            res.render('index', {
                user,
                categories: safeCategories,
                featuredProducts,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    });
});

/* -------------------------
   USER ROUTES
-------------------------- */
app.get('/register', UserController.showRegister);
app.post('/register', UserController.register);

app.get('/login', UserController.showLogin);
app.post('/login', UserController.login);

app.get('/logout', UserController.logout);

app.post(
    '/update-address',
    UserController.checkAuthenticated,
    UserController.updateAddress
);

app.get(
    '/profile',
    UserController.checkAuthenticated,
    UserController.showProfile
);

app.post(
    '/profile',
    UserController.checkAuthenticated,
    UserController.updateProfile
);

/* -------------------------
   PRODUCT ROUTES
-------------------------- */
app.get(
    '/inventory',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.listAll
);

app.get(
    '/shopping',
    UserController.checkAuthenticated,
    ProductController.listAll
);

app.get(
    '/product/:id',
    UserController.checkAuthenticated,
    ProductController.getById
);

app.get(
    '/addProduct',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.showAddForm
);

app.post(
    '/addProduct',
    upload.single('image'),
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.add
);

app.get(
    '/updateProduct/:id',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.showUpdateForm
);

app.post(
    '/updateProduct/:id',
    upload.single('image'),
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.update
);

app.get(
    '/deleteProduct/:id',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.delete
);

/* -------------------------
   CART ROUTES
-------------------------- */
app.get(
    '/cart',
    UserController.checkAuthenticated,
    CartController.viewCart
);

app.post(
    '/add-to-cart/:id',
    UserController.checkAuthenticated,
    CartController.addToCart
);

app.post(
    '/cart/update/:itemId',
    UserController.checkAuthenticated,
    CartController.updateQuantity
);

app.post(
    '/cart/delete/:itemId',
    UserController.checkAuthenticated,
    CartController.deleteItem
);

app.post(
    '/cart/checkout',
    UserController.checkAuthenticated,
    CartController.checkoutSelected
);

/* -------------------------
   PAYMENT ROUTES
-------------------------- */
app.get(
    '/payment',
    UserController.checkAuthenticated,
    PaymentController.showPaymentPage
);

app.post(
    '/payment',
    UserController.checkAuthenticated,
    PaymentController.processPayment
);

/* -------------------------
   NETS PAYMENT ROUTES
-------------------------- */
app.post(
    '/generateNETSQR',
    UserController.checkAuthenticated,
    netsService.generateQrCode
);

app.get("/nets-qr/success", (req, res) => {
    res.render('netsTxnSuccessStatus', { message: 'Transaction Successful!' });
});

app.get("/nets-qr/fail", (req, res) => {
    res.render('netsTxnFailStatus', { message: 'Transaction Failed. Please try again.' });
});

// SSE endpoint for payment status polling
app.get('/sse/payment-status/:txnRetrievalRef', async (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const txnRetrievalRef = req.params.txnRetrievalRef;
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes if polling every 5s
    let frontendTimeoutStatus = 0;

    const interval = setInterval(async () => {
        pollCount++;

        try {
            // Call the NETS query API
            const response = await axios.post(
                'https://sandbox.nets.openapipaas.com/api/v1/common/payments/nets-qr/query',
                { txn_retrieval_ref: txnRetrievalRef, frontend_timeout_status: frontendTimeoutStatus },
                {
                    headers: {
                        'api-key': process.env.API_KEY,
                        'project-id': process.env.PROJECT_ID,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("Polling response:", response.data);
            res.write(`data: ${JSON.stringify(response.data)}\n\n`);
        
            const resData = response.data.result.data;

            // Check if payment is successful
            if (resData.response_code == "00" && resData.txn_status === 1) {
                // Payment success
                res.write(`data: ${JSON.stringify({ success: true })}\n\n`);
                clearInterval(interval);
                res.end();
            } else if (frontendTimeoutStatus == 1 && resData && (resData.response_code !== "00" || resData.txn_status === 2)) {
                // Payment failure
                res.write(`data: ${JSON.stringify({ fail: true, ...resData })}\n\n`);
                clearInterval(interval);
                res.end();
            }

        } catch (err) {
            clearInterval(interval);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        }

        // Timeout
        if (pollCount >= maxPolls) {
            clearInterval(interval);
            frontendTimeoutStatus = 1;
            res.write(`data: ${JSON.stringify({ fail: true, error: "Timeout" })}\n\n`);
            res.end();
        }
    }, 5000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

/* -------------------------
   STRIPE PAYMENT ROUTES
-------------------------- */
app.post('/create-stripe-checkout', UserController.checkAuthenticated, async (req, res) => {
    if (!stripe) {
        return res.redirect('/payment?error=stripe_not_configured');
    }
    
    const total = parseFloat(req.body.cartTotal) || 0;
    const currency = req.body.currency || 'SGD';
    const bnplMonths = req.body.bnplMonths || null;
    
    // Store in session for order processing
    req.session.paymentCurrency = currency;
    req.session.paymentAmount = total;
    req.session.bnplMonths = bnplMonths;
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'sgd',
                        product_data: {
                            name: 'Supermarket Order',
                            description: 'Payment for your supermarket order',
                        },
                        unit_amount: Math.round(total * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/payment`,
        });
        
        res.redirect(session.url);
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.redirect('/payment?error=stripe_checkout_failed');
    }
});

app.get('/stripe-success', UserController.checkAuthenticated, async (req, res) => {
    if (!stripe) {
        return res.redirect('/payment?error=stripe_not_configured');
    }
    
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        
        if (session.payment_status === 'paid') {
            const user = req.session.user;
            const total = req.session.paymentAmount || 0;
            const currency = req.session.paymentCurrency || 'SGD';
            const bnplMonths = req.session.bnplMonths || null;
            
            // Create order in database
            Order.createOrder(user.id, total, 'Stripe', (err, orderId) => {
                if (err) {
                    console.error('Order creation error:', err);
                    return res.redirect('/payment?error=order_creation_failed');
                }
                
                // Clear cart after successful order
                req.session.cart = [];
                
                res.redirect('/payment-success?orderId=' + orderId);
            });
        } else {
            res.redirect('/payment?error=payment_not_completed');
        }
    } catch (error) {
        console.error('Stripe success error:', error);
        res.redirect('/payment?error=stripe_verification_failed');
    }
});

/* -------------------------
   PAYPAL PAYMENT ROUTES
-------------------------- */
app.post('/create-paypal-order', UserController.checkAuthenticated, async (req, res) => {
    if (!paypalClient) {
        return res.status(400).json({ error: 'PayPal not configured' });
    }
    
    const total = parseFloat(req.body.cartTotal) || 0;
    const currency = req.body.currency || 'SGD';
    const bnplMonths = req.body.bnplMonths || null;
    
    // Store in session
    req.session.paymentCurrency = currency;
    req.session.paymentAmount = total;
    req.session.bnplMonths = bnplMonths;
    
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'SGD',
                    value: total.toFixed(2),
                },
            },
        ],
        redirect_urls: {
            return_url: `${req.protocol}://${req.get('host')}/paypal-return`,
            cancel_url: `${req.protocol}://${req.get('host')}/payment`,
        },
    });

    try {
        const order = await paypalClient.execute(request);
        const redirectUrl = order.result.links.find(link => link.rel === 'approve').href;
        res.json({ id: order.result.id, redirectUrl: redirectUrl });
    } catch (err) {
        console.error('PayPal order creation error:', err);
        res.status(500).json({ error: 'Failed to create PayPal order' });
    }
});

app.get('/paypal-return', UserController.checkAuthenticated, async (req, res) => {
    if (!paypalClient) {
        return res.redirect('/payment?error=paypal_not_configured');
    }
    
    const paypalOrderId = req.query.token;
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        
        if (capture.result.status === 'COMPLETED') {
            const user = req.session.user;
            const total = req.session.paymentAmount || 0;
            const currency = req.session.paymentCurrency || 'SGD';
            const bnplMonths = req.session.bnplMonths || null;
            
            // Create order
            Order.createOrder(user.id, total, 'PayPal', (err, orderId) => {
                if (err) {
                    console.error('Order creation error:', err);
                    return res.redirect('/payment?error=order_creation_failed');
                }
                
                // Clear cart
                req.session.cart = [];
                
                res.redirect('/payment-success?orderId=' + orderId);
            });
        } else {
            res.redirect('/payment?error=paypal_payment_not_completed');
        }
    } catch (err) {
        console.error('PayPal capture error:', err);
        res.redirect('/payment?error=paypal_capture_failed');
    }
});

/* -------------------------
   ORDER HISTORY
-------------------------- */
app.get(
    '/orders',
    UserController.checkAuthenticated,
    OrderController.userHistory
);

/* -------------------------
   ADMIN DASHBOARD
-------------------------- */
app.get(
    '/admin/dashboard',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    OrderController.adminDashboard
);

/* -------------------------
   ADMIN USER MANAGEMENT
-------------------------- */
app.get(
    '/admin/users',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    UserController.adminListUsers
);

app.get(
    '/admin/users/:id/edit',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    UserController.adminShowEditUser
);

app.post(
    '/admin/users/:id',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    UserController.adminUpdateUser
);

app.get(
    '/admin/users/:id/delete',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    UserController.adminDeleteUser
);

app.get(
    '/admin/admins',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    (req, res) => {
        res.render('comingSoon', { feature: 'Admin Management' });
    }
);

app.get(
    '/admin/analytics',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    AnalyticsController.showAnalytics
);

/* -------------------------
   ADMIN ORDER NOTIFICATIONS
-------------------------- */
app.get(
    '/admin/orders',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    OrderController.adminNotifications
);


/* -------------------------
   PAYMENT SUCCESS
-------------------------- */
app.get(
    '/payment-success',
    UserController.checkAuthenticated,
    (req, res) => {
        const orderId = req.query.orderId;
        res.render('paymentSuccess', { orderId });
    }
);

/* -------------------------
     INVOICE
-------------------------- */
app.get(
    '/invoice',
    UserController.checkAuthenticated,
    (req, res) => {
        return res.redirect('/orders');
    }
);

app.get(
    '/invoice/:id',
    UserController.checkAuthenticated,
    (req, res) => {
        const id = req.params.id;

        Order.getOrderById(id, (err, rows) => {
            if (err) {
                console.error('Order lookup error:', err);
                return res.status(500).send('Database error');
            }

            if (!rows || rows.length === 0) {
                return res.status(404).send('Order not found');
            }

            const orderInfo = {
                id: rows[0].orderId,
                date: rows[0].createdAt,
                paymentMethod: rows[0].paymentMethod,
                subtotal: parseFloat(rows[0].totalAmount) || 0,
                total: parseFloat(rows[0].totalAmount) || 0,
                items: rows.map(r => ({
                    productName: r.productName,
                    price: parseFloat(r.price),
                    quantity: r.quantity
                }))
            };

            res.render('invoice', {
                user: req.session.user || null,
                order: orderInfo
            });
        });
    }
);

/* -------------------------
   ⭐ BULK RESTOCK (POST ONLY)
-------------------------- */
app.post(
    '/inventory/bulk-restock',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    ProductController.bulkRestock
);

/* -------------------------
   ANALYTICS ROUTES
-------------------------- */
app.get(
    '/admin/analytics',
    UserController.checkAuthenticated,
    UserController.checkAdmin,
    AnalyticsController.showAnalytics
);

/* -------------------------
   CHATBOT API
-------------------------- */
app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message.toLowerCase().trim();
    let reply = '';

    // Simple AI-like responses based on keywords
    if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
        reply = 'Hello! 👋 Welcome to Isaac\'s Supermarket. How can I assist you today?';
    } else if (userMessage.includes('product') || userMessage.includes('items')) {
        reply = 'We offer a wide variety of fresh groceries, dairy, bakery items, and more! Visit our shopping page to browse all products.';
    } else if (userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('how much')) {
        reply = 'Product prices vary. Please check the shopping page for specific pricing on items you\'re interested in.';
    } else if (userMessage.includes('order') || userMessage.includes('purchase')) {
        reply = 'To place an order, add items to your cart from the shopping page and proceed to checkout. It\'s quick and easy!';
    } else if (userMessage.includes('shipping') || userMessage.includes('delivery')) {
        reply = 'We work to get your order to you as quickly as possible. Check your order history for delivery details.';
    } else if (userMessage.includes('payment') || userMessage.includes('pay')) {
        reply = 'We accept multiple payment methods during checkout. Your transactions are secure and encrypted.';
    } else if (userMessage.includes('account') || userMessage.includes('profile')) {
        reply = 'You can manage your account from your profile page. Update your address, contact info, and more!';
    } else if (userMessage.includes('help') || userMessage.includes('support')) {
        reply = 'I\'m here to help! Ask me about products, orders, shipping, or anything else. If you need more help, contact our support team.';
    } else if (userMessage.includes('thank')) {
        reply = 'You\'re welcome! 😊 Is there anything else I can help you with?';
    } else if (userMessage.includes('bye') || userMessage.includes('goodbye')) {
        reply = 'Goodbye! Thanks for shopping at Isaac\'s Supermarket. See you soon! 👋';
    } else if (userMessage.length === 0) {
        reply = 'Please type a message to get started!';
    } else {
        // Default response with helpful suggestions
        reply = 'I\'m still learning! 🤖 Try asking me about: products, orders, shipping, payments, or your account.';
    }

    res.json({ reply });
});


/* -------------------------
   START SERVER
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`🔗 Open your browser: http://localhost:${PORT}\n`);
});
