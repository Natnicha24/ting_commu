const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
require('dotenv').config();
const cors = require('cors');
const host = process.env.MYSQLHOST;

const port = process.env.MYSQLPORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const con = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

con.connect(err => {
    if (err) throw err;
    console.log("MySQL connected");
});

const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        // query method
        con.query(sql, (err, result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}

app.post('/regisDB', async (req, res) => {
    console.log("---------------------------------------------");
    console.log("regis");
    if (req.body.password == req.body.passwordcf) {
        let sql = `
        CREATE TABLE IF NOT EXISTS user(
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100),
            password VARCHAR(100),
            image VARCHAR(200),
            token VARCHAR(255)
        )`;
        let result = await queryDB(sql);
        sql = `INSERT INTO user(username,password,image) VALUES ("${req.body.username}","${req.body.password}","avatar.png")`;
        result = await queryDB(sql);
        res.cookie('image', 'avatar.png');
        console.log("New user registed!");
        return res.redirect(`http://${host}:${port}/index.html`);
    }
    else {
        return res.redirect('/signup.html?error=1')
    }

})

app.post('/checkLogin', async (req, res) => {
    let tablename = "user";
    console.log("-----------------------------------");
    console.log("Check Login");

    let sql = `SELECT username FROM ${tablename}`;
    let result = await queryDB(sql);
    result = Object.assign("", result);
    var keys = Object.keys(result);
    var check = 0;
    console.log(keys.length);

    for (i = 0; i < keys.length; i++) {
        if (req.body.username == result[i].username) {
            console.log("i=", i);
            console.log("check username correct");
            res.cookie('username', req.body.username);
            console.log("username=", result[i].username);
            sql = `SELECT password FROM ${tablename} WHERE username='${req.body.username}'`;
            result = await queryDB(sql);
            result = Object.assign("", result);
            if (req.body.password == result[0].password) {
                console.log("check password correct");
                res.cookie('password', req.body.password);
                sql = `SELECT image FROM ${tablename} WHERE username='${req.body.username}'`;
                result = await queryDB(sql);
                result = Object.assign("", result);
                console.log(result[0].image);
                res.cookie('image', result[0].image);

                // สร้าง Token แบบสุ่ม
                const userToken = Math.random().toString(36).substring(2);
                res.cookie('token', userToken);

                sql = `UPDATE ${tablename} SET token='${userToken}' WHERE username='${req.body.username}'`;
                await queryDB(sql);


                // ส่ง Token กลับไปให้ client เก็บไว้ใน sessionStorage
                res.send(`<script>
                    sessionStorage.setItem('userToken', '${userToken}');
                    sessionStorage.setItem('username', '${req.body.username}');
                    window.location.href='http://${host}:${port}/page/home.html';
                    </script>`);


                i = keys.length;
                check = 1;
            }
            else {
                return res.redirect('/index.html?error=1');
            }
        }
    }
    if (check == 0) {
        return res.redirect('/index.html?error=1');
    }
});




const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

app.post('/profilepic', async (req, res) => {
    var user = req.cookies.username;
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single('avatar');
    upload(req, res, (err) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }
        console.log('You uploaded this image filename: ' + req.file.filename);
        let file = req.file.filename;
        updateImg(user, file).then(() => {
            console.log("HI");
            res.cookie('img', file)
            return res.redirect('/page/home.html')
        })

    })
});

const updateImg = async (username, fileimg) => {
    let tablename = "user";
    console.log("--------------------------");
    console.log("updateimg");
    console.log(username);
    console.log(fileimg);
    let sql = `UPDATE ${tablename} SET image='${fileimg}' WHERE username='${username}'`
    let result = await queryDB(sql);
}

