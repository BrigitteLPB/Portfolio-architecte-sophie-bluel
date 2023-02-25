/**
 * create a compenent an place it in the parent
 * @param {} parent	HTML element to append
 * @param {*} name	name of the component to create (must refer to a function name)
 * @param  {...any} args args to pass to the function
 * @returns HTML component created
 */
async function create_component(parent, name, ...args){
	[html_component, callback] = await this[name](parent, ...args);

	if(html_component != null && parent != null){
		parent.appendChild(html_component);
	}

	if(callback != null){
		callback(parent, ...args);
	}

	return html_component;
}


function header(parent){
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
}

function footer(parent){
	html_footer = document.createElement("footer");

	html_footer.innerHTML = `\
		<nav>\
			<ul>\
				<a class="invisible-link" href=""><li>Mentions Légales</li></a>\
			</ul>\
		</nav>`;

	return [html_footer];
}


async function portfolio(parent){
	html_portfolio = parent;

	html_portfolio.innerHTML = `<h2>Mes Projets</h2>`;

	await create_component(html_portfolio, 'filters')

	html_portfolio.innerHTML += `\
		<div class="gallery"></div>\
		<p class="error-message" id="server-error-message">Une erreur est survenue. Veillez ressayer.</p>`;

	await create_component(html_portfolio, 'modal');

	html_gallery = html_portfolio.getElementsByTagName("div")[0];

	data = await get_works_list();

	if (data.length != undefined){
		for(work of data){
			await create_component(html_gallery, 'figure', work);
		}
	}

	return [html_gallery, () => {
		// adding filter event
		filter_form = document.getElementById("filter-form");
		filter_form.addEventListener("submit", (event) => {swap_filters(event);}, true);

		// adding create-modal event
		modal = document.getElementById('modal');
		modal.addEventListener('submit', (event) => {create_work(event);}, true);
	}];
}

function figure(parent, work){
	f = document.createElement("figure");
	f.id = `figure-${work.id}`;

	f.innerHTML = `\
		<img src="${work.imageUrl}" alt="${work.title}">\
		<figcaption>${work.title}</figcaption>`;

	return [f];
}

async function modal(parent){
	dialog = document.createElement('dialog');
	dialog.id = 'modal-wrapper';

	modal_div = document.createElement('div');
	modal_div.id = 'modal';
	dialog.appendChild(modal_div)

	modal_div.innerHTML = `<div class='modal-header'><span id='modal-return-arrow' onclick='show_modal_view("edit");'><i class="fa-solid fa-arrow-left"></i></span><span onclick='show_modal_view("none");'>&times;</span></div>`;

	await create_component(modal_div, 'modal_content_edit');
	dialog_create = await create_component(modal_div, 'modal_content_create');
	dialog_create.classList.add('hidden');

	return [dialog];
}

async function modal_content_edit(parent){
	edit_dialog = document.createElement('div');
	edit_dialog.id = 'modal-edit';

	edit_dialog.innerHTML = `
		<h1>Galerie photo</h1>
	`;

	works_container = document.createElement('div');
	works_container.id = 'works-container';

	works = await get_works_list();

	// work list
	await works.forEach(async w => {
		await create_component(works_container, 'edit_figure', w);
	});
	edit_dialog.appendChild(works_container)

	// seperation
	edit_dialog.appendChild(document.createElement('hr'));

	// Create a new work
	button_add = document.createElement('button');
	button_add.addEventListener('click', e => {
		show_modal_view('create');
	});
	button_add.innerHTML = 'Ajouter une photo';
	button_add.classList.add('submit-input-like');
	edit_dialog.appendChild(button_add);

	// delete all works
	button_delete_all = document.createElement('button');
	button_delete_all.addEventListener('click', e => {

	});
	button_delete_all.innerHTML = 'Supprimer la galerie';
	button_delete_all.classList.add('delete-all-button');
	edit_dialog.appendChild(button_delete_all);

	return [edit_dialog];
}

function edit_figure(parent, w){
	div_container = document.createElement('div');
	div_container.classList.add('image-container');
	div_container.id = `image-container-${w.id}`;

	// trash button
	icon = document.createElement('button');
	icon.innerHTML = '<i class="fa-solid fa-trash"></i>'
	icon.addEventListener('click', async e => {
		id = e.target.parentElement.id.replace('image-container-', '');

		await delete_work({
			id: id
		});
		document.getElementById(`figure-${id}`).classList.add('hidden');
		e.target.parentElement.classList.add('hidden');
	}, true);
	icon.classList.add('delete-button');

	// image
	img = document.createElement('img');
	img.src = w.imageUrl;

	// edit button
	button = document.createElement('span');
	button.innerHTML = 'Éditer';
	button.addEventListener('click', async e => {
		console.log(e);
	}, true);

	div_container.appendChild(icon);
	div_container.appendChild(img);
	div_container.appendChild(button);

	return [div_container];
}

async function modal_content_create(parent){
	create_dialog = document.createElement('div');
	create_dialog.id = 'modal-create';

	create_dialog.innerHTML = `
		<form id='modal-create-form' action='javascript:;' method='post' enctype="multipart/form-data">
			<input type='file' id='create-image' name='image'>
			<input type='text' id='create-title' name='title'>
			<select id='create-category-id' name='category'></select>
			<input type='submit' id='create-submit'>
		</from>`;

	select = create_dialog.getElementsByTagName('select')[0];

	(await get_category_list(false)).forEach(c => {
		option = document.createElement('option');
		option.value = c.id;
		option.innerHTML = c.name;

		select.appendChild(option);
	});

	return [create_dialog];
}

async function filters(parent){
	filter_form = document.createElement("form");

	filter_form.id = "filter-form";
	filter_form.classList.add("form");
	filter_form.action = 'javascript:;';

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

	return [filter_form];
}
