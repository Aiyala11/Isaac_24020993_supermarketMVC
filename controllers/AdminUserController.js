const User = require('../models/User');

const AdminUserController = {
    // GET /admin/users
    listUsers(req, res) {
        User.getAll((err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                req.flash('error', 'Could not load users right now.');
                return res.render('adminUsers', { users: [], messages: [], errors: req.flash('error') });
            }

            res.render('adminUsers', { users, messages: req.flash('success'), errors: req.flash('error') });
        });
    },

    // GET /admin/users/:id/edit
    showEditForm(req, res) {
        const id = req.params.id;
        User.getById(id, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).send('Database error');
            }
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/admin/users');
            }

            res.render('editUser', { user, errors: req.flash('error') });
        });
    },

    // POST /admin/users/:id
    updateUser(req, res) {
        const id = req.params.id;
        const { username, email, address, contact, role } = req.body;

        if (!username || !email) {
            req.flash('error', 'Username and email are required');
            return res.redirect(`/admin/users/${id}/edit`);
        }

        const data = { username, email, address: address || '', contact: contact || '', role: role || 'user' };

        User.updateById(id, data, (err) => {
            if (err) {
                console.error('Error updating user:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'Email already exists.');
                } else {
                    req.flash('error', 'Failed to update user');
                }
                return res.redirect(`/admin/users/${id}/edit`);
            }

            req.flash('success', 'User updated successfully');
            return res.redirect('/admin/users');
        });
    },

    // GET /admin/users/:id/delete
    deleteUser(req, res) {
        const id = req.params.id;

        // Prevent deleting yourself
        if (req.session.user && req.session.user.id == id) {
            req.flash('error', 'You cannot delete your own admin account');
            return res.redirect('/admin/users');
        }

        User.deleteById(id, (err) => {
            if (err) {
                console.error('Error deleting user:', err);
                req.flash('error', 'Failed to delete user');
                return res.redirect('/admin/users');
            }

            req.flash('success', 'User deleted');
            return res.redirect('/admin/users');
        });
    }
};

module.exports = AdminUserController;
