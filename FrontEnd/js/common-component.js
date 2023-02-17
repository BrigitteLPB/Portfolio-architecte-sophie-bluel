async function create_component(name, ...args){
	html_component = await this[name](...args);

	if(html_component != null){
		document.body.appendChild(html_component);
	}
}


function header(){
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

	return html_header;
}

function footer(){
	html_footer = document.createElement("footer");

	html_footer.innerHTML = `\
		<nav>\
			<ul>\
				<a class="invisible-link" href=""><li>Mentions Légales</li></a>\
			</ul>\
		</nav>`;

	return html_footer
}


async function portfolio(category_id){
	html_portfolio = document.getElementById("portfolio");

	html_portfolio.innerHTML = `\
		<h2>Mes Projets</h2>\
		<p class="error-message" id="server-error-message">Une erreur est survenue. Veillez ressayer.</p>`;

	html_portfolio.appendChild(await filters());

	html_portfolio.innerHTML += `<div class="gallery"></div>`;

	html_gallery = html_portfolio.getElementsByTagName("div")[0];

	data = await get_works_list(category_id);

	if (data.length != undefined){
		for(work of data){
			figure = document.createElement("figure");
			figure.id = `figure-${work.id}`;

			figure.innerHTML = `\
				<img src="${work.imageUrl}" alt="${work.title}">\
				<figcaption>${work.title}</figcaption>`;

			html_gallery.appendChild(figure);
		}
	}

	html_portfolio.appendChild(html_gallery);

	// adding filter event
	filter_form = document.getElementById("filter-form");
	filter_form.addEventListener("submit", (event)=>{swap_filters(event)}, true);

	return null;
}


async function filters(){
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

	return filter_form;
}
