const db = require('./db');

// Run the migration
const migrations = [
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS displayCurrency VARCHAR(10) DEFAULT 'SGD'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS bnplMonths INT DEFAULT NULL",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(50) DEFAULT NULL",
    "UPDATE orders SET paymentMethod = 'Legacy' WHERE paymentMethod IS NULL AND displayCurrency = 'SGD'"
];

let completed = 0;

migrations.forEach((migration, index) => {
    db.query(migration, (err) => {
        if (err) {
            console.error(`Migration ${index + 1} failed:`, err);
        } else {
            console.log(`Migration ${index + 1} completed successfully`);
            completed++;
            
            if (completed === migrations.length) {
                console.log('\nAll migrations completed!');
                process.exit(0);
            }
        }
    });
});
