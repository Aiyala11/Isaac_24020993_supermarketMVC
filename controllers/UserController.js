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
        const { username, email, password, confirmPassword, address, contact } = req.body;

        if (!username || !email || !password || !confirmPassword || !address || !contact) {
            req.flash('error', 'All fields are required.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

        // Validate contact number: exactly 8 digits
        const contactRegex = /^\d{8}$/;
        if (!contactRegex.test(contact.trim())) {
            req.flash('error', 'Contact number must be exactly 8 digits.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

        if (password.length < 6) {
            req.flash('error', 'Password should be at least 6 characters long.');
            req.flash('formData', req.body);
            return res.redirect('/register');
        }

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
                
                // Check for duplicate email error
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'Email address already registered. Please log in or use a different email.');
                } else if (err.errno === 1062) {
                    // Alternative duplicate key check
                    req.flash('error', 'Email address already registered. Please log in or use a different email.');
                } else {
                    req.flash('error', 'Registration failed. Please try again.');
                }
                
                req.flash('formData', req.body);
                return res.redirect('/register');
            }

            req.flash('success', 'Registration successful! Please log in.');
            return res.redirect('/login');
        });
    },

    // GET /login
    showLogin(req, res) {
        res.render('login', {
            messages: res.locals.messages || [],
            errors: res.locals.errors || [],
            formData: req.flash('formData')[0] || {}
        });
    },

    // POST /login
    login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'All fields are required.');
            req.flash('formData', req.body);
            return res.redirect('/login');
        }

        const db = require('../db');
        
        // Debug: Log the login attempt
        console.log('[LOGIN] Email:', email);

        db.query(
            `SELECT * FROM users WHERE email = ? AND password = SHA1(?)`,
            [email, password],
            (err, results) => {
                if (err) {
                    console.error('[LOGIN] Query error:', err);
                    req.flash('error', 'Database error occurred.');
                    req.flash('formData', req.body);
                    return res.redirect('/login');
                }

                console.log('[LOGIN] Query results:', results?.length, 'records found');

                if (!results || results.length === 0) {
                    console.log('[LOGIN] No user found with this email and password');
                    req.flash('error', 'Invalid email or password.');
                    req.flash('formData', req.body);
                    return res.redirect('/login');
                }

                console.log('[LOGIN] User authenticated:', results[0].email);
                req.session.user = results[0];
                req.flash("success", "Successfully logged in!");

                if (req.session.user.role === 'user')
                    return res.redirect('/shopping');
                else
                    return res.redirect('/inventory');
            }
        );
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

    // POST /update-address
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

                req.session.user.address = newAddress;

                let redirectUrl = '/payment';
                if (selectedItems) {
                    redirectUrl += '?selectedItems=' + encodeURIComponent(selectedItems);
                }
                res.redirect(redirectUrl);
            }
        );
    },

    // GET /profile
    showProfile(req, res) {
        const userId = req.session.user.id;

        User.getById(userId, (err, user) => {
            if (err) {
                console.error('Error fetching profile:', err);
                req.flash('error', 'Unable to load your profile right now.');
                return res.redirect('/shopping');
            }

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/logout');
            }

            res.render('profile', {
                user,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    },

    // POST /profile
    updateProfile(req, res) {
        const userId = req.session.user.id;
        const { username, email, address, contact } = req.body;

        if (!username || !email) {
            req.flash('error', 'Name and email are required.');
            return res.redirect('/profile');
        }

        const payload = {
            username: username.trim(),
            email: email.trim(),
            address: (address || '').trim(),
            contact: (contact || '').trim()
        };

        User.updateProfile(userId, payload, (err) => {
            if (err) {
                console.error('Error updating profile:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'This email is already in use.');
                } else {
                    req.flash('error', 'Failed to update profile.');
                }
                return res.redirect('/profile');
            }

            req.session.user = {
                ...req.session.user,
                username: payload.username,
                email: payload.email,
                address: payload.address,
                contact: payload.contact
            };

            req.flash('success', 'Profile updated successfully.');
            return res.redirect('/profile');
        });
    },

    // Admin: Get all users
    adminListUsers(req, res) {
        User.getAll((err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).send('Database error');
            }
            res.render('adminUsers', {
                users: users,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    },

    // Admin: Show edit user form
    adminShowEditUser(req, res) {
        const userId = req.params.id;
        User.getById(userId, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).send('Database error');
            }
            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/admin/users');
            }
            res.render('adminEditUser', {
                user: user,
                messages: req.flash('success'),
                errors: req.flash('error')
            });
        });
    },

    // Admin: Update user
    adminUpdateUser(req, res) {
        const userId = req.params.id;
        const { username, email, address, contact, role } = req.body;

        if (!username || !email || !address || !contact || !role) {
            req.flash('error', 'All fields are required.');
            return res.redirect(`/admin/users/${userId}/edit`);
        }

        const userData = { username, email, address, contact, role };
        User.updateById(userId, userData, (err) => {
            if (err) {
                console.error('Error updating user:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'This email is already in use.');
                } else {
                    req.flash('error', 'Failed to update user.');
                }
                return res.redirect(`/admin/users/${userId}/edit`);
            }

            req.flash('success', `User ${username} updated successfully.`);
            return res.redirect(`/admin/users/${userId}/edit`);
        });
    },

    // Admin: Delete user
    adminDeleteUser(req, res) {
        const userId = req.params.id;

        if (userId == req.session.user.id) {
            req.flash('error', 'You cannot delete your own account.');
            return res.redirect('/admin/users');
        }

        User.deleteById(userId, (err) => {
            if (err) {
                console.error('Error deleting user:', err);
                req.flash('error', 'Failed to delete user.');
                return res.redirect('/admin/users');
            }

            req.flash('success', 'User deleted successfully.');
            return res.redirect('/admin/users');
        });
    }
};

module.exports = UserController;
