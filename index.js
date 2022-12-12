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

// Change Temperature Type & Formula to Toggle Between C & F Values
let allTemps = document.querySelectorAll("#temp-now, .temps");
let fahrenheit = document.querySelectorAll(".fahrenheit");
let celsius = document.querySelector(".celsius");

function toggleTemp(event) {
	event.preventDefault();
	if (celsius.textContent === "C") {
		celsius.textContent = "F";
		fahrenheit.forEach((el) => (el.textContent = "C"));
		allTemps.forEach((el) =>
			Number((el.textContent = Math.round(((el.textContent - 32) * 5) / 9)))
		);
	} else {
		celsius.textContent = "C";
		fahrenheit.forEach((el) => (el.textContent = "F"));
		allTemps.forEach((el) =>
			Number((el.textContent = Math.round((el.textContent * 9) / 5 + 32)))
		);
	}
}

celsius.addEventListener("click", toggleTemp);

// Current Location via Geolocation
let apiKey = "c547e666ba264994fad007fc08810597";
let apiUrl = "https://api.openweathermap.org/data/2.5/weather";
let units = "imperial";

let geolocationButton = document.querySelector("#geolocation-btn");
geolocationButton.addEventListener("click", function () {
	navigator.geolocation.getCurrentPosition(getLocation);
});

function getLocation(position) {
	let lon = position.coords.longitude;
	let lat = position.coords.longitude;

	axios
		.get(`${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature);
}

// Search Functionality
function searchCity(event) {
	event.preventDefault();
	let searchInput = document.querySelector("#search-input").value;
	let locationHeading = document.querySelector("#location");
	if (searchInput) {
		axios
			.get(`${apiUrl}?q=${searchInput}&appid=${apiKey}&units=${units}`)
			.then(displayCurrentTemperature);
		locationHeading.textContent = `${searchInput}`;
	} else {
		alert(`Please provide a city name.`);
	}
}

let searchBtn = document.querySelector(".search-form");
searchBtn.addEventListener("submit", searchCity);

// Display Temperature
let currentTemp = document.querySelector("#temp-now");
let highTemp = document.querySelector("#high-temp");
let lowTemp = document.querySelector("#low-temp");
let feelsLikeTemp = document.querySelector("#feels-like");
let descriptionTemp = document.querySelector("#description-temp");
let sunrise = document.querySelector("#sunrise-time");
let sunset = document.querySelector("#sunset-time");

function displayCurrentTemperature(response) {
	if (response.status == 200) {
		let dataTemp = response.data;
		console.log(response);
		currentTemp.innerHTML = `${Math.round(dataTemp.main.temp)}`;
		highTemp.innerHTML = `${Math.round(dataTemp.main.temp_max)}`;
		lowTemp.innerHTML = `${Math.round(dataTemp.main.temp_min)}`;
		feelsLikeTemp.innerHTML = `${Math.round(dataTemp.main.feels_like)}`;
		descriptionTemp.innerHTML = `${dataTemp.weather[0].description}`;
		let apiSunsrise = new Date(dataTemp.sys.sunrise * 1000).toLocaleTimeString(
			"en-US"
		);
		let apiSunset = new Date(dataTemp.sys.sunset * 1000).toLocaleTimeString(
			"en-US"
		);
		sunrise.innerHTML = `${apiSunsrise}`;
		sunset.innerHTML = `${apiSunset}`;
	} else {
		alert(`Please enter a valid city name.`);
	}
}

// Display Temperatures for Global Forecast (Default)
let globalTemps = document.querySelectorAll(".global-temps");
let globalDesc = document.querySelectorAll(".global-descriptions");
let city = ["Seattle", "Rabat", "England", "Paris", "Delhi"];

function displayGlobalTemperature() {
	for (let i = 0; i < city.length; i++) {
		axios
			.get(`${apiUrl}?q=${city[i]}&appid=${apiKey}&units=${units}`)
			.then(function (response) {
				globalTemps[i].innerHTML = Math.round(response.data.main.temp);
				globalDesc[i].innerHTML = `${response.data.weather[0].description}`;
			});
	}
}

displayGlobalTemperature();

// Display NYC Temperature (Default)
function displayDefaultTemperature() {
	axios
		.get(`${apiUrl}?q=New York&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature);
}

displayDefaultTemperature();
