const db = require('../db'); 
const bcrypt = require('bcryptjs');

const User = {
	getAll(callback){
		// ...existing code...
		// Return all users (no fines-specific filtering)
		db.query('SELECT * FROM users', callback);
		// ...existing code...
	},
	getByCredentials(email, password, callback) {
		// ...existing code...
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
	// ...existing code...
};

module.exports = User;
