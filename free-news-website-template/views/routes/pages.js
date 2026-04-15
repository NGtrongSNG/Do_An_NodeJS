const express = require('express')
const router = express.Router()

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

module.exports = router