CREATE DATABASE IF NOT EXISTS Careerpath;
USE Careerpath;

-- Table for the 3 Learning Pathways in Rwanda
CREATE TABLE pathways (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pathway_name VARCHAR(100), -- e.g., Mathematics & Sciences, Arts & Humanities
    combinations VARCHAR(255)  -- e.g., PCM, MPG, MCB, HEG
);

-- Table for Careers linked to those Pathways
CREATE TABLE careers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    career_title VARCHAR(100),
    pathway_id INT,
    description TEXT,
    FOREIGN KEY (pathway_id) REFERENCES pathways(id)
);

-- Insert some starter data for Rwanda
INSERT INTO pathways (pathway_name, combinations) VALUES 
('Mathematics and Sciences', 'PCM, MPG, MCB, BCG'),
('Arts and Humanities', 'HEG, HEL, LEG'),
('Languages', 'LKK, KEL, LKL');

INSERT INTO careers (career_title, pathway_id, description) VALUES 
('Software Developer', 1, 'Build apps and digital solutions.'),
('Civil Engineer', 1, 'Design and build infrastructure in Rwanda.'),
('Lawyer', 2, 'Expert in legal systems and justice.'),
('Journalist', 3, 'Communication and media professional.');