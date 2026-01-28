const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected to MySQL');

    // Define users to create/update
    const users = [
        {
            username: 'peter',
            email: 'peter@peter.com',
            password: '123456',
            address: 'Admin Address',
            contact: '9876543210',
            role: 'admin'
        },
        {
            username: 'mary tan',
            email: 'mary@mary.com',
            password: '123456',
            address: 'User Address',
            contact: '9876543211',
            role: 'user'
        }
    ];

    let completed = 0;

    users.forEach((user) => {
        // Check if user exists
        db.query(
            `SELECT id FROM users WHERE email = ?`,
            [user.email],
            (err, results) => {
                if (err) {
                    console.error(`Error checking user ${user.email}:`, err.message);
                    completed++;
                    if (completed === users.length) {
                        db.end();
                        process.exit(1);
                    }
                    return;
                }

                if (results.length > 0) {
                    // Update existing user
                    db.query(
                        `UPDATE users SET username = ?, password = SHA1(?), address = ?, contact = ?, role = ? WHERE email = ?`,
                        [user.username, user.password, user.address, user.contact, user.role, user.email],
                        (err) => {
                            if (err) {
                                console.error(`Error updating ${user.email}:`, err.message);
                            } else {
                                console.log(`✓ Updated user: ${user.email}`);
                                console.log(`   Username: ${user.username}`);
                                console.log(`   Password: ${user.password}`);
                                console.log(`   Role: ${user.role}`);
                            }
                            completed++;
                            if (completed === users.length) {
                                console.log('\n✓ All users set up successfully!');
                                db.end();
                                process.exit(0);
                            }
                        }
                    );
                } else {
                    // Create new user
                    db.query(
                        `INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)`,
                        [user.username, user.email, user.password, user.address, user.contact, user.role],
                        (err) => {
                            if (err) {
                                console.error(`Error creating ${user.email}:`, err.message);
                            } else {
                                console.log(`✓ Created user: ${user.email}`);
                                console.log(`   Username: ${user.username}`);
                                console.log(`   Password: ${user.password}`);
                                console.log(`   Role: ${user.role}`);
                            }
                            completed++;
                            if (completed === users.length) {
                                console.log('\n✓ All users set up successfully!');
                                db.end();
                                process.exit(0);
                            }
                        }
                    );
                }
            }
        );
    });
});
