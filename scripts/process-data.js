/**
 * Data Processing Script for Mapping the Gay Guides
 * Converts large CSV to optimized JSON files for web performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Simple CSV parser for our specific data format
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function processData() {
  console.log('Starting data processing...');

  const csvPath = path.join(rootDir, 'data', 'all-data-cleaned-geocoded.csv');
  const outputDir = path.join(rootDir, 'data', 'processed');

  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);

  console.log(`Parsed ${records.length} records`);

  // Create lightweight version for map (only essential fields)
  console.log('Creating map data...');
  const mapData = records.map((r, index) => ({
    id: index,
    t: r.title || '',           // title
    c: r.city || '',            // city
    s: r.state || '',           // state
    y: parseInt(r.year) || 0,   // year
    p: r.publication === "Gaia's Guide" ? 'g' : 'd', // publication (g=Gaia's, d=Damron's)
    cat: r.category || '',      // category
    lat: parseFloat(r.lat) || 0,
    lon: parseFloat(r.lon) || 0
  })).filter(r => r.lat !== 0 && r.lon !== 0);

  // Create full details lookup (indexed by id)
  console.log('Creating details lookup...');
  const details = {};
  records.forEach((r, index) => {
    details[index] = {
      title: r.title || 'Unnamed',
      description: r.description || '',
      type: r.type || '',
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      stateFull: r['state.full'] || '',
      publication: r.publication || '',
      year: r.year || '',
      category: r.category || '',
      amenities: r.amenityfeatures || '',
      stars: r.stars || '',
      region: r.region || '',
      division: r.division || ''
    };
  });

  // Create aggregated statistics
  console.log('Creating statistics...');

  // By year
  const byYear = {};
  records.forEach(r => {
    const year = r.year;
    if (!byYear[year]) byYear[year] = { total: 0, damrons: 0, gaias: 0 };
    byYear[year].total++;
    if (r.publication === "Gaia's Guide") {
      byYear[year].gaias++;
    } else {
      byYear[year].damrons++;
    }
  });

  // By category
  const byCategory = {};
  records.forEach(r => {
    const cat = r.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat]++;
  });

  // By state
  const byState = {};
  records.forEach(r => {
    const state = r.state || 'Unknown';
    if (!byState[state]) byState[state] = 0;
    byState[state]++;
  });

  // By city (top 100)
  const byCity = {};
  records.forEach(r => {
    const city = `${r.city}, ${r.state}`;
    if (!byCity[city]) byCity[city] = 0;
    byCity[city]++;
  });
  const topCities = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .reduce((obj, [k, v]) => { obj[k] = v; return obj; }, {});

  // Get unique values for filters
  const years = [...new Set(records.map(r => r.year))].filter(y => y).sort();
  const categories = [...new Set(records.map(r => r.category))].filter(c => c).sort();
  const states = [...new Set(records.map(r => r.state))].filter(s => s).sort();
  const publications = [...new Set(records.map(r => r.publication))].filter(p => p);

  const stats = {
    totalRecords: records.length,
    byYear,
    byCategory,
    byState,
    topCities,
    filters: {
      years,
      categories,
      states,
      publications
    }
  };

  // Write output files
  console.log('Writing output files...');

  fs.writeFileSync(
    path.join(outputDir, 'map-data.json'),
    JSON.stringify(mapData)
  );
  console.log(`  map-data.json: ${mapData.length} points`);

  fs.writeFileSync(
    path.join(outputDir, 'details.json'),
    JSON.stringify(details)
  );
  console.log(`  details.json: ${Object.keys(details).length} entries`);

  fs.writeFileSync(
    path.join(outputDir, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
  console.log(`  stats.json: statistics and filter options`);

  console.log('\nData processing complete!');
  console.log(`Output files in: ${outputDir}`);
}

processData().catch(console.error);
