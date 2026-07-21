-- Sort Manager 可选示例数据（MySQL 8.4）
-- 表结构由 backend/src/main/resources/db/migration 中的 Flyway 迁移管理。
-- 请先启动一次后端完成迁移，再执行本脚本。

USE sort_manager;

SET @household_id = (SELECT id FROM household ORDER BY id LIMIT 1);

INSERT INTO category (household_id, name, icon, color) VALUES
(@household_id, '电子产品', 'Laptop', '#6366f1'),
(@household_id, '衣物服饰', 'Shirt', '#ec4899'),
(@household_id, '工具器械', 'Wrench', '#f59e0b'),
(@household_id, '文具办公', 'PenLine', '#3b82f6'),
(@household_id, '食品饮料', 'UtensilsCrossed', '#22c55e'),
(@household_id, '药品医疗', 'Pill', '#ef4444'),
(@household_id, '书籍资料', 'BookOpen', '#8b5cf6'),
(@household_id, '运动休闲', 'Dumbbell', '#06b6d4'),
(@household_id, '家居用品', 'Home', '#f97316'),
(@household_id, '其他杂物', 'Package', '#6b7280')
ON DUPLICATE KEY UPDATE icon=VALUES(icon), color=VALUES(color);

INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '客厅', '客厅区域', NULL WHERE NOT EXISTS (SELECT 1 FROM location WHERE household_id=@household_id AND name='客厅' AND parent_id IS NULL);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '卧室', '主卧室', NULL WHERE NOT EXISTS (SELECT 1 FROM location WHERE household_id=@household_id AND name='卧室' AND parent_id IS NULL);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '厨房', '厨房区域', NULL WHERE NOT EXISTS (SELECT 1 FROM location WHERE household_id=@household_id AND name='厨房' AND parent_id IS NULL);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '书房', '书房/工作间', NULL WHERE NOT EXISTS (SELECT 1 FROM location WHERE household_id=@household_id AND name='书房' AND parent_id IS NULL);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '储物间', '杂物储藏室', NULL WHERE NOT EXISTS (SELECT 1 FROM location WHERE household_id=@household_id AND name='储物间' AND parent_id IS NULL);

INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '电视柜', '电视机下方的柜子', p.id FROM location p
WHERE p.household_id=@household_id AND p.name='客厅' AND p.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM location c WHERE c.household_id=@household_id AND c.name='电视柜' AND c.parent_id=p.id);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '沙发茶几', '沙发旁边的茶几', p.id FROM location p
WHERE p.household_id=@household_id AND p.name='客厅' AND p.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM location c WHERE c.household_id=@household_id AND c.name='沙发茶几' AND c.parent_id=p.id);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '衣柜', '主卧衣柜', p.id FROM location p
WHERE p.household_id=@household_id AND p.name='卧室' AND p.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM location c WHERE c.household_id=@household_id AND c.name='衣柜' AND c.parent_id=p.id);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '床头柜', '床头两侧的柜子', p.id FROM location p
WHERE p.household_id=@household_id AND p.name='卧室' AND p.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM location c WHERE c.household_id=@household_id AND c.name='床头柜' AND c.parent_id=p.id);
INSERT INTO location (household_id, name, description, parent_id)
SELECT @household_id, '梳妆台', '梳妆台抽屉', p.id FROM location p
WHERE p.household_id=@household_id AND p.name='卧室' AND p.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM location c WHERE c.household_id=@household_id AND c.name='梳妆台' AND c.parent_id=p.id);

INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id, location_id)
SELECT @household_id, '充电宝', '20000mAh大容量充电宝', 1, 0.00, CURRENT_DATE, c.id, l.id
FROM category c JOIN location l ON l.household_id=c.household_id AND l.name='电视柜'
WHERE c.household_id=@household_id AND c.name='电子产品' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='充电宝');
INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id, location_id)
SELECT @household_id, '遥控器', '电视遥控器', 2, 0.00, CURRENT_DATE, c.id, l.id
FROM category c JOIN location l ON l.household_id=c.household_id AND l.name='电视柜'
WHERE c.household_id=@household_id AND c.name='电子产品' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='遥控器');
INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id, location_id)
SELECT @household_id, '冬季外套', '黑色羽绒服', 1, 0.00, CURRENT_DATE, c.id, l.id
FROM category c JOIN location l ON l.household_id=c.household_id AND l.name='衣柜'
WHERE c.household_id=@household_id AND c.name='衣物服饰' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='冬季外套');
INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id)
SELECT @household_id, '螺丝刀套装', '十字和一字螺丝刀', 1, 0.00, CURRENT_DATE, c.id
FROM category c WHERE c.household_id=@household_id AND c.name='工具器械' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='螺丝刀套装');
INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id, location_id)
SELECT @household_id, '笔记本', 'A5横线笔记本', 5, 0.00, CURRENT_DATE, c.id, l.id
FROM category c JOIN location l ON l.household_id=c.household_id AND l.name='梳妆台'
WHERE c.household_id=@household_id AND c.name='文具办公' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='笔记本');
INSERT INTO item (household_id, name, description, quantity, price, purchase_date, category_id, location_id)
SELECT @household_id, '创可贴', '碧迪创可贴', 1, 0.00, CURRENT_DATE, c.id, l.id
FROM category c JOIN location l ON l.household_id=c.household_id AND l.name='床头柜'
WHERE c.household_id=@household_id AND c.name='药品医疗' AND NOT EXISTS (SELECT 1 FROM item WHERE household_id=@household_id AND name='创可贴');
