const db = require('../db'); 
const bcrypt = require('bcrypt');

const User = {
    getAll(callback){
        db.query('SELECT * FROM users WHERE role = "student"', callback);
    },
    getByCredentials(email, password, callback) {
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return callback(err);
            const row = results && results.length ? results[0] : null;
            if (!row) return callback(null, null);
            bcrypt.compare(password, row.password, (cmpErr, match) => {
                if (cmpErr) return callback(cmpErr);
                if (!match) return callback(null, null);
                delete row.password;
                callback(null, row);
            });
        });
    },

};

module.exports = User;

