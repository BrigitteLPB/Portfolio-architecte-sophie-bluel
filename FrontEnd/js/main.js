const SERVER_HOST = "http://localhost:5678/api"


// LOGIN
async function connect(event){
	data = new FormData(event.target)

	try {
		response = await fetch(`${SERVER_HOST}/users/login`, {
			method: 'POST',
			body : JSON.stringify({
				email : data.get("email"),
				password : data.get("password")
			}),
			headers: {'Content-Type': 'application/json'}
		}).then(response => response.json()).catch((err) => {
			throw err;
		});

		if(response.token != undefined){
			localStorage.setItem("login-token", response.token);
			location.href = "index.html"

		}else{
			connect_show_error("identifiant");
		}
	}catch(err){
		console.log(err);
		connect_show_error("server");
	}
}

function connect_show_error(type){
	switch(type){
		case "identifiant":
			document.getElementById("id-error-message").classList.add("show-error")
			document.getElementById("id-error-message").classList.add("transition")

			setTimeout(() => {
				connect_show_error("identifiant-reset");
			}, 2000);
			break;

		case "server":
			document.getElementById("server-error-message").classList.add("show-error")
			document.getElementById("server-error-message").classList.add("transition")

			setTimeout(() => {
				connect_show_error("server-reset");
			}, 2000);
			break;

		case "identifiant-reset":
			document.getElementById("id-error-message").classList.remove("show-error")
			document.getElementById("id-error-message").classList.remove("transition")
			break;

		case "server-reset":
			document.getElementById("server-error-message").classList.remove("show-error")
			document.getElementById("server-error-message").classList.remove("transition")
			break;
	}
}

function disconnect(){
	localStorage.removeItem("login-token");
	location.href = "login.html"
}


function is_connected(){
	return localStorage.getItem("login-token") != null;
}
