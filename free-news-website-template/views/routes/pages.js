const express = require('express')
const router = express.Router()
const con = require('../../models/db')
var session = require("express-session");
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'keyboard cat'
}));

router.get('/', (req, res) => {
    res.render('layouts/layout', { content: 'pages/index', activePage: 'home' })
})

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
                res.redirect('/admin/dashboard');
            } else {
                // Chuyển về trang chủ của người dùng 
                res.redirect('/');
            }
        }
    );
});

module.exports = router