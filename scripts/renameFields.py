import sqlite3

def rename_fields(database_path, table_name, field_mapping):
    # Connect to the SQLite3 database
    connection = sqlite3.connect(database_path)
    cursor = connection.cursor()

    # Check if all the specified columns exist in the original table
    existing_columns = set(cursor.execute(f"PRAGMA table_info({table_name})").fetchall())
    for old_name in field_mapping.keys():
        if old_name not in existing_columns:
            print(f"Column '{old_name}' does not exist in the table '{table_name}'. Aborting renaming process.")
            return

    # Start a database transaction
    cursor.execute("BEGIN TRANSACTION")

    # Create a temporary table with new field names
    new_table_name = f"{table_name}_temp"
    create_table_sql = f"CREATE TABLE {new_table_name} AS SELECT {', '.join([f'{new_name} AS {old_name}' for old_name, new_name in field_mapping.items()])} FROM {table_name}"
    cursor.execute(create_table_sql)

    # Copy data from the original table to the temporary table
    copy_data_sql = f"INSERT INTO {new_table_name} SELECT * FROM {table_name}"
    cursor.execute(copy_data_sql)

    # Drop the original table
    drop_table_sql = f"DROP TABLE {table_name}"
    cursor.execute(drop_table_sql)

    # Rename the temporary table to the original table name
    rename_table_sql = f"ALTER TABLE {new_table_name} RENAME TO {table_name}"
    cursor.execute(rename_table_sql)

    # Commit the transaction
    cursor.execute("COMMIT")

    # Close the connection
    connection.close()

# Example usage
database_path = "db/transfers.db"
table_name = "courses_data"
field_mapping = {
    "group1FilterName":'externalCourseType',
    "group1FilterId": "externalCourseId",
    "group2FilterName": "externalOrg",
    "group2FilterId": "externalOrgId"
}
rename_fields(database_path, table_name, field_mapping)
