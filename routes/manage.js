var express = require('express');
var router = express.Router();
var http = require('http');
var fs = require('fs');
var db = require('../database/setting');

var $ = require('jquery')(require("jsdom-no-contextify").jsdom().parentWindow);

var parentFolder = 'F:\\movie\\若妻\\';
var originFileName = '';
var saveFolder = 'F:\\movie\\';
var movieDetail={title:'',
                code:'',
                location:'',
                picLocation:'',
                publishDate:'',
                actor:'',
                pictureUrl:'',
                tags:''};
var opt = {
                host:'127.0.0.1',
                port:'8088',
                method:'GET',//这里是发送的方法
                path:'',     //这里是访问的路径
                headers:{
                'Proxy-Authorization': 'Basic d3BkMTIzOlBhc3N3b3JkMDU='
                }
    }
    
function getMoviePageUrl(baseres, movieCode){
    console.log('getMoviePageUrl called!');
    //step 1. get html of the search results
    var baseUrl = 'http://www.javlibrary.com/cn/';
    var searchUrl = baseUrl + 'vl_searchbyid.php?keyword=' + movieCode;
    var movieUrl = '';
    opt.path = searchUrl;

    var body = '';
    var req = http.request(opt, function(res){
        console.log('Got response:' + res.statusCode);
        res.on('data',function(d){//这是异步得到的数据，所以不能在return之前得到。
            body+=d;       
        }).on('end',function(){
            if(res.statusCode == 302){
                console.log('Got 302!');
                movieUrl = movieUrl + baseUrl + res.headers.location;
            } else if(res.statusCode == 200){
                //step 2. resolve the html, return the url of the first results
                console.log('Got 200!');
            }
            resolveMoviePage(baseres, movieUrl);
        });
    }).on('error', function(e){
        console.log('Got error:' + e.message);
        baseres.send({'movieDetail':null});
    })
    req.end();
    //if there is no result, return null 
    return null;
}

function resolveMoviePage(baseres, movieUrl){
    console.log('resolveMoviePage called!');
    //step 1. get html of the url
    opt.path=movieUrl;
    
    var body = '';
    var req2 = http.request(opt, function(res){
        console.log('Got response:' + res.statusCode);
        res.on('data',function(d){
            body+=d;
        }).on('end',function(){
            //console.log(res.headers);
            //console.log(body);
            
            if(res.statusCode == 200){
                console.log('Got 200!');
                var div_rightcolumn = $(body).find('#rightcolumn').each(function($this){  
                    //var a = $(this).children('a').attr('href');  
                    //var title = $(this).children('a').text();
                    //step 2. resolve the code, title, actor, pictures, publishDate, rating, tags
                    movieDetail.title = $(this).find('#video_title').children('h3').children('a').text();
                    movieDetail.code = $(this).find('#video_id').children().children().find('.text').text();
                    movieDetail.publishDate = $(this).find('#video_date').children().children().find('.text').text();
                    movieDetail.actor = $(this).find('#video_cast').children().children().find('.text').text();
                    movieDetail.pictureUrl = $(this).find('#video_jacket_img').attr('src');
                    
                    var tags = new Array();
                    var atag = $(this).find('#video_genres').children().children().find('a').each(function(i){
                        var tag = $(this).text();
                        console.log("tag: "+ tag);
                        tags.push(tag);
                    });
                    movieDetail.tags = tags;
                    
                    baseres.send({'movieDetail':movieDetail});
                });
                
            } 
        });
    }).on('error', function(e){
        console.log('Got error:' + e.message);
        baseres.send({'movieDetail':null});
    })
    req2.end();
}

