# Star Wars Universe Explorer

A simple web application that loads data from the Star Wars API and displays them as organized cards.

## Features

- 🎬 Explore Star Wars characters, planets, species, and starships
- 📱 Responsive design that works on desktop, tablet, and mobile
- 🎨 Beautiful dark theme with Star Wars aesthetic
- ⚡ Fast data loading from external API
- 🖼️ Cards with images and detailed information
- 🌐 English language interface

## Requirements

- Node.js (v12 or higher)
- npm (comes with Node.js)

## Installation

1. Open a terminal/command prompt in the project folder

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the server:
```bash
npm start
```

The application will start at `http://localhost:3000`

You should see:
- ⭐ Star Wars Universe Explorer heading
- Navigation buttons for Categories (Characters, Planets, Species, Starships)
- Grid of cards displaying the data from each category

## How It Works

### Backend
- Express.js server running on port 3000
- Fetches data from the Star Wars Databank API
- Provides endpoints for different categories:
  - `/api/characters` - Character information
  - `/api/planets` - Planet information
  - `/api/species` - Species information
  - `/api/starships` - Starship information

### Frontend
- HTML/CSS/JavaScript single-page application
- Displays cards organized by categories
- Each card shows:
  - Image of the item
  - Name
  - Relevant information (varies by category)
  - Beautiful hover effects

## Project Structure

```
.
├── package.json        - Project dependencies
├── server.js          - Express backend server
└── public/
    ├── index.html     - Main HTML file
    ├── styles.css     - Styling and responsive design
    └── app.js         - Frontend JavaScript logic
```

## Categories

### Characters
Display information like:
- Birth Year
- Height
- Gender
- Hair Color

### Planets
Display information like:
- Climate
- Terrain
- Population
- Diameter

### Species
Display information like:
- Classification
- Lifespan
- Language
- Homeworld

### Starships
Display information like:
- Class
- Length
- Manufacturer
- Crew

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can modify the PORT variable in `server.js`

### API Connection Issues
The app fetches from `https://starwars-databank.vercel.app/`
Make sure you have an active internet connection

### No Images Loading
The app uses fallback images if API images aren't available. All items will still display with placeholder images.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: Star Wars Databank API
- **Additional**: Axios (for API calls), CORS (for cross-origin requests)

## Author

Created as a Star Wars Universe Explorer application

## License

Open source - feel free to use and modify
