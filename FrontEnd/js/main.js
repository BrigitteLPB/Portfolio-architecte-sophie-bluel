const SERVER_HOST = "http://localhost:5678/api"


// LOGIN
async function connect(event){
	data = new FormData(event.target);

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
	response = await fetch(`${SERVER_HOST}/works`, {
		method: 'GET',
		headers: {'Content-Type': 'application/json'}
	}).then(response => response.json()).catch((err) => {
		connect_show_error("server", null);
	});

	if(response.length != undefined){
		if(category_id == undefined || category_id == 'all'){
			return response
		}else{
			return response.filter(w => w.categoryId == category_id);
		}
	}else{
		connect_show_error("server", null);
		return [];
	}
}

async function get_category_list(add_all_category=true){
	if(add_all_category){
		data = [{
			id: "all",
			name: "Tous",
			default: true
		}];
	}else{
		data = [];
	}

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
	await update_works(works);
}

function get_current_category(){
	filter = document.querySelector("#filter-form input[type='submit'].active");
	if(filter != undefined){
		return filter.id.replace('filter-', '');
	}else{
		return undefined;
	}
}

function update_works(works){
	update_figure(works);
	update_image_container(works);
}

function update_figure(works){
	figures = Array.from(document.querySelectorAll(".gallery figure"));

	figures.forEach(f => {
		f.classList.add('hidden');
	});

	for(w of works){
		f = figures.find(f => f.id.replace('figure-', '') == w.id.toString());
		if(f == undefined){
			gallery = document.querySelector("#portfolio .gallery");
			if(gallery != undefined){
				f = figure(w);
				gallery.appendChild(f);
			}else{
				throw Error("cound not find #portfolio .gallery");
			}
		}
		f.classList.remove("hidden");
	};

}

function update_image_container(works){
	modal_figures = Array.from(document.querySelectorAll("#modal .image-container"));

	modal_figures.forEach(m => {
		m.classList.add('hidden');
	})

	for(w of works) {
		m = modal_figures.find(m => m.id.replace('image-container-', '') == w.id.toString());
		if(m == undefined){
			modal = document.querySelector("#modal #works-container");
			if(modal != undefined){
				m = imageContainer(w);
				modal.appendChild(m);
			}else{
				throw Error("cound not find #modal #works-container");
			}
		}
		m.classList.remove("hidden");
	};
}

async function create_work(event){
	data = new FormData(event.target);

	// data validation
	create_category_id = Number(data.get('create-category-id'));

	if(create_category_id == NaN){
		throw Error('could not validate data');
	}

	response = await fetch(`${SERVER_HOST}/works`, {
		method: 'POST',
		headers: {
			'Authorization' : `Bearer ${localStorage.getItem('login-token')}`
		},
		body : data
	});

	console.log(event);

	if(response.status == 401){
		disconnect();
		return;
	}

	if(response.status != 201){
		show_modal_view('create');
		throw Error(`HTTP error	${response.status}: ${response.statusText}`);
	}

	response_data = await response.json();

	await update_works(await get_works_list(get_current_category()));
	show_modal_view('edit');
}

async function create_work(event){
	data = new FormData(event.target);

	// data validation
	create_category_id = Number(data.get('create-category-id'));


	if(create_category_id == NaN){
		throw Error('could not validate data');
	}


	response = await fetch(`${SERVER_HOST}/works`, {
		method: 'POST',
		headers: {
			'Authorization' : `Bearer ${localStorage.getItem('login-token')}`
		},
		body : data
	});

	if(response.status == 401){
		disconnect();
		return;
	}

	if(response.status != 201){
		throw Error(`HTTP error	${response.status}: ${response.statusText}`);
	}

	response_data = await response.json();

	await update_works(await get_works_list(get_current_category()));
	await create_component(document.getElementById('works-container'), 'edit_figure', response_data);
	show_modal_view('edit');
}

async function delete_work(work){
	if(work == undefined){
		throw Error("work is undefined");
	}

	response = await fetch(`${SERVER_HOST}/works/${work.id}`, {
		method: 'DELETE',
		headers: {
			'Authorization' : `Bearer ${localStorage.getItem('login-token')}`
		}
	});

	if(response.status == 401){
		disconnect();
		return;
	}

	if(response.status != 204){
		throw Error(`HTTP error	${response.status}: ${response.statusText}`);
	}

	await update_works(await get_works_list(get_current_category()));
}

/**
 *
 * @param {*} view_name edit or create
 */
function show_modal_view(view_name){
	switch (view_name) {
		case 'edit':
			document.getElementById('modal-wrapper').show();
			document.getElementById('modal-edit').classList.remove('hidden');
			document.getElementById('modal-create').classList.add('hidden');
			document.getElementById('modal-return-arrow').classList.add('hidden');
			break;

		case 'create':
			document.getElementById('modal-wrapper').show();
			document.getElementById('modal-edit').classList.add('hidden');
			document.getElementById('modal-create').classList.remove('hidden');
			document.getElementById('modal-return-arrow').classList.remove('hidden');
			break;

		case 'none':
			document.getElementById('modal-wrapper').close();
			break;

		default:
			break;
	}
}
