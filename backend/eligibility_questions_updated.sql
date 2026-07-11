USE donare;
GO

-- 1. Ne asigurăm că tabelul tău are valorile implicite setate pentru a nu fi obligat să trimiți mereu 1 sau 0 din backend
ALTER TABLE eligibility_questions 
ADD CONSTRAINT DF_eligibility_questions_is_required DEFAULT 1 FOR is_required;

ALTER TABLE eligibility_questions 
ADD CONSTRAINT DF_eligibility_questions_is_active DEFAULT 1 FOR is_active;
GO

-- 2. Ștergem datele vechi (dacă existau) pentru a nu duplica întrebările la rulare
DELETE FROM eligibility_questions;
GO

-- 3. Populăm tabelul cu cele 9 întrebări standard din chestionar
INSERT INTO eligibility_questions (question_text, type, is_required, is_active)
VALUES 
('Am peste 50 kg', 'checkbox', 1, 1),
('Am între 18 și 65 ani', 'checkbox', 1, 1),
('Nu am avut intervenții chirurgicale recente', 'checkbox', 1, 1),
('Nu am avut anestezie recent', 'checkbox', 1, 1),
('Nu am avut tatuaj/piercing/acupunctură/micro-pigmentare în ultimele 6 luni', 'checkbox', 1, 1),
('Nu am luat antiinflamatoare (ex: Nurofen) în ultima săptămână', 'checkbox', 1, 1),
('Nu am luat paracetamol în ultima săptămână', 'checkbox', 1, 1),
('Nu am făcut vaccin (COVID / gripal / HPV) în ultima lună', 'checkbox', 1, 1),
('Au trecut 8 săptămâni (femei) / 12 săptămâni (bărbați) de la ultima donare', 'checkbox', 1, 1);
GO

-- 4. Verifică dacă ai și tabelul de răspunsuri (eligibility_answers) creat corect, 
-- deoarece backend-ul tău va introduce răspunsurile donatorilor aici când dau "Confirmă Rezervarea"
IF OBJECT_ID('eligibility_answers', 'U') IS NULL
BEGIN
    CREATE TABLE eligibility_answers (
        id INT PRIMARY KEY IDENTITY(1,1),
        appointment_id INT NOT NULL,
        question_id INT NOT NULL,
        answer_text VARCHAR(255) NOT NULL,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES eligibility_questions(id) ON DELETE CASCADE
    );
END
GO