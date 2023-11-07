const OPENWEATHER_KEY = 'API-KEY-HERE';

class WeatherService {
	constructor(apiKey) {
		this.apiKey = apiKey;
		this.generalData = 'https://api.openweathermap.org/data/2.5/weather';
		this.forecastData = 'https://api.openweathermap.org/data/2.5/onecall';
		this.units = 'imperial';
		this.geolocationButton = document.querySelector('#geolocation-btn');
		this.cities;
	}

	async byName(location) {
		return await axios.get(
			`${this.generalData}?q=${location}&appid=${this.apiKey}&units=${this.units}`
		);
	}

	async fetchDailyForecast(coordinates) {
		const response = await axios.get(
			`${this.forecastData}?lat=${coordinates.lat}&lon=${coordinates.lon}&exclude=minutely,hourly,alerts&appid=${this.apiKey}&units=${this.units}`
		);
		displayForecast(response);
	}

	async byGeolocation(position) {
		const { latitude: lat, longitude: lon } = position.coords;
		const response = await axios.get(
			`${this.generalData}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`
		);
		displayCurrentTemperature(response);
	}

	displaySelectedLocationWeather(location) {
		this.byName(location).then(response => displayCurrentTemperature(response));
	}

	initializeGeolocation() {
		this.geolocationButton.addEventListener('click', () => {
			navigator.geolocation.getCurrentPosition(this.byGeolocation.bind(this));
		});
	}

	fetchCityList() {
		fetch('/json/cities.json')
			.then(response => response.json())
			.then(data => {
				this.cities = data;
			});
	}

	getSavedLocation() {
		const userLocation = localStorage.getItem('location');
		if (userLocation) {
			this.displaySelectedLocationWeather(userLocation);
		} else {
			this.displaySelectedLocationWeather('New York');
		}
	}

	async renderIcons(location, dataId, dataIcon, imgEl) {
		const response = await axios.get('/json/icons.json');
		const customIcons = response.data;

		const iconMatch = customIcons.find(icon => icon.id === dataId && icon.icon === dataIcon);

		if (iconMatch) {
			const icon = location.querySelector(imgEl);
			icon.setAttribute('src', iconMatch.src);
			icon.setAttribute('alt', iconMatch.alt);
		}
	}
}

const weatherService = new WeatherService(OPENWEATHER_KEY);
weatherService.initializeGeolocation();
weatherService.fetchCityList();
weatherService.getSavedLocation();

const themeManager = {
	body: document.querySelector('body'),
	themeToggle: document.querySelector('#flexSwitchCheckChecked'),

	initialize: function () {
		this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
		this.getSavedTheme();
	},

	toggleTheme: function () {
		this.body.classList.toggle('dark');
		localStorage.setItem('theme', this.body.classList.contains('dark') ? 'dark' : 'light');
	},

	getSavedTheme: function () {
		const userTheme = localStorage.getItem('theme');
		if (userTheme === 'dark') {
			this.themeToggle.click();
		}
	},
};

themeManager.initialize();

const searchManager = {
	suggestionsList: document.querySelector('.search-suggestions'),
	searchBtn: document.querySelector('.search-form'),
	searchInput: document.querySelector('#search-input'),

	initialize: function () {
		this.searchBtn.addEventListener('submit', this.submitCity.bind(this));
		this.searchInput.addEventListener('keyup', this.typeInput.bind(this));
		document.addEventListener('click', this.clickOutsideInput.bind(this));
	},

	submitCity: function (event) {
		event.preventDefault();
		const searchInputValue = this.searchInput.value;
		if (searchInputValue) {
			weatherService.displaySelectedLocationWeather(searchInputValue);
		}
	},

	typeInput: function () {
		const inputText = this.searchInput.value.trim();
		this.clearSuggestions();

		if (inputText) {
			let suggestions = weatherService.cities
				.filter(city => city.name.toLowerCase().startsWith(inputText.toLowerCase()))
				.slice(0, 4);
			this.showSuggestions(suggestions);
		}
	},

	clickOutsideInput: function (event) {
		if (!this.suggestionsList.contains(event.target)) {
			this.clearSuggestions();
		}
	},

	showSuggestions: function (suggestions) {
		suggestions.forEach(city => {
			const li = document.createElement('li');
			li.textContent = city.name;
			this.suggestionsList.appendChild(li);
			this.suggestionsList.style.opacity = '1';

			li.addEventListener('click', () => {
				li.textContent;
				weatherService.displaySelectedLocationWeather(li.textContent);
				this.clearSuggestions();
			});
		});
	},

	clearSuggestions: function () {
		this.suggestionsList.innerHTML = '';
		this.suggestionsList.style.opacity = '0';
	},
};

