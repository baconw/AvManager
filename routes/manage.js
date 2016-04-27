var express = require('express');
var router = express.Router();
var http = require('http');

var $ = require('jquery')(require("jsdom-no-contextify").jsdom().parentWindow);

function getMoviePageUrl(movieCode){
    console.log('getMoviePageUrl called!');
    //step 1. get html of the search results
    var baseUrl = 'http://www.javlibrary.com/cn/';
    var searchUrl = baseUrl + 'vl_searchbyid.php?keyword=' + movieCode;
    var movieUrl = '';
    var opt = {
                host:'127.0.0.1',
                port:'8088',
                method:'GET',//这里是发送的方法
                path:searchUrl,     //这里是访问的路径
                headers:{
                'Proxy-Authorization': 'Basic d3BkMTIzOlBhc3N3b3JkMDU='
                }
    }
    var body = '';
    var req = http.request(opt, function(res){
        console.log('Got response:' + res.statusCode);
        res.on('data',function(d){//这是异步得到的数据，所以不能在return之前得到。
            body+=d;       
        }).on('end',function(){
            //console.log(res.headers);
            //console.log(body);
            if(res.statusCode == 302){
                console.log('Got 302!');
                movieUrl = movieUrl + baseUrl + res.headers.location;
                //console.log('movieUrl:' + movieUrl);
            } else if(res.statusCode == 200){
                //step 2. resolve the html, return the url of the first results
                console.log('Got 200!');
            }
            resolveMoviePage(movieUrl);
        });
    }).on('error', function(e){
        console.log('Got error:' + e.message);
    })
    req.end();
    //if there is no result, return null 
    return null;
}

function resolveMoviePage(movieUrl){
    console.log('resolveMoviePage called!');
    //step 1. get html of the url
    var opt = {
                host:'127.0.0.1',
                port:'8088',
                method:'GET',//这里是发送的方法
                path:movieUrl,     //这里是访问的路径
                headers:{
                'Proxy-Authorization': 'Basic d3BkMTIzOlBhc3N3b3JkMDU=',
                'Cache-Control':'max-age=0'
                }
    }
    var body = '';
    var req = http.request(opt, function(res){
        console.log('Got response:' + res.statusCode);
        res.on('data',function(d){
            body+=d;
        }).on('end',function(){
            //console.log(res.headers);
            //console.log(body);
            if(res.statusCode == 200){
                console.log('Got 200!');
                var title = $(body).find('h3').each(function($this){  
                    //var a = $(this).children('a').attr('href');  
                    //var title = $(this).children('a').text();
                    var title = $(this).children('a').text();
                    console.log("title: " + title);  
                });
                
            } 
        });
    }).on('error', function(e){
        console.log('Got error:' + e.message);
    })
    req.end();
    //step 2. resolve the code, title, actor, pictures, publishDat, rating, tags
    //save to movieDetail
}

function displayMovieDetail(movieDetail){
    
}

function moveMovieAndPicture(){
    
}

function saveMovieDetail(){
    
}


function guessCode(filename){
    //2到4个字母(-)有或者无2到4个数字
    var reg = /[a-z]{2,4}-?[0-9]{2,4}/i;
    var result = filename.match(reg);
    if(result!=null){
        result = result[0];
    }else{
        result = filename;
    }
    console.log(result);
    return result;
}

//display all the movie file in the folder
function getMovieFileListAndDisplay(parentFolder){
    var fs = require('fs');
    /*
    fs.exists(parentFolder,(exists) => {
        console.log(exists ? 'It\'s there' : 'no file!')
    });
    */
    var result = fs.readdirSync(parentFolder);
    console.log(result);
    return result;
}

/*
//onMouseClicked one of the movie item
function startOneFile(fileName){
    //display the origin file name
    //guess the movie code from the file name
    var movieCode = guessCode(filename);
    //get the movie page url by searching the movie code
    var movieUrl = getMoviePageUrl(movieCode);
    //resolve the movie page url and display the detail
    if(movieUrl == null){
        //insert another code and search again
    } else {
        resolveMoviePage(movieUrl);
        displayMovieDetail(movieDetail);
    //move the movie file and the picture file
        moveMovieAndPicture();
    //save the movie detail to the db
        saveMovieDetail();
    //clear the movie detail and the page
    }
}
*/


/*
function startMain(parentFolder){
    getMovieFileListAndDisplay(parentFolder);
    
    
    var express = require('express');
    var app = express();

    app.get('/', function (req, res) {
        res.send('Hello World!');
    });

    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log('Example app listening at http://%s:%s', host, port);
    });
    
}
*/

//startMain('F:\\movie\\若妻\\');

var parentFolder = 'F:\\movie\\若妻\\';

/* GET movies listing. */
router.get('/', function(req, res, next) {
    var movieList = getMovieFileListAndDisplay(parentFolder);
    res.render('manage', { movieList: movieList });
});

router.get('/detail', function(req, res, next) {
    var filename = req.query.filename;
    console.log(filename);
    var fileLocation = parentFolder + filename;
    console.log(fileLocation);
    var code = guessCode(filename);
    res.render('detail', { originFileName: fileLocation,
                            movieCode: code});
});

/*
router.get('/jsonp',function(req,res,next){  //返回jsonp  
   res.jsonp({status:'jsonp'});  
});
router.get('/json',function(req,res,next){   //返回json  
    res.send({status:'json'});  
}); 
*/

router.get('/update',function(req,res,next){   //update 
    var movieCode = req.query.movieCode;
    console.log('movieCode = %s', movieCode);
    var movieUrl = getMoviePageUrl(movieCode);
    //resolve the movie page url and display the detail
    /*
    if(movieUrl == null){
        //insert another code and search again
    } else {
        var movieDetail = resolveMoviePage(movieUrl);
        displayMovieDetail(movieDetail);
    //move the movie file and the picture file
        moveMovieAndPicture(movieDetail);
    //save the movie detail to the db
        saveMovieDetail(movieDetail);
    //clear the movie detail and the page
    }
    
    res.send({status:'update'});
    */
});

module.exports = router;


