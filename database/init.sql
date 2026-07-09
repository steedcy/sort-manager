-- 日常物品收纳管理系统 数据库初始化脚本
-- MySQL 8.4

CREATE DATABASE IF NOT EXISTS sort_manager DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sort_manager;

-- 分类表
CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    icon VARCHAR(50) COMMENT '图标名称（lucide-react图标名）',
    color VARCHAR(30) COMMENT '颜色（hex或tailwind色值）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品分类表';

-- 收纳位置表（支持层级结构）
CREATE TABLE IF NOT EXISTS location (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT '位置名称',
    description TEXT COMMENT '位置描述',
    parent_id BIGINT DEFAULT NULL COMMENT '父位置ID，NULL表示顶级',
    image_url VARCHAR(500) COMMENT '位置图片URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES location(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收纳位置表';

-- 物品表
CREATE TABLE IF NOT EXISTS item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL COMMENT '物品名称',
    description TEXT COMMENT '物品描述',
    quantity INT DEFAULT 1 COMMENT '数量',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '单价',
    purchase_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '购入日期',
    expiry_date DATE COMMENT '有效期至',
    category_id BIGINT DEFAULT NULL COMMENT '分类ID',
    location_id BIGINT DEFAULT NULL COMMENT '存放位置ID',
    image_url VARCHAR(500) COMMENT '物品图片URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品表';

-- 预设分类数据
INSERT INTO category (name, icon, color) VALUES
('电子产品', 'Laptop', '#6366f1'),
('衣物服饰', 'Shirt', '#ec4899'),
('工具器械', 'Wrench', '#f59e0b'),
('文具办公', 'PenLine', '#3b82f6'),
('食品饮料', 'UtensilsCrossed', '#22c55e'),
('药品医疗', 'Pill', '#ef4444'),
('书籍资料', 'BookOpen', '#8b5cf6'),
('运动休闲', 'Dumbbell', '#06b6d4'),
('家居用品', 'Home', '#f97316'),
('其他杂物', 'Package', '#6b7280')
ON DUPLICATE KEY UPDATE name=name;

-- 预设位置数据（示例）
INSERT INTO location (name, description, parent_id) VALUES
('客厅', '客厅区域', NULL),
('卧室', '主卧室', NULL),
('厨房', '厨房区域', NULL),
('书房', '书房/工作间', NULL),
('储物间', '杂物储藏室', NULL);

-- 客厅子位置
INSERT INTO location (name, description, parent_id) VALUES
('电视柜', '电视机下方的柜子', 1),
('沙发茶几', '沙发旁边的茶几', 1);

-- 卧室子位置
INSERT INTO location (name, description, parent_id) VALUES
('衣柜', '主卧衣柜', 2),
('床头柜', '床头两侧的柜子', 2),
('梳妆台', '梳妆台抽屉', 2);

-- 示例物品
INSERT INTO item (name, description, quantity, category_id, location_id) VALUES
('充电宝', '20000mAh大容量充电宝', 1, 1, 6),
('遥控器', '电视遥控器', 2, 1, 6),
('冬季外套', '黑色羽绒服', 1, 2, 8),
('螺丝刀套装', '十字和一字螺丝刀', 1, 3, NULL),
('笔记本', 'A5横线笔记本', 5, 4, 10),
('创可贴', '碧迪创可贴', 1, 6, 9);
