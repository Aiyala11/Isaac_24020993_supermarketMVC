const Product = require('../models/Product');
const Order = require('../models/Order');
const db = require('../db');

class AnalyticsController {
  // Show analytics dashboard
  static showAnalytics(req, res) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/login');
    }

    // Get all products with stock info
    Product.getAll((err, products) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.render('analytics', {
          products: [],
          orders: [],
          topProducts: [],
          lowStockProducts: [],
          salesByCategory: [],
          inventoryValue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          user: req.session.user
        });
      }

      // Get all orders with details
      Order.getAllOrdersWithUser((orderErr, orders) => {
        if (orderErr) {
          console.error('Error fetching orders:', orderErr);
          orders = [];
        }

        // Calculate analytics
        const topProducts = calculateTopProducts(orders, products);
        const lowStockProducts = products.filter(p => p.quantity <= 20).sort((a, b) => a.quantity - b.quantity);
        const salesByCategory = calculateSalesByCategory(orders, products);
        const inventoryValue = calculateInventoryValue(products);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0) / totalOrders : 0;

        res.render('analytics', {
          products,
          orders,
          topProducts,
          lowStockProducts,
          salesByCategory,
          inventoryValue,
          totalOrders,
          averageOrderValue,
          user: req.session.user,
          messages: req.flash('success'),
          errors: req.flash('error')
        });
      });
    });
  }
}

// Helper functions
function calculateTopProducts(orders, products) {
  const productSales = {};

  orders.forEach(order => {
    // Parse items from order if stored as JSON
    let items = [];
    try {
      if (typeof order.items === 'string') {
        items = JSON.parse(order.items);
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }
    } catch (e) {
      // If parsing fails, skip
    }

    if (Array.isArray(items)) {
      items.forEach(item => {
        const productId = item.productId || item.id;
        productSales[productId] = (productSales[productId] || 0) + (item.quantity || 1);
      });
    }
  });

  // Match with product names and sort
  const topProductsList = Object.entries(productSales)
    .map(([productId, quantity]) => {
      const product = products.find(p => p.id == productId);
      return {
        productId,
        productName: product ? product.productName : `Product ${productId}`,
        quantity,
        price: product ? parseFloat(product.price) : 0
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return topProductsList;
}

function calculateSalesByCategory(orders, products) {
  const categorySales = {};

  orders.forEach(order => {
    let items = [];
    try {
      if (typeof order.items === 'string') {
        items = JSON.parse(order.items);
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }
    } catch (e) {
      // If parsing fails, skip
    }

    if (Array.isArray(items)) {
      items.forEach(item => {
        const productId = item.productId || item.id;
        const product = products.find(p => p.id == productId);
        const category = product ? product.categoryName : 'Uncategorized';
        const itemPrice = item.price || (product ? parseFloat(product.price) : 0);
        const quantity = item.quantity || 1;
        const total = itemPrice * quantity;

        categorySales[category] = (categorySales[category] || 0) + total;
      });
    }
  });

  return Object.entries(categorySales)
    .map(([category, sales]) => ({ category, sales: parseFloat(sales.toFixed(2)) }))
    .sort((a, b) => b.sales - a.sales);
}

function calculateInventoryValue(products) {
  return products.reduce((total, p) => {
    return total + (p.quantity * parseFloat(p.price));
  }, 0).toFixed(2);
}

module.exports = AnalyticsController;
