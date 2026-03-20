const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const BREEDS_API_URL = "https://api.thecatapi.com/v1/breeds";
const IMAGE_BY_ID_API_URL = "https://api.thecatapi.com/v1/images";
const CAT_API_KEY = process.env.THE_CAT_API_KEY || "";
const CACHE_TTL_MS = 15 * 60 * 1000;

let catsCache = {
  cards: [],
  countries: [],
  breeds: [],
  updatedAt: 0
};

app.use(express.static(path.join(__dirname, "public")));

function toNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBreedCard(breed, imageUrl) {
  if (!breed || !breed.name || !breed.origin || !breed.description || !imageUrl) {
    return null;
  }

  return {
    id: breed.id,
    imageUrl,
    breed: breed.name,
    country: breed.origin,
    temperament: breed.temperament || "No temperament data",
    description: breed.description
  };
}

async function fetchBreeds(headers) {
  const response = await fetch(BREEDS_API_URL, { headers });

  if (!response.ok) {
    throw new Error(`TheCatAPI breeds error: ${response.status}`);
  }

  return response.json();
}

async function fetchImageUrlById(imageId, headers) {
  const response = await fetch(`${IMAGE_BY_ID_API_URL}/${imageId}`, { headers });

  if (!response.ok) {
    return null;
  }

  const image = await response.json();
  return image && image.url ? image.url : null;
}

function filterCards(cards, breedQuery, country) {
  return cards.filter((card) => {
    const breedMatches = breedQuery
      ? card.breed.toLowerCase().includes(breedQuery.toLowerCase())
      : true;

    const countryMatches = country
      ? card.country.toLowerCase() === country.toLowerCase()
      : true;

    return breedMatches && countryMatches;
  });
}

function sortCards(cards, sortBy) {
  if (sortBy === "breed") {
    cards.sort((a, b) => a.breed.localeCompare(b.breed));
  }

  if (sortBy === "country") {
    cards.sort((a, b) => a.country.localeCompare(b.country));
  }

  return cards;
}

function shuffle(cards) {
  const clone = [...cards];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

async function rebuildCatsCache(headers) {
  const breedItems = await fetchBreeds(headers);

  const enriched = await Promise.all(
    breedItems
      .filter((breed) => Boolean(breed.reference_image_id))
      .map(async (breed) => {
        const imageUrl = await fetchImageUrlById(breed.reference_image_id, headers);
        return normalizeBreedCard(breed, imageUrl);
      })
  );

  const cards = enriched.filter(Boolean);
  const countries = [...new Set(cards.map((card) => card.country))].sort((a, b) =>
    a.localeCompare(b)
  );
  const breedNames = [...new Set(cards.map((card) => card.breed))].sort((a, b) =>
    a.localeCompare(b)
  );

  catsCache = {
    cards,
    countries,
    breeds: breedNames,
    updatedAt: Date.now()
  };
}

async function getCachedCards(headers) {
  const isExpired = Date.now() - catsCache.updatedAt > CACHE_TTL_MS;
  if (!catsCache.cards.length || isExpired) {
    await rebuildCatsCache(headers);
  }

  return catsCache;
}

app.get("/api/cats", async (req, res) => {
  const limit = Math.min(Math.max(toNumber(req.query.limit, 24), 4), 40);
  const breedQuery = (req.query.q || "").trim();
  const country = (req.query.country || "").trim();
  const sort = (req.query.sort || "random").trim();

  try {
    const headers = {};
    if (CAT_API_KEY) {
      headers["x-api-key"] = CAT_API_KEY;
    }

    const cached = await getCachedCards(headers);

    let cards = [...cached.cards];

    cards = filterCards(cards, breedQuery, country);

    if (sort !== "random") {
      cards = sortCards(cards, sort);
    } else {
      cards = shuffle(cards);
    }

    cards = cards.slice(0, limit);

    res.json({
      cards,
      total: cards.length,
      countries: cached.countries,
      breeds: cached.breeds
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch cats",
      details: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Cat app started on http://localhost:${PORT}`);
});