USE donare;
GO

INSERT INTO campaigns (title, location_name, address, date, start_time, end_time, slot_duration, capacity_per_slot, is_active)
VALUES 
(
    'Campanie de Toamna - Dumbravita Salveaza Vieti', 
    'Sala Polivalenta Dumbravita', 
    'Strada Codrului, Dumbravita, Timiș', 
    '2026-10-10', 
    '08:00:00', 
    '14:00:00', 
    15, -- durată slot în minute
    2,  -- donatori maxim per slot
    1   -- campanie activă (BIT)
),
(
    'Caravana Mobilă de Donare', 
    'Piața Unirii (Lângă Parc)', 
    'Bulevardul Unirii, Cluj-Napoca', 
    '2026-10-15', 
    '08:00:00', 
    '14:00:00', 
    15, -- durată slot în minute
    2,  -- donatori maxim per slot
    1   -- campanie activă (BIT)
);
GO

-- Verificare rapidă a datelor introduse
SELECT * FROM campaigns;