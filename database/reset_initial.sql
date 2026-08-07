-- =======================================================
-- Sort Manager 系统初始状态重置脚本 (MySQL 8.4)
-- 作用：清空所有测试物品、历史审计日志与测试会话，恢复系统至全新初始状态。
-- =======================================================

USE sort_manager;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 清空物品表与回收站
TRUNCATE TABLE item;

-- 2. 清空家庭操作审计日志
TRUNCATE TABLE audit_event;

-- 3. 清空刷新令牌会话
TRUNCATE TABLE refresh_token;

-- 4. 清除非 Owner 管理员的测试成员账号
DELETE hm FROM household_member hm 
JOIN app_user u ON hm.user_id = u.id 
WHERE u.username != 'owner';

DELETE FROM app_user WHERE username != 'owner';

-- 5. 重置核心分类目录为干净预设
DELETE FROM category;
ALTER TABLE category AUTO_INCREMENT = 1;

SET @household_id = (SELECT id FROM household ORDER BY id LIMIT 1);

INSERT INTO category (id, household_id, name, icon, color) VALUES
(1, @household_id, '图书资料', 'BookOpen', '#8b5cf6'),
(2, @household_id, '电子数码', 'Laptop', '#00a6f4'),
(3, @household_id, '衣物服饰', 'Shirt', '#ec4899'),
(4, @household_id, '食品饮料', 'UtensilsCrossed', '#22c55e'),
(5, @household_id, '药品医疗', 'Pill', '#ef4444'),
(6, @household_id, '工具器械', 'Wrench', '#f59e0b'),
(7, @household_id, '家居用品', 'Home', '#f97316'),
(8, @household_id, '其他杂物', 'Package', '#6b7280');

-- 6. 重置收纳位置树为干净预设
DELETE FROM location;
ALTER TABLE location AUTO_INCREMENT = 1;

INSERT INTO location (id, household_id, name, description, parent_id) VALUES
(1, @household_id, '客厅', '客厅主要公共区域', NULL),
(2, @household_id, '主卧', '主卧室区域', NULL),
(3, @household_id, '书房', '工作与读书区域', NULL),
(4, @household_id, '储物间', '杂物集中收纳区', NULL),
(5, @household_id, '电视柜', '客厅电视机下方抽屉柜', 1),
(6, @household_id, '书架', '书房立式双层书架', 3),
(7, @household_id, '主卧衣柜', '主卧左侧大衣柜', 2);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '系统数据库已成功重置为初始干净状态！' AS message;