function saveMovieDetail(){
    var tags = movieDetail.tags.join('|');
    var values = [movieDetail.code,movieDetail.title,movieDetail.location,movieDetail.picLocation,movieDetail.actor,movieDetail.publishDate,tags];
    db.query('INSERT INTO avmanager.movie SET code = ?, title = ? , location = ? , picLocation = ? , actor = ? , publishDate = ? , tags = ? ', values, 
        function(error, results) { 
        if(error) { 
        console.log("ClientReady Error: " + error.message); 
        client.end(); 
        return; 
        } 
        console.log('Inserted: ' + results.affectedRows + ' row.'); 
        console.log('Id inserted: ' + results.insertId); 
        } 
        ); 
}

function moveMovieAndPicture(){
    var date = movieDetail.publishDate;
    if(date)
    {
        date = date.substr(0,4);
    }else{
        date = '0000';
    }
    //console.log('date:'+date);
    
    var dateFolder = saveFolder+date+'\\';
    console.log('dateFolder:'+dateFolder);
    fs.exists(dateFolder,(exists) => {
        //console.log(exists ? 'It\'s there' : 'no datefolder!');
        //check the date folder exists, create it in the save folder if not exists.
        if(!exists){
            fs.mkdir(dateFolder,function(err){
                if(err){
                    console.log('mkdir error' + err.message);
                }
            });
        }
        
        var movieFolder = dateFolder+movieDetail.code+'\\';
        fs.exists(movieFolder, (exists) => {
            //check the movie folder exists, create it in the date folder if not exists.
            if(exists){
                console.log('Error! movie folder already exists!');
            } else {
                fs.mkdir(movieFolder, function(err){
                    if(err){
                        console.log('mkdir error'+err.message);
                    }
                })
            }
        });
        
        //check the file suffix and move the file to the movie folder
        var reg = /\.((avi)|(mp4)|(mkv)|(wmv)|(rmvb))/i;
        console.log('originFileName:'+originFileName);
        var suffix = originFileName.match(reg);
        if(!suffix){
            console.log('Error! cannot find file suffix!')
        }else{
            console.log('new location:'+movieFolder+movieDetail.title+suffix[0]);
                      
            fs.rename(parentFolder+originFileName, movieFolder+movieDetail.title+suffix[0], function (err) {
                if(err) {
                    console.error('Move file error'+err.message);
                }
                movieDetail.location = movieFolder+movieDetail.title+suffix[0];
                console.log('move file complete');
                
                //download the picture from the pictureUrl
                reg = /\.((jpg)|(jpeg)|(png)|(gif)|(bmp))/i;
                suffix = movieDetail.pictureUrl.match(reg);
                http.get(movieDetail.pictureUrl, function(res){
                    var imgData = "";
                    res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
                    res.on("data", function(chunk){
                        imgData+=chunk;
                    });
                    res.on("end", function(){
                        fs.writeFile(movieFolder+movieDetail.title+suffix[0], imgData, "binary", function(err){
                            if(err){
                                console.log("down fail");
                            }
                            movieDetail.picLocation = movieFolder+movieDetail.title+suffix[0];
                            console.log("down success");
                            
                            //save movieDetail to the database
                            saveMovieDetail();
                        });
                    });
                });
                
            });
            
        }
                
        
        
        
    });
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
    /*
    fs.exists(parentFolder,(exists) => {
        console.log(exists ? 'It\'s there' : 'no file!')
    });
    */
    var result = fs.readdirSync(parentFolder);
    console.log(result);
    return result;
}

/* GET movies listing. */
router.get('/', function(req, res, next) {
    var movieList = getMovieFileListAndDisplay(parentFolder);
    res.render('manage', { movieList: movieList });
});

router.get('/detail', function(req, res, next) {
    originFileName = req.query.filename;
    var fileLocation = parentFolder + originFileName;
    var code = guessCode(originFileName);
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

router.get('/search',function(req,res,next){   //search 
    var movieCode = req.query.movieCode;
    getMoviePageUrl(res, movieCode);
});

router.get('/update',function(req,res,next){
    //move the movie file and the picture file
    moveMovieAndPicture();
    //save the movie detail to the db
    res.send({'status':'complete'});
});

module.exports = router;


