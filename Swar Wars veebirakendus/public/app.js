// Configuration
const CATEGORIES = [
    { key: 'characters', icon: '👨', endpoint: '/api/characters' },
    { key: 'locations', icon: '🪐', endpoint: '/api/locations' },
    { key: 'species', icon: '👽', endpoint: '/api/species' },
    { key: 'vehicles', icon: '🚀', endpoint: '/api/vehicles' }
];

const FAVORITES_STORAGE_KEY = 'sw-favorites';
const LANGUAGE_STORAGE_KEY = 'sw-language';
const LANGUAGE_ORDER = ['en', 'ru', 'et'];

const CHARACTER_ALIASES = {
    'luke skywalker': ['luke', 'люк', 'люк скайуокер', 'luuk skywalker'],
    'leia organa': ['princess leia', 'leia', 'лея', 'принцесса лея', 'printsess leia'],
    'han solo': ['han', 'хан', 'хан соло', 'haan solo'],
    'darth vader': ['vader', 'anakin', 'anakin skywalker', 'дарт вейдер', 'дарк вейдер'],
    'anakin skywalker': ['anakin', 'darth vader', 'энакин', 'энакин скайуокер', 'anakini'],
    'obi wan kenobi': ['obi-wan', 'kenobi', 'оби-ван', 'оби ван кеноби', 'obiwan'],
    yoda: ['master yoda', 'йода', 'meister yoda'],
    palpatine: ['emperor palpatine', 'darth sidious', 'палпатин', 'император палпатин', 'keiser palpatine'],
    chewbacca: ['chewie', 'чубакка', 'tsubaka'],
    'r2 d2': ['r2-d2', 'арту-диту', 'r2d2'],
    c3po: ['c-3po', 'си-3по', 'c3po'],
    'boba fett': ['boba', 'боба фетт'],
    'padme amidala': ['padme', 'amidala', 'падме', 'падме амидала'],
    'ahsoka tano': ['ahsoka', 'асока', 'асока тано'],
    rey: ['рей', 'rei'],
    'kylo ren': ['ben solo', 'кайло рен', 'kailo ren'],
    finn: ['финн'],
    'poe dameron': ['poe', 'по дамерон', 'po dameron'],
    'mace windu': ['mace', 'винду', 'мейс винду'],
    'count dooku': ['dooku', 'граф дуку', 'krahv dooku'],
    'qui gon jinn': ['qui-gon', 'квай-гон', 'квай гон джинн', 'qui gon'],
    'darth maul': ['maul', 'дарт мол']
};

