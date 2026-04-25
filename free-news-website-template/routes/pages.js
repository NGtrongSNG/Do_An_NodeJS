const express = require('express')
const router = express.Router()
const con = require('../models/db')
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

// 1. Lấy bài viết mới nhất
const sqlLatest = "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10";

// 2. Lấy bài viết xem nhiều nhất
const sqlMostViewed = "SELECT * FROM posts ORDER BY views DESC LIMIT 10";

// 3. Lấy tất cả bài viết sắp xếp theo chuyên mục (chủ đề)
const sqlByTopic = "SELECT * FROM posts ORDER BY title ASC, created_at DESC";

router.get('/', (req, res) => {

    con.query(sqlLatest, (err, latestResults) => {
        if (err) throw err;

        con.query(sqlMostViewed, (err, viewedResults) => {
            if (err) throw err;

            con.query(sqlByTopic, (err, topicResults) => {
                if (err) throw err;

                // Truyền tất cả dữ liệu sang giao diện
                res.render('layouts/layout', {
                    content: 'pages/index', // file chứa 3 cái tab bài viết
                    activePage: 'home',
                    latest: latestResults,
                    mostViewed: viewedResults,
                    byTopic: topicResults,
                });
            });
        });
    });
});

router.get('/category', (req, res) => {
    res.render('layouts/layout', { content: 'pages/category', activePage: 'category' })
})

router.get('/single', (req, res) => {
    res.render('layouts/layout', { content: 'pages/single', activePage: 'search' })
})

router.get('/contact', (req, res) => {
    res.render('layouts/layout', { content: 'pages/contact', activePage: 'post' })
})
router.get('/login', (req, res) => {
    res.render('layouts/layout', { content: 'pages/login', activePage: 'login', error: null })
})

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    con.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.render('pages/login', { error: 'Có lỗi xảy ra, vui lòng thử lại!' });
            }

            if (results.length === 0) {
                return res.render('pages/login', { error: 'Sai tên đăng nhập hoặc mật khẩu!' });
            }

            const user = results[0];
            req.session.user = user;

            if (user.role === 'admin') {
                // Chuyển về trang admin 
                req.session.admin = { username };   // gán session
                res.redirect('/admin/dashboard');
            } else {
                // Chuyển về trang chủ của người dùng 
                res.redirect('/');
            }
        }
    );
});

module.exports = router