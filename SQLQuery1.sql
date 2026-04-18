-- Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS free_news;
USE free_news;

-- Bảng người dùng
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  role ENUM('admin','user') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chuyên mục
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng bài viết
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT,
  image VARCHAR(255),
  category_id INT,
  author_id INT,
  views INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Bảng liên hệ
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,          -- tên người liên hệ
  email VARCHAR(100),                  -- email liên hệ
  phone VARCHAR(20),                   -- số điện thoại
  message TEXT NOT NULL,               -- nội dung liên hệ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users
INSERT INTO users (username, password, email, role)
VALUES 
('admin', '123456', 'admin@example.com', 'admin'),
('ngoc', 'abcdef', 'ngoc@example.com', 'user'),
('linh', 'qwerty', 'linh@example.com', 'user');

-- Categories
INSERT INTO categories (name, description)
VALUES 
('Công nghệ', 'Tin tức về công nghệ, phần mềm, phần cứng, AI...'),
('Thể thao', 'Các bài viết về bóng đá, bóng rổ, thể thao trong nước và quốc tế'),
('Giải trí', 'Tin tức về phim ảnh, âm nhạc, showbiz');

-- Posts
INSERT INTO posts (title, summary, content, image, category_id, author_id, views)
VALUES 
('Xu hướng AI năm 2026', 'Tóm tắt về xu hướng AI', 'Nội dung chi tiết về xu hướng AI...', '/images/ai2026.jpg', 1, 1, 120),
('Chung kết bóng đá quốc gia', 'Tóm tắt trận chung kết', 'Tường thuật trận chung kết bóng đá...', '/images/football.jpg', 2, 2, 250),
('Phim bom tấn mới ra mắt', 'Tóm tắt phim bom tấn', 'Giới thiệu phim bom tấn mùa hè...', '/images/movie.jpg', 3, 3, 80);

-- Contacts
INSERT INTO contacts (name, email, phone, message)
VALUES
('Ngọc', 'ngoc@example.com', '0901234567', 'Mình muốn góp ý về chuyên mục công nghệ.'),
('Linh', 'linh@example.com', '0912345678', 'Website rất hay, mong có thêm tin thể thao.'),
('Khách', 'khach@example.com', '0987654321', 'Liên hệ để hợp tác quảng cáo.');
