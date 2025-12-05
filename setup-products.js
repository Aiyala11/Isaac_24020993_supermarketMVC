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

    // Clear current products
    db.query('DELETE FROM order_items', (err) => {
        if (err) console.error('Error clearing order_items:', err.message);
    });

    db.query('DELETE FROM cart_items', (err) => {
        if (err) console.error('Error clearing cart_items:', err.message);
    });

    db.query('DELETE FROM products', (err) => {
        if (err) console.error('Error clearing products:', err.message);
    });

    // Define products with correct images
    const products = [
        // Fruits & Vegetables
        { name: 'Apples', price: 4.99, qty: 50, category: 'Groceries', image: 'apples.png' },
        { name: 'Bananas', price: 3.49, qty: 80, category: 'Groceries', image: 'bananas.png' },
        { name: 'Broccoli', price: 5.99, qty: 30, category: 'Groceries', image: 'broccoli.png' },
        { name: 'Tomatoes', price: 4.49, qty: 40, category: 'Groceries', image: 'tomatoes.png' },

        // Dairy & Eggs
        { name: 'Milk', price: 6.99, qty: 50, category: 'Dairy', image: 'milk.png' },
        { name: 'Eggs', price: 8.99, qty: 60, category: 'Dairy', image: 'Pasareggs.png' },

        // Bakery
        { name: 'Bread', price: 4.99, qty: 45, category: 'Bakery', image: 'bread.png' },
        { name: 'White Bread', price: 5.49, qty: 35, category: 'Bakery', image: 'gardeniawhitebreadjumbo.png' },

        // Beverages
        { name: 'Ribenna', price: 5.99, qty: 40, category: 'Beverages', image: 'ribenna.png' },
        { name: 'Green Tea', price: 7.99, qty: 25, category: 'Beverages', image: 'greentea.png' },

        // Snacks & Others
        { name: 'Pringles', price: 2.99, qty: 55, category: 'Snacks', image: 'pringlesog.png' },
        { name: 'Gummy Bears', price: 1.99, qty: 70, category: 'Snacks', image: 'gummybear.png' },
        { name: 'Tofu', price: 3.49, qty: 20, category: 'Groceries', image: 'tofu.png' },
    ];

    let completed = 0;

    products.forEach((product) => {
        const sql = `
            INSERT INTO products (productName, quantity, price, categoryId, image)
            VALUES (?, ?, ?, (SELECT id FROM categories WHERE name = ? LIMIT 1), ?)
        `;
        
        db.query(sql, [product.name, product.qty, product.price, product.category, product.image], (err) => {
            if (err) {
                console.error(`Error adding ${product.name}:`, err.message);
            } else {
                console.log(`✓ Added: ${product.name} (${product.image})`);
            }
            
            completed++;
            if (completed === products.length) {
                console.log('\n✓ Product catalog updated successfully!');
                db.end();
                process.exit(0);
            }
        });
    });
});
