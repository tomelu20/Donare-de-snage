Use donare;
GO

CREATE TABLE users (
    id INT PRIMERY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
)

CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT NOT NULL,
    capacity_per_slot INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
)

CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    slot_time TIME NOT NULL,
    status ENUM('confirmed', 'cancelled', 'attended') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)

CREATE TABLE waitlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    preferred_time_range VARCHAR(50) NOT NULL,
    travel_time_minutes INT NOT NULL,
    status ENUM('waiting', 'notified', 'accepted', 'expired') NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)

CREATE TABLE eligibility_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_text VARCHAR(255) NOT NULL,
    type ENUM('checkbox', 'radio', 'numeric') NOT NULL,
    is_required BOOLEAN,
    is_active BOOLEAN
)

CREATE TABLE eligibility_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (question_id) REFERENCES eligibility_questions(id)
)