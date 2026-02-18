ALTER TABLE event_tables
    DROP COLUMN IF EXISTS table_rows,
    DROP COLUMN IF EXISTS table_columns;
