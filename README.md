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
- Axios
- OpenWeather API

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

- Search cities from a database of over 200,000 cities and updates all content related to the selected city
- Geolocation button fetches the user’s current location and updates all content based on user’s city
- Toggle weather data between imperial and metric
- ‘Forecast In Other Cities’ section shows current weather data for 5 random cities from around the world; clicking on the city will update the weather dashboard with that city’s weather data

**Additional Functionality/Behind-the-Scenes**

- Save user’s last selected city to `localStorage`
- Save user’s last selected theme to `localStorage` 
- Display custom animated icons using the JSON file that I wrote to integrate with the data received through OpenWeather API
- Reusable functions to make API calls for search, geolocation or clicking on a city in the sidebar panel
- Use `forEach()` and `for` loops to display icons, city information, and daily forecast dynamically
- Set the icons `alt` attribute matching to the weather description
- Formatted UNIX timestamps to display sunset, sunrise and current time are local to the city that is selected
- Change the landscape background image for sunset/sunrise card based on time
- Utilized Axios to make HTTP requests to API

## Future Features
- ☐ Autosuggestions for search input
- ☐ Add option to download as PWA