const TRANSLATIONS = {
    en: {
        pageTitle: 'Star Wars Universe',
        pageSubtitle: 'Explore multiple categories from Star Wars Databank',
        searchPlaceholder: 'Search by name or description...',
        sortAria: 'Sort cards',
        sortDefault: 'Default order',
        sortAz: 'Name A-Z',
        sortZa: 'Name Z-A',
        controlsHeading: 'Control Deck',
        openControls: 'Open controls',
        closeControls: 'Close controls',
        favoritesOnly: 'Favorites only',
        forcePick: 'Force Pick',
        refresh: 'Refresh',
        languagePrefix: 'Language',
        loading: 'Loading...',
        footer: '© 2026 Star Wars Universe Explorer | Powered by Star Wars Databank API',
        copyDescription: 'Copy description',
        details: 'Details',
        save: '☆ Save',
        saved: '★ Saved',
        noData: 'No data available',
        unknown: 'Unknown',
        noDescription: 'No description available.',
        errorLoadCategories: 'Failed to load categories. Please try again.',
        toastRemovedFavorite: 'Removed from favorites',
        toastAddedFavorite: 'Added to favorites',
        toastNoVisibleCards: 'No visible cards to pick',
        toastForceChoice: 'The Force has chosen a card',
        toastRandomRefreshed: 'Random cards loaded',
        toastDescriptionCopied: 'Description copied',
        toastCopyFailed: 'Copy failed',
        labels: {
            id: 'ID',
            name: 'Name',
            description: 'Description',
            details: 'Details'
        },
        categories: {
            characters: 'Characters',
            locations: 'Locations',
            species: 'Species',
            vehicles: 'Vehicles'
        }
    },
    ru: {
        pageTitle: '⭐ Вселенная Star Wars',
        pageSubtitle: 'Изучайте несколько категорий из Star Wars Databank',
        searchPlaceholder: 'Поиск по имени или описанию...',
        sortAria: 'Сортировка карточек',
        sortDefault: 'По умолчанию',
        sortAz: 'Имя А-Я',
        sortZa: 'Имя Я-А',
        controlsHeading: 'Панель управления',
        openControls: 'Открыть параметры',
        closeControls: 'Закрыть параметры',
        favoritesOnly: 'Только избранное',
        forcePick: 'Выбор Силы',
        refresh: 'Обновить',
        languagePrefix: 'Язык',
        loading: 'Загрузка...',
        footer: '© 2026 Вселенная Star Wars | Работает на Star Wars Databank API',
        copyDescription: 'Скопировать описание',
        details: 'Подробнее',
        save: '☆ В избранное',
        saved: '★ В избранном',
        noData: 'Данные отсутствуют',
        unknown: 'Неизвестно',
        noDescription: 'Описание отсутствует.',
        errorLoadCategories: 'Не удалось загрузить категории. Попробуйте снова.',
        toastRemovedFavorite: 'Удалено из избранного',
        toastAddedFavorite: 'Добавлено в избранное',
        toastNoVisibleCards: 'Нет видимых карточек для выбора',
        toastForceChoice: 'Сила выбрала карточку',
        toastRandomRefreshed: 'Загружены случайные карточки',
        toastDescriptionCopied: 'Описание скопировано',
        toastCopyFailed: 'Не удалось скопировать',
        labels: {
            id: 'ID',
            name: 'Имя',
            description: 'Описание',
            details: 'Детали'
        },
        categories: {
            characters: 'Персонажи',
            locations: 'Локации',
            species: 'Виды',
            vehicles: 'Техника'
        }
    },
    et: {
        pageTitle: '⭐ Star Warsi universum',
        pageSubtitle: 'Avasta Star Wars Databanki mitut kategooriat',
        searchPlaceholder: 'Otsi nime või kirjelduse järgi...',
        sortAria: 'Kaartide sortimine',
        sortDefault: 'Vaikimisi järjekord',
        sortAz: 'Nimi A-Z',
        sortZa: 'Nimi Z-A',
        controlsHeading: 'Juhtpaneel',
        openControls: 'Ava seaded',
        closeControls: 'Sulge seaded',
        favoritesOnly: 'Ainult lemmikud',
        forcePick: 'Jõu valik',
        refresh: 'Värskenda',
        languagePrefix: 'Keel',
        loading: 'Laadimine...',
        footer: '© 2026 Star Warsi universum | Töötab Star Wars Databanki API peal',
        copyDescription: 'Kopeeri kirjeldus',
        details: 'Detailid',
        save: '☆ Salvesta',
        saved: '★ Salvestatud',
        noData: 'Andmed puuduvad',
        unknown: 'Tundmatu',
        noDescription: 'Kirjeldus puudub.',
        errorLoadCategories: 'Kategooriate laadimine ebaõnnestus. Proovi uuesti.',
        toastRemovedFavorite: 'Eemaldatud lemmikutest',
        toastAddedFavorite: 'Lisatud lemmikutesse',
        toastNoVisibleCards: 'Valimiseks pole nähtavaid kaarte',
        toastForceChoice: 'Jõud valis kaardi',
        toastRandomRefreshed: 'Juhuslikud kaardid on laaditud',
        toastDescriptionCopied: 'Kirjeldus kopeeritud',
        toastCopyFailed: 'Kopeerimine ebaõnnestus',
        labels: {
            id: 'ID',
            name: 'Nimi',
            description: 'Kirjeldus',
            details: 'Üksikasjad'
        },
        categories: {
            characters: 'Tegelased',
            locations: 'Asukohad',
            species: 'Liigid',
            vehicles: 'Sõidukid'
        }
    }
};

