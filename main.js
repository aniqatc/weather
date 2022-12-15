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

// Change Temperature Type & Formula to Toggle Between C & F Values
let allTemps = document.querySelectorAll("#temp-now, .temps");
let fahrenheit = document.querySelectorAll(".fahrenheit");
let celsius = document.querySelector(".celsius");

function toggleTemp(event) {
	event.preventDefault();
	if (celsius.innerHTML === "C") {
		celsius.innerHTML = "F";
		fahrenheit.forEach((el) => (el.innerHTML = "C"));
		allTemps.forEach(
			(el) => (el.textContent = Math.round(((el.innerHTML - 32) * 5) / 9))
		);
	} else if (celsius.innerHTML === "F") {
		celsius.innerHTML = "C";
		fahrenheit.forEach((el) => (el.innerHTML = "F"));
		allTemps.forEach(
			(el) => (el.textContent = Math.round((el.innerHTML * 9) / 5 + 32))
		);
	}
}

celsius.addEventListener("click", toggleTemp);

// Variables for API & Heading
let apiKey = "d1a86552de255334f6117b348c4519bd";
let apiWeather = "https://api.openweathermap.org/data/2.5/weather";
let apiLocation = "https://api.openweathermap.org/geo/1.0/reverse";
let units = "imperial";
let locationHeading = document.querySelector("#location");
let geolocationButton = document.querySelector("#geolocation-btn");

// Location via Geolocation
geolocationButton.addEventListener("click", function () {
	navigator.geolocation.getCurrentPosition(getLocation);
});

