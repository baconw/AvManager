var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Password05',
  database : 'avmanager',
  port : '3306'
});

module.exports = connection;