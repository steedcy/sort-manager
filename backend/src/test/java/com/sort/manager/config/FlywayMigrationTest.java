package com.sort.manager.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest {

    @Test
    void migratesAnEmptyDatabaseToLatestVersion() throws Exception {
        String url = "jdbc:h2:mem:flyway_fresh;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

        Flyway flyway = flyway(url, false);
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(4);

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO category(name, household_id) VALUES ('Electronics', 1)");
            statement.executeUpdate("INSERT INTO location(name, household_id) VALUES ('Cabinet', 1)");
            statement.executeUpdate("INSERT INTO item(name, quantity, price, purchase_date, category_id, location_id, household_id) "
                    + "VALUES ('Power bank', 1, 99.00, CURRENT_DATE, 1, 1, 1)");
            assertThat(count(statement, "item")).isEqualTo(1);
            assertThat(count(statement, "household")).isEqualTo(1);
            assertThat(countWhereHouseholdMissing(statement, "category")).isZero();
            assertThat(countWhereHouseholdMissing(statement, "location")).isZero();
            assertThat(countWhereHouseholdMissing(statement, "item")).isZero();
            assertThat(indexColumns(connection, "category", "uk_category_household_name"))
                    .containsExactlyInAnyOrder("household_id", "name");
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
        assertThat(baselineUpgrade.migrate().migrationsExecuted).isEqualTo(3);

        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            assertThat(count(statement, "category")).isEqualTo(1);
            assertThat(countWhereHouseholdMissing(statement, "category")).isZero();
            assertThat(countWhereHouseholdMissing(statement, "location")).isZero();
            assertThat(countWhereHouseholdMissing(statement, "item")).isZero();
            assertThat(indexColumns(connection, "category", "uk_category_household_name"))
                    .containsExactlyInAnyOrder("household_id", "name");
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

    private long countWhereHouseholdMissing(Statement statement, String table) throws Exception {
        try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM " + table + " WHERE household_id IS NULL")) {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private Set<String> indexColumns(Connection connection, String table, String indexName) throws Exception {
        Set<String> columns = new HashSet<>();
        try (ResultSet indexes = connection.getMetaData().getIndexInfo(null, null, table, false, false)) {
            while (indexes.next()) {
                if (indexName.equalsIgnoreCase(indexes.getString("INDEX_NAME"))) {
                    columns.add(indexes.getString("COLUMN_NAME").toLowerCase());
                }
            }
        }
        return columns;
    }
}
