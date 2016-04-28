var express = require('express');
var router = express.Router();
var db = require('../database/setting');

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index');
});

router.get('/showall',function(req,res,next){
  console.log('call showall');
    db.query('SELECT * from avmanager.movie;', function(err, rows, fields) {
      if (err) throw err;
      var moviePack = new Array();
      for(var i = 0; i < rows.length;i++)
      {
          var movie = {code: rows[i].code,
          title:rows[i].title,
          location:rows[i].location,
          picLocation:rows[i].picLocation};
          moviePack.push(movie);
          console.log('moviePack: ',i, movie);
      }
      console.log('moviePack length:' + moviePack.length);
      res.send({'data':moviePack});
    });
    
});

router.route('/login')
.get(function(req,res){
  res.render('login',{title:'用户登录'});
})
.post(function(req,res){
  var user = {
    username:'admin',
    password:'123456'
  }
  if(req.body.username === user.username && req.body.password === user.password){
    res.redirect('/home');
  }
  res.redirect('/login');
});

router.get('/logout', function(req, res) {
  res.redirect('/');
});

router.get('/home', function(req, res){
  var user = {
    username:'admin',
    password:'123456'
  };
  res.render('home', {title:'Home', user:user});
});

router.get('/showdetail',function(req, res){
  res.render('showdetail', { title: 'AvManager' });
})

/*
router.get('/manage',function(req,res){
  res.redirect('/manage');
});
*/

module.exports = router;
