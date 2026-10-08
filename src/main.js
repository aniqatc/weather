// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

// Storage helpers: localStorage can throw (private mode, blocked storage), so never let it break the app
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore: saving preferences is a convenience, not a requirement
    }
  },
};

// Small fetch wrapper with the same shape the app used from axios: resolves { data, status },
// rejects with error.response.status set for HTTP errors (e.g. 404 for an unknown city)
const http = {
  async get(url, { params } = {}) {
    const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      error.response = { status: response.status };
      throw error;
    }
    return { data: await response.json(), status: response.status };
  },
};

// Unit conversion. All API calls use imperial units; metric values are converted locally,
// so switching units re-renders instantly instead of re-fetching every city.
const units = {
  current: storage.get('units') === 'metric' ? 'metric' : 'imperial',

  isMetric() {
    return this.current === 'metric';
  },
  temp(fahrenheit) {
    return Math.round(this.isMetric() ? ((fahrenheit - 32) * 5) / 9 : fahrenheit);
  },
  wind(mph) {
    return Math.round(this.isMetric() ? mph * 1.60934 : mph);
  },
  visibility(meters) {
    return Math.round(this.isMetric() ? meters / 1000 : meters / 1609.34);
  },
  tempLabel() {
    return this.isMetric() ? 'C' : 'F';
  },
  otherTempLabel() {
    return this.isMetric() ? 'F' : 'C';
  },
  windLabel() {
    return this.isMetric() ? 'km/h' : 'mph';
  },
  visibilityLabel() {
    return this.isMetric() ? 'km' : 'mi';
  },
};

// Weather App
class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.generalData = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastData = 'https://api.openweathermap.org/data/3.0/onecall';
    this.geolocationButton = document.querySelector('#geolocation-btn');
    this.iconsPromise = null;
    // Increments on each request for the main dashboard so a slow, older response can't overwrite a newer one
    this.requestId = 0;
  }

  // location is either { lat, lon } or { name }; URLSearchParams encodes them safely
  fetchCurrent(location) {
    const params = { appid: this.apiKey, units: 'imperial' };
    if (location.lat !== undefined && location.lon !== undefined) {
      params.lat = location.lat;
      params.lon = location.lon;
    } else {
      params.q = location.name;
    }
    return http.get(this.generalData, { params });
  }

  fetchForecast(coordinates) {
    return http.get(this.forecastData, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        exclude: 'minutely,hourly,alerts',
        appid: this.apiKey,
        units: 'imperial',
      },
    });
  }

  async displaySelectedLocationWeather(location) {
    const requestId = ++this.requestId;
    try {
      const response = await this.fetchCurrent(location);
      if (requestId !== this.requestId) return;
      selectedLocationWeather.setCurrent(response.data, location.label);
      this.displayForecast(response.data.coord, requestId);
    } catch (error) {
      if (requestId !== this.requestId) return;
      console.error('Unable to load current weather', error);
      const status = error.response && error.response.status;
      if (status === 404) {
        searchManager.showMessage(
          location.name
            ? `Couldn't find "${location.label || location.name}". Try adding a country, like "Paris, FR".`
            : "Couldn't find weather for that location. Try searching for a city.",
        );
      } else {
        searchManager.showMessage('Weather data is unavailable right now. Check your connection and try again.');
      }
      selectedLocationWeather.showUnavailable();
    }
  }

  async displayForecast(coordinates, requestId) {
    try {
      const response = await this.fetchForecast(coordinates);
      if (requestId !== this.requestId) return;
      dailyWeather.setForecast(response.data);
    } catch (error) {
      if (requestId !== this.requestId) return;
      console.error('Unable to load weekly forecast', error);
      dailyWeather.showUnavailable();
    }
  }

  initializeGeolocation() {
    this.geolocationButton.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        searchManager.showMessage("Your browser doesn't support location access. Search for a city instead.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          this.displaySelectedLocationWeather({ lat, lon });
        },
        (error) => {
          const message =
            error.code === error.PERMISSION_DENIED
              ? 'Location access is turned off. Allow it in your browser settings, or search for a city.'
              : "Couldn't get your location. Try again or search for a city.";
          searchManager.showMessage(message);
        },
        { timeout: 10000, maximumAge: 300000 },
      );
    });
  }

  getSavedLocation() {
    const saved = storage.get('location');
    let location = { name: 'New York' };

    if (saved) {
      try {
        // Current format: JSON with coordinates
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
          location = parsed;
        }
      } catch (error) {
        // Older versions saved just the city name as a plain string
        location = { name: saved };
      }
    }

    this.displaySelectedLocationWeather(location);
  }

  // icons.json is loaded once and shared by every icon on the page
  loadIcons() {
    if (!this.iconsPromise) {
      this.iconsPromise = http
        .get('/json/icons.json')
        .then((response) => response.data)
        .catch((error) => {
          this.iconsPromise = null;
          throw error;
        });
    }
    return this.iconsPromise;
  }

  async renderIcon(imgEl, dataId, dataIcon) {
    if (!imgEl) return;
    try {
      const customIcons = await this.loadIcons();
      const iconMatch = customIcons.find((icon) => icon.id === dataId && icon.icon === dataIcon);
      if (iconMatch) {
        imgEl.setAttribute('src', iconMatch.src);
        imgEl.setAttribute('alt', iconMatch.alt);
      }
    } catch (error) {
      console.error('Unable to load weather icons', error);
    }
  }
}

