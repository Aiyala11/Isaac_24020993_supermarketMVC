-- Database export for c372_supermarketdb
-- Exported on: 2025-12-06T14:16:19.483Z

CREATE DATABASE IF NOT EXISTS c372_supermarketdb;
USE c372_supermarketdb;

DROP TABLE IF EXISTS cart;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS cart_items;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cartId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `cartId` (`cartId`),
  KEY `productId` (`productId`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cartId`) REFERENCES `cart` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS categories;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS order_items;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS orders;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS products;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productName` varchar(255) NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

INSERT INTO cart VALUES
(1, 3, '2025-12-06T14:02:50.000Z');

INSERT INTO categories VALUES
(1, 'Groceries'),
(2, 'Dairy'),
(3, 'Bakery'),
(4, 'Beverages'),
(5, 'Snacks');

INSERT INTO order_items VALUES
(1, 1, 11, 9, '2.99'),
(2, 2, 2, 7, '3.49');

INSERT INTO orders VALUES
(1, 3, '26.91', 'Credit Card', 'Pending', '2025-12-06T14:03:05.000Z'),
(2, 3, '24.43', 'Credit Card', 'Pending', '2025-12-06T14:11:57.000Z');

INSERT INTO products VALUES
(1, 'Apples', 50, '4.99', 'apples.png', 1, '2025-12-06T11:37:21.000Z'),
(2, 'Bananas', 73, '3.49', 'bananas.png', 1, '2025-12-06T11:37:21.000Z'),
(3, 'Broccoli', 30, '5.99', 'broccoli.png', 1, '2025-12-06T11:37:21.000Z'),
(4, 'Tomatoes', 9, '4.49', 'tomatoes.png', 1, '2025-12-06T11:37:21.000Z'),
(5, 'Milk', 56, '6.99', 'milk.png', 2, '2025-12-06T11:37:21.000Z'),
(6, 'Eggs', 60, '8.99', 'Pasareggs.png', 2, '2025-12-06T11:37:21.000Z'),
(7, 'Bread', 45, '4.99', 'bread.png', 3, '2025-12-06T11:37:21.000Z'),
(8, 'White Bread', 35, '5.49', 'gardeniawhitebreadjumbo.png', 3, '2025-12-06T11:37:21.000Z'),
(9, 'Ribenna', 40, '2.49', 'ribenna.png', 4, '2025-12-06T11:37:21.000Z'),
(10, 'Green Tea', 25, '2.49', 'greentea.png', 4, '2025-12-06T11:37:21.000Z'),
(11, 'Pringles', 46, '2.99', 'pringlesog.png', 5, '2025-12-06T11:37:21.000Z'),
(12, 'Gummy Bears', 70, '1.99', 'gummybear.png', 5, '2025-12-06T11:37:21.000Z'),
(13, 'Tofu', 20, '3.49', 'tofu.png', 1, '2025-12-06T11:37:21.000Z');

INSERT INTO users VALUES
(2, 'peter', 'peter@peter.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'Admin Address', '98765432', 'admin', '2025-12-06T11:37:22.000Z'),
(3, 'mary tan', 'mary@mary.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'Tampines Ave 1', '98765432', 'user', '2025-12-06T11:37:22.000Z');

