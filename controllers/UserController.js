const User = require('../models/User');

const UserController = {

    // GET /register
    showRegister(req, res) {
        res.render('register', {
            messages: req.flash('error'),
            formData: req.flash('formData')[0]
        });
    },

    // POST /register
    register(req, res) {
        const { username, email, password, address, contact } = req.body;

        // Removed role requirement
        if (!username || !email || !password || !address || !contact) {
            req.flash('error', 'All fields are required.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

        if (password.length < 6) {
            req.flash('error', 'Password should be at least 6 characters long.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

        // Force role = user (no admin allowed)
        const user = { 
            username, 
            email, 
            password, 
            address, 
            contact, 
            role: "user" 
        };

        User.create(user, (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).send('Database error');
            }

            req.flash('success', 'Registration successful! Please log in.');
            return res.redirect('/login');
        });
    },

    // GET /login
    showLogin(req, res) {
        res.render('login', {
            messages: req.flash('success'),
            errors: req.flash('error')
        });
    },

    // POST /login
    login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/login');
        }

        User.getByEmail(email, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).send('Database error');
            }

            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }

            // Validate password with SHA1
            const db = require('../db');
            db.query(
                `SELECT * FROM users WHERE email = ? AND password = SHA1(?)`,
                [email, password],
                (err, results) => {
                    if (err) throw err;

                    if (results.length === 0) {
                        req.flash('error', 'Invalid email or password.');
                        return res.redirect('/login');
                    }

                    req.session.user = results[0]; // store full user record including address + contact

                    if (req.session.user.role === 'user')
                        return res.redirect('/shopping');
                    else
                        return res.redirect('/inventory');
                }
            );
        });
    },

    // GET /logout
    logout(req, res) {
        req.session.destroy();
        res.redirect('/login');
    },

    // Middleware: Require Login
    checkAuthenticated(req, res, next) {
        if (req.session.user) return next();
        req.flash('error', 'Please log in to continue');
        return res.redirect('/login');
    },

    // Middleware: Require Admin
    checkAdmin(req, res, next) {
        if (req.session.user && req.session.user.role === 'admin') return next();
        req.flash('error', 'Access denied');
        return res.redirect('/shopping');
    },

    // POST /update-address  (Used on payment page)
    updateAddress(req, res) {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const newAddress = req.body.address;
        const selectedItems = req.body.selectedItems || '';

        const db = require('../db');
        db.query(
            'UPDATE users SET address = ? WHERE id = ?',
            [newAddress, req.session.user.id],
            (err) => {
                if (err) {
                    console.error('Error updating address:', err);
                    return res.status(500).send('Database error');
                }

                // update session so EJS pages show updated address
                req.session.user.address = newAddress;

                // redirect back to payment with the same selected items
                let redirectUrl = '/payment';
                if (selectedItems) {
                    redirectUrl += '?selectedItems=' + encodeURIComponent(selectedItems);
                }
                res.redirect(redirectUrl);
            }
        );
    }
};

module.exports = UserController;