const themeManager = {
  body: document.querySelector('body'),
  themeToggle: document.querySelector('#flexSwitchCheckChecked'),

  initialize: function () {
    this.themeToggle.addEventListener('change', this.toggleTheme.bind(this));
    this.applyTheme(storage.get('theme') === 'dark');
  },

  applyTheme: function (isDark) {
    this.body.classList.toggle('dark', isDark);
    this.themeToggle.checked = isDark;
  },

  toggleTheme: function () {
    this.applyTheme(this.themeToggle.checked);
    storage.set('theme', this.themeToggle.checked ? 'dark' : 'light');
  },
};

// City search. Suggestions come from small prefix shards in /json/cities/ (built by
// scripts/build-city-index.py), so only the shard for what's being typed is downloaded.
const searchManager = {
  suggestionsList: document.querySelector('.search-suggestions'),
  searchForm: document.querySelector('.search-form'),
  searchInput: document.querySelector('#search-input'),
  shards: new Map(),
  debounceTimer: null,
  maxSuggestions: 6,

  initialize: function () {
    this.searchForm.addEventListener('submit', this.submitCity.bind(this));
    this.searchInput.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.typeInput(), 150);
    });
    this.searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.clearSuggestions();
      if (event.key === 'ArrowDown') {
        const first = this.suggestionsList.querySelector('li[tabindex]');
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    document.addEventListener('click', this.clickOutsideInput.bind(this));
    window.addEventListener('resize', () => {
      if (this.suggestionsList.children.length) this.positionSuggestions();
    });
  },

  // Line the dropdown up under the input. Both sit inside .input-group, which is position: relative,
  // so the input's offsets are measured from the same box the dropdown is positioned in.
  positionSuggestions: function () {
    const input = this.searchInput;
    this.suggestionsList.style.left = `${input.offsetLeft}px`;
    this.suggestionsList.style.top = `${input.offsetTop + input.offsetHeight}px`;
    this.suggestionsList.style.width = `${input.offsetWidth}px`;
  },

  // Lowercase and strip accents so "sao paulo" matches "São Paulo"
  normalize: function (text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  },

  // Must match shard_key() in scripts/build-city-index.py
  shardKey: function (normalizedText) {
    let key = '';
    for (const char of normalizedText) {
      key += /[a-z0-9]/.test(char) ? char : '_';
      if (key.length === 2) break;
    }
    return key.padEnd(2, '_');
  },

  loadShard: function (key) {
    if (!this.shards.has(key)) {
      const promise = http
        .get(`/json/cities/${key}.json`)
        .then((response) =>
          response.data.map(([name, state, country, lat, lon]) => ({
            name,
            state,
            country,
            lat,
            lon,
            search: this.normalize(name),
          })),
        )
        .catch((error) => {
          // A missing shard just means no city starts with these letters
          if (error.response && error.response.status === 404) return [];
          this.shards.delete(key);
          throw error;
        });
      this.shards.set(key, promise);
    }
    return this.shards.get(key);
  },

  submitCity: function (event) {
    event.preventDefault();
    const query = this.searchInput.value.trim();
    if (query) {
      this.clearSuggestions();
      weatherService.displaySelectedLocationWeather({ name: query });
    }
  },

  typeInput: async function () {
    const inputText = this.searchInput.value.trim();
    const query = this.normalize(inputText);

    if (query.length < 2) {
      this.clearSuggestions();
      return;
    }

    try {
      const cities = await this.loadShard(this.shardKey(query));
      // Ignore results for text the user has already changed
      if (this.normalize(this.searchInput.value.trim()) !== query) return;

      const matches = cities.filter((city) => city.search.startsWith(query));
      // Exact name matches first, then alphabetical (the shard is already sorted)
      matches.sort((a, b) => (b.search === query) - (a.search === query));
      this.showSuggestions(matches.slice(0, this.maxSuggestions));
    } catch (error) {
      console.error('Unable to load city suggestions', error);
      this.clearSuggestions();
    }
  },

  clickOutsideInput: function (event) {
    if (!this.suggestionsList.contains(event.target) && event.target !== this.searchInput) {
      this.clearSuggestions();
    }
  },

  cityLabel: function (city) {
    return [city.name, city.state, city.country].filter(Boolean).join(', ');
  },

  showSuggestions: function (suggestions) {
    this.clearSuggestions();
    if (!suggestions.length) return;

    suggestions.forEach((city) => {
      const li = document.createElement('li');
      li.textContent = this.cityLabel(city);
      li.tabIndex = 0;
      li.setAttribute('role', 'option');

      const choose = () => {
        this.searchInput.value = '';
        this.clearSuggestions();
        weatherService.displaySelectedLocationWeather({
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          label: city.state ? `${city.name}, ${city.state}` : city.name,
        });
      };

      li.addEventListener('click', choose);
      li.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') choose();
        if (event.key === 'Escape') {
          this.clearSuggestions();
          this.searchInput.focus();
        }
        if (event.key === 'ArrowDown' && li.nextElementSibling) {
          event.preventDefault();
          li.nextElementSibling.focus();
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          (li.previousElementSibling || this.searchInput).focus();
        }
      });

      this.suggestionsList.appendChild(li);
    });
    this.positionSuggestions();
    this.suggestionsList.style.opacity = '1';
  },

  // Non-clickable message in the suggestions dropdown (errors, location problems)
  showMessage: function (message) {
    this.clearSuggestions();
    const li = document.createElement('li');
    li.className = 'suggestion-message';
    li.setAttribute('role', 'alert');
    li.textContent = message;
    this.suggestionsList.appendChild(li);
    this.positionSuggestions();
    this.suggestionsList.style.opacity = '1';
  },

  clearSuggestions: function () {
    this.suggestionsList.innerHTML = '';
    this.suggestionsList.style.opacity = '0';
  },
};