searchManager.initialize();

const locationHeading = document.querySelector('#location');
const allTemps = document.querySelectorAll('#temp-now, .temps, .faded-temp');
const fahrenheit = document.querySelectorAll('.fahrenheit');
const celsius = document.querySelector('.celsius');
const windUnit = document.querySelector('#wind-unit');

function toggleTemp(event) {
	event.preventDefault();
	if (weatherService.units === 'metric') {
		celsius.innerHTML = 'C';
		fahrenheit.forEach(el => (el.innerHTML = 'F'));
		windUnit.innerHTML = `mph`;
		weatherService.units = 'imperial';
	} else if (weatherService.units === 'imperial') {
		celsius.innerHTML = 'F';
		fahrenheit.forEach(el => (el.innerHTML = 'C'));
		windUnit.innerHTML = `km/h`;
		weatherService.units = 'metric';
	}

	// Update Data to Reflect Celsius or Fahrenheit Change
	weatherService.displaySelectedLocationWeather(locationHeading.textContent);
	displayGlobalTemperatures();
}

celsius.addEventListener('click', toggleTemp);

// Display Temperature
function displayCurrentTemperature(response) {
	if (response.status == 200) {
		const data = response.data;

		// Update Weather Details
		displayWeatherDetails(data);

		// Render Icon for Main Card
		weatherService.renderIcons(
			document,
			data.weather[0].id,
			data.weather[0].icon,
			`.default-main-icon`
		);

		// Weather Condition Message Indicator
		displayWeatherCondition(data.weather[0].main);

		// Daily Forecast Function
		weatherService.fetchDailyForecast(response.data.coord);

		// Current Time/Date to Location
		const localDateObject = new Date().getTime();
		printLocalDateString(data, localDateObject);

		// Sunset/Sunrise
		const apiSunrise = data.sys.sunrise * 1000;
		const apiSunset = data.sys.sunset * 1000;
		displaySunsetSunriseTime(data, localDateObject, apiSunrise, apiSunset);

		// Local Storage
		localStorage.setItem('location', `${data.name}`);
	}
}

// Get Local Date Object for Searched Cities
function convertDateToSelectedLocale(unix, timezone) {
	const date = new Date();
	const timestamp = unix;
	const offset = date.getTimezoneOffset() * 60000;
	const utc = timestamp + offset;
	const convertedDateObject = new Date(utc + 1000 * timezone);
	return convertedDateObject;
}

// Format Local Date Objects to Strings
function formatDate(object, options, method) {
	if (method === 'toLocaleString') {
		return object.toLocaleString([], options);
	}

	if (method === 'toLocaleDateString') {
		return object.toLocaleDateString([], options);
	}
}

// Format Daily Forecast Unix Timestamps
function formatDay(unix) {
	const date = new Date(unix * 1000);
	const day = date.getDay();
	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	return days[day];
}

// Display Local Date
function printLocalDateString(data, dateObject) {
	const localDateString = formatDate(
		convertDateToSelectedLocale(dateObject, data.timezone),
		{
			weekday: 'long',
			month: 'long',
			day: 'numeric',
		},
		'toLocaleDateString'
	);
	const localTimeString = convertDateToSelectedLocale(dateObject, data.timezone).toLocaleString(
		[],
		{
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		}
	);
	const todaysDate = document.querySelector('#today');
	todaysDate.innerHTML = `${localDateString} at ${localTimeString}`;
}

// Handle sunset/sunrise
function displaySunsetSunriseTime(data, localDateObject, sunriseTime, sunsetTime) {
	const sunrise = document.querySelector('#sunrise-time');
	const sunset = document.querySelector('#sunset-time');

	sunrise.innerHTML = formatDate(
		convertDateToSelectedLocale(sunriseTime, data.timezone),
		{
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		},
		'toLocaleString'
	);
	sunset.innerHTML = formatDate(
		convertDateToSelectedLocale(sunsetTime, data.timezone),
		{
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		},
		'toLocaleString'
	);

	const scenery = document.querySelector('#scenery');
	const sunriseHour = convertDateToSelectedLocale(sunriseTime, data.timezone).getHours();
	const sunsetHour = convertDateToSelectedLocale(sunsetTime, data.timezone).getHours();

	if (
		convertDateToSelectedLocale(localDateObject, data.timezone).getHours() < sunriseHour ||
		convertDateToSelectedLocale(localDateObject, data.timezone).getHours() >= sunsetHour
	) {
		scenery.src = '/assets/night-landscape.png';
		scenery.alt = 'Night landscape';
	} else {
		scenery.src = '/assets/day-landscape.png';
		scenery.alt = 'Day landscape';
	}
}