// DOM Elements
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const controlsHeading = document.getElementById('controlsHeading');
const controlsToggle = document.getElementById('controlsToggle');
const controlsPanel = document.getElementById('controlsPanel');
const categoriesContainer = document.getElementById('categoriesContainer');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const sortDefaultOption = document.getElementById('sortDefaultOption');
const sortAzOption = document.getElementById('sortAzOption');
const sortZaOption = document.getElementById('sortZaOption');
const favoritesOnly = document.getElementById('favoritesOnly');
const favoritesOnlyLabel = document.getElementById('favoritesOnlyLabel');
const randomBtn = document.getElementById('randomBtn');
const refreshBtn = document.getElementById('refreshBtn');
const languageBtn = document.getElementById('languageBtn');
const detailsModal = document.getElementById('detailsModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const copyDescriptionBtn = document.getElementById('copyDescriptionBtn');
const footerText = document.getElementById('footerText');
const toast = document.getElementById('toast');

const state = {
    query: '',
    sort: 'default',
    favoritesOnly: false,
    favorites: new Set(loadFavorites()),
    datasets: {},
    language: loadLanguage(),
    modalItem: null,
    controlsOpen: false
};

function t(key) {
    const parts = key.split('.');
    let current = TRANSLATIONS[state.language] || TRANSLATIONS.en;

    for (const part of parts) {
        current = current?.[part];
        if (current === undefined) {
            break;
        }
    }

    return current ?? key;
}

function getCategoryTitle(categoryKey) {
    return t(`categories.${categoryKey}`);
}

function updateStaticTexts() {
    document.documentElement.lang = state.language;
    pageTitle.textContent = t('pageTitle');
    pageSubtitle.textContent = t('pageSubtitle');
    controlsHeading.textContent = t('controlsHeading');
    searchInput.placeholder = t('searchPlaceholder');
    searchInput.setAttribute('aria-label', t('searchPlaceholder'));
    sortSelect.setAttribute('aria-label', t('sortAria'));
    sortDefaultOption.textContent = t('sortDefault');
    sortAzOption.textContent = t('sortAz');
    sortZaOption.textContent = t('sortZa');
    favoritesOnlyLabel.textContent = t('favoritesOnly');
    randomBtn.textContent = t('forcePick');
    refreshBtn.textContent = t('refresh');
    languageBtn.textContent = `${t('languagePrefix')}: ${state.language.toUpperCase()}`;
    loading.textContent = t('loading');
    copyDescriptionBtn.textContent = t('copyDescription');
    modalClose.setAttribute('aria-label', t('details'));
    detailsModal.setAttribute('aria-label', t('details'));
    footerText.textContent = t('footer');
    updateControlsToggleUI();

    if (state.modalItem) {
        renderModalContent(state.modalItem);
    }
}

function updateControlsToggleUI() {
    controlsPanel.classList.toggle('open', state.controlsOpen);
    controlsToggle.classList.toggle('open', state.controlsOpen);
    controlsToggle.setAttribute('aria-expanded', String(state.controlsOpen));
    controlsToggle.setAttribute('aria-label', state.controlsOpen ? t('closeControls') : t('openControls'));
}

function toggleControlsPanel() {
    state.controlsOpen = !state.controlsOpen;
    updateControlsToggleUI();
}

function cycleLanguage() {
    const currentIndex = LANGUAGE_ORDER.indexOf(state.language);
    const nextIndex = (currentIndex + 1) % LANGUAGE_ORDER.length;
    state.language = LANGUAGE_ORDER[nextIndex];
    saveLanguage();
    updateStaticTexts();
    renderCategories();
}

// Fetch and display all categories
async function loadAllCategories(options = {}) {
    const { randomize = false } = options;
    clearError();
    showLoading(true);

    try {
        const results = await Promise.all(
            CATEGORIES.map(async (category) => {
                const payload = await fetchCategoryPayload(category, randomize, 6);
                return {
                    category,
                    items: extractItems(payload)
                };
            })
        );

        results.forEach(({ category, items }) => {
            state.datasets[category.key] = items;
        });

        renderCategories();

        if (randomize) {
            showToast(t('toastRandomRefreshed'));
        }
    } catch (err) {
        console.error(err);
        showError(t('errorLoadCategories'));
    } finally {
        showLoading(false);
    }
}

async function fetchCategoryPayload(category, randomize, limit) {
    if (!randomize) {
        return fetchPayloadByPage(category, 1, limit);
    }

    const seedPayload = await fetchPayloadByPage(category, 1, 1);
    const totalItems = Number(seedPayload?.info?.total) || 1;
    const maxPage = Math.max(1, Math.ceil(totalItems / limit));
    const randomPage = getRandomInt(1, maxPage);
    const randomizedPayload = await fetchPayloadByPage(category, randomPage, limit);

    const randomizedItems = shuffleArray(extractItems(randomizedPayload));
    return {
        ...randomizedPayload,
        data: randomizedItems
    };
}

async function fetchPayloadByPage(category, page, limit) {
    const response = await fetch(`${category.endpoint}?page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${category.key}`);
    }

    return response.json();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function extractItems(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
}

function renderCategories() {
    categoriesContainer.innerHTML = '';

    CATEGORIES.forEach((category) => {
        const sourceItems = state.datasets[category.key] || [];
        const preparedItems = prepareItems(sourceItems, category.key);
        const filteredItems = filterItems(preparedItems);
        const sortedItems = sortItems(filteredItems);
        categoriesContainer.appendChild(createCategorySection(category, sortedItems));
    });
}

function createCategorySection(category, items) {
    const section = document.createElement('section');
    section.className = 'category-section';

    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = `${category.icon} ${getCategoryTitle(category.key)} (${items.length})`;
    section.appendChild(title);

    if (!items.length) {
        const noData = document.createElement('div');
        noData.className = 'no-data';
        noData.textContent = t('noData');
        section.appendChild(noData);
        return section;
    }

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid';

    items.forEach((item) => {
        cardsGrid.appendChild(createCard(item, category.key));
    });

    section.appendChild(cardsGrid);
    return section;
}

// Create a card element
function createCard(item, category) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    card.dataset.category = category;

    const image = getImageForItem(item, category);
    const infoRows = getInfoRows(item);
    const favoriteActiveClass = state.favorites.has(item.id) ? 'active' : '';
    const favoriteText = state.favorites.has(item.id) ? t('saved') : t('save');

    card.innerHTML = `
        <img src="${image}" alt="${item.name || t('unknown')}" class="card-image"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2224%22>📷</text></svg>'">
        <div class="card-content">
            <h2 class="card-title">${item.name || t('unknown')}</h2>
            <div class="card-info">
                ${infoRows}
            </div>
            <div class="card-actions">
                <button class="mini-btn favorite-btn ${favoriteActiveClass}">${favoriteText}</button>
                <button class="mini-btn details-btn">${t('details')}</button>
            </div>
        </div>
    `;

    const favoriteBtn = card.querySelector('.favorite-btn');
    const detailsBtn = card.querySelector('.details-btn');

    favoriteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(item.id);
        renderCategories();
    });

    detailsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openDetailsModal(item);
    });

    card.addEventListener('click', () => {
        openDetailsModal(item);
    });

    // Add hover effect with random SVG images
    const cardImage = card.querySelector('.card-image');
    const originalImage = cardImage.src;

    card.addEventListener('mouseenter', () => {
        // Select a random SVG from 1-5
        const randomNumber = Math.floor(Math.random() * 5) + 1;
        cardImage.src = `${randomNumber}.svg`;
    });

    card.addEventListener('mouseleave', () => {
        // Restore original image
        cardImage.src = originalImage;
    });

    return card;
}