const timeManager = {
  // OpenWeather gives Unix seconds plus the city's UTC offset in seconds. Shifting by the offset and
  // formatting in UTC shows the city's local time, regardless of the viewer's own timezone.
  formatCityTime: function (unixSeconds, offsetSeconds, options) {
    return new Date((unixSeconds + offsetSeconds) * 1000).toLocaleString([], { ...options, timeZone: 'UTC' });
  },

  // One Call returns an IANA timezone name (e.g. "Asia/Tokyo"), so forecast days use the city's calendar
  formatDay: function (unixSeconds, timeZone) {
    try {
      return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { weekday: 'short', timeZone });
    } catch (error) {
      return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { weekday: 'short' });
    }
  },

  printLocalDateString: function (data) {
    const now = Math.floor(Date.now() / 1000);
    const localDate = this.formatCityTime(now, data.timezone, { weekday: 'long', month: 'long', day: 'numeric' });
    const localTime = this.formatCityTime(now, data.timezone, { hour: '2-digit', minute: '2-digit', hour12: true });
    document.querySelector('#today').textContent = `${localDate} at ${localTime}`;
  },

  displaySunsetSunriseTime: function (data) {
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    document.querySelector('#sunrise-time').textContent = this.formatCityTime(
      data.sys.sunrise,
      data.timezone,
      timeOptions,
    );
    document.querySelector('#sunset-time').textContent = this.formatCityTime(
      data.sys.sunset,
      data.timezone,
      timeOptions,
    );
    this.changeSceneryImage(data);
  },

  changeSceneryImage: function (data) {
    const scenery = document.querySelector('#scenery');
    const now = Math.floor(Date.now() / 1000);
    const isDay = now >= data.sys.sunrise && now < data.sys.sunset;

    scenery.src = isDay ? '/assets/day-landscape.png' : '/assets/night-landscape.png';
    scenery.alt = isDay ? 'Day landscape' : 'Night landscape';
  },
};

