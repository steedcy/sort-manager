UPDATE item SET quantity = 1 WHERE quantity IS NULL;

CREATE UNIQUE INDEX uk_category_name ON category(name);
CREATE INDEX idx_item_expiry_date ON item(expiry_date);
CREATE INDEX idx_item_created_at ON item(created_at);