app.post('/addpost', async (req, res) => {
    var username = req.body.username;
    console.log(username)
    let tablename = 'user';
    let sql = `SELECT id from ${tablename} WHERE username='${username}'`;
    let id = await queryDB(sql)

    tablename = 'fandom';
    sql = `SELECT id from ${tablename} WHERE name='${req.body.fandom}'`;
    let fandom_id = await queryDB(sql)
    console.log("---------------------------------------------");
    console.log("addpost");

    sql = "CREATE TABLE IF NOT EXISTS post(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,content VARCHAR(200),comment INT,likenum INT,date DATETIME DEFAULT CURRENT_TIMESTAMP,fandom_id INT)";
    let result = await queryDB(sql);

    sql = `INSERT INTO post(user_id,content,comment,likenum,fandom_id) VALUES (${id[0].id},'${req.body.content}',0,0,${fandom_id[0].id})`;
    result = await queryDB(sql);
    console.log('post success')
    return res.redirect('/page/feed.html')

})

app.get('/showfandom', async (req, res) => {
    var tablename = "fandom";
    console.log("-----------------------------------");
    console.log("show fandom at home");
    let sql = `SELECT name,image FROM ${tablename}`;
    let result = await queryDB(sql);
    result = Object.assign({}, result);
    res.send(JSON.stringify(result));
})

app.post('/getlike', async (req, res) => {

    let sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    let result = await queryDB(sql);
    let userId = result[0].id

    sql = `SELECT postId FROM liked WHERE userId=${userId}`;
    result = await queryDB(sql);

    result = Object.assign({}, result);
    console.log("get like",result);
    
    res.send(JSON.stringify(result));
})


app.post('/profile', async (req, res) => {
    let username = req.body.username;
    let token = req.body.token;
    let tablename = "user";
    console.log("Get Profile to show in input");

    let sql = `SELECT username, image FROM ${tablename} WHERE username='${username}' AND token='${token}'`;
    let result = await queryDB(sql);
    res.json(result);

});




app.post('/showpost', async (req, res) => {
    console.log(req.body.fandom)
    var tablename = 'fandom';
    let sql = `SELECT id from ${tablename} WHERE name='${req.body.fandom}'`;
    let fandom_id = await queryDB(sql)
    console.log("-----------------------------------");
    console.log("show post");

    tablename = 'post'
    sql = `SELECT * FROM ${tablename} WHERE fandom_id='${fandom_id[0].id}'`;
    let result = await queryDB(sql);
    result = Object.assign({}, result);

    tablename = 'user'

    for (const e in result) {
        tablename = 'user'
        sql = `SELECT username,image FROM ${tablename} WHERE id=${result[e].user_id}`;
        let resultuser = await queryDB(sql);
        resultuser = Object.assign({}, resultuser);
        result[e].username = resultuser[0].username
        result[e].image = resultuser[0].image

        let date = new Date(result[e].date);
        result[e].date = date.toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }


    result = Object.assign({}, result);

    res.send(JSON.stringify(result));
})


app.post('/likeupdate', async (req, res) => {

    let sql = `
CREATE TABLE IF NOT EXISTS liked(
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    postId INT
)`;
    let result = await queryDB(sql);

    sql = `SELECT likenum FROM post WHERE id=${req.body.postId}`;
    result = await queryDB(sql)
    console.log(result[0].likenum)
    
    sql = `UPDATE post SET likenum=${result[0].likenum+1} WHERE id=${req.body.postId}`;
    result = await queryDB(sql)
   

    sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    result = await queryDB(sql)
    let userId = result[0].id

    sql = `INSERT INTO liked(userId,postId) VALUES (${userId},${req.body.postId})`;
    result = await queryDB(sql)

    res.send(JSON.stringify(result));
})

app.post('/likedelete', async (req, res) => {

    let sql = `SELECT likenum FROM post WHERE id=${req.body.postId}`;
    let result = await queryDB(sql)
    console.log(result[0].likenum)
    
    sql = `UPDATE post SET likenum=${result[0].likenum-1} WHERE id=${req.body.postId}`;
    result = await queryDB(sql)


    sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    result = await queryDB(sql)
    let userId = result[0].id

    sql = `DELETE FROM liked WHERE userID=${userId} and postId=${req.body.postId}`;
    result = await queryDB(sql)

    res.send(JSON.stringify(result));
})

