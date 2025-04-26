const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');

// Fetch initial featured meals
document.addEventListener('DOMContentLoaded', async () => {
  const promises = Array.from({ length: 5 }, () =>
    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
  );
  const responses = await Promise.all(promises);
  const meals = (await Promise.all(responses.map(r => r.json()))).map(d => d.meals[0]);
  renderMeals(meals);
});

// Search handler
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') doSearch();
});

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`
  );
  const data = await res.json();
  renderMeals(data.meals || []);
}

// Render meal cards with "View Recipe" button and detail container
function renderMeals(meals) {
  resultsContainer.innerHTML = '';
  if (!meals.length) {
    resultsContainer.innerHTML = '<p>No meals found. Try something else.</p>';
    return;
  }

  meals.slice(0, 5).forEach(meal => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <div class="meal-info">
        <h3>${meal.strMeal}</h3>
        <p>${meal.strInstructions.slice(0, 100)}…</p>
        <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
        <div class="details" hidden></div>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

// Delegate recipe detail fetch & display
resultsContainer.addEventListener('click', async e => {
  if (!e.target.classList.contains('view-btn')) return;

  const btn = e.target;
  const id = btn.dataset.id;
  const detailBox = btn.nextElementSibling;

  // If already shown, hide and return
  if (!detailBox.hasAttribute('hidden')) {
    detailBox.setAttribute('hidden', '');
    btn.textContent = 'View Recipe';
    return;
  }

  // Fetch full recipe details
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );
    const { meals } = await res.json();
    const meal = meals[0];

    // Build ingredient list
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const m = meal[`strMeasure${i}`];
      if (ing) ingredients.push(`<li>${m} ${ing}</li>`);
    }

    // Populate details
    detailBox.innerHTML = `
      <h4>Ingredients:</h4>
      <ul>${ingredients.join('')}</ul>
      <h4>Instructions:</h4>
      <p>${meal.strInstructions}</p>
    `;
    detailBox.removeAttribute('hidden');
    btn.textContent = 'Hide Recipe';

  } catch (err) {
    console.error('Error loading recipe:', err);
  }
});