const selectedLocationWeather = {
  locationHeading: document.querySelector('#location'),
  celsius: document.querySelector('.celsius'),
  windUnit: document.querySelector('#wind-unit'),
  visibilityUnit: document.querySelector('#visibility-unit'),
  currentTemp: document.querySelector('#temp-now'),
  feelsLikeTemp: document.querySelector('#feels-like'),
  tempDescription: document.querySelector('#description-temp'),
  wind: document.querySelector('#wind'),
  humidity: document.querySelector('#humidity'),
  visibility: document.querySelector('#visibility'),
  clouds: document.querySelector('#clouds'),
  conditionMsg: document.querySelector('#condition-msg'),
  mainIcon: document.querySelector('.default-main-icon'),
  data: null,
  label: null,

  initialize: function () {
    this.celsius.addEventListener('click', this.toggleTemp.bind(this));
    this.renderUnitLabels();
  },

  toggleTemp: function (event) {
    event.preventDefault();
    units.current = units.isMetric() ? 'imperial' : 'metric';
    storage.set('units', units.current);

    // Re-render everything from data we already have
    this.renderUnitLabels();
    this.render();
    dailyWeather.render();
    globalWeather.render();
  },

  renderUnitLabels: function () {
    document.querySelectorAll('.fahrenheit').forEach((el) => (el.textContent = units.tempLabel()));
    this.celsius.textContent = units.otherTempLabel();
    this.windUnit.textContent = units.windLabel();
    if (this.visibilityUnit) this.visibilityUnit.textContent = units.visibilityLabel();
  },

  setCurrent: function (data, label) {
    this.data = data;
    this.label = label || null;
    dailyWeather.reset();
    this.render();

    const { lat, lon } = data.coord;
    storage.set('location', JSON.stringify({ name: data.name, label: this.label, lat, lon }));
  },

  render: function () {
    const data = this.data;
    if (!data) return;

    this.displayWeatherDetails(data);
    this.displayWeatherCondition(data.weather[0].main);
    weatherService.renderIcon(this.mainIcon, data.weather[0].id, data.weather[0].icon);
    timeManager.printLocalDateString(data);
    timeManager.displaySunsetSunriseTime(data);
  },

  displayWeatherDetails: function (data) {
    const place = this.label || data.name;
    this.locationHeading.textContent = data.sys.country ? `${place}, ${data.sys.country}` : place;
    this.currentTemp.textContent = units.temp(data.main.temp);
    this.feelsLikeTemp.textContent = units.temp(data.main.feels_like);
    this.tempDescription.textContent = data.weather[0].description;
    this.wind.textContent = units.wind(data.wind.speed);
    this.humidity.textContent = data.main.humidity;
    this.visibility.textContent = data.visibility !== undefined ? units.visibility(data.visibility) : '--';
    this.clouds.textContent = data.clouds.all;
  },

  displayWeatherCondition: function (weatherType) {
    switch (weatherType) {
      case 'Rain':
      case 'Drizzle':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-umbrella"></i> Umbrella Required`;
        break;
      case 'Clouds':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-cloud"></i> Cloudy Skies`;
        break;
      case 'Thunderstorm':
      case 'Tornado':
      case 'Squall':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-cloud-bolt"></i> Stay Indoors`;
        break;
      case 'Snow':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-snowflake"></i> Dress Warm`;
        break;
      case 'Clear':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ideal Conditions`;
        break;
      case 'Mist':
      case 'Fog':
      case 'Haze':
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Visibility`;
        break;
      default:
        // Smoke, Dust, Sand, Ash
        this.conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Air Quality`;
    }
  },

  showUnavailable: function () {
    if (!this.data) {
      this.locationHeading.textContent = 'Unavailable';
      document.querySelector('#today').textContent = 'Search for a city to see its weather.';
    }
  },
};

const dailyWeather = {
  dewPoint: document.querySelector('#dew-point'),
  highTemp: document.querySelector('#high-temp'),
  lowTemp: document.querySelector('#low-temp'),
  forecastContainer: document.querySelector('.full-forecast'),
  data: null,

  setForecast: function (data) {
    this.data = data;
    this.render();
  },

  // Clear the previous city's values while the new forecast loads
  reset: function () {
    this.data = null;
    this.highTemp.textContent = '--';
    this.lowTemp.textContent = '--';
    this.dewPoint.textContent = '--';
  },

  render: function () {
    const data = this.data;
    if (!data) return;

    // Dew point is only available with the One Call API, not the current-weather call
    this.dewPoint.textContent = units.temp(data.current.dew_point);

    // Today's high/low come from the daily forecast. The current-weather temp_max/temp_min are
    // the spread across nearby stations right now, not the day's forecast high and low.
    const today = data.daily[0];
    this.highTemp.textContent = units.temp(today.temp.max);
    this.lowTemp.textContent = units.temp(today.temp.min);

    const unit = units.tempLabel();
    const days = data.daily.slice(0, 7);

    this.forecastContainer.innerHTML = days
      .map(
        (day, index) => `
			<div class="daily m-2 m-md-0">
				<p>${index === 0 ? 'Today' : timeManager.formatDay(day.dt, data.timezone)}</p>
				<img
					src="/assets/loading.svg"
					class="weather-icon forecast-icon mb-2"
					height="45"
					width="50"
					alt="Loading icon"
					id="icon-${index}"
				/>
				<p>
					<span class="temps">${units.temp(day.temp.max)}</span>°<span class="fahrenheit">${unit}</span><br />
					<span class="daily-low">
						<span class="forecast-low temps">${units.temp(day.temp.min)}</span>°<span class="fahrenheit">${unit}</span>
					</span>
				</p>
			</div>`,
      )
      .join('');

    days.forEach((day, index) => {
      weatherService.renderIcon(
        this.forecastContainer.querySelector(`#icon-${index}`),
        day.weather[0].id,
        day.weather[0].icon,
      );
    });
  },

  showUnavailable: function () {
    this.forecastContainer.innerHTML = '<p class="forecast-error">Weekly forecast unavailable. Try again later.</p>';
  },
};

