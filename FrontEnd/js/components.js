
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
				var [html, callback] = await c.run(e.parentElement);
				e.replaceWith(html);

				if(callback != undefined){
					await callback();
				}
			};
		}
	}
}

class BaseComponent{
	_componentName = undefined;
	_run = async (parent) => {};

	constructor(manager, name, run){
		this._componentName = name;
		this._run = run;

		manager.addComponent(this);
	}

	async run(parent){
		return await this._run(parent);
	}

	name(){
		return this._componentName;
	}
}

function figure(work){
	f = document.createElement("figure");
	f.id = `figure-${work.id}`;

	f.innerHTML = `\
		<img src="${work.imageUrl}" alt="${work.title}">\
		<figcaption>${work.title}</figcaption>`;

	return f;
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

new BaseComponent(htmlManager, "admin-header", async (parent) => {
	html_admin_header = document.createElement('div');

	if(is_connected()){
		html_admin_header.id = "admin-header";
		html_admin_header.innerHTML = `\
			<p><i class="fa-solid fa-pen-to-square"></i> Mode édition</p>\
			<button class="white-button">publier les changements</button>\
		`;
	}
	return [html_admin_header];
});

new BaseComponent(htmlManager, "header", async (parent) => {
	function get_login_html(){
		if(is_connected()){
			return `<button class="invisible-button" onClick="disconnect()"><li>logout</li></button>`
		}else{
			return `<a class="invisible-link" href="login.html"><li>login</li></a>`
		}
	}

	html_header = document.createElement("header");

	html_header.innerHTML = `\
		<a class="invisible-link" href="index.html"><h1>Sophie Bluel <span>Architecte d'intérieur</span></h1></a> \
			<nav>\
				<ul>\
				<a class="invisible-link" href="index.html#portfolio"><li>projets</li></a>\
				<a class="invisible-link" href="index.html#contact"><li>contact</li></a>\
				${get_login_html()}\
				<a class=\"invisible-link" href="https://www.instagram.com/"><li><img src="./assets/icons/instagram.png" alt="Instagram"></li></a>\
			</ul>\
		</nav>`;

	return [html_header];
});

new BaseComponent(htmlManager, "footer", async (parent) => {
	html_footer = document.createElement("footer");

	html_footer.innerHTML = `\
		<nav>\
			<ul>\
				<a class="invisible-link" href=""><li>Mentions Légales</li></a>\
			</ul>\
		</nav>`;

	return [html_footer];
});

new BaseComponent(htmlManager, "edit-intro", async (parent) => {
	edit_intro = document.createElement('div');
	edit_intro.id = "edit-button-container";

	if(is_connected()){
		edit_intro.innerHTML = `\
			<button class="edit-button"><i class="fa-solid fa-pen-to-square"></i> modifier</button>\
		`;
	}
	return [edit_intro];
});

new BaseComponent(htmlManager, "portfolio", async (parent) => {

	html_portfolio = parent;
	html_portfolio.innerHTML = `<h2>Mes Projets</h2>`;

	if(is_connected()){
		html_portfolio.innerHTML += `\
			<button class="edit-button" onclick="show_modal_view('edit');"><i class="fa-solid fa-pen-to-square"></i> modifier</button>\
		`;
	}

	html_portfolio.appendChild(document.createElement('filters'));

	html_portfolio.innerHTML += `\
		<div class="gallery"></div>\
		<p class="error-message" id="server-error-message">Une erreur est survenue. Veillez ressayer.</p>`;

	html_gallery = html_portfolio.getElementsByTagName("div")[0];

	data = await get_works_list();

	if (data.length != undefined){
		for(work of data){
			f = await figure(work);
			html_gallery.appendChild(f);
		}
	}

	return [html_gallery];
});

new BaseComponent(htmlManager, "filters", async (parent) => {
	filter_form = document.createElement("form");

	filter_form.id = "filter-form";
	filter_form.classList.add("form");
	filter_form.method = "dialog";

	categories = await get_category_list();

	for(c of categories){
		filter_field = document.createElement("input");
		filter_field.id = `filter-${c.id}`;
		filter_field.type = "submit";
		filter_field.value = c.name;

		if(c.default == true){
			filter_field.classList.add("active");
		}else{
			filter_field.classList.add("inactive");
		}

		filter_form.appendChild(filter_field);
	}

	return [filter_form, () => {
		// adding filter event
		filter_form = document.getElementById("filter-form");
		filter_form.addEventListener("submit", (event)=>{swap_filters(event)}, true);
	}];
});

new BaseComponent(htmlManager, "modal", async (parent) => {
	modal_wrapper = document.createElement('dialog');
	modal_wrapper.id = 'modal-wrapper'

	// container
	modal_view_container = document.createElement('div');
	modal_view_container.id = 'modal';

	// header
	modal_header = document.createElement('div');
	modal_header.classList.add('modal-header');
	modal_header.innerHTML = `<span id='modal-return-arrow' onclick="show_modal_view('edit');"><i class="fa-solid fa-arrow-left" ></i></span><span onclick="show_modal_view('none');">&times</span>`;

	modal_view_container.appendChild(modal_header);

	modal_view_container.appendChild(document.createElement('edit_modal_view'));
	modal_view_container.appendChild(document.createElement('create_modal_view'));

	modal_wrapper.appendChild(modal_view_container);

	return [modal_wrapper];
});

new BaseComponent(htmlManager, "edit_modal_view", async (parent) => {
	modal_edit_wrapper = document.createElement('div');
	modal_edit_wrapper.id = 'modal-edit';

	// header
	edit_header = document.createElement("h1");
	edit_header.innerHTML = "Galerie photo";
	modal_edit_wrapper.appendChild(edit_header);

	// work container
	work_container = document.createElement('div');
	work_container.id = 'works-container';

	works = await get_works_list();

	works.forEach(w => {
		work_container.appendChild(imageContainer(w));
	});
	modal_edit_wrapper.appendChild(work_container);

	// separation
	modal_edit_wrapper.appendChild(document.createElement('hr'));

	// add button
	add_button = document.createElement("button");
	add_button.innerHTML = "Ajouter une photo";
	add_button.classList.add('submit-input-like');
	add_button.addEventListener('click', e => {
		show_modal_view('create');
	});
	modal_edit_wrapper.appendChild(add_button);

	// delete all button
	delete_button = document.createElement("button");
	delete_button.innerHTML = "Supprimer la galerie";
	delete_button.classList.add('delete-all-button');
	delete_button.addEventListener('click', async e => {
		for(w of await get_works_list()){
			await delete_work(w);
		};
	});
	modal_edit_wrapper.appendChild(delete_button);

	return [modal_edit_wrapper];
});

new BaseComponent(htmlManager, "create_modal_view", async (parent, ...args) => {
	modal_create_wrapper = document.createElement('div');
	modal_create_wrapper.id = 'modal-create';

	// form
	modal_create_wrapper.innerHTML = `\
		<h1>Ajouter une photo</h1>\
		<form method="dialog">\
			<div id="create-image">\
				<label id="create-image-label" for="create-image-field">\
					<i class="fa-regular fa-image"></i>
					<span class="button-label">+ Ajouter une photo</span>\
					<span>jpg, png : 4mo max</span>\
				</label>\
				<input id="create-image-field" type="file" name="image" accept="image/png, image/jpeg" required/>\
				<img id="create-image-preview" src=""/>\
			</div>\
			<div>\
				<label for="create-title">Titre</label>\
				<input id="create-title" type="text" name="title" required/>\
			</div>\
			<div>\
				<label for="create-category">Catégorie</label>\
				<select id="create-category" name="category" default="" required></select>\
			</div>\
			<hr>\
			<input id="create-submit" class="desactivate" type="submit" value="Valider"/>\
		</form>`;

	image = modal_create_wrapper.getElementsByTagName('input')[0];
	image.addEventListener('change', e => {
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

	select = modal_create_wrapper.getElementsByTagName('select')[0];
	for(var c of await get_category_list(false)){
		select.innerHTML += `<option value=${c.id}>${c.name}</option>`;
	}

	form = modal_create_wrapper.getElementsByTagName('form')[0];
	form.addEventListener("submit", async e => {
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

	return [modal_create_wrapper];
});
