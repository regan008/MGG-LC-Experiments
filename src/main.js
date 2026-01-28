/**
 * Mapping the Gay Guides - Main Application
 * Interactive exploration tool for LGBTQ+ historical guidebook data
 */

// Global state
let map;
let markersLayer;
let allData = [];
let detailsData = {};
let stats = {};
let filteredData = [];
let animationInterval = null;

// Initialize application
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Load data files
    await loadData();

    // Initialize map
    initMap();

    // Initialize UI components
    initFilters();
    initSearch();
    initNavigation();
    initDetailsPanel();

    // Initial render
    applyFilters();

    // Hide loading
    document.getElementById('loading').classList.add('hidden');
  } catch (error) {
    console.error('Initialization error:', error);
    document.getElementById('loading').innerHTML = `
      <p style="color: red;">Error loading data. Please refresh the page.</p>
      <p style="font-size: 0.75rem; color: #666;">${error.message}</p>
    `;
  }
}

// Data Loading
async function loadData() {
  const [mapDataRes, statsRes, detailsRes] = await Promise.all([
    fetch('/data/processed/map-data.json'),
    fetch('/data/processed/stats.json'),
    fetch('/data/processed/details.json')
  ]);

  allData = await mapDataRes.json();
  stats = await statsRes.json();
  detailsData = await detailsRes.json();

  document.getElementById('total-count').textContent = allData.length.toLocaleString();
}

