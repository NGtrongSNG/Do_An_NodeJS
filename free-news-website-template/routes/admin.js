const express = require('express')
const router = express.Router()
const con = require('../models/db')
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

router.use((req, res, next) => {
    if (req.session.admin) {
        // Nếu đã đăng nhập (có session), cho phép đi tiếp
        next();
    } else {
        // Nếu chưa, đá ra trang login
        res.redirect('/login');
    }
});

router.get('/', (req, res) => {
    res.render('layouts/layout_admin', {
        content: 'admin/dashboard',
        activePage: 'dashboard'
    })
});

router.get('/dashboard', (req, res) => {
    res.render('layouts/layout_admin', {
        content: 'admin/dashboard',
        activePage: 'dashboard'
    })
});
router.get('/user', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/users', activePage: 'users' })
})

router.get('/categories', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/categories', activePage: 'categories' })
})

router.get('/articles', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/articles', activePage: 'articles' })
})

module.exports = router 