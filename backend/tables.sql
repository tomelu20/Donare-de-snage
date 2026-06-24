USE master;
GO

-- Verifica daca db exista si o sterge daca da
-- Mai intai seteaza baza de date pe single user pentru a o putea sterge
IF DB_ID('donare') IS NOT NULL
BEGIN
    ALTER DATABASE donare SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE donare; 
END
GO

CREATE DATABASE donare;
GO

Use donare;
GO

CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
)
GO

CREATE TABLE campaigns (
    id INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT NOT NULL,
    capacity_per_slot INT NOT NULL,
    is_active BIT NOT NULL DEFAULT 1
)
GO

CREATE TABLE appointments (
    id INT PRIMARY KEY IDENTITY(1,1),
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    slot_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)
GO

CREATE TABLE waitlist (
    id INT PRIMARY KEY IDENTITY(1,1),
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    preferred_time_range VARCHAR(50) NOT NULL,
    travel_time_minutes INT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('waiting', 'notified', 'accepted', 'expired')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)
GO

CREATE TABLE eligibility_questions (
    id INT PRIMARY KEY IDENTITY(1,1),
    question_text VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('checkbox', 'radio', 'numeric')),
    is_required BIT,
    is_active BIT
)
GO

CREATE TABLE eligibility_answers (
    id INT PRIMARY KEY IDENTITY(1,1),
    appointment_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (question_id) REFERENCES eligibility_questions(id)
)
GO