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
//booklist 주소로 겟 요청시 도서목록,view 화면을 보여줌
app.get('/bookList',function(req,res){
  var sql = 'SELECT * FROM books';
  conn.query(sql,function(err, booklistResult){
      res.render('bookList',{bookslist:booklistResult});
  });
});
//get 요청 대출가능목록
app.get('/bookRentPossible',function(req,res){
  var sql = 'SELECT * FROM books WHERE booksLendingPossible=1'
  conn.query(sql, function(err, bookRentResult){
    if(err){
      res.send('대출가능목록 불러오기 실패!'+err);
    }else{
      res.render('bookList',{bookslist:bookRentResult});
    }
  });
});
//get 요청 도서 정보 수정
app.get('/bookModify/:id',function(req,res){
  var booknumber = req.params.id;
  var sql = 'SELECT books.*, bookskind.bookskindsname,library.libraryName'
  +' FROM books'
  +' LEFT JOIN bookskind'
  +' ON books.bookskindsNumber = bookskind.bookskindsNumber'
  +' LEFT JOIN library'
  +' ON books.libraryNumber = library.libraryNumber'
  +' WHERE booksNumber=?';
  conn.query(sql,[booknumber],function(err, bookModify){
    if(err){
      res.send('도서정보수정를 할수 없습니다! modify'+err);
    }else{
      console.log(bookModify);
      sql = 'SELECT * FROM bookskind';
      conn.query(sql,function(err,kinds){
        if(err){
          res.send('도서정보수정를 할수 없습니다! kinds'+err);
        }else{
          sql = "SELECT * FROM library";
          conn.query(sql, function(err,libr){
            if(err){
              res.send('도서정보수정를 할수 없습니다 lib'+err);
            }else{
              res.render('bookModify',{books:bookModify,bookskind:kinds,librResult:libr});
            }
          });
        }
      });
    }
  });
});
//post 요청 도저정보수정 처리
app.post('/bookModify',function(req,res){
  var libNum = req.body.libraryNumber;
  var sql = 'SELECT localNumber FROM library WHERE libraryNumber =?';
  var localNum = '';
  //지역번호 구하기 구현
  conn.query(sql,[libNum],function(err, localNum){
    if(err){
      res.send('지역번호를 찾을수 없습니다:'+err);
    }else {
      console.log(localNum[0].localNumber);
      var sql = 'UPDATE books SET bookskindsNumber=?,'
      +' localNumber=?, libraryNumber=?, booksName=?,booksMade=?,booksAuthor=?,'
      +' booksLendingPossible=?,booksLendingCount=?,booksLendingDay=?,booksDamage=?'
      +' WHERE booksNumber=?';
      var statement = [
        req.body.bookskind,localNum[0].localNumber,req.body.libraryNumber,
        req.body.booksName,req.body.booksMade,req.body.booksAuthor,
        req.body.booksLendingPossible,req.body.booksLendingCount,
        req.body.booksLendingDay,req.body.booksDamage,req.body.booksNumber
      ];
      console.log(statement);
      conn.query(sql, statement, function(err, lbnResult ){
        if(err){
          res.send('도서 정보 수정 오류!'+err);
        }else{
          res.redirect('/bookList');
        };
      });
    }
  });
});

//get 요청 도서대여등록
app.get('/bookRentAdd',function(req,res){
  res.render('bookRentAdd');
});

//post 요청 도서대여등록
app.post('/booksrentAdd',function(req,res){
  var statement = [
      req.body.booksNumber, req.body.membersNumber, req.body.booksRentStartDate,
      req.body.booksRentEndDate, req.body.booksRentPay, req.body.booksDamage,'0'
  ];
  var sql = 'INSERT INTO booksrent(booksNumber,membersNumber,booksRentStartDate,'
  +'booksRentEndDate,booksRentPay,booksDamage,booksRentBack) VALUES(?,?,?,?,?,?,?)';
  conn.query(sql, statement, function(err, rentResult){
    if(err){
      console.log(err);
      res.send('도서대여등록이 되지 않았습니다. 다시 확인하세요!'+err);
    }else{
      sql = 'SELECT firstRentDay FROM books WHERE booksNumber=?';
      conn.query(sql,[req.body.booksNumber], function(err,rentResult){
        if(err){
          console.log(err);
          res.sed('error!')
        }else if(rentResult[0].firstRentDay == null){
          sql = 'UPDATE books SET firstRentDay=? WHERE booksNumber=?'
          conn.query(sql,[req.body.booksRentStartDate,req.body.booksNumber],function(err,rentResult){
            if(err){
              console.log(err);
              res.send('최초대여일 등록실패!');
            }else{
              res.redirect('/home');
            }
          });
        }else{
          res.redirect('/home');
        }
      });
    }
  });
});
//get 요청 반납처리 리스트
app.get('/bookRentList', function(req,res){
  var sql = 'SELECT booksrent.*, members.membersNumber, books.booksName'
  +' FROM booksrent LEFT JOIN members'
  +' ON booksrent.membersNumber = members.membersNumber'
  +' LEFT JOIN books'
  +' ON booksrent.booksNumber = books.booksNumber'
  +' WHERE booksrent.booksRentBack = "0"';
  conn.query(sql, function(err, rentList){
    if(err){
      console.log(err);
      res.send('반납목록 불러오기 실패'+err);
    }else{
      res.render('bookRentList',{rentList:rentList})
    }
  });
});
//post 요청 반납처리-- 대여정보 및 대여일수, 파손 정보 수정. 트랜잭션추가
app.post

app.listen('3000',function(){
    console.log('3000 접속성공!')
});
