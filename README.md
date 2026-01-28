# Mapping the Gay Guides

Interactive exploration tool for LGBTQ+ historical guidebook data (1965-2003).

## Project Overview

This web application visualizes data from two historically significant LGBTQ+ travel guidebooks:
- **Bob Damron's Address Book** - The primary gay travel guide in America
- **Gaia's Guide** - A women-focused alternative guidebook

The dataset contains nearly 200,000 geocoded locations across the United States.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Data Processing

If you need to regenerate the processed JSON files from the source CSV:

```bash
npm run process-data
```

## Project Structure

```
├── data/
│   ├── all-data-cleaned-geocoded.csv    # Source data
│   ├── all-data-relative-location-by-year.csv
│   └── processed/                        # Generated JSON for web
│       ├── map-data.json                 # Lightweight map points
│       ├── details.json                  # Full venue details
│       └── stats.json                    # Aggregated statistics
├── src/
│   ├── main.js                          # Application entry point
│   └── styles.css                       # Styles
├── index.html                           # Main HTML
└── package.json
```

## Features

- **Interactive Map**: Browse ~195,000 locations with clustering
- **Timeline Animation**: Watch the landscape change from 1965-2003
- **Filters**: Filter by year range, publication, category, state
- **Search**: Find specific venues, cities, or states
- **Details Panel**: View full information for each location
- **Statistics**: Real-time breakdown of visible data

## Deployment

For production deployment to your private server:

1. Build the project: `npm run build`
2. Copy the `dist/` directory to your web server
3. Ensure the server serves `index.html` for all routes (SPA)

## Data Notes

- Locations are geocoded to city level
- Star ratings appear primarily in Gaia's Guide entries
- Categories have been standardized from original venue types
- Some entries may lack complete address information

## Credits

[Placeholder: Add research team and institutional credits]

## License

[Placeholder: Add license information]
