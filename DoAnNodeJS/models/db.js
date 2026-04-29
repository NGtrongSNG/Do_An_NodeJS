// Model Cơ Sở Dữ Liệu (MySQL)
const mysql = require('mysql2');

// Cấu hình kết nối MySQL
const pool = mysql.createPool({
    host: 'localhost', // Địa chỉ máy chủ MySQL
    user: 'root', // Tên người dùng MySQL
    password: '', // Mật khẩu MySQL
    database: 'db_news', // Tên cơ sở dữ liệu
    waitForConnections: true, // Chờ kết nối nếu không có kết nối nào có sẵn
    connectionLimit: 10, // Số lượng kết nối tối đa
})
module.exports = pool.promise();