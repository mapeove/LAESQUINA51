INSERT INTO store_settings (key, value) VALUES 
('store_open', 'true'),
('whatsapp_number', '633184354')
ON CONFLICT (key) DO NOTHING;

INSERT INTO opening_hours (day_of_week, open_time, close_time, active) VALUES
(5, '19:00:00', '00:00:00', true),
(6, '19:00:00', '00:00:00', true),
(0, '19:00:00', '00:00:00', true);

INSERT INTO delivery_zones (name, postal_codes, delivery_fee) VALUES
('Polígono San Pablo', '{41007}', 0),
('La Macarena', '{41009,41003}', 0),
('Centro', '{41001,41002,41003,41004}', 0),
('Hytasa', '{41010}', 0),
('El Corte Inglés Nervión', '{41005}', 0),
('Otros alrededores', '{41006,41008,41011,41012}', 0);

INSERT INTO categories (name, slug, sort_order) VALUES
('HAMBURGUESAS VIRALES', 'hamburguesas-virales', 1),
('BOX TENDENCIA', 'box-tendencia', 2),
('EL REY DE LA PLANCHA', 'el-rey-de-la-plancha', 3),
('PERROS CALIENTES', 'perros-calientes', 4),
('EMPANADAS CON GUASA', 'empanadas-con-guasa', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, price) VALUES
((SELECT id FROM categories WHERE slug = 'hamburguesas-virales'), 'La Casi Triple', 'la-casi-triple', 8.50),
((SELECT id FROM categories WHERE slug = 'hamburguesas-virales'), 'La Primera Cita', 'la-primera-cita', 7.50),
((SELECT id FROM categories WHERE slug = 'box-tendencia'), 'El Box Mini-Monster', 'el-box-mini-monster', 10.50),
((SELECT id FROM categories WHERE slug = 'el-rey-de-la-plancha'), 'El Amarre Árabe', 'el-amarre-arabe', 9.00),
((SELECT id FROM categories WHERE slug = 'perros-calientes'), 'Perro-Shawarma', 'perro-shawarma', 5.50),
((SELECT id FROM categories WHERE slug = 'perros-calientes'), 'El Chikiturri', 'el-chikiturri', 3.50),
((SELECT id FROM categories WHERE slug = 'empanadas-con-guasa'), 'La Incondicional', 'la-incondicional', 3.50),
((SELECT id FROM categories WHERE slug = 'empanadas-con-guasa'), 'La Maracucha Tóxica', 'la-maracucha-toxica', 4.50)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_option_groups (product_id, name, required) VALUES
((SELECT id FROM products WHERE slug = 'el-amarre-arabe'), 'Tipo de proteína', true);

INSERT INTO product_options (group_id, name, price_modifier) VALUES
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-amarre-arabe') AND name = 'Tipo de proteína'), 'Carne', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-amarre-arabe') AND name = 'Tipo de proteína'), 'Pollo', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-amarre-arabe') AND name = 'Tipo de proteína'), 'Mixto', 0.00);

-- Product options groups for bebidas on items that might be considered "with bebida" (adding to all just to fulfill the "all products with bebida" request gracefully)
INSERT INTO product_option_groups (product_id, name, required) VALUES
((SELECT id FROM products WHERE slug = 'la-casi-triple'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'la-primera-cita'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'el-box-mini-monster'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'el-amarre-arabe'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'perro-shawarma'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'el-chikiturri'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'la-incondicional'), 'Bebida', false),
((SELECT id FROM products WHERE slug = 'la-maracucha-toxica'), 'Bebida', false);

INSERT INTO product_options (group_id, name, price_modifier) VALUES
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'la-casi-triple') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'la-primera-cita') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-box-mini-monster') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-amarre-arabe') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'perro-shawarma') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'el-chikiturri') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'la-incondicional') AND name = 'Bebida'), 'Coca-Cola', 0.00),
((SELECT id FROM product_option_groups WHERE product_id = (SELECT id FROM products WHERE slug = 'la-maracucha-toxica') AND name = 'Bebida'), 'Coca-Cola', 0.00);
