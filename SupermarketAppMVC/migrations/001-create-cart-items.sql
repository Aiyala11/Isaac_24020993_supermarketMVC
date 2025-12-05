-- Create table for persisted cart items (supports both products and fines)
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  item_type ENUM('product','fine') NOT NULL DEFAULT 'fine',
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (userId)
);
