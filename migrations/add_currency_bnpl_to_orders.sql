-- Add currency and BNPL support to orders table
ALTER TABLE orders ADD COLUMN displayCurrency VARCHAR(10) DEFAULT 'SGD';
ALTER TABLE orders ADD COLUMN bnplMonths INT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(50) DEFAULT NULL;

-- Update existing orders to show they were not using BNPL
UPDATE orders SET paymentMethod = 'Legacy' WHERE paymentMethod IS NULL;
