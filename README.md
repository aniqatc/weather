# <a href="https://weather.aniqa.dev" target="_blank">Weather Dashboard</a>
The Weather Dashboard provides an overview of weather conditions in the specified city with an option to toggle all temperature units to Celsius and back to Fahrenheit. Sidebar provides access to random major cities and their current weather.

<img src="https://user-images.githubusercontent.com/25181517/189715289-df3ee512-6eca-463f-a0f4-c10d94a06b2f.png" width="20px">  <img src="https://user-images.githubusercontent.com/25181517/192158954-f88b5814-d510-4564-b285-dff7d6400dad.png" width="20px"> <img src="https://user-images.githubusercontent.com/25181517/183898674-75a4a1b1-f960-4ea9-abcb-637170a00a75.png" width="20px">  <img src="https://user-images.githubusercontent.com/25181517/183898054-b3d693d4-dafb-4808-a509-bab54cf5de34.png" width="20px"> <img src="https://user-images.githubusercontent.com/25181517/117447155-6a868a00-af3d-11eb-9cfe-245df15c9f3f.png" width="20px">

# Key Features
Designing and building the Weather Dashboard taught me a lot since it was my first JavaScript-heavy website, my first time using an API to pull live data and my first time relying mostly on Bootstrap to create a responsive layout. Here's an overview of the features I created and the *some* of the key topics I tackled:
- Responsive application using Bootstrap and no explicit media queries
- Light/dark mode toggling
- CSS variables used to keep track of light and dark mode styles
- Save user's last searched city to localStorage
- Save user's theme preference to localStorage
- Custom animated icons added through JSON file (that I wrote to connect with OpenWeather data)
- Advanced usage of flexbox & grid containers
- Custom scrollbar wherever required
- Created reusable functions to make API calls for searches, geolocation, and clicking on the cities in the sidebar panel
- Sidebar panel shows a random list of 5 major cities every time the page is loaded
- Used forEach() and for loops to display icons, city information, and daily forecast dynamically
- Added support for Celsius and Fahrenheit units
- Formatted UNIX timestamps to format Sunset, Sunrise and current time local to the city that is selected
- Added custom message depending on the type of weather condition (below "Feels Like" value)
- Change the landscape background image for Sunset/Sunrise Card based on whether current time is past sunset or before
- Used Axios to make HTTP requests to API
- Added a custom loading spinner animation as the default image for weather icons (allows user to see a loading image instead of a broken image tag until the weather icons loads)

# Light Mode
<a href="https://weather.aniqa.dev" target="_blank"><img src="https://github.com/aniqatc/weather/blob/main/assets/og-img.png?raw=true" style="max-width: 100%;"></a>

# Dark Mode
<a href="https://weather.aniqa.dev" target="_blank"><img src="/assets/screenshot-dark.png" style="max-width: 100%;"></a>