function prepareItems(items, categoryKey) {
    return items.map((item, index) => ({
        ...item,
        id: item._id || `${categoryKey}-${item.name || 'item'}-${index}`,
        categoryKey,
        name: item.name || '',
        description: item.description || ''
    }));
}

function filterItems(items) {
    const normalizedQuery = normalizeForSearch(state.query);

    return items.filter((item) => {
        const searchable = getSearchableText(item);
        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const matchesFavorite = !state.favoritesOnly || state.favorites.has(item.id);
        return matchesQuery && matchesFavorite;
    });
}

function getSearchableText(item) {
    const baseText = `${item.name || ''} ${item.description || ''}`;

    if (item.categoryKey !== 'characters') {
        return normalizeForSearch(baseText);
    }

    const aliases = getAliasesForName(item.name || '');
    return normalizeForSearch(`${baseText} ${aliases.join(' ')}`);
}

function getAliasesForName(name) {
    const normalizedName = normalizeForSearch(name);
    if (!normalizedName) {
        return [];
    }

    const aliases = new Set();
    Object.entries(CHARACTER_ALIASES).forEach(([key, values]) => {
        const normalizedKey = normalizeForSearch(key);
        if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
            values.forEach((value) => aliases.add(value));
        }
    });

    return Array.from(aliases);
}

