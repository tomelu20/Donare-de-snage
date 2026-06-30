ALTER TABLE campaigns ADD end_date DATE NULL;
-- Pentru campaniile existente, end_date va fi egal cu date
UPDATE campaigns SET end_date = date WHERE end_date IS NULL;
ALTER TABLE campaigns ALTER COLUMN end_date DATE NOT NULL;