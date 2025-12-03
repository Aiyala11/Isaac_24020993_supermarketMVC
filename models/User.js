/**
 * Function-based User model (MVC)
 * Uses db from ../db.
 * Table fields: id, username, email, password, address, contact, role
 */

const User = {
    // Create new user
    create(user, callback) {
        const db = require('../db');
        const sql = `
            INSERT INTO users (username, email, password, address, contact, role)
            VALUES (?, ?, SHA1(?), ?, ?, ?)
        `;
        const params = [
            user.username,
            user.email,
            user.password,
            user.address,
            user.contact,
            user.role
        ];
        db.query(sql, params, (err, result) => callback(err, result));
    },

    // Get a user by email (used for login)
    getByEmail(email, callback) {
        const db = require('../db');
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.query(sql, [email], (err, results) =>
            callback(err, results && results[0] ? results[0] : null)
        );
    },

    // Get user by ID
    getById(id, callback) {
        const db = require('../db');
        const sql = `SELECT * FROM users WHERE id = ?`;
        db.query(sql, [id], (err, results) =>
            callback(err, results && results[0] ? results[0] : null)
        );
    }
};

module.exports = User;
