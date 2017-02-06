var express = require('express');// express 모듈을 가져와 express 변수에 담아줌
var bodyParser = require('body-parser'); // body-parser모듈을 bodyParser변수에담아줌
var ejs = require('ejs')

var app = express() // express 함수 리턴값을 app 변수에 담아줌

var mysql = require('mysql'); //mysql 모듈을 가져오 mysql 담아줌
var conn = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'library22',
  password : 'librarypw',
  database : 'library'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));

app.set('view engine', 'ejs');
app.set('views','./views');

conn.connect();

//겟 요청 메인화면으로 이동
app.get('/home', function(req,res){
  res.render('bookHome');
});
// 겟 요청 도서 등록폼화면 이동
app.get('/bookAdd',function(req,res){
  var sql = 'SELECT * FROM library';
  conn.query(sql,function(err, result){
    var sql = 'SELECT * FROM bookskind';
    conn.query(sql,function(err, kindlist){
      res.render('bookAddForm',{'libraryResult':result, 'bookskind':kindlist});
    });
  });
});
//post 요청 도서등록
app.post('/bookAdd',function(req,res){
  var statement = [
    req.body.booksName,req.body.booksMade,req.body.bookskindsNumber,req.body.booksAuthor,
    req.body.booksLendingPossible,
    req.body.booksLendingDay,req.body.booksLendingCount,req.body.booksDamage,
    req.body.libraryNumber
  ]
  var sql = 'INSERT INTO books'
    +'(booksName,booksMade,bookskindsNumber,booksAuthor,booksLendingPossible,'
    +'booksLendingDay,booksLendingCount,booksDamage,libraryNumber)'
    +' VALUES(?,?,?,?,?,?,?,?,?)';
  conn.query(sql, statement, function(err, bookadd){
    if(err){
      res.send("애러 : "+err);
    }
    res.redirect('/home');
  });
});
//겟 요청 도서목록
app.get('/bookList',function(req,res){
  res.send('hilist')
});


app.listen('3000',function(){
    console.log('3000 접속성공!')
});
