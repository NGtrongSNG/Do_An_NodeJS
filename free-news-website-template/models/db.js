var mysql = require('mysql')
var con = mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "free_news"
})
con.connect(function (err) {
    if (err) throw err;
    console.log("Kết nối MySQL thành công!");
});
module.exports = con;