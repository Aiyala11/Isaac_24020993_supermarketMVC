const CartItems = require('../models/CartItem');
const Product = require('../models/Product');

const CartItemsController = {
    // List all cart items for the logged-in user, enriched with product details (no fines)
    list(req, res) {
        const userId = req.session.user.userId;
        CartItems.getByUserId(userId, (err, cartItems) => {
            if (err) return res.status(500).send('Error retrieving cart');

            const enriched = [];
            let pending = (cartItems || []).length;
            if (pending === 0) return res.render('cart', { cart: [], user: req.session.user });

            cartItems.forEach((item) => {
                if (item.item_type === 'product') {
                    Product.getById(item.item_id, (pErr, product) => {
                        if (pErr) return res.status(500).send('Error retrieving product');
                        enriched.push({
                            type: 'product',
                            id: item.id,
                            productId: item.item_id,
                            productName: product ? product.productName : 'Unknown',
                            price: item.unit_price || (product ? product.price : 0),
                            quantity: item.quantity,
                            image: product ? product.image : null
                        });
                        pending -= 1;
                        if (pending === 0) res.render('cart', { cart: enriched, user: req.session.user });
                    });
                } else {
                    // skip unknown/non-product types (fines removed)
                    pending -= 1;
                    if (pending === 0) res.render('cart', { cart: enriched, user: req.session.user });
                }
            });
        });
    },

    // Add a product to the cart (expects productId in body or itemId)
    add(req, res) {
        const userId = req.session.user.userId;
        const productId = parseInt(req.body.productId || req.body.itemId, 10);
        if (!productId) {
            req.flash('error', 'Invalid product selected');
            return res.redirect('/shopping');
        }
        Product.getById(productId, (err, product) => {
            if (err || !product) {
                req.flash('error', 'Product not found');
                return res.redirect('/shopping');
            }
            const unitPrice = product.price || 0;
            CartItems.add(userId, 'product', productId, 1, unitPrice, (err) => {
                if (err) req.flash('error', 'Could not add to cart');
                else req.flash('success', 'Product added to cart');
                res.redirect('/cart');
            });
        });
    },

    // Remove an item from the cart (product)
    remove(req, res) {
        const userId = req.session.user.userId;
        const { itemType, itemId } = req.body;
        // only allow product itemType (fines removed)
        if (itemType !== 'product') {
            req.flash('error', 'Invalid item type');
            return res.redirect('/cart');
        }
        CartItems.remove(userId, itemType, itemId, (err) => {
            if (req.headers['content-type'] === 'application/json') {
                if (err) return res.status(500).json({ success: false, message: 'Could not remove from cart' });
                return res.json({ success: true, itemId });
            } else {
                if (err) req.flash('error', 'Could not remove from cart');
                else req.flash('success', 'Item removed from cart');
                res.redirect('/cart');
            }
        });
    },

    // Clear all items from the cart
    clear(req, res) {
        const userId = req.session.user.userId;
        CartItems.clear(userId, (err) => {
            if (req.headers['content-type'] === 'application/json') {
                if (err) return res.status(500).json({ success: false, message: 'Could not clear cart' });
                return res.json({ success: true });
            } else {
                if (err) req.flash('error', 'Could not clear cart');
                else req.flash('success', 'Cart cleared');
                res.redirect('/cart');
            }
        });
    }
};

module.exports = CartItemsController;