// Map Initialization
function initMap() {
  map = L.map('map', {
    center: [39.8283, -98.5795], // Center of US
    zoom: 4,
    minZoom: 3,
    maxZoom: 18
  });

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Initialize marker cluster group
  markersLayer = L.markerClusterGroup({
    chunkedLoading: true,
    chunkInterval: 50,
    chunkDelay: 25,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size = 'small';
      if (count > 100) size = 'medium';
      if (count > 500) size = 'large';

      return L.divIcon({
        html: `<div><span>${count >= 1000 ? Math.round(count/1000) + 'k' : count}</span></div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(40, 40)
      });
    }
  });

  map.addLayer(markersLayer);
}

// Create marker for a data point
function createMarker(point) {
  const isGaias = point.p === 'g';
  const marker = L.circleMarker([point.lat, point.lon], {
    radius: 6,
    fillColor: isGaias ? '#9b59b6' : '#3498db',
    color: '#fff',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  });

  // Popup on hover
  marker.bindTooltip(`
    <strong>${point.t || 'Unnamed'}</strong><br>
    ${point.c}, ${point.s} (${point.y})
  `, { direction: 'top' });

  // Click handler for details
  marker.on('click', () => showDetails(point.id));

  return marker;
}

// Filter Initialization
function initFilters() {
  // Populate category filter
  const categorySelect = document.getElementById('filter-category');
  stats.filters.categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Populate state filter
  const stateSelect = document.getElementById('filter-state');
  stats.filters.states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  // Year sliders
  const yearMin = document.getElementById('year-min');
  const yearMax = document.getElementById('year-max');
  const yearMinLabel = document.getElementById('year-min-label');
  const yearMaxLabel = document.getElementById('year-max-label');

  yearMin.addEventListener('input', () => {
    if (parseInt(yearMin.value) > parseInt(yearMax.value)) {
      yearMin.value = yearMax.value;
    }
    yearMinLabel.textContent = yearMin.value;
    applyFilters();
  });

  yearMax.addEventListener('input', () => {
    if (parseInt(yearMax.value) < parseInt(yearMin.value)) {
      yearMax.value = yearMin.value;
    }
    yearMaxLabel.textContent = yearMax.value;
    applyFilters();
  });

  // Publication checkboxes
  document.getElementById('filter-damrons').addEventListener('change', applyFilters);
  document.getElementById('filter-gaias').addEventListener('change', applyFilters);

  // Category select
  categorySelect.addEventListener('change', applyFilters);

  // State select
  stateSelect.addEventListener('change', applyFilters);

  // Clear categories button
  document.getElementById('clear-categories').addEventListener('click', () => {
    Array.from(categorySelect.options).forEach(opt => opt.selected = opt.value === '');
    applyFilters();
  });

  // Reset all filters
  document.getElementById('reset-filters').addEventListener('click', resetFilters);

  // Play button for animation
  const playBtn = document.getElementById('play-btn');
  playBtn.addEventListener('click', toggleAnimation);
}

function resetFilters() {
  document.getElementById('year-min').value = 1965;
  document.getElementById('year-max').value = 2003;
  document.getElementById('year-min-label').textContent = '1965';
  document.getElementById('year-max-label').textContent = '2003';
  document.getElementById('filter-damrons').checked = true;
  document.getElementById('filter-gaias').checked = true;
  document.getElementById('filter-state').value = '';

  const categorySelect = document.getElementById('filter-category');
  Array.from(categorySelect.options).forEach(opt => opt.selected = opt.value === '');

  document.getElementById('current-year-display').textContent = '';

  if (animationInterval) {
    stopAnimation();
  }

  applyFilters();
}

function applyFilters() {
  const yearMin = parseInt(document.getElementById('year-min').value);
  const yearMax = parseInt(document.getElementById('year-max').value);
  const showDamrons = document.getElementById('filter-damrons').checked;
  const showGaias = document.getElementById('filter-gaias').checked;
  const selectedState = document.getElementById('filter-state').value;

  const categorySelect = document.getElementById('filter-category');
  const selectedCategories = Array.from(categorySelect.selectedOptions)
    .map(opt => opt.value)
    .filter(v => v !== '');

  filteredData = allData.filter(point => {
    // Year filter
    if (point.y < yearMin || point.y > yearMax) return false;

    // Publication filter
    if (point.p === 'd' && !showDamrons) return false;
    if (point.p === 'g' && !showGaias) return false;

    // State filter
    if (selectedState && point.s !== selectedState) return false;

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(point.cat)) return false;

    return true;
  });

  updateMap();
  updateStats();
}

function updateMap() {
  markersLayer.clearLayers();

  const markers = filteredData.map(point => createMarker(point));
  markersLayer.addLayers(markers);

  document.getElementById('visible-count').textContent = filteredData.length.toLocaleString();
}

function updateStats() {
  // Category breakdown
  const categoryCounts = {};
  filteredData.forEach(point => {
    const cat = point.cat || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  const breakdownHtml = sortedCategories.map(([cat, count]) => `
    <div class="category-bar">
      <span class="category-bar-label" title="${cat}">${cat}</span>
      <div class="category-bar-fill">
        <div class="category-bar-fill-inner" style="width: ${(count / maxCount * 100)}%"></div>
      </div>
      <span class="category-bar-count">${count.toLocaleString()}</span>
    </div>
  `).join('');

  document.getElementById('category-breakdown').innerHTML = breakdownHtml;
}

// Animation
function toggleAnimation() {
  if (animationInterval) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function startAnimation() {
  const playBtn = document.getElementById('play-btn');
  const yearDisplay = document.getElementById('current-year-display');
  const yearMin = document.getElementById('year-min');
  const yearMax = document.getElementById('year-max');
  const yearMinLabel = document.getElementById('year-min-label');
  const yearMaxLabel = document.getElementById('year-max-label');

  playBtn.textContent = '⏸ Pause';
  playBtn.classList.add('playing');

  let currentYear = 1965;

  animationInterval = setInterval(() => {
    yearMin.value = currentYear;
    yearMax.value = currentYear;
    yearMinLabel.textContent = currentYear;
    yearMaxLabel.textContent = currentYear;
    yearDisplay.textContent = currentYear;

    applyFilters();

    currentYear++;
    if (currentYear > 2003) {
      stopAnimation();
    }
  }, 800);
}

function stopAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  const playBtn = document.getElementById('play-btn');
  playBtn.textContent = '▶ Play';
  playBtn.classList.remove('playing');
}

// Search
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      const matches = allData
        .filter(point => {
          const title = (point.t || '').toLowerCase();
          const city = (point.c || '').toLowerCase();
          const state = (point.s || '').toLowerCase();
          return title.includes(query) || city.includes(query) || state.includes(query);
        })
        .slice(0, 20);

      if (matches.length === 0) {
        searchResults.innerHTML = '<p style="padding: 8px; color: #7f8c8d;">No results found</p>';
        return;
      }

      searchResults.innerHTML = matches.map(point => `
        <div class="search-result-item" data-id="${point.id}" data-lat="${point.lat}" data-lon="${point.lon}">
          <div class="result-title">${point.t || 'Unnamed'}</div>
          <div class="result-location">${point.c}, ${point.s} (${point.y})</div>
        </div>
      `).join('');

      // Add click handlers
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const lat = parseFloat(item.dataset.lat);
          const lon = parseFloat(item.dataset.lon);
          const id = parseInt(item.dataset.id);

          map.setView([lat, lon], 14);
          showDetails(id);
          searchResults.innerHTML = '';
          searchInput.value = '';
        });
      });
    }, 300);
  });
}

// Details Panel
function initDetailsPanel() {
  document.getElementById('close-details').addEventListener('click', hideDetails);
}

function showDetails(id) {
  const details = detailsData[id];
  if (!details) return;

  const panel = document.getElementById('details-panel');
  const content = document.getElementById('details-content');

  const isGaias = details.publication === "Gaia's Guide";

  content.innerHTML = `
    <div class="detail-header">
      <h2 class="detail-title">${details.title || 'Unnamed Location'}</h2>
      <span class="detail-category ${isGaias ? 'gaias' : ''}">${details.category || 'Uncategorized'}</span>
    </div>

    <div class="detail-section">
      <h4>Location</h4>
      <p>${details.address ? details.address + '<br>' : ''}${details.city}, ${details.stateFull || details.state}</p>
    </div>

    <div class="detail-section">
      <h4>Source</h4>
      <p>${details.publication} (${details.year})</p>
    </div>

    ${details.type ? `
    <div class="detail-section">
      <h4>Type</h4>
      <p>${details.type}</p>
    </div>
    ` : ''}

    ${details.description ? `
    <div class="detail-section">
      <h4>Description</h4>
      <p>${details.description}</p>
    </div>
    ` : ''}

    ${details.amenities ? `
    <div class="detail-section">
      <h4>Amenities/Features</h4>
      <p>${details.amenities}</p>
    </div>
    ` : ''}

    ${details.stars && details.stars !== 'NA' ? `
    <div class="detail-section">
      <h4>Rating</h4>
      <p>${details.stars}</p>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4>Region</h4>
      <p>${details.region}${details.division ? ' / ' + details.division : ''}</p>
    </div>
  `;

  panel.classList.remove('hidden');
}

function hideDetails() {
  document.getElementById('details-panel').classList.add('hidden');
}

// Navigation
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view + '-view';

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      views.forEach(v => {
        v.classList.remove('active');
        if (v.id === viewId) {
          v.classList.add('active');
        }
      });

      // Invalidate map size when switching to explore view
      if (viewId === 'explore-view') {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });
}
