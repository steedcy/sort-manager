USE sort_manager;
ALTER TABLE item
ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '单价' AFTER quantity,
ADD COLUMN purchase_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '购入日期' AFTER price,
ADD COLUMN expiry_date DATE COMMENT '有效期至' AFTER purchase_date;
