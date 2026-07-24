USE donare;
GO

-- 1. Adăugăm coloana de observații medicale în tabelul de programări
ALTER TABLE appointments ADD notes VARCHAR(500) NULL;
GO