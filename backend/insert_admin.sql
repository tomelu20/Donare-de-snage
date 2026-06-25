USE donare;
GO

-- Îi schimbăm rolul utilizatorului tău din 'user' în 'admin'
UPDATE users
SET role = 'admin'
WHERE email = 'mihai05.toma@gmail.com';
GO

-- Verifică dacă rolul s-a schimbat cu succes
SELECT id, name, email, role FROM users;
GO