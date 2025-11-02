// Service Worker Registration
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/service-worker.js');
	});
}

// Weather App
class WeatherService {
	constructor(apiKey) {
		this.apiKey = apiKey;
		this.generalData = 'https://api.openweathermap.org/data/2.5/weather';
		this.forecastData = 'https://api.openweathermap.org/data/2.5/onecall';
		this.units = 'metric';
		this.geolocationButton = document.querySelector('#geolocation-btn');
		this.cities;
		this.weatherCodes;
		this.mySelectedCityName;
		this.mySelectedCityLon;
		this.mySelectedCityLat;
	}

	async byName(name,lat,lon) {
		//https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,weather_code,apparent_temperature,visibility,cloud_cover,snowfall,showers,rain,snow_depth,precipitation,precipitation_probability,dew_point_2m,relative_humidity_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=Europe%2FBerlin
		//DONE
		const response = await axios.get(
			`https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,weather_code,apparent_temperature,visibility,cloud_cover,snowfall,showers,rain,snow_depth,precipitation,precipitation_probability,dew_point_2m,relative_humidity_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=Europe%2FBerlin`
		);
		response.data.city = name;
		return response;
	}

	async fetchDailyForecast(lat,lon) {
		const response = await axios.get(
			`https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,weather_code,apparent_temperature,visibility,cloud_cover,snowfall,showers,rain,snow_depth,precipitation,precipitation_probability,dew_point_2m,relative_humidity_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=Europe%2FBerlin`
		);
		dailyWeather.displayForecast(response);
	}

	async byGeolocation(position) {
		//Not Done!!!!!
		const { latitude: lat, longitude: lon } = position.coords;
		const response = await axios.get(
			`${this.generalData}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`
		);
		selectedLocationWeather.displayCurrentTemperature(response);
	}

	displaySelectedLocationWeather(name,lat,lon) {
		//DONE
		this.byName(name,lat,lon).then(response =>
			selectedLocationWeather.displayCurrentTemperature(response)
		);
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

	fetchWeatherCodeList() {
		fetch('/json/weathercodes.json')
			.then(response => response.json())
			.then(data => {
				this.weatherCodes = data;
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

		 // Determine if it's day or night (optional, assumes current local hour)
   		const nowHour = new Date().getHours();
    	const isDay = nowHour >= 6 && nowHour < 18; // simple day/night check
		// Try to find the matching icon
    	let iconMatch = customIcons.find(icon => icon.id === dataId && (
        	(isDay && icon.icon.endsWith('d')) || (!isDay && icon.icon.endsWith('n'))
    	));

		//const iconMatch = customIcons.find(icon => icon.id === dataId && icon.icon === dataIcon);

		 // Fallback: if no day/night match, just match by id
		if (!iconMatch) {
			iconMatch = customIcons.find(icon => icon.id === dataId);
		}

		if (iconMatch) {
			const icon = location.querySelector(imgEl);
			if (icon) {
				icon.setAttribute('src', iconMatch.src);
				icon.setAttribute('alt', iconMatch.alt);
			}
		}
	}
}

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
				mySelectedCityName = city.name;
				mySelectedCityLon = city.coord.lon;
				mySelectedCityLat = city.coord.lat				
				weatherService.displaySelectedLocationWeather(city.name,city.coord.lat,city.coord.lon);
				//console.log(`list clicked: ${li.textContent} with lat: ${city.coord.lat} and long ${city.coord.lon}`)
				this.clearSuggestions();
			});
		});
	},

	clearSuggestions: function () {
		this.suggestionsList.innerHTML = '';
		this.suggestionsList.style.opacity = '0';
	},
};

const timeManager = {
	// Get Local Date Object for Searched Cities
	convertUnixToTimezone: function (unix, timezone) {
		const date = new Date();
		const timestamp = unix;
		const offset = date.getTimezoneOffset() * 60000;
		const utc = timestamp + offset;
		const convertedDateObject = new Date(utc + 1000 * timezone);
		return convertedDateObject;
	},
	// Format Local Date Objects to Strings
	formatDate: function (object, options, method) {
		if (method === 'toLocaleString') {
			return object.toLocaleString([], options);
		}

		if (method === 'toLocaleDateString') {
			return object.toLocaleDateString([], options);
		}
	},
	// Format Daily Forecast Unix Timestamps
	formatDay: function (unix) {
		const date = new Date(unix);
    	// JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    	const day = date.getDay();
    
    	return days[day];

	},

	// Display Local Date
	printLocalDateString: function (data, dateObject) {
		const localDateString = this.formatDate(
			this.convertUnixToTimezone(dateObject, data.timezone),
			{
				weekday: 'long',
				month: 'long',
				day: 'numeric',
			},
			'toLocaleDateString'
		);
		const localTimeString = this.convertUnixToTimezone(dateObject, data.timezone).toLocaleString(
			[],
			{
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			}
		);
		const todaysDate = document.querySelector('#today');
		todaysDate.innerHTML = `${localDateString} at ${localTimeString}`;
	},

	// Handle sunset/sunrise
	displaySunsetSunriseTime: function (data, localDateObject, sunriseTime, sunsetTime) {
		const sunrise = document.querySelector('#sunrise-time');
		const sunset = document.querySelector('#sunset-time');

		sunrise.innerHTML = this.formatDate(
			this.convertUnixToTimezone(sunriseTime, data.timezone),
			{
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			},
			'toLocaleString'
		);
		sunset.innerHTML = this.formatDate(
			this.convertUnixToTimezone(sunsetTime, data.timezone),
			{
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			},
			'toLocaleString'
		);

		this.changeSceneryImage(data, localDateObject, sunriseTime, sunsetTime);
	},

	changeSceneryImage: function (data, localDateObject, sunriseTime, sunsetTime) {
		const scenery = document.querySelector('#scenery');
		const sunriseHour = this.convertUnixToTimezone(sunriseTime, data.timezone).getHours();
		const sunsetHour = this.convertUnixToTimezone(sunsetTime, data.timezone).getHours();

		if (
			this.convertUnixToTimezone(localDateObject, data.timezone).getHours() < sunriseHour ||
			this.convertUnixToTimezone(localDateObject, data.timezone).getHours() >= sunsetHour
		) {
			scenery.src = '/assets/night-landscape.png';
			scenery.alt = 'Night landscape';
		} else {
			scenery.src = '/assets/day-landscape.png';
			scenery.alt = 'Day landscape';
		}
	},
};

