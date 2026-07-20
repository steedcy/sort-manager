package com.sort.manager.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest {

    @Test
    void migratesAnEmptyDatabaseToLatestVersion() throws Exception {
        String url = "jdbc:h2:mem:flyway_fresh;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

        Flyway flyway = flyway(url, false);
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(2);

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO category(name) VALUES ('Electronics')");
            statement.executeUpdate("INSERT INTO location(name) VALUES ('Cabinet')");
            statement.executeUpdate("INSERT INTO item(name, quantity, price, purchase_date, category_id, location_id) "
                    + "VALUES ('Power bank', 1, 99.00, CURRENT_DATE, 1, 1)");
            assertThat(count(statement, "item")).isEqualTo(1);
        }
    }

    @Test
    void baselinesAnExistingDatabaseAndPreservesRows() throws Exception {
        String url = "jdbc:h2:mem:flyway_existing;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        Flyway.configure().dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .target("1")
                .load()
                .migrate();

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO category(name) VALUES ('Existing')");
            statement.executeUpdate("DROP TABLE flyway_schema_history");
        }

        Flyway baselineUpgrade = flyway(url, true);
        assertThat(baselineUpgrade.migrate().migrationsExecuted).isEqualTo(1);

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            assertThat(count(statement, "category")).isEqualTo(1);
            ResultSet indexes = connection.getMetaData().getIndexInfo(null, null, "item", false, false);
            boolean expiryIndexFound = false;
            while (indexes.next()) {
                if ("idx_item_expiry_date".equalsIgnoreCase(indexes.getString("INDEX_NAME"))) {
                    expiryIndexFound = true;
                }
            }
            assertThat(expiryIndexFound).isTrue();
        }
    }

    private Flyway flyway(String url, boolean baselineOnMigrate) {
        return Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion("1")
                .load();
    }

    private long count(Statement statement, String table) throws Exception {
        try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM " + table)) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }
}