const globalWeather = {
  globalContainer: document.querySelector('.global-items-wrapper'),
  cityTemps: document.querySelectorAll('.global-temps'),
  cityWeatherDesc: document.querySelectorAll('.global-descriptions'),
  cityNames: document.querySelectorAll('.global-name'),
  countryNames: document.querySelectorAll('.country-name'),
  countryRows: document.querySelectorAll('.global-item'),
  cities: [
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
    'Santiago',
    'Miami',
    'Sydney',
  ],
  data: [],

  // Fisher-Yates shuffle (sort with Math.random() is biased)
  shuffle: function (list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },

  initialize: function () {
    this.globalContainer.addEventListener('click', this.updateWeatherData.bind(this));
    this.getGlobalTemperatures();
  },

  getGlobalTemperatures: function () {
    const picks = this.shuffle(this.cities);
    this.countryRows.forEach((item, i) => {
      weatherService
        .fetchCurrent({ name: picks[i] })
        .then((response) => {
          this.data[i] = response.data;
          this.renderRow(i);
        })
        .catch((error) => {
          console.error(`Unable to load weather for ${picks[i]}`, error);
          this.cityNames[i].textContent = picks[i];
          this.cityWeatherDesc[i].textContent = 'unavailable';
        });
    });
  },

  render: function () {
    this.data.forEach((_, i) => this.renderRow(i));
  },

  renderRow: function (i) {
    const data = this.data[i];
    if (!data) return;
    const item = this.countryRows[i];

    this.cityNames[i].textContent = data.name;
    this.countryNames[i].textContent = data.sys.country;
    this.cityTemps[i].textContent = units.temp(data.main.temp);
    this.cityWeatherDesc[i].textContent = data.weather[0].description;
    item.dataset.lat = data.coord.lat;
    item.dataset.lon = data.coord.lon;
    weatherService.renderIcon(item.querySelector('.global-icon'), data.weather[0].id, data.weather[0].icon);
  },

  updateWeatherData: function (event) {
    const clickedEl = event.target.closest('.global-item');
    // Clicks on the dividers or padding between rows have no city
    if (!clickedEl || !clickedEl.dataset.lat) return;

    const name = clickedEl.querySelector('.global-name').textContent;
    weatherService.displaySelectedLocationWeather({
      name,
      label: name,
      lat: Number(clickedEl.dataset.lat),
      lon: Number(clickedEl.dataset.lon),
    });
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  },
};

const OPENWEATHER_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE'; // Replace with your actual OpenWeather API key
const weatherService = new WeatherService(OPENWEATHER_KEY);

themeManager.initialize();
searchManager.initialize();
selectedLocationWeather.initialize();
weatherService.initializeGeolocation();
weatherService.getSavedLocation();
globalWeather.initialize();
