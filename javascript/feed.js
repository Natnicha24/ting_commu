window.onload = pageload;

function checkSession() {
    var username = sessionStorage.getItem('username');
    var token = sessionStorage.getItem('userToken'); // ใช้ชื่อ 'userToken' ตามที่ส่งมาจาก server

    console.log("Username:", username);
    console.log("Token:", token);

    if (!username || !token) {
        window.location.href = "/index.html";
    }
}

function setSession(name, value) {
    sessionStorage.setItem(name, value);
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
    const fandom = sessionStorage.getItem("fandom");
    console.log(fandom);
    let name = document.getElementById('room-name');
    name.innerHTML = fandom;

    let pic = document.getElementById("changeProfile");
    let input = document.getElementById("uploadInput");

    const response = await fetch('/profile', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: sessionStorage.getItem('username'),
            token: sessionStorage.getItem('userToken')
        })
    });
    let profileDate = await response.json()

    pic.setAttribute('src', `../images/${profileDate[0].image}`)

    pic.addEventListener("click", function () {
        input.click(); // เมื่อคลิกที่รูป จะเปิดเลือกไฟล์
    });

    let post = document.getElementById('post-btn');

    await showPost()

    post.addEventListener('click', async () => {
        try {
            let response = await fetch("/addpost", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: document.getElementById('content-write').value,
                    fandom: fandom,
                    username: sessionStorage.getItem('username'),
                })
            });
            window.location.reload(); // รีเฟรชหน้าเพื่อแสดงรูปใหม่
        } catch (error) {
            console.error("Error:", error);
        }


        document.getElementById('logout').addEventListener('click', clearSession)


    })

    input.addEventListener("change", async function () {
        let file = input.files[0];
        if (!file) return; // ถ้าไม่ได้เลือกไฟล์ ให้จบเลย

        let formData = new FormData();
        formData.append("avatar", file);

        try {
            let response = await fetch("/profilepic", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                window.location.reload(); // รีเฟรชหน้าเพื่อแสดงรูปใหม่
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

    let like1 = document.querySelectorAll('.like');

    like1.forEach(async (like) => {
        like.addEventListener('click', async () => {
            let img = like.querySelector('img'); // รูปไลก์ใน div
            let post = like.closest('.post-style'); // หา parent ที่มี class post-style
            let postId = post ? post.id : null; // ดึงค่า id จาก post-style ถ้ามี
            let spanlike = like.querySelector('span'); // หา span ของจำนวนไลก์
            let likeNum = parseInt(spanlike.innerHTML); // แปลงค่า span จาก string เป็น number

            console.log(postId);

            if (img.src.includes('like.svg')) {
                img.src = '../images/loveed.png'; // เปลี่ยนรูปเป็นกดไลก์
                spanlike.innerHTML = likeNum + 1; // เพิ่มจำนวนไลก์ทันที

                await fetch('/likeupdate', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: sessionStorage.getItem('username'),
                        postId: postId
                    })
                });

            } else {
                img.src = '../images/like.svg'; // เปลี่ยนรูปเป็นไม่ได้กดไลก์
                spanlike.innerHTML = likeNum - 1; // ลดจำนวนไลก์ทันที

                await fetch('/likedelete', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: sessionStorage.getItem('username'),
                        postId: postId
                    })
                });
            }
        });
    });



    let comment = document.querySelectorAll('.comment');

    comment.forEach(async (comment) => {
        comment.addEventListener('click', async () => {
            let post = comment.closest('.post-style'); // หา parent ที่มี class post-style
            let postId = post ? post.id : null; // ดึงค่า id จาก post-style ถ้ามี
            setSession('postId', postId)
            window.location.href = "comment.html";
        });


    });


}

async function showPost() {
    let response = await fetch('/showpost', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fandom: sessionStorage.getItem("fandom"),
            username: sessionStorage.getItem('username')
        })
    })

    let data = await response.json()

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

    let data2 = await response2.json() //like


    for (const e of Object.keys(data).reverse()) { //สร้างโพสต์ทีละโพสต์
        let readSection = document.getElementById('read-section')

        let postStyle = document.createElement('div')
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
        // like.id = 'like'
        react.appendChild(like)

        let image = document.createElement('img')
        image.setAttribute('alt', 'like')

        console.log(data2)
        console.log(data[e].id)


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
    }
}

