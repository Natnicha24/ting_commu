window.onload = pageload

function checkSession() {
    var username = sessionStorage.getItem('username');
    var token = sessionStorage.getItem('userToken'); // ใช้ชื่อ 'userToken' ตามที่ส่งมาจาก server

    console.log("Username:", username);
    console.log("Token:", token);

    if (!username || !token) {
        window.location.href = "/index.html";
    }
}

function setSession(username, token) {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('token', token);
}

function clearSession() {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
}

function getSession(key) {
    return sessionStorage.getItem(key);
}


checkSession()

async function pageload() {

    let postId = sessionStorage.getItem('postId')
    await showOnePost(postId)

    document.getElementById('send').addEventListener('click', async () => {
        console.log('comment send')
        let content = document.getElementById('write-comment-input').value
        console.log(content)
        let response = await fetch('/saveComment', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: sessionStorage.getItem('username'), // ส่ง username
                postId: postId,
                content: content
            })
        });

        window.location.reload(); // รีเฟรชหน้าเพื่อแสดงรูปใหม่

    })

    /////////////////////////////////////////////////////////////////
    let like1 = document.querySelectorAll('.like');
 

    like1.forEach(async (like) => {
        like.addEventListener('click', async () => {

            let img = like.querySelector('img'); // ค้นหารูปใน div ที่กด
            let post = like.closest('.post-style'); // หา parent ที่มี class post-style
            let postId = post ? post.id : null; // ดึงค่า id จาก post-style ถ้ามี

            if (img.src.includes('like.svg')) {

                img.src = '../images/loveed.png';

                let response = await fetch('/likeupdate', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: sessionStorage.getItem('username'), // ส่ง username
                        postId: postId
                    })
                });
                window.location.reload(); // รีเฟรชหน้าเพื่อแสดงรูปใหม่


            }

            else {
                img.src = '../images/like.svg'; // กลับเป็นรูปเดิม

                let response = await fetch('/likedelete', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: sessionStorage.getItem('username'), // ส่ง username
                        postId: postId
                    })
                });

                window.location.reload(); // รีเฟรชหน้าเพื่อแสดงรูปใหม่

            }
        });
    });




}

async function getComment(poststyle) {
    console.log('getcomment')
    let response = await fetch('/getComment', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            postId: sessionStorage.getItem('postId'),
        })
    });
    let data = await response.json()
    console.log(data)
    await createComment(data, poststyle)
}



async function showOnePost(postId) {
    //จะไปดึงโพสต์ที่ถูกคลิกคอมเม้นมาโชว์ ต้องมี postid
    let response = await fetch('/getOnePost', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: sessionStorage.getItem('username'), // ส่ง username
            postId: postId
        })
    });
    let data = await response.json()
    let poststyle = await createDisplay(data)
    await getComment(poststyle);

}

