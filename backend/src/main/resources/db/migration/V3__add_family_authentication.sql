CREATE TABLE household (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_app_user_username UNIQUE (username)
);

CREATE TABLE household_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_household_member_household FOREIGN KEY (household_id) REFERENCES household(id),
    CONSTRAINT fk_household_member_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT uk_household_member_household_user UNIQUE (household_id, user_id)
);

CREATE TABLE refresh_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL,
    token_family CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    household_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    replaced_by_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_refresh_token_household FOREIGN KEY (household_id) REFERENCES household(id),
    CONSTRAINT fk_refresh_token_replacement FOREIGN KEY (replaced_by_id) REFERENCES refresh_token(id)
);

ALTER TABLE category ADD COLUMN household_id BIGINT NULL;
ALTER TABLE location ADD COLUMN household_id BIGINT NULL;
ALTER TABLE item ADD COLUMN household_id BIGINT NULL;

INSERT INTO household(name) VALUES ('默认家庭');

UPDATE category SET household_id = 1 WHERE household_id IS NULL;
UPDATE location SET household_id = 1 WHERE household_id IS NULL;
UPDATE item SET household_id = 1 WHERE household_id IS NULL;
UPDATE location SET image_url = REPLACE(image_url, '/uploads/', '/api/v1/files/') WHERE image_url LIKE '/uploads/%';
UPDATE item SET image_url = REPLACE(image_url, '/uploads/', '/api/v1/files/') WHERE image_url LIKE '/uploads/%';

ALTER TABLE category MODIFY COLUMN household_id BIGINT NOT NULL;
ALTER TABLE location MODIFY COLUMN household_id BIGINT NOT NULL;
ALTER TABLE item MODIFY COLUMN household_id BIGINT NOT NULL;

ALTER TABLE category ADD CONSTRAINT fk_category_household FOREIGN KEY (household_id) REFERENCES household(id);
ALTER TABLE location ADD CONSTRAINT fk_location_household FOREIGN KEY (household_id) REFERENCES household(id);
ALTER TABLE item ADD CONSTRAINT fk_item_household FOREIGN KEY (household_id) REFERENCES household(id);

DROP INDEX uk_category_name ON category;
CREATE UNIQUE INDEX uk_category_household_name ON category(household_id, name);
CREATE INDEX idx_location_household_parent ON location(household_id, parent_id);
CREATE INDEX idx_item_household_created_at ON item(household_id, created_at);
CREATE INDEX idx_item_household_expiry_date ON item(household_id, expiry_date);
CREATE INDEX idx_item_household_category ON item(household_id, category_id);
CREATE INDEX idx_item_household_location ON item(household_id, location_id);
CREATE INDEX idx_refresh_token_user ON refresh_token(user_id);
CREATE INDEX idx_refresh_token_family ON refresh_token(token_family);
