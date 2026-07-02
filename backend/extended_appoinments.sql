ALTER TABLE appointments ADD 
    is_for_someone_else BIT NOT NULL DEFAULT 0,
    guest_name VARCHAR(100) NULL,
    guest_surname VARCHAR(100) NULL,
    guest_phone VARCHAR(15) NULL,
    guest_blood_group VARCHAR(10) NULL DEFAULT 'Nu știu',
    appointment_date DATE NULL; -- Ne asigurăm că există coloana cerută de Frontend