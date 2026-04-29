const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const db = require('./models/db'); // Đường dẫn đến file kết nối DB của em
const { render } = require('express/lib/response');
const multer = require('multer');
// Cấu hình để Server nhớ người dùng đã đăng nhập chưa
app.use(session({
    secret: 'chuoi_bi_mat_cua_em',
    resave: false,
    saveUninitialized: true
}));



// Cấu hình nơi lưu ảnh và tên ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/img'); // Ảnh sẽ bay vào thư mục này
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên ảnh để không bị trùng
    }
});
const upload = multer({ storage: storage });


// 1. Cấu hình View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Cấu hình thư mục Public (Chứa CSS, Images, JS của template)
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình lấy dữ liệu từ Form (POST method)
// 2 dòng này để Express đọc được dữ liệu từ Form gửi lên
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 4. Middleware để đổ Danh mục vào TẤT CẢ các trang (Rất quan trọng cho Header/Footer)
app.use(async (req, res, next) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE status = 1');
        res.locals.categories = categories; // Dữ liệu này sẽ có mặt ở mọi file .ejs

        next();
    } catch (err) {
        next(err);
    }
});

// 6.Route Người Dùng
// 6.1 Route trang chủ
app.get('/', async (req, res) => {
    try {

        const new_posts = `
            SELECT posts.*, categories.name AS category_name,fullname,DATE_FORMAT(Create_at, '%d-%m-%Y %H:%i:%s') AS date 
            FROM posts,users,categories 
            WHERE posts.status = 1 and users.id = posts.author_id AND posts.category_id = categories.id
            ORDER BY posts.Create_at DESC
            LIMIT 3
        `;

        const latest_news = `
       SELECT posts.*, categories.name AS category_name,fullname,DATE_FORMAT(Create_at, '%d-%m-%Y %H:%i:%s') AS date 
            FROM posts,users,categories 
            WHERE posts.status = 1 and users.id = posts.author_id AND posts.category_id = categories.id 
       ORDER BY posts.views DESC LIMIT 4;
        `
        const [new_post] = await db.query(new_posts);
        const [last_news] = await db.query(latest_news);
        res.render('user/index', { posts: new_post, last: last_news });
        console.log("Người Dùng Vào Trang Chủ")
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi server");
    }
});
// 6.2 Route Trang Liên Hệ
app.get('/contact', async (req, res) => {
    res.render('user/contact');
    console.log("Người Dùng Vào Trang Liện Hệ")
});

