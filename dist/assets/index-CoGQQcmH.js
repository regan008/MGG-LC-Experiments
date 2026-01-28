(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();let u,m,y=[],h={},p={},g=[],d=null;document.addEventListener("DOMContentLoaded",I);async function I(){try{await B(),b(),x(),T(),A(),D(),c(),document.getElementById("loading").classList.add("hidden")}catch(t){console.error("Initialization error:",t),document.getElementById("loading").innerHTML=`
      <p style="color: red;">Error loading data. Please refresh the page.</p>
      <p style="font-size: 0.75rem; color: #666;">${t.message}</p>
    `}}async function B(){const[t,e,a]=await Promise.all([fetch("/data/processed/map-data.json"),fetch("/data/processed/stats.json"),fetch("/data/processed/details.json")]);y=await t.json(),p=await e.json(),h=await a.json(),document.getElementById("total-count").textContent=y.length.toLocaleString()}function b(){u=L.map("map",{center:[39.8283,-98.5795],zoom:4,minZoom:3,maxZoom:18}),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(u),m=L.markerClusterGroup({chunkedLoading:!0,chunkInterval:50,chunkDelay:25,maxClusterRadius:50,spiderfyOnMaxZoom:!0,showCoverageOnHover:!1,iconCreateFunction:function(t){const e=t.getChildCount();let a="small";return e>100&&(a="medium"),e>500&&(a="large"),L.divIcon({html:`<div><span>${e>=1e3?Math.round(e/1e3)+"k":e}</span></div>`,className:`marker-cluster marker-cluster-${a}`,iconSize:L.point(40,40)})}}),u.addLayer(m)}function $(t){const e=t.p==="g",a=L.circleMarker([t.lat,t.lon],{radius:6,fillColor:e?"#9b59b6":"#3498db",color:"#fff",weight:1,opacity:1,fillOpacity:.8});return a.bindTooltip(`
    <strong>${t.t||"Unnamed"}</strong><br>
    ${t.c}, ${t.s} (${t.y})
  `,{direction:"top"}),a.on("click",()=>E(t.id)),a}function x(){const t=document.getElementById("filter-category");p.filters.categories.forEach(r=>{const l=document.createElement("option");l.value=r,l.textContent=r,t.appendChild(l)});const e=document.getElementById("filter-state");p.filters.states.forEach(r=>{const l=document.createElement("option");l.value=r,l.textContent=r,e.appendChild(l)});const a=document.getElementById("year-min"),o=document.getElementById("year-max"),n=document.getElementById("year-min-label"),i=document.getElementById("year-max-label");a.addEventListener("input",()=>{parseInt(a.value)>parseInt(o.value)&&(a.value=o.value),n.textContent=a.value,c()}),o.addEventListener("input",()=>{parseInt(o.value)<parseInt(a.value)&&(o.value=a.value),i.textContent=o.value,c()}),document.getElementById("filter-damrons").addEventListener("change",c),document.getElementById("filter-gaias").addEventListener("change",c),t.addEventListener("change",c),e.addEventListener("change",c),document.getElementById("clear-categories").addEventListener("click",()=>{Array.from(t.options).forEach(r=>r.selected=r.value===""),c()}),document.getElementById("reset-filters").addEventListener("click",C),document.getElementById("play-btn").addEventListener("click",k)}function C(){document.getElementById("year-min").value=1965,document.getElementById("year-max").value=2003,document.getElementById("year-min-label").textContent="1965",document.getElementById("year-max-label").textContent="2003",document.getElementById("filter-damrons").checked=!0,document.getElementById("filter-gaias").checked=!0,document.getElementById("filter-state").value="";const t=document.getElementById("filter-category");Array.from(t.options).forEach(e=>e.selected=e.value===""),document.getElementById("current-year-display").textContent="",d&&v(),c()}function c(){const t=parseInt(document.getElementById("year-min").value),e=parseInt(document.getElementById("year-max").value),a=document.getElementById("filter-damrons").checked,o=document.getElementById("filter-gaias").checked,n=document.getElementById("filter-state").value,i=document.getElementById("filter-category"),s=Array.from(i.selectedOptions).map(r=>r.value).filter(r=>r!=="");g=y.filter(r=>!(r.y<t||r.y>e||r.p==="d"&&!a||r.p==="g"&&!o||n&&r.s!==n||s.length>0&&!s.includes(r.cat))),w(),M()}function w(){m.clearLayers();const t=g.map(e=>$(e));m.addLayers(t),document.getElementById("visible-count").textContent=g.length.toLocaleString()}function M(){const t={};g.forEach(n=>{const i=n.cat||"Unknown";t[i]=(t[i]||0)+1});const e=Object.entries(t).sort((n,i)=>i[1]-n[1]).slice(0,8),a=e.length>0?e[0][1]:1,o=e.map(([n,i])=>`
    <div class="category-bar">
      <span class="category-bar-label" title="${n}">${n}</span>
      <div class="category-bar-fill">
        <div class="category-bar-fill-inner" style="width: ${i/a*100}%"></div>
      </div>
      <span class="category-bar-count">${i.toLocaleString()}</span>
    </div>
  `).join("");document.getElementById("category-breakdown").innerHTML=o}function k(){d?v():S()}function S(){const t=document.getElementById("play-btn"),e=document.getElementById("current-year-display"),a=document.getElementById("year-min"),o=document.getElementById("year-max"),n=document.getElementById("year-min-label"),i=document.getElementById("year-max-label");t.textContent="⏸ Pause",t.classList.add("playing");let s=1965;d=setInterval(()=>{a.value=s,o.value=s,n.textContent=s,i.textContent=s,e.textContent=s,c(),s++,s>2003&&v()},800)}function v(){d&&(clearInterval(d),d=null);const t=document.getElementById("play-btn");t.textContent="▶ Play",t.classList.remove("playing")}function T(){const t=document.getElementById("search-input"),e=document.getElementById("search-results");let a;t.addEventListener("input",o=>{clearTimeout(a);const n=o.target.value.trim().toLowerCase();if(n.length<2){e.innerHTML="";return}a=setTimeout(()=>{const i=y.filter(s=>{const r=(s.t||"").toLowerCase(),l=(s.c||"").toLowerCase(),f=(s.s||"").toLowerCase();return r.includes(n)||l.includes(n)||f.includes(n)}).slice(0,20);if(i.length===0){e.innerHTML='<p style="padding: 8px; color: #7f8c8d;">No results found</p>';return}e.innerHTML=i.map(s=>`
        <div class="search-result-item" data-id="${s.id}" data-lat="${s.lat}" data-lon="${s.lon}">
          <div class="result-title">${s.t||"Unnamed"}</div>
          <div class="result-location">${s.c}, ${s.s} (${s.y})</div>
        </div>
      `).join(""),e.querySelectorAll(".search-result-item").forEach(s=>{s.addEventListener("click",()=>{const r=parseFloat(s.dataset.lat),l=parseFloat(s.dataset.lon),f=parseInt(s.dataset.id);u.setView([r,l],14),E(f),e.innerHTML="",t.value=""})})},300)})}function D(){document.getElementById("close-details").addEventListener("click",O)}function E(t){const e=h[t];if(!e)return;const a=document.getElementById("details-panel"),o=document.getElementById("details-content"),n=e.publication==="Gaia's Guide";o.innerHTML=`
    <div class="detail-header">
      <h2 class="detail-title">${e.title||"Unnamed Location"}</h2>
      <span class="detail-category ${n?"gaias":""}">${e.category||"Uncategorized"}</span>
    </div>

    <div class="detail-section">
      <h4>Location</h4>
      <p>${e.address?e.address+"<br>":""}${e.city}, ${e.stateFull||e.state}</p>
    </div>

    <div class="detail-section">
      <h4>Source</h4>
      <p>${e.publication} (${e.year})</p>
    </div>

    ${e.type?`
    <div class="detail-section">
      <h4>Type</h4>
      <p>${e.type}</p>
    </div>
    `:""}

    ${e.description?`
    <div class="detail-section">
      <h4>Description</h4>
      <p>${e.description}</p>
    </div>
    `:""}

    ${e.amenities?`
    <div class="detail-section">
      <h4>Amenities/Features</h4>
      <p>${e.amenities}</p>
    </div>
    `:""}

    ${e.stars&&e.stars!=="NA"?`
    <div class="detail-section">
      <h4>Rating</h4>
      <p>${e.stars}</p>
    </div>
    `:""}

    <div class="detail-section">
      <h4>Region</h4>
      <p>${e.region}${e.division?" / "+e.division:""}</p>
    </div>
  `,a.classList.remove("hidden")}function O(){document.getElementById("details-panel").classList.add("hidden")}function A(){const t=document.querySelectorAll(".nav-btn"),e=document.querySelectorAll(".view");t.forEach(a=>{a.addEventListener("click",()=>{const o=a.dataset.view+"-view";t.forEach(n=>n.classList.remove("active")),a.classList.add("active"),e.forEach(n=>{n.classList.remove("active"),n.id===o&&n.classList.add("active")}),o==="explore-view"&&setTimeout(()=>u.invalidateSize(),100)})})}