function getLocation(position) {
	let lon = position.coords.longitude;
	let lat = position.coords.latitude;

	axios
		.get(`${apiWeather}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature);
	axios
		.get(
			`${apiLocation}?lat=${lat}&lon=${lon}&limit=5&appid=${apiKey}&units=${units}`
		)
		.then((response) => {
			locationHeading.innerHTML = `${response.data[0].name}, ${response.data[0].country}`;
		});
}

// Location via Search Functionality
function searchCity(event) {
	event.preventDefault();
	let searchInput = document.querySelector("#search-input").value;
	if (searchInput) {
		axios
			.get(`${apiWeather}?q=${searchInput}&appid=${apiKey}&units=${units}`)
			.then(displayCurrentTemperature, function () {
				alert("Please enter a valid city!");
			});
	}
}

let searchBtn = document.querySelector(".search-form");
searchBtn.addEventListener("submit", searchCity);

// Variables for Elements Representing Data
let currentTemp = document.querySelector("#temp-now");
let highTemp = document.querySelector("#high-temp");
let lowTemp = document.querySelector("#low-temp");
let feelsLikeTemp = document.querySelector("#feels-like");
let descriptionTemp = document.querySelector("#description-temp");
let wind = document.querySelector("#wind");
let humidity = document.querySelector("#humidity");
let visibility = document.querySelector("#visibility");
let clouds = document.querySelector("#clouds");
let sunrise = document.querySelector("#sunrise-time");
let sunset = document.querySelector("#sunset-time");

// Display Temperature
function displayCurrentTemperature(response) {
	if (response.status == 200) {
		let dataTemp = response.data;
		locationHeading.innerHTML = `${dataTemp.name}, ${dataTemp.sys.country}`;
		currentTemp.innerHTML = `${Math.round(dataTemp.main.temp)}`;
		highTemp.innerHTML = `${Math.round(dataTemp.main.temp_max)}`;
		lowTemp.innerHTML = `${Math.round(dataTemp.main.temp_min)}`;
		feelsLikeTemp.innerHTML = `${Math.round(dataTemp.main.feels_like)}`;
		descriptionTemp.innerHTML = `${dataTemp.weather[0].description}`;
		wind.innerHTML = `${Math.round(dataTemp.wind.speed)}`;
		humidity.innerHTML = `${dataTemp.main.humidity}`;
		visibility.innerHTML = `${dataTemp.visibility / 1000}`;
		clouds.innerHTML = `${dataTemp.clouds.all}`;
		// Sunset & Sunrise Times
		let options = {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		};
		let apiSunrise = dataTemp.sys.sunrise * 1000;
		let apiSunset = dataTemp.sys.sunset * 1000;
		sunrise.innerHTML = localTime(apiSunrise).toLocaleString([], options);
		sunset.innerHTML = localTime(apiSunset).toLocaleString([], options);

		// Get Local Time & Date for Searched Cities
		function localTime(unix) {
			let d = new Date();
			let local = unix;
			let localOffset = d.getTimezoneOffset() * 60000;
			let utc = local + localOffset;
			let nTime = new Date(utc + 1000 * response.data.timezone);
			return nTime;
		}

		function localDate(unix) {
			let d = new Date();
			let local = unix;
			let localOffset = d.getTimezoneOffset() * 60000;
			let utc = local + localOffset;
			let nDate = new Date(utc + 1000 * response.data.timezone);
			return nDate.toLocaleDateString([], {
				weekday: "long",
				month: "long",
				day: "numeric",
			});
		}

		// Change Current Time/Date to Location
		let today = new Date();
		let localToday = today.getTime();
		let todaysDate = document.querySelector("#today");
		let dateStatement = `${localDate(localToday)} at ${localTime(
			localToday
		).toLocaleString([], options)}`;
		todaysDate.innerHTML = `${dateStatement}`;

		// Change Landscape Image Based on Sunset / Sunrises
		let scenery = document.querySelector("#scenery");
		let sunriseHour = localTime(apiSunrise).getHours();
		let sunsetHour = localTime(apiSunset).getHours();

		localTime(localToday).getHours() < sunriseHour ||
		localTime(localToday).getHours() >= sunsetHour
			? (scenery.src = "/assets/night-landscape.png")
			: (scenery.src = "/assets/day-landscape.png");

		// Change Icon for Main Overview
		axios.get("icons.json").then((icon) => {
			for (let i = 0; i < icon.data.length; i++) {
				if (
					dataTemp.weather[0].icon == icon.data[i].icon &&
					dataTemp.weather[0].id == icon.data[i].id
				) {
					let mainWeatherIcon = document.querySelector(".default-main-icon");
					mainWeatherIcon.setAttribute("src", icon.data[i].src);
					mainWeatherIcon.setAttribute("alt", icon.data[i].alt);
				}
			}
		});
	}
}

// Display Temperatures for Global Forecast (Default)
let globalTemps = document.querySelectorAll(".global-temps");
let globalDesc = document.querySelectorAll(".global-descriptions");
let cityNames = document.querySelectorAll(".global-name");
let countryNames = document.querySelectorAll(".country-name");
let city = [
	"Seattle",
	"Rabat",
	"London",
	"Paris",
	"Delhi",
	"Jakarta",
	"Manila",
	"Shanghai",
	"Tokyo",
	"Cairo",
	"Dhaka",
	"New York",
	"Istanbul",
];

// Shuffle Array for Randomized Cities
city.sort(() => Math.random() - 0.5);

function displayGlobalTemperature() {
	for (let i = 0; i < 5; i++) {
		axios
			.get(`${apiWeather}?q=${city[i]}&appid=${apiKey}&units=${units}`)
			.then((response) => {
				cityNames[i].innerHTML = `${response.data.name}`;
				countryNames[i].innerHTML = `${response.data.sys.country}`;
				globalTemps[i].innerHTML = Math.round(response.data.main.temp);
				globalDesc[i].innerHTML = `${response.data.weather[0].description}`;
				axios.get("icons.json").then((icon) => {
					for (let k = 0; k < icon.data.length; k++) {
						if (response.data.weather[0].id == icon.data[k].id) {
							let globalWeatherIcon = document.querySelectorAll(".global-icon");
							globalWeatherIcon[i].setAttribute("src", icon.data[k].src);
							globalWeatherIcon[i].setAttribute("alt", icon.data[k].alt);
						}
					}
				});
			});
	}
}

displayGlobalTemperature();

// Click on "Other Cities" To Display Weather For That Region
let globalContainers = document.querySelectorAll(".global-item");

for (let i = 0; i < 5; i++) {
	globalContainers[i].addEventListener("click", () => {
		axios
			.get(`${apiWeather}?q=${city[i]}&appid=${apiKey}&units=${units}`)
			.then(displayCurrentTemperature);
	});
}

function displayDefaultTemperature() {
	axios
		.get(`${apiWeather}?q=New York&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature);
}

displayDefaultTemperature();
