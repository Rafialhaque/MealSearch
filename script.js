(function() {
    'use strict';
    const searchBtn       = document.getElementById('search-btn');
    const searchInput     = document.getElementById('search-input');
    const resultsContainer= document.getElementById('results');
    const modal           = document.getElementById('details-modal');
    const btnClose        = modal.querySelector('.modal-close');
    const btnClose2       = modal.querySelector('.btn-close-details');
  
    const fld = {
      title:       document.getElementById('modal-title'),
      region:      document.getElementById('modal-region'),
      flagImg:     document.getElementById('modal-flag-img'),
      capital:     document.getElementById('modal-capital'),
      population:  document.getElementById('modal-population'),
      languages:   document.getElementById('modal-languages'),
      currencies:  document.getElementById('modal-currencies'),
      temp:        document.getElementById('modal-temp'),
      wind:        document.getElementById('modal-wind'),
      weatherIcon: document.getElementById('modal-weather-icon'),
    };
  
    let countriesData = [];
    let debounceTimer;
  
    function debounce(fn, delay = 500) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fn, delay);
    }
  
    function toggleUI(enabled) {
      searchBtn.disabled   = !enabled;
      searchInput.disabled = !enabled;
      searchBtn.textContent = enabled ? 'Search' : 'Searching...';
    }
  
    function showLoading() {
      resultsContainer.innerHTML = `<div class="loader">Loading...</div>`;
    }
  
    function showError(msg) {
      resultsContainer.innerHTML = `<div class="error" role="alert">Error: ${msg}</div>`;
    }
  
    async function fetchCountries() {
      const q = searchInput.value.trim();
      if (!q) return;
      toggleUI(false);
      showLoading();
      try {
        const res = await fetch(
          `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        countriesData = data;
        renderCountries(data);
      } catch (err) {
        console.error(err);
        showError(err.message || 'Unable to load data.');
      } finally {
        toggleUI(true);
      }
    }
  
    function renderCountries(list) {
      resultsContainer.innerHTML = '';
      if (!list.length) {
        showError('No countries found.');
        return;
      }
      list.forEach((country, idx) => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
          <img src="${country.flags.svg}" alt="Flag of ${country.name.common}" />
          <div class="country-info">
            <h3>${country.name.common}</h3>
            <p><strong>Region:</strong> ${country.region}</p>
            <button class="details-btn" data-index="${idx}">More Details</button>
          </div>
        `;
        resultsContainer.appendChild(card);
      });
    }
  
    function openModal()   { modal.classList.remove('hidden'); }
    function closeModal()  { modal.classList.add('hidden'); }
  
    btnClose.addEventListener('click', closeModal);
    btnClose2.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  
    resultsContainer.addEventListener('click', async e => {
      if (!e.target.classList.contains('details-btn')) return;
      const idx = e.target.dataset.index;
      const c = countriesData[idx];
  
      fld.title.textContent      = c.name.common;
      fld.region.textContent     = `${c.region} — ${c.subregion || ''}`;
      fld.flagImg.src            = c.flags.svg;
      fld.flagImg.alt            = `Flag of ${c.name.common}`;
      fld.capital.textContent    = c.capital?.[0] || 'N/A';
      fld.population.textContent = c.population.toLocaleString();
      fld.languages.textContent  = c.languages
        ? Object.values(c.languages).join(', ')
        : 'N/A';
      fld.currencies.textContent = c.currencies
        ? Object.values(c.currencies)
            .map(x => `${x.name} (${x.symbol})`)
            .join(', ')
        : 'N/A';
  
      try {
        const [lat, lon] = c.capitalInfo?.latlng || c.latlng;
        const wres = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const { current_weather: cw } = await wres.json();
        fld.temp.textContent = cw.temperature;
        fld.wind.textContent = cw.windspeed;
        fld.weatherIcon.textContent = cw.weathercode < 3 ? '☀️' : '☁️';
      } catch {
        fld.weatherIcon.textContent = '❓';
        fld.temp.textContent = '-';
        fld.wind.textContent = '-';
      }
  
      openModal();
    });
  
    searchBtn.addEventListener('click', fetchCountries);
    searchInput.addEventListener('keyup', e => {
      if (e.key === 'Enter') fetchCountries();
      else debounce(fetchCountries);
    });
  })();
  