function displayWeatherDetails(data) {
	const currentTemp = document.querySelector('#temp-now');
	const highTemp = document.querySelector('#high-temp');
	const lowTemp = document.querySelector('#low-temp');
	const feelsLikeTemp = document.querySelector('#feels-like');
	const tempDescription = document.querySelector('#description-temp');
	const wind = document.querySelector('#wind');
	const humidity = document.querySelector('#humidity');
	const visibility = document.querySelector('#visibility');
	const clouds = document.querySelector('#clouds');

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
}

function displayWeatherCondition(data) {
	const conditionMsg = document.querySelector('#condition-msg');
	const weatherType = data;

	switch (weatherType) {
		case 'Rain':
		case 'Drizzle':
		case 'Clouds':
			conditionMsg.innerHTML = `<i class="fa-solid fa-umbrella"></i> Umbrella Required`;
			break;
		case 'Thunderstorm':
		case 'Tornado':
			conditionMsg.innerHTML = `<i class="fa-solid fa-cloud-bolt"></i> Stay Indoors`;
			break;
		case 'Snow':
			conditionMsg.innerHTML = `<i class="fa-solid fa-snowflake"></i> Dress Warm`;
			break;
		case 'Clear':
			conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Conditions`;
			break;
		case 'Mist':
		case 'Fog':
		case 'Haze':
			conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Visibility`;
			break;
		default:
			conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Air Quality`;
	}
}

// Display Daily Forecast Data
function displayForecast(response) {
	// Added Dew Point // Original API Call Does Not Support
	const dewPoint = document.querySelector('#dew-point');
	dewPoint.innerHTML = `${Math.round(response.data.current.dew_point)}`;

	// Daily Forecast
	const forecastData = response.data.daily;
	const forecastContainer = document.querySelector('.full-forecast');
	let forecastHTML = '';

	forecastData.forEach(function (day, index) {
		if (index < 7) {
			forecastHTML += `
			<div class="daily m-2 m-md-0">
				<p>${formatDay(day.dt)}</p>
					<img
						src="/assets/loading.svg"
						class="weather-icon forecast-icon mb-2"
						height="45"
						width="50"
						alt="Loading icon"
						id="icon-${index}"
					/>
				<p>
					<span class="temps">${Math.round(day.temp.max)}</span>°<span class="fahrenheit">${
				weatherService.units === 'metric' ? 'C' : 'F'
			}
					</span><br />
					<span class="daily-low">
						<span class="forecast-low temps">${Math.round(day.temp.min)}</span>°<span class="fahrenheit">${
				weatherService.units === 'metric' ? 'C' : 'F'
			}
					</span>
					</span>
				</p>
			</div>`;
			forecastContainer.innerHTML = forecastHTML;

			weatherService.renderIcons(
				forecastContainer,
				day.weather[0].id,
				day.weather[0].icon,
				`#icon-${index}`
			);
		}
	});
}

// Display Temperatures for Global Forecast (Default)
const cityTemps = document.querySelectorAll('.global-temps');
const cityWeatherDesc = document.querySelectorAll('.global-descriptions');
const cityNames = document.querySelectorAll('.global-name');
const countryNames = document.querySelectorAll('.country-name');
const countryRows = document.querySelectorAll('.global-item');
const randomCities = [
	'Seattle',
	'Rabat',
	'London',
	'Paris',
	'Delhi',
	'Jakarta',
	'Manila',
	'Shanghai',
	'Tokyo',
	'Cairo',
	'Dhaka',
	'New York',
	'Istanbul',
	'Los Angeles',
	'Munich',
	'Dubai',
	'Chile',
	'Florida',
	'Sydney',
].sort(() => Math.random() - 0.5);

// Default Information for Global Forecast Section
function displayGlobalTemperatures() {
	countryRows.forEach(async (item, i) => {
		weatherService.byName(randomCities[i]).then(response => {
			cityNames[i].innerHTML = `${response.data.name}`;
			countryNames[i].innerHTML = `${response.data.sys.country}`;
			cityTemps[i].innerHTML = Math.round(response.data.main.temp);
			cityWeatherDesc[i].innerHTML = `${response.data.weather[0].description}`;
			weatherService.renderIcons(
				item,
				response.data.weather[0].id,
				response.data.weather[0].icon,
				'.global-icon'
			);
		});
	});
}

displayGlobalTemperatures();

const globalContainer = document.querySelector('.global-items-wrapper');
globalContainer.addEventListener('click', event => {
	const clickedEl = event.target.closest('.global-item');
	const clickedCountry = clickedEl.querySelector('.global-name').textContent;

	weatherService.displaySelectedLocationWeather(clickedCountry);
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
});
