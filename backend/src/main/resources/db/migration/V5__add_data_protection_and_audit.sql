ALTER TABLE item ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE item ADD COLUMN deleted_by_user_id BIGINT NULL;

ALTER TABLE item ADD CONSTRAINT fk_item_deleted_by_user
    FOREIGN KEY (deleted_by_user_id) REFERENCES app_user(id) ON DELETE SET NULL;

CREATE INDEX idx_item_household_deleted_created
    ON item(household_id, deleted_at, created_at);

CREATE TABLE audit_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    actor_user_id BIGINT NOT NULL,
    actor_display_name VARCHAR(100) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id BIGINT NULL,
    entity_name VARCHAR(200) NULL,
    summary VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_event_household FOREIGN KEY (household_id) REFERENCES household(id),
    CONSTRAINT fk_audit_event_actor FOREIGN KEY (actor_user_id) REFERENCES app_user(id)
);

CREATE INDEX idx_audit_event_household_created
    ON audit_event(household_id, created_at);
CREATE INDEX idx_audit_event_household_action_created
    ON audit_event(household_id, action, created_at);
