ALTER TABLE event_tables
    ADD COLUMN IF NOT EXISTS table_rows INT,
    ADD COLUMN IF NOT EXISTS table_columns INT;
