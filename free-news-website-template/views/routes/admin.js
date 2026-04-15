const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/dashboard', activePage: 'dashboard' })
})

router.get('/users', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/users', activePage: 'users' })
})

router.get('/categories', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/categories', activePage: 'categories' })
})

router.get('/articles', (req, res) => {
    res.render('layouts/layout_admin', { content: 'admin/articles', activePage: 'articles' })
})

module.exports = router 