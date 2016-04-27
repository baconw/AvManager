var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'AvManager' });
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

/*
router.get('/manage',function(req,res){
  res.redirect('/manage');
});
*/

module.exports = router;
