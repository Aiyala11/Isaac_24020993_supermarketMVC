const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');
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


const Order = require('./models/Order');

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
app.use(express.json());   // ⭐ Required for AJAX JSON

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

// ⭐ Make user available everywhere
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ⭐ Admin notification badge
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
    res.render('index');
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
   ORDER HISTORY
-------------------------- */
app.get(
    '/orders',
    UserController.checkAuthenticated,
    OrderController.userHistory
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
   START SERVER
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
