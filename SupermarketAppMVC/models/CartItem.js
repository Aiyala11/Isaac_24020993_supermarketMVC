const db = require('../db');

const CartItems = {
    getByUserId(userId, callback) {
        db.query('SELECT * FROM cart_items WHERE userId = ?', [userId], callback);
    },
    // generic add: itemType = 'product'|'fine', itemId = productId or fineId
    add(userId, itemType, itemId, quantity = 1, unitPrice = 0, callback) {
        // if existing, increase quantity
        const sqlFind = 'SELECT * FROM cart_items WHERE userId = ? AND item_type = ? AND item_id = ?';
        db.query(sqlFind, [userId, itemType, itemId], (err, results) => {
            if (err) return callback(err);
            if (results && results.length) {
                const existing = results[0];
                const newQty = (existing.quantity || 0) + quantity;
                db.query('UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?', [newQty, unitPrice, existing.id], callback);
            } else {
                db.query('INSERT INTO cart_items (userId, item_type, item_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)', [userId, itemType, itemId, quantity, unitPrice], callback);
            }
        });
    },
    remove(userId, itemType, itemId, callback) {
        db.query('DELETE FROM cart_items WHERE userId = ? AND item_type = ? AND item_id = ?', [userId, itemType, itemId], callback);
    },
    // removeBulk: specify itemType and an array of itemIds
    removeBulk(userId, itemType, itemIds, callback) {
        if (!itemIds || !itemIds.length) return callback(null);
        const placeholders = itemIds.map(() => '?').join(',');
        const sql = `DELETE FROM cart_items WHERE userId = ? AND item_type = ? AND item_id IN (${placeholders})`;
        db.query(sql, [userId, itemType, ...itemIds], callback);
    },
    clear(userId, callback) {
        db.query('DELETE FROM cart_items WHERE userId = ?', [userId], callback);
    }
};

module.exports = CartItems;
