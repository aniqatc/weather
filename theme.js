function changeTheme() {
	document
		.querySelectorAll(".local-overview, .global-overview, .search-btn")
		.forEach((el) => el.classList.toggle("dark-container"));
	document
		.querySelectorAll(".daily")
		.forEach((el) => el.classList.toggle("dark-hover"));
	document
		.querySelectorAll(".input-group")
		.forEach((el) => el.classList.toggle("dark-btn"));
	document
		.querySelectorAll(".global-item")
		.forEach((el) => el.classList.toggle("light-hover"));
	document
		.querySelectorAll(".card, .list-group-item, body")
		.forEach((el) => el.classList.toggle("dark"));
	document
		.querySelectorAll(".list-group-item, footer, .sun-time")
		.forEach((el) => el.classList.toggle("dark-icon"));
}

let themeToggle = document.querySelector("#flexSwitchCheckChecked");
themeToggle.addEventListener("click", changeTheme);

// Hover Function for Mobile
document.addEventListener("touchstart", function () {}, true);

// Checkbox checked if night time
let currentHour = new Date().getHours();

if (currentHour >= 16 || currentHour < 7) {
	themeToggle.click();
}
