const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'))

// app.get('/', (req, res) => {
//     res.render('layout', { content: 'index.ejs' })
// })
// app.get('/category', (req, res) => {
//     res.render('layout', { content: 'category.ejs' })
// })
// app.get('/single', (req, res) => {
//     res.render('layout', { content: 'single.ejs' })
// })
// app.get('/contact', (req, res) => {
//     res.render('layout', { content: 'contact.ejs' })
// })

app.get('/', (req, res) => {
    res.render('layout', { content: 'index', activePage: 'home' })
})
app.get('/category', (req, res) => {
    res.render('layout', { content: 'category', activePage: 'category' })
})
app.get('/single', (req, res) => {
    res.render('layout', { content: 'single', activePage: 'single' })
})
app.get('/contact', (req, res) => {
    res.render('layout', { content: 'contact', activePage: 'contact' })
})


app.listen(3000, (req, res) => {
    console.log("Start: localhost:3000");
})