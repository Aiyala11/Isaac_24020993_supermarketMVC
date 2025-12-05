const User = require('../models/User');

const UserController = {
	// Render login form
	loginForm(req, res) {
		const formData = req.flash('formData')[0] || {};
		const errors = req.flash('error') || [];
		res.render('login', { formData, errors, user: req.session.user });
	},

	// Handle login
	login(req, res) {
		const { email, password } = req.body;
		User.getByCredentials(email, password, (err, userData) => {
			if (err) return res.status(500).send('Server error');
			if (!userData) {
				req.flash('error', 'Invalid email or password');
				req.flash('formData', req.body);
				return res.redirect('/login');
			}
			req.session.user = {
				userId: userData.userId,
				name: userData.name,
				email: userData.email,
				role: userData.role,
			};
			req.flash('success', 'Logged in');
			if (userData.role === 'admin') {
				return res.redirect('/admin/dashboard');
			} else {
				// fines removed -> send regular users to shopping
				return res.redirect('/shopping');
			}
		});
	},

	// Logout
	logout(req, res) {
		req.session.destroy((err) => {
			res.redirect('/');
		});
	},
};

module.exports = UserController;
