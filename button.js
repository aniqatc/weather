function changeTheme() {
	document
		.querySelectorAll('.local-overview, .global-overview, .search-btn')
		.forEach((el) => el.classList.toggle('dark-container'));
	document
		.querySelectorAll('.daily, button')
		.forEach((el) => el.classList.toggle('dark-hover'));
	document
		.querySelectorAll('.input-group')
		.forEach((el) => el.classList.toggle('dark-btn'));
	document
		.querySelectorAll('.global-item')
		.forEach((el) => el.classList.toggle('light-hover'));
	document
		.querySelectorAll('.card, .list-group-item, body')
		.forEach((el) => el.classList.toggle('dark'));
	document
		.querySelectorAll('.list-group-item, footer, .sun-time')
		.forEach((el) => el.classList.toggle('dark-icon'));
}

let themeToggle = document.querySelector('#flexSwitchCheckChecked');
themeToggle.addEventListener('click', changeTheme);
