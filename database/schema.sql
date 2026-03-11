CREATE DATABASE pathaura_db;
USE pathaura_db;

CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    salary VARCHAR(100),
    job_type VARCHAR(50), -- e.g., Full-time, Remote
    match_rate VARCHAR(10) -- e.g., 95%
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255),
    university VARCHAR(255),
    duration VARCHAR(50),
    avg_entry_grade INT,
    match_rate VARCHAR(10)
);

-- Insert some sample data
INSERT INTO jobs (title, company, location, salary, job_type, match_rate) VALUES 
('UX Designer', 'MTN Uganda', 'Kampala', '2M+ UGX', 'Full-time', '98%'),
('Data Analyst', 'Stanbic Bank', 'Remote', '1.8M UGX', 'Contract', '85%');

INSERT INTO courses (course_name, university, duration, avg_entry_grade, match_rate) VALUES 
('Computer Science', 'Makerere University', '4 Years', 75, '94%'),
('Business Admin', 'MUBS', '3 Years', 60, '88%');