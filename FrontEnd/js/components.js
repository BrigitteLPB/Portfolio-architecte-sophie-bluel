// await fetch(location.pathname + "/../components/modal.html").then((response) => response.text()).then((html) => {document.body.innerHTML += html})
//# CLASS DEFINED #//
class HTMLComponentManager{
	_components = new Array();

	addComponent(component){
		if (component instanceof BaseComponent){
			this._components.push(component)
		}
	}

	async parseDOM(){
		for (var c of this._components){
			var html_elements = document.getElementsByTagName(c.name());
			for (var e of  html_elements){
				try{
					var [html, callback] = await c.run(e.parentElement);
					var new_html_elements = (new DOMParser()).parseFromString(html, "text/html").body.children;
					e.replaceWith(new_html_elements[0]);

					await callback(e.parentElement, html);
				}catch(err){
					console.log(err);
				}
			};
		}
	}
}

class BaseComponent{
	_componentName = undefined;
	// _run = async (parent) => {};
	_functions = [async (parent) => {}];
	_callback = async (parent, html) => {};

	constructor(manager, name, callback, functions){
		this._componentName = name;
		this._functions = functions;
		this._callback = callback;

		manager.addComponent(this);
	}

	async run(parent){
		console.log(`running : ${this.name()}`); 	// DEBUG
		var html = await fetch(location.pathname + `/../components/${this.name()}.html`).then((response) => response.text());

		for(var i = 0; i < this._functions.length; i++){
			var placeholder_html = await this._functions[i](parent);
			html = html.replace(`#\{${i+1}\}`, placeholder_html);
		};

		return [html, this._callback];
	}

	name(){
		return this._componentName;
	}
}

// --- *** --- //

/**
 * Generate HTML content for a figure
 * @param {*} work
 * @returns
 */
function figure(work){
	f = document.createElement("figure");
	f.id = `figure-${work.id}`;

	f.innerHTML = `\
		<img src="${work.imageUrl}" alt="${work.title}">\
		<figcaption>${work.title}</figcaption>`;

	return f;
}

function categories(category){
	filter_field = document.createElement("input");
	filter_field.id = `filter-${c.id}`;
	filter_field.type = "submit";
	filter_field.value = c.name;

	if(c.default == true){
		filter_field.classList.add("active");
	}else{
		filter_field.classList.add("inactive");
	}

	return filter_field;
}

function imageContainer(work){
	image_container = document.createElement('div');
	image_container.classList.add('image-container');
	image_container.id = `image-container-${work.id}`;
	image_container.innerHTML = `<img src='${work.imageUrl}'><button class='delete-button' onclick='delete_work({id:this.parentElement.id.replace("image-container-", "")});'><i class="fa-solid fa-trash"></i></button><span>Éditier</span>`;
	return image_container;
}

//# COMPONENT DEFINED #//
htmlManager = new HTMLComponentManager();

new BaseComponent(htmlManager, "admin-header",
	(parent, html) => {},
	[]
);

new BaseComponent(htmlManager, "header",
	(parent, html) =>{
		login_button = document.getElementById("login-button");
		login_button.addEventListener("click", async (e) => {
			await disconnect();
		});
	},
	[
		async (parent) => {
			if(is_connected()){
				return `<button id="login-button" class="invisible-button"><li>logout</li></button>`
			}else{
				return `<a class="invisible-link" href="login.html"><li>login</li></a>`
			}
		}
	]
);

new BaseComponent(htmlManager, "footer",
	(parent, html) => {},
	[]
);

new BaseComponent(htmlManager, "edit-intro",
	(parent, html) => {},
	[
		(parent) => {
			if(is_connected()){
				return `<button class="edit-button"><i class="fa-solid fa-pen-to-square"></i> modifier</button>`;
			}
			return "";
		}
	]
);

new BaseComponent(htmlManager, "portfolio",
	async (parent, html) => {
		let gallery = document.getElementById('work-gallery');
		let works = await get_works_list();
		for(w of works){
			gallery.appendChild(figure(w));
		}
	},
	[
		(parent) => {
			if(is_connected()){
				return `<button class="edit-button" onclick="show_modal_view('edit');"><i class="fa-solid fa-pen-to-square"></i> modifier</button>`;
			}
			return "";
		}
	]
);

new BaseComponent(htmlManager, "filters",
	async (parent, html) => {
		var form_element = document.getElementById("filter-form");
		category_list = await get_category_list();

		for(c of category_list){
			form_element.appendChild(categories(c));
		}

		form_element.addEventListener("submit", (event)=>{swap_filters(event)}, true);
	},
	[]
);

new BaseComponent(htmlManager, "modal",
	async (parent, html) => {
		// add background escape
		document.getElementById("modal-wrapper").addEventListener('click', (e) => {
			show_modal_view('none');
		});
		document.getElementById("modal").addEventListener('click', (e) => {
			e.stopPropagation();
		})

		document.getElementById("modal-return-arrow").addEventListener('click', async (e) => {
			await show_modal_view('edit');
		});

		document.getElementById("modal-close-dialog").addEventListener('click', async (e) => {
			await show_modal_view('none');
		});
	},
	[]
);

new BaseComponent(htmlManager, "edit-modal-view",
	async (parent, html) => {
		// add work list
		work_container = document.getElementById("works-container");
		works = await get_works_list();
		works.forEach(w => {
			work_container.appendChild(imageContainer(w));
		});

		// add button
		document.getElementById("edit-add-work").addEventListener("click", (e) => {
			show_modal_view('create');
		});
		document.getElementById("edit-delete-work").addEventListener("click", async (e) => {
			for(w of await get_works_list()){
				await delete_work(w);
			};
		});
	},
	[]
);

new BaseComponent(htmlManager, "create-modal-view",
	async (parent, html) => {
		// dynamic image preview
		document.getElementById("create-image-field").addEventListener('change', e => {
			const [file] = document.getElementById('create-image-field').files
			if (file) {
				document.getElementById('create-image-preview').src = URL.createObjectURL(file)
				for(e of document.getElementById('create-image').children){
					if(e.id != "create-image-preview"){
						e.classList.add('soft-hidden');
					}
				}
			}
		});

		// form
		let form = document.getElementById("add-work-form");
			// submit
		form.addEventListener('submit', async (e) => {
			try {
				await create_work(e);

				e.target.reset();
				document.getElementById('create-image-preview').src = "";
				for(e of document.getElementById('create-image').children){
					if(e.id != "create-image-preview"){
						e.classList.remove('soft-hidden');
					}
				}
			} catch (error) {
				console.log(error);
			}
		});
			// button validation
		form.addEventListener("change", async e => {
			var sumbit_button;
			for(var input of e.srcElement.form){
				if(input.value == ""){
					document.getElementById('create-submit').classList.add('desactivate');
					return
				}

				if(input.id == "create-submit"){
					sumbit_button = input;
				}
			}
			sumbit_button.classList.remove('desactivate');
		});

	},
	[
		async (parent) => {
			var return_str = ""
			for(var c of await get_category_list(false)){
				return_str += `<option value=${c.id}>${c.name}</option>`;
			}
			return return_str;
		}
	]
);
