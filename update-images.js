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

    // Update product images to match actual files
    const updates = [
        { id: 1, image: 'milk.png' },      // Milk
        { id: 2, image: 'bread.png' },     // Bread
        { id: 3, image: 'Pasareggs.png' }, // Eggs
        { id: 4, image: 'ribenna.png' },   // Orange Juice (using ribenna as substitute)
        { id: 5, image: 'broccoli.png' }   // Rice (using broccoli as substitute)
    ];

    let completed = 0;

    updates.forEach((update) => {
        db.query(
            'UPDATE products SET image = ? WHERE id = ?',
            [update.image, update.id],
            (err) => {
                if (err) {
                    console.error(`Error updating product ${update.id}:`, err.message);
                } else {
                    console.log(`✓ Updated product ${update.id} image to ${update.image}`);
                }
                
                completed++;
                if (completed === updates.length) {
                    console.log('\n✓ Image update completed!');
                    db.end();
                    process.exit(0);
                }
            }
        );
    });
});
