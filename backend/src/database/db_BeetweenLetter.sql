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

-- 3. Inserção de 5 Usuários Fictícios (A senha é '123456' hasheada com bcrypt)
-- OBS: Na vida real, você deve obter o hash da senha '123456' com seu código Node.js
-- O hash abaixo é um EXEMPLO do que seria gerado por bcrypt.hash('123456', 10)

INSERT INTO Users (username, email, password_hash) VALUES
('CartaAntiga', 'ana@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'), 
('Mensageiro', 'bruno@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('PenaPrata', 'carla@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('Pergaminho', 'davi@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8'),
('Tinteiro', 'elisa@email.com', '$2b$10$w3/gIeN6eG.y4b0n9b0uB.2VlY4.D/G4/B1.B8');


SELECT * FROM Users;

ALTER TABLE Users
ADD COLUMN profile_picture_url VARCHAR(255) DEFAULT '/public/images/default_avatar.png';

-- Adiciona a coluna para a biografia
ALTER TABLE Users
ADD COLUMN bio TEXT;

ALTER TABLE Posts
ADD COLUMN image_url VARCHAR(255) NULL;

CREATE TABLE Reports(
	reporter_id INT PRIMARY KEY,
    post_id INT,
    reason VARCHAR(1000)
);

CREATE TABLE Follows (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE ChatConversations (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY user_pair (user1_id, user2_id)
);

CREATE TABLE ChatMessages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'video') NOT NULL DEFAULT 'text',
    media_url VARCHAR(255) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ChatConversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