// 6.3 Route Trang Đăng Nhập
app.get('/login', async (req, res) => {
    res.render('admin/login');
    console.log("Người Dùng Vào Trang Đăng Nhập")
});
// 6.4 Route Trang Chi Tiết Bài Viết
app.get('/posts/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // 1. Tăng lượt xem
        await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

        // 2. Lấy chi tiết bài viết
        const sqlPost = `
            SELECT p.*, c.name AS category_name, u.fullname 
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.ID
            LEFT JOIN users u ON p.author_id = u.ID
            WHERE p.id = ? AND p.status = 1
        `;
        const [posts] = await db.query(sqlPost, [id]);

        if (posts.length === 0) {
            return res.status(404).send("Bài viết không tồn tại.");
        }
        const post = posts[0];

        // 3. Lấy bài viết liên quan (Sửa lỗi logic)
        const sqlRelated = 'SELECT * FROM posts WHERE status = 1 AND category_id = ? AND id != ? LIMIT 3';
        const [relatedPosts] = await db.query(sqlRelated, [post.category_id, id]);

        // 4. Lấy danh mục (Bỏ dấu * để tránh lỗi ID nhầm lẫn)
        const sqlCategories = `
            SELECT c.ID, c.name, COUNT(p.id) AS post_count 
            FROM categories c 
            LEFT JOIN posts p ON c.ID = p.category_id 
            GROUP BY c.ID, c.name
        `;
        const [categories] = await db.query(sqlCategories);

        res.render('user/Single_news', {
            post: post,
            related: relatedPosts,
            categories: categories
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi: " + err.message);
    }
});
// 6.5 Route Trang Danh Sách Bài Viết Theo Danh Mục Tổng Quan
app.get('/categories-overview', async (req, res) => {
    try {
        // 1. Lấy danh sách tất cả các danh mục hiện có
        const [categories] = await db.query('SELECT * FROM categories');

        // 2. Với mỗi danh mục, chúng ta lấy ra 4 bài viết mới nhất
        const data = await Promise.all(categories.map(async (cat) => {
            const [posts] = await db.query(
                `SELECT p.*, u.fullname 
                 FROM posts p 
                 LEFT JOIN users u ON p.author_id = u.ID 
                 WHERE p.category_id = ? AND p.status = 1 
                 ORDER BY p.id DESC LIMIT 4`, 
                [cat.ID]
            );
            // Trả về một đối tượng gồm thông tin danh mục và mảng bài viết của nó
            return {
                categoryName: cat.name,
                categoryId: cat.ID,
                posts: posts
            };
        }));

        // 3. Gửi dữ liệu sang trang overview
        res.render('user/categories-overview', { categoriesWithPosts: data });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});
app.get('/category/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        // 1. Lấy thông tin danh mục hiện tại
        const [categoryRows] = await db.query(
            'SELECT * FROM categories WHERE ID = ?',
            [categoryId]
        );

        if (categoryRows.length === 0) {
            return res.status(404).send('Danh mục không tồn tại');
        }
        const category = categoryRows[0];

        // 2. Lấy danh sách bài viết thuộc danh mục này
        // JOIN với bảng users để lấy fullname tác giả
        const sqlPosts = `
            SELECT p.*, u.fullname 
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.ID
            WHERE p.category_id = ? AND p.status = 1
            ORDER BY p.id DESC`;
        
        const [posts] = await db.query(sqlPosts, [categoryId]);

        // 3. Lấy thêm danh sách tất cả danh mục để hiện ở Sidebar
        const [allCategories] = await db.query('SELECT * FROM categories');

        res.render('user/category-detail', {
            category: category,
            posts: posts,
            allCategories: allCategories
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server: " + err.message);
    }
});


// 7.Route Admin
app.get('/dashboard', async (req, res) => {
    // Lấy Số Lượng Bài Viết
    const [posts] = await db.query('SELECT COUNT(*) AS total_posts FROM posts');
    // Lấy Số Lượng Danh Mục
    const [categories] = await db.query('SELECT COUNT(*) AS total_categories FROM categories');

    // Lấy Số Lượng Người Dùng

    console.log("Quản Trị Viên Vào Trang Dashbroad")
    const [users] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    res.render('admin/dashboard', {
        total_posts: posts[0].total_posts,
        total_categories: categories[0].total_categories,
        total_users: users[0].total_users
    });

});

// 7.1 Xử lý khi bấm nút Đăng nhập
app.post('/admin/login', async (req, res) => {
    // 1. In thử ra màn hình console xem có nhận được chữ NGtrongNG không
    // console.log("Dữ liệu nhận từ form:", req.body); 

    const { username, password } = req.body;

    try {
        // 2. In thử câu SQL để xem nó chạy đúng không
        const sql = "SELECT * FROM users WHERE username = ? AND password = ? AND role = 'Admin'";
        const [rows] = await db.query(sql, [username, password]);

        // console.log("Kết quả tìm trong Database:", rows); // Xem tìm thấy user không

        if (rows.length > 0) {
            req.session.isLoggedIn = true;
            req.session.user = rows[0];
            res.redirect('/dashboard');
            // Sau Khi Đăng Nhập Thành Công, Chuyển Hướng Sang Trang Dashboard và Hiển Th
        }

        else {
            res.render('/admin/login', { error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
            console.log("Tên đăng nhập hoặc mật khẩu không chính xác!")
        }
        console.log("Quản Trị Viên Vào Trang Dashbroad thành công")
    } catch (err) {
        // console.error("LỖI RỒI EM ƠI:", err); // Nếu văng lỗi đỏ chót ở terminal là do nguyên nhân 2
        res.render('admin/login', { error: 'Lỗi hệ thống!' });

    }
});


// 7.2 Route Trang Quản Lý Bài Viết
app.get('/admin/posts', async (req, res) => {

    try {
        // Lấy bài viết và "mượn" thêm cột name từ bảng categories
        const sql = `
        SELECT posts.id, image, posts.title, fullname, DATE_FORMAT(posts.Create_at, '%d-%m-%Y %H:%i:%s') AS formatted_date, categories.name AS category_name, posts.status 
        FROM posts,users,categories 
        where posts.author_id = users.id and posts.category_id = categories.id 
        ORDER BY posts.id ASC;
        `;
        const [rows] = await db.query(sql);

        // Gửi dữ liệu posts sang file index.ejs
        res.render('admin/readposts', { posts: rows });
        console.log("Quản Trị Viên Vào Trang Quản Lý Bài Viết")
    } catch (err) {
        console.error("Lỗi lấy bài viết:", err);
        res.send("Có lỗi xảy ra khi lấy danh sách bài viết");
    }
});
// 7.3 Route Trang Thêm Bài Viết Mới
// Hiện Thị Danh Sách Danh Mục Trong ComboBox Khi Vào Trang Thêm Bài Viết Mới
app.get('/admin/posts/add', async (req, res) => {
    try {
        // 1. Lấy danh sách tác giả
        const [authors] = await db.query(`SELECT fullname FROM users where role ='Author'`);
        // 2. Lấy danh sách danh mục 
        const [categories] = await db.query('SELECT * FROM categories');

        // 3. Gửi CẢ HAI sang giao diện
        res.render('admin/addposts', {
            authors: authors,
            categories: categories
        });
        console.log("Quản Trị Viên Vào Trang Thêm Bài Viết")
    } catch (err) {
        res.send("Lỗi: " + err.message);
    }
});
// 7.3.1 Xử lý khi bấm nút Thêm Bài Viết Mới
app.post('/admin/posts/add', upload.single('image'), async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ Form (Thêm trường summary vào đây)
        const { title, summary, content, category_id, author_id } = req.body;
        // console.log("Dữ liệu từ form:", req.body); 

        // 2. Lấy tên file ảnh đã upload 
        const image = req.file ? req.file.filename : 'default.jpg';

        // 3. Lệnh SQL Insert chuẩn: Cập nhật đầy đủ các cột tương ứng trong CSDL
        const sql = `INSERT INTO posts (Title, Summary, Content, Image, category_id, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // 4. Giá trị tương ứng với dấu ? (status mặc định là 1 - Hiện)
        const values = [title, summary, content, image, category_id, author_id, 1];

        // 5. Thực thi
        await db.query(sql, values);

        // Thành công thì quay về trang danh sách
        res.redirect('/admin/posts');
        console.log("Quản Trị Viên Vào Thêm Bài Viết Thành Công")
    } catch (err) {
        console.error("Lỗi thêm bài:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});
//7.3.2 Sửa Bài Viết
// Hiện Giao Diện Sửa Bài Viết
app.get('/admin/posts/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // 1. Lấy bài viết cần sửa
        const [posts] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);

        // Nếu không tìm thấy bài viết thì báo lỗi
        if (posts.length === 0) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        const post = posts[0]; // Lấy object bài viết

        // 2. Lấy danh sách Danh mục và Tác giả để in ra Form
        const [categories] = await db.query('SELECT * FROM categories');
        const [authors] = await db.query(`SELECT ID,fullname FROM users where role = 'Author'`);

        // 3. Truyền tất cả ra view editposts.ejs
        res.render('admin/editposts', {
            post: post,
            categories: categories,
            authors: authors
        });
        console.log("Quản Trị Viên Vào Trang Chỉnh Sửa Bài Viết")
    } catch (err) {
        res.send("Lỗi: " + err.message);
    }
});
// Xử Lý Cập Nhật Thông Tin Bài Báo Lên Cơ Sở Dữ Liệu
app.post('/admin/posts/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id; // Lấy ID từ URL 

        // 1. Lấy dữ liệu từ form gửi lên (bao gồm cả status)
        const { title, summary, content, category_id, id_authors, old_image, status } = req.body;

        // 2. Xử lý ảnh: Nếu có ảnh mới thì dùng ảnh mới, không thì giữ ảnh cũ
        const image = req.file ? req.file.filename : old_image;

        // 3. Câu lệnh SQL cập nhật (nhớ viết đúng tên cột trong DB của em nhé)
        const sql = `
            UPDATE posts 
            SET Title = ?, Summary = ?, Content = ?, Image = ?, category_id = ?, author_id = ?, status = ? 
            WHERE id = ?
        `;

        const values = [title, summary, content, image, category_id, id_authors, status, id];

        // 4. Thực thi cập nhật
        await db.query(sql, values);
        console.log("Cập Nhật Bài Viết Thành Công")
        // 5. Thành công thì quay về danh sách bài viết
        res.redirect('/admin/posts');
    } catch (err) {
        console.error("Lỗi cập nhật bài viết:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});
// Xóa Bài Viết 
// ROUTE XÓA BÀI VIẾT
app.get('/admin/posts/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Câu lệnh SQL xóa bài viết theo ID
        // Lưu ý: Kiểm tra tên cột là 'id' hay 'ID' để viết cho đúng nhé
        const sql = "DELETE FROM posts WHERE id = ?";

        await db.query(sql, [id]);

        // Xóa xong thì "đá" người dùng quay lại trang danh sách bài viết
        res.redirect('/admin/posts');
        console.log("Quản Trị Viên Xóa Bài Viết Thành Công")
    } catch (err) {
        console.error("Lỗi khi xóa bài:", err);
        res.status(500).send("Không thể xóa bài viết này. Lỗi: " + err.message);
    }
});
// 7.4 Route Trang Quản Lý Danh Mục
app.get('/admin/categories', async (req, res) => {

    try {
        const sql = `
            SELECT c.*, COUNT(p.id) AS post_count
            FROM categories c
            LEFT JOIN posts p ON c.ID = p.category_id
            GROUP BY c.ID
        `;
        const [rows] = await db.query(sql);
        res.render('admin/readcategories', { categories: rows });
        console.log("Quản Trị Viên vào Trang Quản Lý Danh Mục")
    } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
        res.send("Có lỗi xảy ra khi lấy danh sách danh mục");
    }
});
//7.4.1 Route Trang Thêm Danh Mục Mới
app.get('/admin/categories/add', async (req, res) => {
    res.render('admin/addcategories');
    console.log("Vào Trang Thêm Danh Mục")
});
// 7.4.2 Xử lý khi bấm nút Thêm Danh Mục Mới
app.post('/admin/categories/add', async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ Form
        const { name} = req.body;

        // 2. Lệnh SQL Insert chuẩn: Cập nhật đầy đủ các cột tương ứng trong CSDL
        const sql = `INSERT INTO categories (name) VALUES (?)`;

        // 3. Giá trị tương ứng với dấu ? (status mặc định là 1 - Hiện)
        const values = [name];

        // 5. Thực thi
        await db.query(sql, values);
        console.log("Thêm danh mục thành công")
        // Thành công thì quay về trang danh sách
        res.redirect('/admin/categories');

    } catch (err) {
        console.error("Lỗi thêm danh mục:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});
// 7.4.3 Chỉnh Sửa Danh Mục
app.get('/admin/categories/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Lấy thông tin 1 danh mục dựa trên ID
        const [rows] = await db.query('SELECT * FROM categories WHERE ID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).send('Không tìm thấy danh mục này');
        }

        const category = rows[0];
        // Truyền dữ liệu sang file editcategory.ejs
        res.render('admin/editcategories', { categories: category });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
});
// 7.4.4 Xử Lý Nút Chỉnh Sửa Danh Mục
app.post('/admin/categories/edit/:id', async (req, res) => {
    try {
        // Lấy id 
        const id = req.params.id; // Lấy ID từ URL 
        // 1. Lấy dữ liệu từ Form
        const { name } = req.body;


        // 2. Lệnh SQL Insert chuẩn: Cập nhật đầy đủ các cột tương ứng trong CSDL
        const sql = `UPDATE categories
            SET name = ?
            WHERE id = ? `;

        // 3. Giá trị tương ứng với dấu ? (status mặc định là 1 - Hiện)
        const values = [name, id];

        // 5. Thực thi
        await db.query(sql, values);
        console.log("Chỉnh sửa danh mục thành công")
        // Thành công thì quay về trang danh sách
        res.redirect('/admin/categories');

    } catch (err) {
        console.error("Lỗi Chỉnh Sửa danh mục:", err);
        res.status(500).send("Lỗi server: " + err.message);
    }
});
// 7.4.5 Xóa Danh Mục
app.get('/admin/categories/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // 1. Kiểm tra xem có bài viết nào thuộc danh mục này không
        // Lưu ý: Thay 'category_id' bằng tên cột khóa ngoại trong bảng posts của em
        const [posts] = await db.query('SELECT COUNT(*) AS total FROM posts WHERE category_id = ?', [id]);

        const postCount = posts[0].total;

        if (postCount > 0) {
            // 2. Nếu có bài viết, không cho xóa và bắn thông báo về trình duyệt
            return res.send(`
                <script>
                    alert('KHÔNG THỂ XÓA! Danh mục này đang có ${postCount} bài viết. Em phải xóa hoặc đổi danh mục cho các bài viết đó trước.');
                    window.location.href = '/admin/categories';
                </script>
            `);
        }

        // 3. Nếu không có bài viết (count == 0), tiến hành xóa bình thường
        await db.query('DELETE FROM categories WHERE ID = ?', [id]);
        console.log("Xóa Danh Mục Thành Công")
        // Xóa xong quay về danh sách
        res.redirect('/admin/categories');

    } catch (err) {
        console.error("Lỗi khi xóa danh mục:", err);
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});
// 7.5 Trang Quản Lý Người Dùng
app.get('/admin/users', async (req, res) => {
    try {
        // 1. Lấy danh sách tác giả
        const [users] = await db.query('SELECT * FROM users');


        // 3. Gửi CẢ HAI sang giao diện
        res.render('admin/readusers', {
            users: users,
        });
        console.log("Quản Trị Viên Vào Trang Quản Lý Người Dùng")
    } catch (err) {
        res.send("Lỗi: " + err.message);
    }
});
// 7.5.1 Thêm Người Dùng Mới
app.get('/admin/users/add', async (req, res) => {
    res.render('admin/addusers');
    console.log("Quản Trị Viên Vào Trang Thêm Người Dùng")
});
// --- 2. Xử lý Thêm Người Dùng (POST) ---
app.post('/admin/users/add', async (req, res) => {
    const { username, password, fullname, role } = req.body;
    try {
        const sql = 'INSERT INTO users (username, password, fullname, role) VALUES (?, ?, ?, ?)';
        await db.query(sql, [username, password, fullname, role]);
        res.redirect('/admin/users'); // Quay lại trang danh sách em đã làm
    } catch (err) {
        res.status(500).send("Lỗi khi thêm: " + err.message);
    }
});
//7.5.2 Chỉnh Sửa Người Dùng
// 1. Cổng GET: Hiển thị Form sửa và đổ dữ liệu cũ vào
app.get('/admin/users/edit/:id', async (req, res) => {
    try {
        const id = req.params.id; // Lấy ID từ URL
        const [rows] = await db.query('SELECT * FROM users WHERE ID = ?', [id]);

        if (rows.length > 0) {
            // Gửi dữ liệu user tìm được sang file EJS
            res.render('admin/editusers', { user: rows[0] });
        } else {
            res.status(404).send("Không tìm thấy người dùng này!");
        }
    } catch (err) {
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});

// 2. Cổng POST: Nhận dữ liệu đã sửa và cập nhật vào Database
app.post('/admin/users/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { username, fullname, role } = req.body; // Lấy dữ liệu từ Form gửi lên

    try {
        const sql = 'UPDATE users SET username = ?, fullname = ?, role = ? WHERE ID = ?';
        await db.query(sql, [username, fullname, role, id]);
        
        // Sửa xong quay về trang danh sách
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send("Lỗi khi cập nhật: " + err.message);
    }
});
// Route xử lý Xóa người dùng
app.get('/admin/users/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Đếm số lượng bài viết của user này (dựa vào author_id trong bảng posts)
        const [postCountRows] = await db.query(
            'SELECT COUNT(*) AS total FROM posts WHERE author_id = ?', 
            [userId]
        );
        
        const postCount = postCountRows[0].total;

        // 2. Kiểm tra điều kiện: Nếu có từ 1 bài viết trở lên thì KHÔNG cho xóa
        if (postCount > 0) {
            // Trả về một đoạn script để hiện thông báo rồi quay lại trang danh sách
            return res.send(`
                <script>
                    alert("Không thể xóa! Người dùng này đang có ${postCount} bài viết. Hãy xóa hoặc chuyển bài viết của họ trước.");
                    window.location.href = "/admin/users";
                </script>
            `);
        }

        // 3. Nếu không có bài viết nào (postCount == 0), tiến hành xóa
        await db.query('DELETE FROM users WHERE ID = ?', [userId]);
        
        // Xóa xong quay về trang danh sách
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Lỗi xóa: ", err);
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});
// 8. Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});




