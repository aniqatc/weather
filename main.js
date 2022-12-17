// Hover Function for Mobile
document.addEventListener("touchstart", function () {}, true);

// Dark Mode Theme Classes
function changeTheme() {
	document
		.querySelectorAll(".local-overview, .global-overview, .search-btn")
		.forEach((el) => el.classList.toggle("dark-container"));
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
	document
		.querySelectorAll(".daily-low")
		.forEach((el) => el.classList.toggle("dark-text"));
	// In order to update API content to match theme
	updateLocationDataByName(locationHeading.textContent);
}

// Dark Mode Triggered by Click
const themeToggle = document.querySelector("#flexSwitchCheckChecked");
themeToggle.addEventListener("click", changeTheme);

// TEMP: Dark Mode Theme Triggered Between 5pm - 7am
const currentHour = new Date().getHours();
if (currentHour >= 17 || currentHour < 7) {
	themeToggle.click();
}

// Change Temperature Type & Formula to Toggle Between C & F Values
const allTemps = document.querySelectorAll("#temp-now, .temps, .faded-temp");
const fahrenheit = document.querySelectorAll(".fahrenheit");
const celsius = document.querySelector(".celsius");

function toggleTemp(event) {
	event.preventDefault();
	if (celsius.innerHTML === "C") {
		celsius.innerHTML = "F";
		fahrenheit.forEach((el) => (el.innerHTML = "C"));
		allTemps.forEach(
			(el) => (el.textContent = Math.round(((el.innerHTML - 32) * 5) / 9))
		);
		units = "metric";
	} else if (celsius.innerHTML === "F") {
		celsius.innerHTML = "C";
		fahrenheit.forEach((el) => (el.innerHTML = "F"));
		allTemps.forEach(
			(el) => (el.textContent = Math.round((el.innerHTML * 9) / 5 + 32))
		);
		units = "imperial";
	}
	// Update Data to Reflect Celsius or Fahrenheit Change
	updateLocationDataByName(locationHeading.textContent);
}

celsius.addEventListener("click", toggleTemp);

// Variables for API & Location Heading
const apiKey = "d1a86552de255334f6117b348c4519bd";
const apiWeather = "https://api.openweathermap.org/data/2.5/weather";
const apiOneCall = "https://api.openweathermap.org/data/2.5/onecall";
let units = "imperial";
const locationHeading = document.querySelector("#location");
const geolocationButton = document.querySelector("#geolocation-btn");

