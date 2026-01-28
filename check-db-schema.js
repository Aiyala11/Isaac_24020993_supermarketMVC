const db = require('./db');

// Check if columns exist and add them if not
const checkAndAddColumns = () => {
    // First, check which columns already exist
    db.query("DESCRIBE orders", (err, results) => {
        if (err) {
            console.error("Error describing table:", err);
            process.exit(1);
        }

        const existingColumns = results.map(r => r.Field);
        const migrations = [];

        // Only add migrations for columns that don't exist
        if (!existingColumns.includes('displayCurrency')) {
            migrations.push("ALTER TABLE orders ADD COLUMN displayCurrency VARCHAR(10) DEFAULT 'SGD'");
        }
        if (!existingColumns.includes('bnplMonths')) {
            migrations.push("ALTER TABLE orders ADD COLUMN bnplMonths INT DEFAULT NULL");
        }
        if (!existingColumns.includes('paymentMethod') || !existingColumns.includes('paymentMethod')) {
            // paymentMethod might already exist, so we check
            const paymentCol = results.find(r => r.Field === 'paymentMethod');
            if (!paymentCol || paymentCol.Type !== 'varchar(50)') {
                // Need to modify if wrong type or missing
                if (paymentCol && paymentCol.Type !== 'varchar(50)') {
                    migrations.push("ALTER TABLE orders MODIFY COLUMN paymentMethod VARCHAR(50)");
                }
            }
        }

        if (migrations.length === 0) {
            console.log('✅ All required columns already exist!');
            db.query("DESCRIBE orders", (err, results) => {
                if (err) {
                    console.error("Error describing table:", err);
                } else {
                    console.log("\n📋 Orders table structure:");
                    console.table(results.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
                }
                process.exit(0);
            });
            return;
        }

        let completed = 0;

        migrations.forEach((migration, index) => {
            db.query(migration, (err) => {
                completed++;
                if (err) {
                    console.error(`✗ Migration ${index + 1} error:`, err.message);
                } else {
                    console.log(`✓ Migration ${index + 1} applied`);
                }

                if (completed === migrations.length) {
                    console.log('\n✅ All migrations completed!');
                    
                    // Now show table structure
                    db.query("DESCRIBE orders", (err, results) => {
                        if (err) {
                            console.error("Error describing table:", err);
                        } else {
                            console.log("\n📋 Orders table structure:");
                            console.table(results.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
                        }
                        process.exit(0);
                    });
                }
            });
        });
    });
};

checkAndAddColumns();
