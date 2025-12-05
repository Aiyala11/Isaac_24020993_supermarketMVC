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
    },

    // List all users (admin dashboard)
    getAll(callback) {
        const db = require('../db');
        const sql = `
            SELECT id, username, email, address, contact, role, createdAt
            FROM users
            ORDER BY createdAt DESC
        `;
        db.query(sql, callback);
    },

    // Update user by ID (admin)
    updateById(id, data, callback) {
        const db = require('../db');
        const sql = `
            UPDATE users
            SET username = ?, email = ?, address = ?, contact = ?, role = ?
            WHERE id = ?
        `;
        db.query(
            sql,
            [data.username, data.email, data.address, data.contact, data.role, id],
            callback
        );
    },

    // Update profile (user self-service; role is not touched)
    updateProfile(id, data, callback) {
        const db = require('../db');
        const sql = `
            UPDATE users
            SET username = ?, email = ?, address = ?, contact = ?
            WHERE id = ?
        `;
        db.query(
            sql,
            [data.username, data.email, data.address, data.contact, id],
            callback
        );
    },

    // Delete user (admin)
    deleteById(id, callback) {
        const db = require('../db');
        db.query(`DELETE FROM users WHERE id = ?`, [id], callback);
    }
};

module.exports = User;