// Call API by City Name
function updateLocationDataByName(location) {
	axios
		.get(`${apiWeather}?q=${location}&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature, function () {
			alert(
				"I can take up to over 200,000 locations so there's no reason why you should see this message but if you do, try entering a valid city name! 🌃"
			);
		});
}

// Call API by Geolocation
geolocationButton.addEventListener("click", function () {
	navigator.geolocation.getCurrentPosition(getLocation);
});

function getLocation(position) {
	const lon = position.coords.longitude;
	const lat = position.coords.latitude;

	axios
		.get(`${apiWeather}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
		.then(displayCurrentTemperature);
}

// Call API by Search Functionality
function searchCity(event) {
	event.preventDefault();
	const searchInput = document.querySelector("#search-input").value;
	if (searchInput) {
		updateLocationDataByName(searchInput);
	}
}

const searchBtn = document.querySelector(".search-form");
searchBtn.addEventListener("submit", searchCity);

// Variables for Elements Representing Data
const currentTemp = document.querySelector("#temp-now");
const highTemp = document.querySelector("#high-temp");
const lowTemp = document.querySelector("#low-temp");
const feelsLikeTemp = document.querySelector("#feels-like");
const tempDescription = document.querySelector("#description-temp");
const wind = document.querySelector("#wind");
const humidity = document.querySelector("#humidity");
const visibility = document.querySelector("#visibility");
const clouds = document.querySelector("#clouds");
const sunrise = document.querySelector("#sunrise-time");
const sunset = document.querySelector("#sunset-time");
const scenery = document.querySelector("#scenery");
const conditionMsg = document.querySelector("#condition-msg");
const todaysDate = document.querySelector("#today");

// Display Temperature
function displayCurrentTemperature(response) {
	if (response.status == 200) {
		const data = response.data;
		locationHeading.innerHTML = `${data.name}, ${data.sys.country}`;
		currentTemp.innerHTML = `${Math.round(data.main.temp)}`;
		highTemp.innerHTML = `${Math.round(data.main.temp_max)}`;
		lowTemp.innerHTML = `${Math.round(data.main.temp_min)}`;
		feelsLikeTemp.innerHTML = `${Math.round(data.main.feels_like)}`;
		tempDescription.innerHTML = `${data.weather[0].description}`;
		wind.innerHTML = `${Math.round(data.wind.speed)}`;
		humidity.innerHTML = `${data.main.humidity}`;
		visibility.innerHTML = `${Math.round(data.visibility / 1000)}`;
		clouds.innerHTML = `${data.clouds.all}`;

		// Sunset & Sunrise Times
		let apiSunrise = data.sys.sunrise * 1000;
		let apiSunset = data.sys.sunset * 1000;
		let options = {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		};
		sunrise.innerHTML = localTime(apiSunrise).toLocaleString([], options);
		sunset.innerHTML = localTime(apiSunset).toLocaleString([], options);

		// Get Local Time Object for Searched Cities
		function localTime(unix) {
			let date = new Date();
			let local = unix;
			let localOffset = date.getTimezoneOffset() * 60000;
			let utc = local + localOffset;
			let updatedTime = new Date(utc + 1000 * response.data.timezone);
			return updatedTime;
		}

		// Change Current Time/Date to Location
		let today = new Date();
		let localToday = today.getTime();
		let dateStatement = `${localTime(localToday).toLocaleDateString([], {
			weekday: "long",
			month: "long",
			day: "numeric",
		})} at ${localTime(localToday).toLocaleString([], options)}`;
		todaysDate.innerHTML = `${dateStatement}`;

		// Change Landscape Image Based on Sunset / Sunrises
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
					data.weather[0].icon == icon.data[i].icon &&
					data.weather[0].id == icon.data[i].id
				) {
					let mainWeatherIcon = document.querySelector(".default-main-icon");
					mainWeatherIcon.setAttribute("src", icon.data[i].src);
					mainWeatherIcon.setAttribute("alt", icon.data[i].alt);
				}
			}
		});

		// Weather Condition Message Indicator
		let weatherType = data.weather[0].main;
		if (
			weatherType === "Rain" ||
			weatherType === "Drizzle" ||
			weatherType === "Clouds"
		) {
			conditionMsg.innerHTML = `<i class="fa-solid fa-umbrella"></i> Umbrella Required`;
		} else if (weatherType === "Thunderstorm" || weatherType === "Tornado") {
			conditionMsg.innerHTML = `<i class="fa-solid fa-cloud-bolt"></i> Stay Indoors`;
		} else if (weatherType === "Snow") {
			conditionMsg.innerHTML = `<i class="fa-solid fa-snowflake"></i> Dress Warm`;
		} else if (weatherType === "Clear") {
			conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Weather Conditions`;
		} else if (
			weatherType === "Mist" ||
			weatherType === "Fog" ||
			weatherType === "Haze"
		) {
			conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Visibility`;
		} else {
			conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Air Quality`;
		}

		// Call Daily Forecast Function Based on Current Location Data
		getForecast(response.data.coord);
	}
}

function getForecast(coordinates) {
	axios
		.get(
			`${apiOneCall}?lat=${coordinates.lat}&lon=${coordinates.lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=${units}`
		)
		.then(displayForecast);
}

// Daily Forecast

function displayForecast(response) {
	// Added Dew Point // Original API Call Does Not Support
	let dewPoint = document.querySelector("#dew-point");
	dewPoint.innerHTML = `${Math.round(response.data.current.dew_point)}`;
	// Daily Forecase
	let forecastData = response.data.daily;
	let forecastContainer = document.querySelector(".full-forecast");
	let forecastHTML = "";
	forecastData.forEach(function (day, index) {
		if (index < 7) {
			let maxTemp = day.temp.max;
			let minTemp = day.temp.min;

			forecastHTML += `<div class="daily m-2 m-md-0">
							<p>${formatDay(day.dt)}</p>
							<img
								src="/assets/loading.svg"
								class="weather-icon forecast-icon mb-2"
								height="45px"
								width="50px"
							/>
							<p>
								<span class="temps">${Math.round(maxTemp)}</span>°<span class="fahrenheit">${
				units === "metric" ? "C" : "F"
			} </span
								><br />
								<span class="${themeToggle.checked === true ? "dark-text" : "daily-low"}">
									<span class="forecast-low temps">${Math.round(
										minTemp
									)}</span>°<span class="fahrenheit"
										>${units === "metric" ? "C" : "F"}
									</span>
								</span>
							</p>
						</div>
						`;
			axios.get("icons.json").then((icon) => {
				for (let i = 0; i < icon.data.length; i++) {
					if (day.weather[0].id == icon.data[i].id) {
						forecastHTML = forecastHTML.replace(
							'src="/assets/loading.svg"',
							`src="${icon.data[i].src}"`
						);
					}
				}
				forecastContainer.innerHTML = forecastHTML;
			});
		}
	});
}
// Format Daily Forecast Unix Timestamps
function formatDay(unix) {
	let date = new Date(unix * 1000);
	let day = date.getDay();
	let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	return days[day];
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
	"Los Angeles",
	"Munich",
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
		updateLocationDataByName(city[i]);
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	});
}

// Default Location to Show
updateLocationDataByName("New York");
