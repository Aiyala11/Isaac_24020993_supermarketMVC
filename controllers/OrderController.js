const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const OrderController = {

    // ⭐ USER ORDER HISTORY (Newest first)
    userHistory(req, res) {
        const user = req.session.user;

        if (!user) return res.redirect('/login');

        Order.getOrdersByUser(user.id, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            const grouped = {};

            // Group rows by orderId
            rows.forEach(r => {
                if (!grouped[r.orderId]) {
                    grouped[r.orderId] = {
                        id: r.orderId,
                        total: parseFloat(r.totalAmount),   // use totalAmount correctly
                        createdAt: r.createdAt,
                        items: []
                    };
                }

                grouped[r.orderId].items.push({
                    name: r.productName,
                    quantity: r.quantity,
                    price: parseFloat(r.price)
                });
            });

            // ⭐ Sort orders by date (Newest → Oldest)
            let orders = Object.values(grouped).sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // ⭐ Add per-user order numbering
            orders.forEach((order, index) => {
                order.orderNumber = orders.length - index;   // 1, 2, 3 for each user
            });

            res.render('orderHistory', {
                user,
                orders
            });
        });
    },

    // ⭐ ADMIN ORDER NOTIFICATIONS (Newest first)
    adminNotifications(req, res) {
        const user = req.session.user;

        if (!user || user.role !== 'admin') {
            return res.redirect('/shopping');
        }

        Order.getAllOrdersWithUser((err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            const formatted = rows.map(r => ({
                orderId: r.orderId,
                username: r.username,
                items: r.items,
                total: parseFloat(r.totalAmount),
                createdAt: r.createdAt
            }));

            // ⭐ Sort newest → oldest
            formatted.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            res.render('adminnotifications', {
                user,
                orders: formatted
            });
        });
    },

    // ⭐ ADMIN DASHBOARD
    adminDashboard(req, res) {
        const user = req.session.user;

        if (!user || user.role !== 'admin') {
            return res.redirect('/shopping');
        }

        // Fetch all data in parallel
        let stats = {
            totalUsers: 0,
            totalAdmins: 0,
            totalProducts: 0,
            lowStockCount: 0,
            totalOrders: 0,
            totalRevenue: 0
        };

        // Get users and admins count
        User.getAll((errUsers, users) => {
            if (!errUsers && users) {
                stats.totalUsers = users.length;
                stats.totalAdmins = users.filter(u => u.role === 'admin').length;
            }

            // Get products and low stock count
            Product.getAll((errProducts, products) => {
                if (!errProducts && products) {
                    stats.totalProducts = products.length;
                    stats.lowStockCount = products.filter(p => p.quantity <= 20).length;
                }

                // Get orders and revenue
                Order.getAllOrdersWithUser((errOrders, orders) => {
                    if (!errOrders && orders) {
                        const uniqueOrders = [...new Set(orders.map(o => o.orderId))];
                        stats.totalOrders = uniqueOrders.length;
                        stats.totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0) / uniqueOrders.length;
                    }

                    // Get recent orders for preview
                    Order.getAllOrdersWithUser((errRecent, recentOrders) => {
                        const orderMap = {};
                        (recentOrders || []).forEach(row => {
                            if (!orderMap[row.orderId]) {
                                orderMap[row.orderId] = {
                                    id: row.orderId,
                                    username: row.username,
                                    totalAmount: row.totalAmount,
                                    status: row.status || 'Pending',
                                    createdAt: row.createdAt
                                };
                            }
                        });

                        const recentList = Object.values(orderMap)
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5);

                        res.render('adminDashboard', {
                            user,
                            stats,
                            recentOrders: recentList
                        });
                    });
                });
            });
        });
    }
};

module.exports = OrderController;
