CREATE DATABASE beetweenletterbd;
USE beetweenletterbd;

CREATE TABLE Users(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE
);

CREATE TABLE Posts(
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Direct_Letters(
    letter_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    send_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 5 Usuários Fictícios (A senha é '123456' hasheada com bcrypt)
-- As senhas são fictícias, simulando uma criptografia que seria feita pelo Node.js

INSERT INTO Users (username, email, password_hash) VALUES
('CartaAntiga', 'ana@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'), 
('Mensageiro', 'bruno@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('PenaPrata', 'carla@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('Pergaminho', 'davi@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('Tinteiro', 'elisa@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8');