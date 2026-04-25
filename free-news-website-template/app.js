const express = require('express')
const app = express()
const session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


const pageRouter = require('./routes/pages')
const adminRouter = require('./routes/admin')

app.use('/', pageRouter)
app.use('/admin', adminRouter)

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))

app.listen(3000, () => console.log('Server chạy ở http://localhost:3000'))
