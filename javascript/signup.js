window.onload = pageLoad;

function pageLoad(){
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.get("error")==1){
		if (window.location.href.split('/').pop()== "page/signup.html"){
			document.getElementById('alert').innerHTML = "password and comfirm password do not match."
			document.getElementById('alert').hidden=false
		}
		else{
			document.getElementById('alert').innerHTML = "password and comfirm password do not match.";
			document.getElementById('alert').hidden=false
		}
	}	
}