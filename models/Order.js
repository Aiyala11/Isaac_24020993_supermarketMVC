const db = require('../db');

const Order = {

    // -------------------------------------------------------
    // Create a new order
    // -------------------------------------------------------
    createOrder(userId, totalAmount, paymentMethod, callback) {
        const sql = `
            INSERT INTO orders (userId, totalAmount, paymentMethod, createdAt, status)
            VALUES (?, ?, ?, NOW(), 'Pending')
        `;
        db.query(sql, [userId, totalAmount, paymentMethod], (err, result) => {
            if (err) return callback(err);
            callback(null, result.insertId);
        });
    },

    // -------------------------------------------------------
    // Add a product into an order (order_items)
    // -------------------------------------------------------
    addOrderItem(orderId, productId, quantity, price, callback) {
        const sql = `
            INSERT INTO order_items (orderId, productId, quantity, price)
            VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [orderId, productId, quantity, price], callback);
    },

    // -------------------------------------------------------
    // Get all orders for a specific user  
    // (Used for orderHistory.ejs)
    // -------------------------------------------------------
    getOrdersByUser(userId, callback) {
        const sql = `
            SELECT 
                o.id AS orderId,
                o.totalAmount,
                o.paymentMethod,
                o.status,
                o.createdAt,
                oi.quantity,
                oi.price,
                p.productName
            FROM orders o
            JOIN order_items oi ON oi.orderId = o.id
            JOIN products p      ON p.id = oi.productId
            WHERE o.userId = ?
            ORDER BY o.createdAt DESC, o.id DESC
        `;
        db.query(sql, [userId], callback);
    },

    // -------------------------------------------------------
    // For admin notifications (FINAL FIXED VERSION)
    // Correctly displays totalAmount for each order
    // -------------------------------------------------------
    getAllOrdersWithUser(callback) {
        const sql = `
            SELECT 
                o.id AS orderId,
                o.totalAmount,
                o.paymentMethod,
                o.status,
                o.createdAt,
                u.username,
                (
                    SELECT 
                        GROUP_CONCAT(CONCAT(p.productName, ' (x', oi.quantity, ')') 
                        SEPARATOR ', ')
                    FROM order_items oi
                    JOIN products p ON p.id = oi.productId
                    WHERE oi.orderId = o.id
                ) AS items
            FROM orders o
            JOIN users u ON u.id = o.userId
            ORDER BY o.createdAt DESC
        `;
        db.query(sql, callback);
    }

    // -------------------------------------------------------
    // Get single order by id (with items)
    // -------------------------------------------------------
    , getOrderById(orderId, callback) {
        const sql = `
            SELECT 
                o.id AS orderId,
                o.userId,
                o.totalAmount,
                o.paymentMethod,
                o.status,
                o.createdAt,
                oi.quantity,
                oi.price,
                p.productName,
                u.username,
                u.address,
                u.contact
            FROM orders o
            JOIN order_items oi ON oi.orderId = o.id
            JOIN products p ON p.id = oi.productId
            LEFT JOIN users u ON u.id = o.userId
            WHERE o.id = ?
        `;
        db.query(sql, [orderId], callback);
    }

};

module.exports = Order;
