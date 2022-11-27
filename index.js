// Hover Function for Mobile
document.addEventListener("touchstart", function () {}, true);

// Date & Time Declarations
let today = new Date();

let days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

let months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

let day = days[today.getDay()];
let month = months[today.getMonth()];
let date = today.getDate();
let hour = today.getHours();
let minute = today.getMinutes();

// Render AM or PM Marker
function renderTimeMarker(time) {
	if (time < 12) {
		time = "AM";
	} else {
		time = "PM";
	}
	return time;
}

// Add Zero to Single Digit Minutes
function addZero(minute) {
	if (minute < 10) {
		minute = `0${minute}`;
	}
	return minute;
}

// Update Time in HTML Markup
let todaysDate = document.querySelector("#today");
todaysDate.textContent = `${day}, ${month} ${date} at ${hour}:${addZero(
	minute
)}${renderTimeMarker(hour)}`;

// Search Functionality
function searchCity(event) {
	event.preventDefault();
	let searchInput = document.querySelector("#search-input").value;
	let locationHeading = document.querySelector("#location");
	if (searchInput) {
		locationHeading.textContent = `${searchInput}`;
	} else {
		alert(`Please provide a city name.`);
	}
}

let searchBtn = document.querySelector(".search-form");
searchBtn.addEventListener("submit", searchCity);

// Change Temperature Type
let currentTemp = document.querySelectorAll("#temp-now, .temps");
let fahrenheit = document.querySelectorAll(".fahrenheit");
let celsius = document.querySelector(".celsius");

function toggleTemp(event) {
	event.preventDefault();
	if (celsius.textContent === "C") {
		celsius.textContent = "F";
		fahrenheit.forEach((el) => (el.textContent = "C"));
		currentTemp.forEach((el) => (el.textContent = "11"));
	} else {
		celsius.textContent = "C";
		fahrenheit.forEach((el) => (el.textContent = "F"));
		currentTemp.forEach((el) => (el.textContent = "38"));
	}
}

celsius.addEventListener("click", toggleTemp);
