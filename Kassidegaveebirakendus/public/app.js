const cardsGrid = document.getElementById("cardsGrid");
const statsText = document.getElementById("statsText");
const breedSearch = document.getElementById("breedSearch");
const breedSelect = document.getElementById("breedSelect");
const countrySelect = document.getElementById("countrySelect");
const sortSelect = document.getElementById("sortSelect");
const reloadButton = document.getElementById("reloadButton");
const langSelect = document.getElementById("langSelect");
const langLabel = document.getElementById("langLabel");
const heroKicker = document.getElementById("heroKicker");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitle = document.getElementById("heroSubtitle");
const searchLabel = document.getElementById("searchLabel");
const breedLabel = document.getElementById("breedLabel");
const countryLabel = document.getElementById("countryLabel");
const sortLabel = document.getElementById("sortLabel");
const panelSummary = document.getElementById("panelSummary");
const favoritesToggle = document.getElementById("favoritesToggle");
const viewToggle = document.getElementById("viewToggle");
const themeToggle = document.getElementById("themeToggle");
const autoToggle = document.getElementById("autoToggle");
const surpriseButton = document.getElementById("surpriseButton");
const template = document.getElementById("catCardTemplate");

const dict = {
  ru: {
    lang: "Язык",
    kicker: "Веб-приложение",
    title: "Карточки с котиками из внешнего API",
    subtitle: "Приложение загружает случайных кошек из TheCatAPI и показывает картинку, породу, страну и описание.",
    reload: "Загрузить новых кошек",
    searchLabel: "Поиск по породе",
    searchPlaceholder: "Введите название породы",
    breedLabel: "Порода",
    allBreeds: "Все породы",
    countryLabel: "Страна",
    allCountries: "Все страны",
    sortLabel: "Сортировка",
    sortBreed: "От А до Я (порода)",
    sortCountry: "От А до Я (страна)",
    loading: "Загрузка карточек...",
    loadedCards: "Загружено карточек",
    loadError: "Ошибка загрузки данных. Проверьте сервер.",
    loadFailed: "Не удалось загрузить карточки",
    empty: "Ничего не найдено. Попробуйте изменить фильтры.",
    breedPrefix: "Порода",
    countryPrefix: "Страна",
    temperamentPrefix: "Характер",
    noData: "Нет данных",
    favOnly: "Только избранные",
    view: "Вид",
    grid: "Сетка",
    list: "Список",
    theme: "Тема",
    light: "Светлая",
    dark: "Темная",
    auto: "Автообновление",
    on: "Вкл",
    off: "Выкл",
    surprise: "Удиви меня",
    summaryLoaded: "Загружено",
    summaryVisible: "Видно",
    summaryFav: "Избранных",
    favAria: "Избранное",
    temperamentTitle: "Характер"
  },
  en: {
    lang: "Language",
    kicker: "Web App",
    title: "Cat Cards from External API",
    subtitle: "The app loads random cats from TheCatAPI and shows image, breed, country, and description.",
    reload: "Load New Cats",
    searchLabel: "Search by Breed",
    searchPlaceholder: "Type breed name",
    breedLabel: "Breed",
    allBreeds: "All breeds",
    countryLabel: "Country",
    allCountries: "All countries",
    sortLabel: "Sort",
    sortBreed: "A-Z (breed)",
    sortCountry: "A-Z (country)",
    loading: "Loading cards...",
    loadedCards: "Loaded cards",
    loadError: "Failed to load data. Check server.",
    loadFailed: "Could not load cards",
    empty: "Nothing found. Try changing filters.",
    breedPrefix: "Breed",
    countryPrefix: "Country",
    temperamentPrefix: "Temperament",
    noData: "No data",
    favOnly: "Favorites only",
    view: "View",
    grid: "Grid",
    list: "List",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    auto: "Auto refresh",
    on: "On",
    off: "Off",
    surprise: "Surprise me",
    summaryLoaded: "Loaded",
    summaryVisible: "Visible",
    summaryFav: "Favorites",
    favAria: "Favorite",
    temperamentTitle: "Temperament"
  },
  et: {
    lang: "Keel",
    kicker: "Veebirakendus",
    title: "Kassikaardid välisest API-st",
    subtitle: "Rakendus laadib TheCatAPI-st juhuslikud kassid ja kuvab pildi, tõu, päritoluriigi ning kirjelduse.",
    reload: "Laadi uued kassid",
    searchLabel: "Tõu otsing",
    searchPlaceholder: "Sisesta tõu nimi",
    breedLabel: "Tõug",
    allBreeds: "Kõik tõud",
    countryLabel: "Riik",
    allCountries: "Kõik riigid",
    sortLabel: "Sorteerimine",
    sortBreed: "A-Z (tõug)",
    sortCountry: "A-Z (riik)",
    loading: "Kaartide laadimine...",
    loadedCards: "Laaditud kaarte",
    loadError: "Andmete laadimine ebaõnnestus. Kontrolli serverit.",
    loadFailed: "Kaartide laadimine nurjus",
    empty: "Midagi ei leitud. Muuda filtreid.",
    breedPrefix: "Tõug",
    countryPrefix: "Riik",
    temperamentPrefix: "Iseloom",
    noData: "Andmed puuduvad",
    favOnly: "Ainult lemmikud",
    view: "Vaade",
    grid: "Ruudustik",
    list: "Nimekiri",
    theme: "Teema",
    light: "Hele",
    dark: "Tume",
    auto: "Automaatne värskendus",
    on: "Sees",
    off: "Väljas",
    surprise: "Üllata mind",
    summaryLoaded: "Laaditud",
    summaryVisible: "Nähtaval",
    summaryFav: "Lemmikuid",
    favAria: "Lemmik",
    temperamentTitle: "Iseloom"
  }
};

