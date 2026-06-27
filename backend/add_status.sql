-- 1. Ștergem constrângerea CHECK existentă (numele ei exact din eroarea ta este CK__appointme__statu__52593CB8)
ALTER TABLE appointments DROP CONSTRAINT CK__appointme__statu__52593CB8;

-- 2. Adăugăm noua constrângere care include și 'no_show'
ALTER TABLE appointments 
ADD CONSTRAINT CK_appointments_status CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show'));