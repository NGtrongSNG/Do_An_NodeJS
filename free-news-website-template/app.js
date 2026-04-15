const express = require('express')
const app = express()

const pageRouter = require('./views/routes/pages')
const adminRouter = require('./views/routes/admin')

app.use('/', pageRouter)
app.use('/admin', adminRouter)

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))

app.listen(3000, () => console.log('Server chạy ở http://localhost:3000'))
