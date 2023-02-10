function create_component(name){
	html_component = this[name]();

	document.body.appendChild(html_component)
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
