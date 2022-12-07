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

// Change Hours to 12-Hour Format
hour = hour > 12 ? hour - 12 : hour;

// Render AM or PM Marker
let timeMarker = today.getHours() > 12 ? "PM" : "AM";

// Add Zero to Single Digit Minutes
function addZero(time) {
	if (time < 10) {
		time = `0${time}`;
	}
	return time;
}

// Update Time in HTML Markup
let todaysDate = document.querySelector("#today");
let dateStatement = `${day}, ${month} ${date} at ${addZero(hour)}:${addZero(
	minute
)}${timeMarker}`;
todaysDate.textContent = `${dateStatement}`;

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

// Change Temperature Type & Formula to Toggle Between C & F Values
let currentTemp = document.querySelectorAll("#temp-now, .temps");
let fahrenheit = document.querySelectorAll(".fahrenheit");
let celsius = document.querySelector(".celsius");

function toggleTemp(event) {
	event.preventDefault();
	if (celsius.textContent === "C") {
		celsius.textContent = "F";
		fahrenheit.forEach((el) => (el.textContent = "C"));
		currentTemp.forEach((el) =>
			Number((el.textContent = Math.round(((el.textContent - 32) * 5) / 9)))
		);
	} else {
		celsius.textContent = "C";
		fahrenheit.forEach((el) => (el.textContent = "F"));
		currentTemp.forEach((el) =>
			Number((el.textContent = Math.round((el.textContent * 9) / 5 + 32)))
		);
	}
}

celsius.addEventListener("click", toggleTemp);
