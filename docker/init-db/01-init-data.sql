-- ============================================
-- DATABASE INITIALIZATION SCRIPT
-- ============================================
-- This script runs automatically when the
-- PostgreSQL container starts for the first time
-- ============================================

-- Wait for tables to be created by Hibernate first
-- These inserts will run after Spring Boot creates the schema

-- Note: Run this manually after first application startup
-- or use the application to create initial data

-- ============================================
-- SAMPLE CATEGORIES
-- ============================================
INSERT INTO category_table (category_id, category_name) 
VALUES (1, 'Electronics')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_table (category_id, category_name) 
VALUES (2, 'Clothing')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_table (category_id, category_name) 
VALUES (3, 'Books')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO category_table (category_id, category_name) 
VALUES (4, 'Home & Kitchen')
ON CONFLICT (category_id) DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================
INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (1, 'iPhone 15 Pro', 'Latest Apple smartphone with A17 chip', 1299.99, 50, 1, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (2, 'Samsung Galaxy S24', 'Android flagship with AI features', 999.99, 30, 1, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (3, 'MacBook Pro 14"', 'Apple laptop with M3 Pro chip', 1999.99, 20, 1, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (4, 'Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 29.99, 100, 2, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (5, 'Denim Jeans', 'Classic blue denim jeans', 59.99, 75, 2, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (6, 'Java Programming Book', 'Complete guide to Java development', 49.99, 40, 3, NOW())
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO product_table (product_id, product_name, description, price, stock_present, category_id, created_at) 
VALUES (7, 'Spring Boot in Action', 'Master Spring Boot framework', 54.99, 35, 3, NOW())
ON CONFLICT (product_id) DO NOTHING;

-- ============================================
-- UPDATE SEQUENCES
-- ============================================
-- Ensure sequences are set correctly for new inserts
SELECT setval('category_table_category_id_seq', 10, true);
SELECT setval('product_table_product_id_seq', 10, true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Uncomment to verify data
-- SELECT * FROM category_table;
-- SELECT * FROM product_table;

