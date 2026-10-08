## Weather Dashboard

[https://weather.aniqa.dev/](https://weather.aniqa.dev)

🌤️ A detailed light and dark mode dashboard with a complete overview of live weather conditions in the specified city. Option to toggle weather data between Celsius and Fahrenheit units. Sidebar with random major cities weather. Built using the OpenWeather API.

## Light Mode

<a href="https://weather.aniqa.dev" target="_blank"><img src="https://github.com/aniqatc/weather/blob/main/assets/og-img.png?raw=true" style="max-width: 100%;"></a>

## Dark Mode

<a href="https://weather.aniqa.dev" target="_blank"><img src="/assets/screenshot-dark.png" style="max-width: 100%;"></a>

## Tech

- HTML5
- CSS3
- Bootstrap
- JavaScript
- Fetch API
- OpenWeather API
- Progressive Web App (PWA)
- Service Worker

## Key Features

**Design**

- Fully responsive without using any media queries
- Layout and responsive achieved using Bootstrap
- Styling done through custom CSS
- Light and dark mode themes using CSS variables
- Custom animated icons ([https://bas.dev/work/meteocons](https://bas.dev/work/meteocons))
- Custom loading spinner animation that will appear until all data has been downloaded
- Minimalistic and cohesive design
- Subtle shadow usage to increase contrast between certain text elements and icons
- Custom scrollbar styling

**Interactive Elements**

- Search over 200,000 cities with debounced, accent-insensitive autosuggestions
- Search suggestions display city, state, and country and support keyboard navigation
- Selecting a suggestion searches by coordinates for more accurate results
- Geolocation button fetches the user’s current location and updates all weather data
- Toggle weather data between imperial and metric units without re-fetching weather data
- ‘Forecast In Other Cities’ section shows current weather data for 5 randomly selected cities from around the world
- Clicking a city in the sidebar updates the weather dashboard with that city’s weather data
- Responsive PWA with offline support and optimized caching

**Additional Functionality/Behind-the-Scenes**

- Save user’s last selected city and theme to `localStorage`
- Store the selected city with coordinates for more accurate weather requests
- Support legacy saved city values for backwards compatibility
- Use the city’s IANA timezone to display accurate local times and forecast day names
- Display custom animated icons using a JSON mapping file that integrates with OpenWeather API data
- Reusable functions for API requests, search, geolocation, and sidebar city selection
- Load city search data on demand using 520 alphabetically indexed shards instead of loading the entire city database
- Load weather icon data once and reuse it across the dashboard
- Use a service worker with network-first and stale-while-revalidate caching strategies
- Automatically remove outdated service worker caches
- Use native `fetch` for API requests with centralized error handling
- Safely handle `localStorage` access when storage is unavailable
- Format weather data and visibility according to the selected unit system

## Changelog

### 11/07/2023

- **Custom Search Suggestions**: Implemented a feature where search suggestions are dynamically generated and appear as the user types, enhancing the user experience by providing immediate suggestions for over 200K cities; additionally, added `searchManager` object to handle user queries from
- **WeatherService Class**: Enhanced API handling within the `WeatherService` class
- **ThemeManager Object**: Simplified theme management in the `themeManager`
- **TimeManager Object** - Centralized all time-related manipulations within the `timeManager` object
- **Objects for SelectedLocationWeather and GlobalWeather** - Improved handling of all weather-related data (both for the selected location and the randomized cities in the sidebar)

### 11/08/2023

- **Enabled PWA functionality** to improve offline usage and performance on mobile devices:
  - Implemented service worker caching for faster load times and offline access
  - Added manifest file with application icons

### 10/08/2026

#### User-facing bugs

- **Fixed incorrect forecast day names**: Forecast days now use the selected city's IANA timezone, and the first forecast card is labeled "Today".
- **Fixed stale weather data**: The service worker no longer caches OpenWeather API responses indefinitely. Page requests now use network-first caching, while static assets use stale-while-revalidate.
- **Fixed service worker installation**: Resolved duplicate and invalid icon paths that prevented `cache.addAll()` from completing successfully, enabling offline support.
- **Fixed metric wind speeds**: Weather requests now use imperial units and convert wind speed locally when metric units are selected.
- **Fixed daily high/low temperatures**: Today's high and low now come from the daily forecast instead of the current weather station temperature spread.
- **Improved weather descriptions**: Updated descriptions for `Clouds` and `Squall` conditions.
- **Improved visibility units**: Visibility now displays in miles or kilometers based on the selected unit system.
- **Fixed sidebar navigation errors**: Clicking between cities in "Forecast In Other Cities" no longer causes an error.
- **Improved error handling**: Search, weather requests, and geolocation failures now display helpful messages directly in the search interface.
- **Improved private browsing support**: `localStorage` access is now safely handled when storage is unavailable.

#### Performance

- **Reduced initial city data by 42 MB**: The original `cities.json` database was replaced with 520 smaller alphabetically indexed shards. Only the shard needed for the current search is downloaded.
- **Improved unit switching**: Changing between imperial and metric units now re-renders existing weather data instead of making additional API requests.
- **Reduced icon requests**: `icons.json` is loaded once instead of once for every weather icon.
- **Removed Axios**: Replaced Axios with a lightweight native `fetch` wrapper and removed the external unpkg dependency.
- **Improved service worker caching**: Cache versioning and cleanup prevent outdated cached assets from being retained.

#### Search

- **Accent-insensitive search**: Searching for `sao paulo` can now find São Paulo.
- **Improved suggestions**: Suggestions now display state and country information and are debounced to reduce unnecessary processing.
- **Keyboard navigation**: Search suggestions can be navigated with the arrow keys and selected with Enter or dismissed with Escape.
- **Coordinate-based selection**: Selecting an autocomplete result now searches using its coordinates, improving accuracy for cities with duplicate names.
- **Improved direct search**: Pressing Enter still supports city names and `City, CC` searches.
- **Improved city storage**: Saved locations now include coordinates while remaining compatible with previously saved string values.