app.post('/getOnePost', async (req, res) => {

    let sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    let result = await queryDB(sql)
    let userId = result[0].id

    sql = `SELECT * FROM post WHERE id=${req.body.postId}`;
    result = await queryDB(sql)

    for (const e in result) {
        tablename = 'user'
        sql = `SELECT username,image FROM ${tablename} WHERE id=${result[e].user_id}`;
        let resultuser = await queryDB(sql);
        resultuser = Object.assign({}, resultuser);
        result[e].username = resultuser[0].username
        result[e].image = resultuser[0].image

        let date = new Date(result[e].date);
        result[e].date = date.toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    result = Object.assign({}, result);
    console.log(result);

    res.send(JSON.stringify(result));
})

app.post('/getOnePost', async (req, res) => {

    let sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    let result = await queryDB(sql)
    let userId = result[0].id

    sql = `SELECT * FROM post WHERE id=${req.body.postId}`;
    result = await queryDB(sql)

    for (const e in result) {
        tablename = 'user'
        sql = `SELECT username,image FROM ${tablename} WHERE id=${result[e].user_id}`;
        let resultuser = await queryDB(sql);
        resultuser = Object.assign({}, resultuser);
        result[e].username = resultuser[0].username
        result[e].image = resultuser[0].image

        let date = new Date(result[e].date);
        result[e].date = date.toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    result = Object.assign({}, result);
    console.log(result);

    res.send(JSON.stringify(result));
})
app.post('/getOnePost', async (req, res) => {

    let sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    let result = await queryDB(sql)
    let userId = result[0].id

    sql = `SELECT * FROM post WHERE id=${req.body.postId}`;
    result = await queryDB(sql)

    for (const e in result) {
        tablename = 'user'
        sql = `SELECT username,image FROM ${tablename} WHERE id=${result[e].user_id}`;
        let resultuser = await queryDB(sql);
        resultuser = Object.assign({}, resultuser);
        result[e].username = resultuser[0].username
        result[e].image = resultuser[0].image

        let date = new Date(result[e].date);
        result[e].date = date.toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    result = Object.assign({}, result);
    console.log(result);

    res.send(JSON.stringify(result));
})


app.post('/saveComment', async (req, res) => {
    console.log('save comment')

    let sql = `SELECT comment FROM post WHERE id=${req.body.postId}`;
    let result = await queryDB(sql)
    
    sql = `UPDATE post SET comment=${result[0].comment+1} WHERE id=${req.body.postId}`;
    result = await queryDB(sql)

    sql = `
        CREATE TABLE IF NOT EXISTS comment(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            content VARCHAR(20000),
            postId INT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
    result = await queryDB(sql);

    sql = `SELECT id FROM user WHERE username='${req.body.username}'`;
    result = await queryDB(sql)
    let userId = result[0].id //ได้ id คน comment

    sql = `INSERT INTO comment(user_id,content,postId) VALUES (${userId},"${req.body.content}",${req.body.postId})`;
    result = await queryDB(sql)

    res.send(JSON.stringify(result));
})




app.post('/getComment', async (req, res) => {
    //มีค่า post id แล้ว ดึงค่าออกมาโชว์ตาม post id
    let sql = `SELECT * FROM comment WHERE postId=${req.body.postId}`;
    result = await queryDB(sql)

    for (const e in result) {
        tablename = 'user'
        sql = `SELECT username,image FROM ${tablename} WHERE id=${result[e].user_id}`;
        let resultuser = await queryDB(sql);
        resultuser = Object.assign({}, resultuser);
        result[e].username = resultuser[0].username
        result[e].image = resultuser[0].image

        let date = new Date(result[e].date);
        result[e].date = date.toLocaleString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    result = Object.assign({}, result);
    console.log(result);

    res.send(JSON.stringify(result));
})

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

app.listen(port, host, () => {
    console.log(`Server running at   http://${host}:${port}/index.html`);
});