const state = {
  cards: [],
  countries: [],
  breeds: [],
  visibleCards: [],
  favorites: new Set(JSON.parse(localStorage.getItem("catFavorites") || "[]")),
  language: localStorage.getItem("catLanguage") || "ru",
  onlyFavorites: false,
  view: "grid",
  theme: localStorage.getItem("catTheme") || "light",
  autoRefresh: false,
  autoTimer: null
};

function t(key) {
  return dict[state.language][key];
}

function debounce(callback, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

function renderCountries(countryList) {
  const selected = countrySelect.value;
  const countries = [...new Set(countryList.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  countrySelect.innerHTML = `<option value="">${t("allCountries")}</option>`;

  for (const country of countries) {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.append(option);
  }

  if (countries.includes(selected)) {
    countrySelect.value = selected;
  }
}

function renderBreeds(breedList) {
  const selected = breedSelect.value;
  const breeds = [...new Set(breedList.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  breedSelect.innerHTML = `<option value="">${t("allBreeds")}</option>`;

  for (const breed of breeds) {
    const option = document.createElement("option");
    option.value = breed;
    option.textContent = breed;
    breedSelect.append(option);
  }

  if (breeds.includes(selected)) {
    breedSelect.value = selected;
  }
}

function updateToggleLabels() {
  const onOff = state.onlyFavorites ? t("on") : t("off");
  favoritesToggle.textContent = `${t("favOnly")}: ${onOff}`;
  viewToggle.textContent = `${t("view")}: ${state.view === "grid" ? t("grid") : t("list")}`;
  themeToggle.textContent = `${t("theme")}: ${state.theme === "light" ? t("light") : t("dark")}`;
  autoToggle.textContent = `${t("auto")}: ${state.autoRefresh ? t("on") : t("off")}`;
  surpriseButton.textContent = t("surprise");

  favoritesToggle.classList.toggle("active", state.onlyFavorites);
  viewToggle.classList.toggle("active", state.view === "list");
  themeToggle.classList.toggle("active", state.theme === "cool");
  autoToggle.classList.toggle("active", state.autoRefresh);
}

function updateSummary() {
  panelSummary.textContent = `${t("summaryLoaded")}: ${state.cards.length} | ${t("summaryVisible")}: ${state.visibleCards.length} | ${t("summaryFav")}: ${state.favorites.size}`;
  statsText.textContent = `${t("loadedCards")}: ${state.visibleCards.length}`;
}

function renderCards(cards) {
  cardsGrid.innerHTML = "";
  cardsGrid.classList.toggle("list-view", state.view === "list");

  if (!cards.length) {
    cardsGrid.innerHTML = `<div class="empty-state">${t("empty")}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const card of cards) {
    const node = template.content.cloneNode(true);
    const image = node.querySelector(".cat-image");
    const favBtn = node.querySelector(".fav-btn");

    image.src = card.imageUrl;
    image.alt = `${t("breedPrefix")}: ${card.breed}`;
    node.querySelector(".cat-breed").textContent = `${t("breedPrefix")}: ${card.breed}`;
    const countryLabelNode = node.querySelector(".cat-country")?.closest("p")?.querySelector("strong");
    const temperamentLabelNode = node.querySelector(".cat-temperament")?.closest("p")?.querySelector("strong");
    if (countryLabelNode) {
      countryLabelNode.textContent = `${t("countryPrefix")}:`;
    }
    if (temperamentLabelNode) {
      temperamentLabelNode.textContent = `${t("temperamentTitle")}:`;
    }
    node.querySelector(".cat-country").textContent = card.country || t("noData");
    node.querySelector(".cat-temperament").textContent = card.temperament || t("noData");
    node.querySelector(".cat-description").textContent = card.description || t("noData");

    favBtn.dataset.id = card.id;
    favBtn.setAttribute("aria-label", t("favAria"));
    favBtn.classList.toggle("active", state.favorites.has(card.id));
    favBtn.textContent = state.favorites.has(card.id) ? "★" : "☆";

    fragment.append(node);
  }

  cardsGrid.append(fragment);
}

function applyFiltersAndRender() {
  const q = breedSearch.value.trim().toLowerCase();
  const selectedBreed = breedSelect.value;
  const selectedCountry = countrySelect.value;
  const sort = sortSelect.value;

  let filtered = state.cards.filter((card) => {
    const breedMatches = q ? card.breed.toLowerCase().includes(q) : true;
    const exactBreedMatches = selectedBreed ? card.breed === selectedBreed : true;
    const countryMatches = selectedCountry ? card.country === selectedCountry : true;
    const favoriteMatches = state.onlyFavorites ? state.favorites.has(card.id) : true;
    return breedMatches && exactBreedMatches && countryMatches && favoriteMatches;
  });

  if (sort === "breed") {
    filtered = filtered.sort((a, b) => a.breed.localeCompare(b.breed));
  } else if (sort === "country") {
    filtered = filtered.sort((a, b) => a.country.localeCompare(b.country));
  }

  state.visibleCards = filtered;
  renderCards(state.visibleCards);
  updateSummary();
  updateToggleLabels();
}

function updateLanguageTexts() {
  document.documentElement.lang = state.language;
  langLabel.textContent = t("lang");
  heroKicker.textContent = t("kicker");
  heroTitle.textContent = t("title");
  heroSubtitle.textContent = t("subtitle");
  reloadButton.textContent = t("reload");
  searchLabel.textContent = t("searchLabel");
  breedSearch.placeholder = t("searchPlaceholder");
  breedLabel.textContent = t("breedLabel");
  countryLabel.textContent = t("countryLabel");
  sortLabel.textContent = t("sortLabel");

  sortSelect.innerHTML = `
    <option value="breed">${t("sortBreed")}</option>
    <option value="country">${t("sortCountry")}</option>
  `;

  if (!["breed", "country"].includes(sortSelect.value)) {
    sortSelect.value = "breed";
  }
}

function setTheme() {
  document.body.classList.toggle("theme-dark", state.theme === "dark");
}

function stopAutoRefresh() {
  if (state.autoTimer) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
}

function syncAutoRefresh() {
  stopAutoRefresh();

  if (state.autoRefresh) {
    state.autoTimer = setInterval(() => {
      loadCats();
    }, 30000);
  }
}

async function loadCats() {
  statsText.textContent = t("loading");
  reloadButton.disabled = true;

  const params = new URLSearchParams({
    limit: "24"
  });

  try {
    const response = await fetch(`/api/cats?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.cards = payload.cards;
    state.countries = payload.countries || state.cards.map((card) => card.country);
    state.breeds = payload.breeds || state.cards.map((card) => card.breed);

    renderBreeds(state.breeds);
    renderCountries(state.countries);
    applyFiltersAndRender();
  } catch (error) {
    cardsGrid.innerHTML = `<div class="empty-state">${t("loadError")}</div>`;
    statsText.textContent = `${t("loadFailed")}: ${error.message}`;
  } finally {
    reloadButton.disabled = false;
  }
}

function toggleFavorite(cardId) {
  if (state.favorites.has(cardId)) {
    state.favorites.delete(cardId);
  } else {
    state.favorites.add(cardId);
  }

  localStorage.setItem("catFavorites", JSON.stringify([...state.favorites]));
  applyFiltersAndRender();
}

function surpriseMe() {
  if (!state.visibleCards.length) {
    return;
  }

  const randomCard = state.visibleCards[Math.floor(Math.random() * state.visibleCards.length)];
  const target = cardsGrid.querySelector(`.fav-btn[data-id="${randomCard.id}"]`)?.closest(".cat-card");

  if (!target) {
    return;
  }

  cardsGrid.querySelectorAll(".cat-card.surprise").forEach((node) => node.classList.remove("surprise"));
  target.classList.add("surprise");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initializeUI() {
  langSelect.value = state.language;
  updateLanguageTexts();
  setTheme();
  updateToggleLabels();
}

const debouncedApplyFilters = debounce(applyFiltersAndRender, 250);

breedSearch.addEventListener("input", debouncedApplyFilters);
breedSelect.addEventListener("change", applyFiltersAndRender);
countrySelect.addEventListener("change", applyFiltersAndRender);
sortSelect.addEventListener("change", applyFiltersAndRender);
reloadButton.addEventListener("click", loadCats);

favoritesToggle.addEventListener("click", () => {
  state.onlyFavorites = !state.onlyFavorites;
  applyFiltersAndRender();
});

viewToggle.addEventListener("click", () => {
  state.view = state.view === "grid" ? "list" : "grid";
  applyFiltersAndRender();
});

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("catTheme", state.theme);
  setTheme();
  updateToggleLabels();
});

autoToggle.addEventListener("click", () => {
  state.autoRefresh = !state.autoRefresh;
  syncAutoRefresh();
  updateToggleLabels();
});

surpriseButton.addEventListener("click", surpriseMe);

langSelect.addEventListener("change", () => {
  state.language = langSelect.value;
  localStorage.setItem("catLanguage", state.language);
  updateLanguageTexts();
  renderBreeds(state.breeds);
  renderCountries(state.countries);
  applyFiltersAndRender();
});

cardsGrid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const favBtn = target.closest(".fav-btn");
  if (!favBtn) {
    return;
  }

  const cardId = favBtn.dataset.id;
  if (cardId) {
    toggleFavorite(cardId);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  loadCats();
});

window.addEventListener("beforeunload", stopAutoRefresh);