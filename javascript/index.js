window.onload = pageLoad;

async function pageLoad() {


	document.getElementById('alert').hidden = true;
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.get("error") == 1) {
		if (window.location.href.split('/').pop() == "page/index.html") {
			document.getElementById('alert').innerHTML = "username or password not correct."
			document.getElementById('alert').hidden = false;
		}
		else {
			document.getElementById('alert').innerHTML = "username or password not correct.";
			document.getElementById('alert').hidden = false
		}
	}
}