const selectedLocationWeather = {
	locationHeading: document.querySelector('#location'),
	allTemps: document.querySelectorAll('#temp-now, .temps, .faded-temp'),
	fahrenheit: document.querySelectorAll('.fahrenheit'),
	celsius: document.querySelector('.celsius'),
	windUnit: document.querySelector('#wind-unit'),
	currentTemp: document.querySelector('#temp-now'),
	highTemp: document.querySelector('#high-temp'),
	lowTemp: document.querySelector('#low-temp'),
	feelsLikeTemp: document.querySelector('#feels-like'),
	tempDescription: document.querySelector('#description-temp'),
	wind: document.querySelector('#wind'),
	humidity: document.querySelector('#humidity'),
	visibility: document.querySelector('#visibility'),
	clouds: document.querySelector('#clouds'),
	conditionMsg: document.querySelector('#condition-msg'),

	initialize: function () {
		this.celsius.addEventListener('click', this.toggleTemp.bind(this));
	},

	toggleTemp: function (event) {
		event.preventDefault();
		if (weatherService.units === 'metric') {
			this.celsius.innerHTML = 'C';
			this.fahrenheit.forEach(el => (el.innerHTML = 'F'));
			this.windUnit.innerHTML = `mph`;
			weatherService.units = 'imperial';
		} else if (weatherService.units === 'imperial') {
			this.celsius.innerHTML = 'F';
			this.fahrenheit.forEach(el => (el.innerHTML = 'C'));
			this.windUnit.innerHTML = `km/h`;
			weatherService.units = 'metric';
		}

		// Update Data to Reflect Celsius or Fahrenheit Change
		weatherService.displaySelectedLocationWeather(this.locationHeading.textContent);
		globalWeather.getGlobalTemperatures();
	},

	displayCurrentTemperature: function (response) {
		if (response.status == 200) {
			const data = response.data;

			// Rendering selected location's weather data
			this.displayWeatherDetails(data);//DONE 
			this.displayWeatherCondition(data.current.weather_code,data.current.is_day);
			weatherService.fetchDailyForecast(mySelectedCityLat,mySelectedCityLon);
			weatherService.renderIcons(
				document,
				data.current.weather_code,
				null,
				`.default-main-icon`
			);

			// User's Local Time
			const localDateObject = new Date().getTime();
			timeManager.printLocalDateString(data, localDateObject);

			// Location's Local Time
			const apiSunrise = data.sys.sunrise * 1000;
			const apiSunset = data.sys.sunset * 1000;
			timeManager.displaySunsetSunriseTime(data, localDateObject, apiSunrise, apiSunset);

			localStorage.setItem('location', `${data.name}`);
		}
	},

	displayWeatherDetails: function (data) {
		this.locationHeading.innerHTML = `${data.city}`;
		this.currentTemp.innerHTML = `${Math.round(data.current.temperature_2m)}`;

		this.highTemp.innerHTML = `${Math.round(data.daily.temperature_2m_max[0])}`;
		this.lowTemp.innerHTML = `${Math.round(data.daily.temperature_2m_min[0])}`;

		this.feelsLikeTemp.innerHTML = `${Math.round(data.current.apparent_temperature)}`;
		this.tempDescription.innerHTML = `PH`;

		this.wind.innerHTML = `${Math.round(data.current.wind_speed_10m)}`;
		this.humidity.innerHTML = `${data.current.relative_humidity_2m}`;

		this.visibility.innerHTML = `PH`;
		this.clouds.innerHTML = `${data.current.cloud_cover}`;
	},

	displayWeatherCondition: function (weatherCode,is_day ) {
		const weatherData = weatherService.weatherCodes;
		const codeKey = String(weatherCode);
		const bDay = is_day === 1; 

		const entry = weatherData[codeKey];
		const weatherGroups = {
    		sunny: [0, 1],
    		partlyCloudy: [2],
    		cloudy: [3],
    		fog: [45, 48],
    		drizzle: [51, 53, 55, 56, 57],
    		rain: [61, 63, 65, 66, 67],
    		snow: [71, 73, 75, 77],
    		showers: [80, 81, 82],
    		snowShowers: [85, 86],
    		thunderstorm: [95],
    		thunderstormHail: [96, 99]
		};
		switch (true) {
			//Sunny
			case weatherGroups.sunny.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Conditions`;
				break;
			case weatherGroups.partlyCloudy.includes(weatherCode):
			case weatherGroups.cloudy.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Conditions`;
				break;
			case weatherGroups.fog.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Conditions`;
				break;
			case weatherGroups.drizzle.includes(weatherCode):	
			case weatherGroups.rain.includes(weatherCode):
			case weatherGroups.showers.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-umbrella"></i> Umbrella Required`;
					break;

			case weatherGroups.snowShowers.includes(weatherCode):
			case weatherGroups.snow.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-snowflake"></i> Dress Warm`;
				break;
			
			case weatherGroups.thunderstorm.includes(weatherCode):
			case weatherGroups.thunderstormHail.includes(weatherCode):
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-cloud-bolt"></i> Stay Indoors`;
				break;
			default:
				this.conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Air Quality`;
		}
	},
};

const dailyWeather = {
	dewPoint: document.querySelector('#dew-point'),
	forecastContainer: document.querySelector('.full-forecast'),

	displayForecast: function (response) {
		// Note: dew point is only available w/ one-call API & not with the general data call
		this.dewPoint.innerHTML = `PH`;
		const forecastData = response.data.daily;
		let forecastHTML = '';

		forecastData.time.forEach((date, index) => {
			if (index < 7) {
				const maxTemp = forecastData.temperature_2m_max[index];
        		const minTemp = forecastData.temperature_2m_min[index];
        		const dayName = timeManager.formatDay(date); // format the date
				const weatherCode = forecastData.weather_code[index];


				forecastHTML += `
				<div class="daily m-2 m-md-0">
					<p>${dayName}</p>
						<img
							src="/assets/loading.svg"
							class="weather-icon forecast-icon mb-2"
							height="45"
							width="50"
							alt="Loading icon"
							id="icon-${index}"
						/>
					<p>
						<span class="temps">${Math.round(maxTemp)}</span>°<span class="fahrenheit">${
						weatherService.units === 'metric' ? 'C' : 'F'
					}
						</span><br />
						<span class="daily-low">
							<span class="forecast-low temps">${Math.round(minTemp)}</span>°<span class="fahrenheit">${
						weatherService.units === 'metric' ? 'C' : 'F'
					}
						</span>
						</span>
					</p>
				</div>`;
					this.forecastContainer.innerHTML = forecastHTML;

					weatherService.renderIcons(
						this.forecastContainer,
						weatherCode,
						null,
						`#icon-${index}`
					);
				}
		});
	},
};

