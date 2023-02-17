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
		}).then(response => response.json());

		if(response.token != undefined){
			localStorage.setItem("login-token", response.token);
			localStorage.setItem("userId", response.userId);
			location.href = "index.html"

		}else{
			connect_show_error("identifiant");
		}
	}catch(err){
		console.log(err);
		connect_show_error("server");
	}
}

function connect_show_error(type, timeout = 2000){
	switch(type){
		case "identifiant":
			console.log("login error");
			document.getElementById("id-error-message").classList.add("show-error")
			document.getElementById("id-error-message").classList.add("transition")


			if(timeout != null){
				setTimeout(() => {
					connect_show_error("identifiant-reset");
				}, timeout);
			}
			break;

		case "server":
			console.log("server error");
			document.getElementById("server-error-message").classList.add("show-error")
			document.getElementById("server-error-message").classList.add("transition")

			if(timeout != null){
				setTimeout(() => {
					connect_show_error("server-reset");
				}, timeout);
			}
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
	localStorage.removeItem("userId");
	location.href = "login.html";
}


function is_connected(){
	return localStorage.getItem("login-token") != null && localStorage.getItem("userId") != null;
}


async function get_works_list(category_id){
	data = [];

	response = await fetch(`${SERVER_HOST}/works`, {
		method: 'GET',
		headers: {'Content-Type': 'application/json'}
	}).then(response => response.json()).catch((err) => {
		connect_show_error("server", null);
	});

	if(response.length != undefined){
		if(category_id == undefined || category_id == 'all'){
			data = response;
		}else{
			for(work of response){
				if(work.categoryId == category_id){
					data.push(work);
				}
			}
		}
	}else{
		connect_show_error("server", null);
	}

	return data;
}

async function get_category_list(){
	data = [{
		id: "all",
		name: "Tous",
		default: true
	}];

	response = await fetch(`${SERVER_HOST}/categories`, {
		method: 'GET',
		headers: {'Content-Type': 'application/json'}
	}).then(response => response.json()).catch((err) => {
		// do nothing
	});

	if(response != undefined){
		data = data.concat(response);
	}

	return data;
}

async function swap_filters(event){
	new_filter = event.submitter;
	previous_filter = document.querySelector("#filter-form input[type='submit'].active");

	// updating filter buttons
	previous_filter.classList.remove("active");
	previous_filter.classList.add("inactive");

	new_filter.classList.remove("inactive");
	new_filter.classList.add("active");


	works = await get_works_list(new_filter.id.replace('filter-', ''));

	update_works(works);
}

function update_works(works){
	figures = document.querySelectorAll(".gallery figure");

	figures.forEach(f => {
		for(w of works){
			if(f.id.replace('figure-', '') == w.id){
				f.classList.remove('hidden');
				return;
			}
		}

		f.classList.add('hidden');
	});
}
