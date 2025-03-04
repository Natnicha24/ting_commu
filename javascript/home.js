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
window.onload = pageLoad;

async function pageLoad() {
    await showData()
    var username = sessionStorage.getItem('username');
    document.getElementById('hello').innerHTML = `Hello,${username}`;

}

function local(fandom) {
    sessionStorage.setItem("fandom", fandom);
    window.location.href = "/page/feed.html";
}

async function showData() {
    let response = await fetch('/showfandom')
    let data = await response.json()

    try {
        let menu = document.querySelector('.menu')
        for (const e in data) {
            let a = document.createElement('a')
            a.classList.add('fandom-choice')
            a.setAttribute('href', '/page/feed.html')

            let li = document.createElement('li')
            li.appendChild(a)

            let span = document.createElement('span')
            let img = document.createElement('img')

            img.setAttribute('src', `../images/fandom/${data[e].image}`)
            span.innerHTML = data[e].name

            li.id = data[e].name

            a.appendChild(img)
            a.appendChild(span)
            menu.appendChild(li)
        }
        Object.keys(data).forEach(e => {
            document.getElementById(data[e].name).addEventListener('click', () => local(data[e].name))
        })
    } catch (err) {
        throw new Error('error at showData', err)
    }


    document.getElementById('logout').addEventListener('click',clearSession)
}