const globalWeather = {
	globalContainer: document.querySelector('.global-items-wrapper'),
	cityTemps: document.querySelectorAll('.global-temps'),
	cityWeatherDesc: document.querySelectorAll('.global-descriptions'),
	cityNames: document.querySelectorAll('.global-name'),
	countryNames: document.querySelectorAll('.country-name'),
	countryRows: document.querySelectorAll('.global-item'),
	randomCities: [
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
	].sort(() => Math.random() - 0.5),

	initialize: function () {
		this.globalContainer.addEventListener('click', this.updateWeatherData.bind(this));
		this.getGlobalTemperatures();
	},

	getGlobalTemperatures: function () {
		this.countryRows.forEach((item, i) => {
			weatherService
				.byName(this.randomCities[i])
				.then(response => this.displayGlobalTemperatures(response, i, item));
		});
	},

	displayGlobalTemperatures: function (response, i, item) {
		this.cityNames[i].innerHTML = `${response.data.name}`;
		this.countryNames[i].innerHTML = `${response.data.sys.country}`;
		this.cityTemps[i].innerHTML = Math.round(response.data.main.temp);
		this.cityWeatherDesc[i].innerHTML = `${response.data.weather[0].description}`;
		weatherService.renderIcons(
			item,
			response.data.weather[0].id,
			response.data.weather[0].icon,
			'.global-icon'
		);
	},

	updateWeatherData: function (event) {
		const clickedEl = event.target.closest('.global-item');
		const clickedCountry = clickedEl.querySelector('.global-name').textContent;

		weatherService.displaySelectedLocationWeather(clickedCountry);
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	},
};

const OPENWEATHER_KEY = 'API-KEY-HERE';
const weatherService = new WeatherService(OPENWEATHER_KEY);

weatherService.initializeGeolocation();
weatherService.fetchCityList();
weatherService.fetchWeatherCodeList();
weatherService.getSavedLocation();
themeManager.initialize();
searchManager.initialize();
selectedLocationWeather.initialize();
globalWeather.initialize();