async function createDisplay(data) {

    console.log(data)
    let postStyle

    for (const e in data) {
        let response2 = await fetch('/getlike', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: sessionStorage.getItem('username')
            })
        })

        let data2 = await response2.json()

        let readSection = document.getElementById('read-section')

        postStyle = document.createElement('div')
        postStyle.classList.add('post-style')
        postStyle.id = `${data[e].id}`

        let profile = document.createElement('div')
        profile.id = 'profile'
        postStyle.appendChild(profile)

        let divimg = document.createElement('div')
        let img = document.createElement('img')
        divimg.appendChild(img)
        profile.appendChild(divimg)

        let divprofile = document.createElement('div')
        divprofile.id = 'profile-detail'
        profile.appendChild(divprofile)

        let divusername = document.createElement('div')
        divusername.classList.add('username')
        divprofile.appendChild(divusername)

        let divdate = document.createElement('div')
        divdate.classList.add('date')
        divprofile.appendChild(divdate)

        let spanusername = document.createElement('span')
        spanusername.id = 'username'
        divusername.appendChild(spanusername)

        let spandate = document.createElement('span')
        spandate.id = 'date'
        divdate.appendChild(spandate)

        readSection.appendChild(postStyle)

        spanusername.innerHTML = data[e].username
        spandate.innerHTML = data[e].date
        img.setAttribute('src', `../images/${data[e].image}`)

        let divcontent = document.createElement('div')
        divcontent.id = 'content'
        postStyle.appendChild(divcontent)

        let p = document.createElement('p')
        divcontent.appendChild(p)
        p.innerHTML = data[e].content.replace(/\n/g, "<br>");

        let react = document.createElement('div')
        react.id = 'react'
        postStyle.appendChild(react)

        let like = document.createElement('div')
        like.classList.add('react-style')
        like.classList.add('like')
        react.appendChild(like)

        let image = document.createElement('img')
        image.setAttribute('alt', 'like')

        if (Object.keys(data2).length !== 0) { // data2 = like
            for (const n in data2) {
                console.log(`${data[e].id}=${data2[n].postId}`)
                if (data[e].id == data2[n].postId) {
                    console.log('yes');
                    image.setAttribute('src', `../images/loveed.png`);
                    break
                }else{
                    console.log('no');
                    image.setAttribute('src', `../images/like.svg`);
                }
            }
        } else {
            image.setAttribute('src', `../images/like.svg`);
        }

        like.appendChild(image)

        let spanlike = document.createElement('span')
        like.appendChild(spanlike)
        spanlike.innerHTML = data[e].likenum



        let comment = document.createElement('div')
        comment.classList.add('react-style')
        comment.classList.add('comment')
        react.appendChild(comment)

        let imagecomment = document.createElement('img')
        imagecomment.setAttribute('alt', 'comment')
        imagecomment.setAttribute('src', `../images/comment.svg`)
        comment.appendChild(imagecomment)

        let spancomment = document.createElement('span')
        comment.appendChild(spancomment)
        spancomment.innerHTML = data[e].comment

        const writeComment = document.createElement('div');
        writeComment.id = 'write-comment';
        postStyle.appendChild(writeComment)

        const form = document.createElement('form');
        form.id = 'write-form';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'comment';
        input.id = 'write-comment-input'

        const button = document.createElement('button');
        button.id = 'send'
        button.type = 'submit';
        button.textContent = 'ส่ง';

        form.appendChild(input);
        form.appendChild(button);
        writeComment.appendChild(form);


    }

    return postStyle
}

async function createComment(data, poststyle) {
    //////////////////////////////////////////////////////////////////////////////

    //ดึงค่า comment


    if (Object.keys(data).length > 0) {
        for (const e in data) {
            console.log(data[e].content)

            const showComment = document.createElement('div');
            showComment.id = 'show-comment';
            poststyle.appendChild(showComment)

            const profileComment = document.createElement('div');
            profileComment.id = 'profile-comment';


            const imgDiv = document.createElement('div');
            const img1 = document.createElement('img');
            img1.src = `../images/${data[e].image}`;
            img1.alt = 'profile-image';
            imgDiv.appendChild(img1);

            const profileDetail = document.createElement('div');
            profileDetail.id = 'profile-detail-comment';

            const usernameDiv = document.createElement('div');
            usernameDiv.classList.add('username-comment');
            const usernameSpan = document.createElement('span');
            usernameSpan.id = 'username-comment';
            usernameSpan.textContent = data[e].username;
            usernameDiv.appendChild(usernameSpan);

            const dateDiv = document.createElement('div');
            dateDiv.classList.add('date-comment');
            const dateSpan = document.createElement('span');
            dateSpan.id = 'date-comment';
            dateSpan.textContent = data[e].date;
            dateDiv.appendChild(dateSpan);

            profileDetail.appendChild(usernameDiv);
            profileDetail.appendChild(dateDiv);

            profileComment.appendChild(imgDiv);
            profileComment.appendChild(profileDetail);

            const contentComment = document.createElement('div');
            contentComment.id = 'content-comment';
            const contentP = document.createElement('p');
            contentP.textContent = data[e].content;
            contentComment.appendChild(contentP);

            showComment.appendChild(profileComment);
            showComment.appendChild(contentComment);
        }
    }
}