function normalizeForSearch(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sortItems(items) {
    if (state.sort === 'default') {
        return items;
    }

    const sorted = [...items].sort((a, b) => (a.name || t('unknown')).localeCompare(b.name || t('unknown')));
    return state.sort === 'za' ? sorted.reverse() : sorted;
}

function toggleFavorite(id) {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
        showToast(t('toastRemovedFavorite'));
    } else {
        state.favorites.add(id);
        showToast(t('toastAddedFavorite'));
    }

    saveFavorites();
}

function runForcePick() {
    const cards = Array.from(document.querySelectorAll('.card'));
    if (!cards.length) {
        showToast(t('toastNoVisibleCards'));
        return;
    }

    const selected = cards[Math.floor(Math.random() * cards.length)];
    cards.forEach((card) => card.classList.remove('spotlight'));
    selected.classList.add('spotlight');
    selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(t('toastForceChoice'));
}

function renderModalContent(item) {
    modalImage.src = getImageForItem(item, 'details');
    modalImage.alt = item.name || t('unknown');
    modalTitle.textContent = item.name || t('unknown');
    modalDescription.textContent = item.description || t('noDescription');
}

function openDetailsModal(item) {
    state.modalItem = item;
    renderModalContent(item);
    detailsModal.classList.add('show');
    detailsModal.setAttribute('aria-hidden', 'false');
}

function closeDetailsModal() {
    detailsModal.classList.remove('show');
    detailsModal.setAttribute('aria-hidden', 'true');
    state.modalItem = null;
}

async function copyModalDescription() {
    const text = modalDescription.textContent || '';

    try {
        await navigator.clipboard.writeText(text);
        showToast(t('toastDescriptionCopied'));
    } catch (error) {
        console.error(error);
        showToast(t('toastCopyFailed'));
    }
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(state.favorites)));
}

function loadFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function saveLanguage() {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
}

function loadLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGE_ORDER.includes(saved) ? saved : 'en';
}

let toastTimer = null;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

// Get image URL for item
function getImageForItem(item, category) {
    if (item.image) return item.image;
    if (item.imgSrc) return item.imgSrc;
    if (item.url && item.url.includes('image')) return item.url;

    // Fallback: generate a placeholder
    return `https://via.placeholder.com/300x250?text=${encodeURIComponent(item.name || t('unknown'))}`;
}

// Get info rows for the card
function getInfoRows(item) {
    const info = [
        { label: t('labels.id'), value: item._id || t('unknown') },
        { label: t('labels.name'), value: item.name || t('unknown') },
        { label: t('labels.description'), value: shortText(item.description) }
    ];

    return info
        .filter((row) => row.label && row.value)
        .map((row) => `<div class="info-row">
                        <span class="info-label">${row.label}:</span>
                        <span class="info-value">${row.value}</span>
                     </div>`)
        .join('');
}

function shortText(text) {
    if (!text) return t('unknown');
    if (text.length <= 110) return text;
    return `${text.slice(0, 110)}...`;
}

// Show/hide loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Show/hide error
function showError(message) {
    error.textContent = message;
    error.classList.add('show');
}

// Clear error
function clearError() {
    error.classList.remove('show');
    error.textContent = '';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateStaticTexts();

    searchInput.addEventListener('input', (event) => {
        state.query = event.target.value;
        renderCategories();
    });

    sortSelect.addEventListener('change', (event) => {
        state.sort = event.target.value;
        renderCategories();
    });

    favoritesOnly.addEventListener('change', (event) => {
        state.favoritesOnly = event.target.checked;
        renderCategories();
    });

    randomBtn.addEventListener('click', runForcePick);
    refreshBtn.addEventListener('click', () => loadAllCategories({ randomize: true }));
    languageBtn.addEventListener('click', cycleLanguage);
    controlsToggle.addEventListener('click', toggleControlsPanel);
    modalClose.addEventListener('click', closeDetailsModal);
    copyDescriptionBtn.addEventListener('click', copyModalDescription);

    detailsModal.addEventListener('click', (event) => {
        if (event.target === detailsModal) {
            closeDetailsModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDetailsModal();
        }
    });

    loadAllCategories();
});
