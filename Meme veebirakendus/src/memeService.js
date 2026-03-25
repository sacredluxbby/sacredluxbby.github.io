const OpenAI = require("openai");

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const fallbackByLang = {
  ru: {
    top: [
      "КОГДА ОТКРЫЛ КОД",
      "Я И МОЯ МОТИВАЦИЯ",
      "ЭТО БЫЛ ХОРОШИЙ ПЛАН",
      "ОЖИДАНИЕ VS РЕАЛЬНОСТЬ",
      "ПОНЕДЕЛЬНИК В 09:00",
      "Я ПЕРЕД ДЕДЛАЙНОМ",
      "КОГДА ПРОСИЛИ БЫСТРЫЙ ФИКС",
      "ПИШУ ОДНУ СТРОЧКУ",
      "КОГДА ВКЛЮЧИЛ ПРОДУКТИВНОСТЬ",
      "Я ПОСЛЕ ОДНОГО ТУТОРИАЛА",
      "КОГДА СКАЗАЛИ ЛЕГКАЯ ЗАДАЧА",
      "ВЧЕРАШНИЙ Я",
      "Я И МОЙ ПЕРВЫЙ РЕФАКТОРИНГ",
      "КОГДА ВСЕ ТЕСТЫ ЗЕЛЕНЫЕ",
      "ПЕРЕД РЕЛИЗОМ",
      "Я НА СОЗВОНЕ",
      "КОГДА НАШЕЛ СТАРЫЙ ПРОЕКТ",
      "УТРОМ ПОЛОН СИЛ",
      "Я ПОСЛЕ КОФЕ",
      "КОГДА ОТКРЫЛ ЧУЖОЙ КОД",
      "Я И ДОКУМЕНТАЦИЯ",
      "КОГДА ПОЧИНИЛ ОДИН БАГ",
      "Я В ПЯТНИЦУ ВЕЧЕРОМ",
      "КОГДА ВЫКАТИЛ В ПРОД",
      "Я И НОВАЯ БИБЛИОТЕКА",
      "КОГДА ТЕБЯ ДОБАВИЛИ В ЧАТ",
      "Я ПЕРЕД ДЕМО",
      "КОГДА НАЖАЛ RUN",
      "Я И МОЙ TODO ЛИСТ",
      "КОГДА ОТКРЫЛ 30 ВКЛАДОК",
      "Я ПОСЛЕ КОММЕНТА НУЖНО БЫСТРО",
      "КОГДА БЭКЕНД ВРЕМЕННО НЕДОСТУПЕН",
      "Я И GIT CONFLICT",
      "КОГДА ЗАПУСТИЛ МИГРАЦИИ",
      "Я И НОЧНОЙ HOTFIX",
      "КОГДА СКАЗАЛИ НЕ ЛОМАЙ",
      "Я ПОСЛЕ СТАТУСА IN PROGRESS",
      "КОГДА ПРОЕКТ РАСТЕТ БЫСТРО",
      "Я И МОЙ КОД ВЧЕРА",
      "КОГДА КЛИЕНТ НАПИСАЛ СРОЧНО",
      "Я НА ЭТАПЕ ФИНАЛЬНЫХ ПРАВОК",
      "КОГДА НУЖНО СДАТЬ СЕГОДНЯ",
      "Я ПЕРЕД ПЕРВОЙ ПРЕЗЕНТАЦИЕЙ",
      "КОГДА УВИДЕЛ НОВЫЙ ТАСК",
      "Я И ПРОЕКТ БЕЗ ТЗ",
      "КОГДА ПРОСНУЛСЯ БЕЗ БУДИЛЬНИКА",
      "Я В ОЧЕРЕДИ В МАГАЗИНЕ",
      "КОГДА СКАЗАЛИ ВЫЙДЕМ НА ПЯТЬ",
      "Я ПЕРЕД ЗАРПЛАТОЙ",
      "КОГДА ПРИШЕЛ НА КУХНЮ НОЧЬЮ",
      "Я И МОЙ РЕЖИМ СНА",
      "КОГДА БУДИЛЬНИК В 6:00",
      "Я ПОСЛЕ ТЯЖЕЛОГО ДНЯ",
      "КОГДА УЖЕ ПЯТНИЦА ВЕЧЕРОМ",
      "Я В ПОНЕДЕЛЬНИК УТРОМ",
      "КОГДА ТАКСИ ОТМЕНИЛОСЬ",
      "Я В ПРОБКЕ",
      "КОГДА ИНТЕРНЕТ ЛЕГ",
      "Я ПЕРЕД ЭКЗАМЕНОМ",
      "КОГДА ПЫТАЕШЬСЯ ЭКОНОМИТЬ",
      "Я ПОСЛЕ ТРЕНИРОВКИ",
      "КОГДА В ХОЛОДИЛЬНИКЕ ПУСТО",
      "Я ПЕРЕД ВАЖНЫМ ЗВОНКОМ",
      "КОГДА ПЛАНЫ НА ДЕНЬ РУХНУЛИ",
      "Я И МЫСЛЬ НАЧАТЬ С ПОНЕДЕЛЬНИКА"
    ],
    bottom: [
      "И ВСЕ СЛОМАЛОСЬ",
      "НО Я ДЕЛАЮ ВИД ЧТО НОРМ",
      "ПОТОМ РАЗБЕРЕМСЯ",
      "ТАК И ЗАДУМАНО",
      "ЗАТО КРАСИВО",
      "ГЛАВНОЕ НЕ ТРОГАТЬ",
      "ЭТО ВРЕМЕННОЕ РЕШЕНИЕ",
      "ЕЩЕ ПЯТЬ МИНУТ И ГОТОВО",
      "УЖЕ ИЩУ КРАЙНЕГО",
      "ПЛАН Б БОЛЬШЕ НЕ РАБОТАЕТ",
      "ЩАС ПЕРЕЗАПУЩУ И НОРМ",
      "ПОЧЕМУ ОПЯТЬ В ПЯТНИЦУ",
      "ЛАДНО ЭТО ФИЧА",
      "ЗАТО СКРИНШОТЫ КРАСИВЫЕ",
      "ПУСТЬ НИКТО НЕ ТРОГАЕТ",
      "ЭТО НЕ БАГ ЭТО ЭФФЕКТ",
      "В СЛЕДУЮЩЕМ СПРИНТЕ ПОЧИНИМ",
      "МНЕ НУЖЕН ЕЩЕ КОФЕ",
      "ЭТО РАБОТАЛО ЛОКАЛЬНО",
      "ПЕРЕПИШЕМ КОГДА БУДЕТ ВРЕМЯ",
      "Я УЖЕ НАПИСАЛ ПОСТМОРТЕМ",
      "ГДЕ-ТО ЕСТЬ ЛИШНЯЯ ЗАПЯТАЯ",
      "СЕЙЧАС ДОБАВЛЮ HOTFIX",
      "НИКТО НЕ ЗАМЕТИЛ ПРАВДА",
      "ПРОСТО НЕ ОБНОВЛЯЙ СТРАНИЦУ",
      "ЭТО ЛЕЖИТ В ТЕХДОЛГЕ",
      "ЩАС БУДЕТ МАГИЯ ИЛИ НЕТ",
      "СОЗДАМ НОВЫЙ ISSUE",
      "Я УЖЕ ПИШУ ПАТЧ",
      "ДАВАЙТЕ НЕ ТРОГАТЬ ПРОД",
      "ЭТО СЛОЖНО ОБЪЯСНИТЬ",
      "НУЖЕН ЕЩЕ ОДИН РЕФАКТОР",
      "ГЛАВНОЕ ЧТО ДЕМО РАБОТАЕТ",
      "ПОКА ПУСТЬ БУДЕТ ТАК",
      "ОЙ КОММИТ НЕ В ТУ ВЕТКУ",
      "Я УЖЕ ПЕРЕЗАПУСТИЛ ТРИ РАЗА",
      "МОЖНО СЧИТАТЬ ЧТО ГОТОВО",
      "ЭТО МЕЛОЧЬ НА ПОЛДНЯ",
      "ТУТ НУЖЕН ОЧЕНЬ ТОНКИЙ ФИКС",
      "ВСЕ ПОД КОНТРОЛЕМ ПОЧТИ",
      "Я ЭТО ВИДЕЛ В ТИКЕТЕ",
      "СДЕЛАЮ СРАЗУ ПОСЛЕ ОБЕДА",
      "ВЫГЛЯДИТ СТАБИЛЬНО ИНОГДА",
      "ПРОСТО ДАЙ МНЕ ПЯТЬ МИНУТ",
      "ПОСИДИМ И РАЗБЕРЕМСЯ",
      "СЕГОДНЯ УЖЕ БЕЗ ПОДВИГОВ",
      "ХОЧУ ПРОСТО ЛЕЧЬ И СПАТЬ",
      "ЭТО БЫЛ ОЧЕНЬ ДЛИННЫЙ ДЕНЬ",
      "ЛАДНО ЗАВТРА НАЧНУ С НУЛЯ",
      "ПЛАНЫ СНОВА ПЕРЕНЕСЛИСЬ",
      "ВСЕ ПОШЛО НЕ ПО ГРАФИКУ",
      "УЖЕ ХОЧЕТСЯ ОТПУСК",
      "ГДЕ МОЯ ВТОРАЯ КРУЖКА ЧАЯ",
      "НУЖНО БЫЛО ЛЕЧЬ РАНЬШЕ",
      "СИЛ ХВАТАЕТ ТОЛЬКО НА МЕМ",
      "Я ВКЛЮЧИЛ РЕЖИМ ЭНЕРГОСБЕРЕЖЕНИЯ",
      "ЭТОТ ДЕНЬ МЕНЯ ПЕРЕИГРАЛ",
      "У МЕНЯ БЫЛИ ДРУГИЕ ПЛАНЫ",
      "ГЛАВНОЕ ПЕРЕЖИТЬ ДО ВЕЧЕРА",
      "ПРОСТО СЕЙЧАС НЕ МОЙ ДЕНЬ",
      "ТУТ НУЖЕН СОН И ПИЦЦА",
      "ВСЕ НОРМ НО Я УСТАЛ",
      "ПОКА ЧТО ВЫЖИВАЕМ",
      "ДАЙТЕ МНЕ ЕЩЕ ВЫХОДНОЙ"
    ]
  },
  en: {
    top: [
      "ME WRITING CLEAN CODE",
      "WHEN THE BUILD IS GREEN",
      "I HAVE A GREAT PLAN",
      "EXPECTATION VS REALITY",
      "MONDAY 9 AM",
      "ME BEFORE THE DEADLINE",
      "WHEN THEY SAID QUICK FIX",
      "JUST ONE SMALL CHANGE",
      "ME AFTER ONE TUTORIAL",
      "WHEN TASK LOOKED EASY",
      "YESTERDAY ME",
      "ME DOING REFACTOR",
      "WHEN TESTS FINALLY PASS",
      "RIGHT BEFORE RELEASE",
      "ME IN THE TEAM CALL",
      "WHEN I OPEN LEGACY CODE",
      "ME READING DOCS",
      "ME AFTER COFFEE",
      "WHEN PROD IS LIVE",
      "ME LEARNING NEW FRAMEWORK",
      "I CAN HANDLE THIS",
      "WHEN PM SAYS URGENT",
      "ME STARTING SIDE PROJECT",
      "LATE NIGHT DEPLOYMENT",
      "ME CHASING A BUG",
      "WHEN I CLICK RUN",
      "ME OPENING 40 TABS",
      "WHEN CLIENT SAYS ASAP",
      "ME BEFORE LIVE DEMO",
      "WHEN MERGE CONFLICT APPEARS",
      "ME AFTER NEW REQUIREMENTS",
      "WHEN RELEASE DAY ARRIVES",
      "ME AND MY TODO LIST",
      "WHEN I PUSH TO MAIN",
      "ME DURING CODE REVIEW",
      "WHEN STAGING LOOKS WEIRD",
      "ME WRITING LAST MINUTE PATCH",
      "WHEN TEAM LEAD TYPES QUESTION",
      "ME FIXING JUST ONE BUG",
      "WHEN SCOPE CHANGES AGAIN",
      "ME WITH LEGACY CONFIG",
      "WHEN LOGIN STOPS WORKING",
      "ME BUILDING FINAL VERSION",
      "WHEN THE TASK DOUBLES",
      "ME TRYING TO STAY CALM",
      "WHEN ALARM RINGS AT 6",
      "ME ON MONDAY MORNING",
      "WHEN PLANS FALL APART",
      "ME BEFORE PAYDAY",
      "WHEN WIFI STOPS WORKING",
      "ME STUCK IN TRAFFIC",
      "WHEN TAXI CANCELS AGAIN",
      "ME AT THE GROCERY LINE",
      "WHEN SOMEONE SAYS FIVE MINUTES",
      "ME AFTER A LONG DAY",
      "WHEN FRIDGE IS EMPTY",
      "ME BEFORE A BIG CALL",
      "WHEN I TRY TO SAVE MONEY",
      "ME AFTER GYM DAY",
      "WHEN SLEEP SCHEDULE IS GONE",
      "ME BEFORE AN EXAM",
      "WHEN WEEKEND ENDS TOO FAST",
      "ME AT 2 AM THINKING",
      "WHEN COFFEE DOES NOTHING",
      "ME STARTING AGAIN TOMORROW"
    ],
    bottom: [
      "AND EVERYTHING BREAKS",
      "BUT I ACT CALM",
      "WE FIX IT LATER",
      "TOTALLY INTENTIONAL",
      "AT LEAST IT LOOKS COOL",
      "PLEASE DO NOT TOUCH IT",
      "WORKED ON MY MACHINE",
      "I NEED ONE MORE COFFEE",
      "THIS IS A FEATURE NOW",
      "LET ME JUST RESTART IT",
      "HOTFIX COMING IN 3 2 1",
      "DEPLOYED ON FRIDAY AGAIN",
      "NOBODY SAW THAT RIGHT",
      "WE WILL PATCH NEXT SPRINT",
      "THE PLAN HAS CHANGED",
      "I BLAME THE CACHE",
      "SOMETHING ATE THE SEMICOLON",
      "IT WAS FINE A MINUTE AGO",
      "THIS COMMIT IS PURE COURAGE",
      "NOT A BUG JUST DRAMA",
      "ROLLBACK IS MY CARDIO",
      "ONE LINE BROKE EVERYTHING",
      "DEBUGGING IS MY LIFESTYLE",
      "PLEASE STAY GREEN CI",
      "I WILL FIX AFTER LUNCH",
      "LET US NOT TOUCH PROD",
      "THAT IS A MONDAY PROBLEM",
      "OPENING A NEW TICKET NOW",
      "JUST CLEAR THE CACHE AGAIN",
      "I SWEAR THIS WAS WORKING",
      "PATCHING IN REAL TIME",
      "WE NEED A SMALL REFACTOR",
      "THIS IS FINE MOSTLY",
      "CAN WE SHIP THIS ANYWAY",
      "ONE MORE COMMIT TRUST ME",
      "IT ONLY FAILS SOMETIMES",
      "I CAN EXPLAIN LATER",
      "MINOR ISSUE MAJOR PANIC",
      "LET ME CHECK THE LOGS",
      "NOT GREAT NOT TERRIBLE",
      "THE FIX IS ALMOST READY",
      "THAT BRANCH WAS CURSED",
      "SHIP NOW IMPROVE LATER",
      "PLEASE NO MORE SURPRISES",
      "I JUST NEED A NAP",
      "THIS DAY WAS TOO MUCH",
      "CAN WE SKIP TO WEEKEND",
      "NOT TODAY MAYBE TOMORROW",
      "I NEED TEA AND SILENCE",
      "PLANS CHANGED AGAIN",
      "LET ME BREATHE FOR A MINUTE",
      "SURVIVING ONE TASK AT A TIME",
      "CURRENT MOOD LOW BATTERY",
      "I LOST TRACK OF TIME",
      "I AM RUNNING ON VIBES",
      "AT LEAST WE TRIED",
      "IT IS WHAT IT IS",
      "TODAY IS NOT MY DAY",
      "NEED ONE EXTRA WEEKEND",
      "LET US PRETEND IT IS FINE",
      "WE WILL RECOVER SOMEHOW",
      "I AM TOO TIRED TO PANIC",
      "TIME FOR FOOD AND SLEEP",
      "ONE STEP THEN ANOTHER"
    ]
  }
};

const allowedStyles = new Set(["classic", "sarcastic", "absurd", "wholesome"]);
const RECENT_LIMIT = 30;
const recentCaptionsByKey = new Map();

function normalizeLanguage(language) {
  return language === "en" ? "en" : "ru";
}

function normalizeStyle(style) {
  return allowedStyles.has(style) ? style : "classic";
}

function safeText(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 60).toUpperCase();
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function captionKey(language, style) {
  return `${normalizeLanguage(language)}:${normalizeStyle(style)}`;
}

function captionSignature(topText, bottomText) {
  return `${safeText(topText)}|${safeText(bottomText)}`;
}

function getRecentSet(key) {
  if (!recentCaptionsByKey.has(key)) {
    recentCaptionsByKey.set(key, []);
  }

  const queue = recentCaptionsByKey.get(key);
  return new Set(queue);
}

function getRecentQueue(key) {
  if (!recentCaptionsByKey.has(key)) {
    recentCaptionsByKey.set(key, []);
  }

  return recentCaptionsByKey.get(key);
}

function rememberCaption(key, topText, bottomText) {
  const queue = recentCaptionsByKey.get(key) || [];
  const signature = captionSignature(topText, bottomText);

  queue.push(signature);
  if (queue.length > RECENT_LIMIT) {
    queue.splice(0, queue.length - RECENT_LIMIT);
  }

  recentCaptionsByKey.set(key, queue);
}

function randomNotRecent(list, blockedValues) {
  const available = list.filter((item) => !blockedValues.has(item));
  if (available.length) {
    return randomFrom(available);
  }

  return randomFrom(list);
}

function recentLineSets(recentQueue, limit = 20) {
  const recentTail = recentQueue.slice(-limit);
  const topSet = new Set();
  const bottomSet = new Set();

  recentTail.forEach((row) => {
    const parts = row.split("|");
    if (parts.length === 2) {
      topSet.add(parts[0]);
      bottomSet.add(parts[1]);
    }
  });

  return { topSet, bottomSet };
}

function pickFreshLine(list, blockedSet) {
  const blockedRaw = new Set(blockedSet);
  const blockedSafe = new Set([...blockedSet].map((item) => safeText(item)));

  const available = list.filter(
    (item) => !blockedRaw.has(item) && !blockedSafe.has(safeText(item))
  );

  if (available.length) {
    return randomFrom(available);
  }

  return randomFrom(list);
}

function fallbackCaption(language, style) {
  const lang = normalizeLanguage(language);
  const key = captionKey(lang, style);
  const dict = fallbackByLang[lang];
  const recentQueue = getRecentQueue(key);
  const recent = new Set(recentQueue);

  let topText = "";
  let bottomText = "";

  for (let i = 0; i < 20; i += 1) {
    topText = randomFrom(dict.top);
    bottomText = randomFrom(dict.bottom);

    if (!recent.has(captionSignature(topText, bottomText))) {
      rememberCaption(key, topText, bottomText);
      return { topText, bottomText };
    }
  }

  const recentTail = recentQueue.slice(-12);

  const usedTop = new Set(
    [...recentTail]
      .map((row) => row.split("|"))
      .filter((parts) => parts.length === 2)
      .map((parts) => parts[0])
  );
  const usedBottom = new Set(
    [...recentTail]
      .map((row) => row.split("|"))
      .filter((parts) => parts.length === 2)
      .map((parts) => parts[1])
  );

  topText = randomNotRecent(dict.top, usedTop);
  bottomText = randomNotRecent(dict.bottom, usedBottom);

  rememberCaption(key, topText, bottomText);

  return {
    topText,
    bottomText
  };
}

function extractJson(text) {
  if (!text) return null;

  const block = text.match(/\{[\s\S]*\}/);
  if (!block) return null;

  try {
    return JSON.parse(block[0]);
  } catch {
    return null;
  }
}

async function generateMemeCaption(imageBuffer, mimeType, options = {}) {
  const language = normalizeLanguage(options.language);
  const style = normalizeStyle(options.style);
  const key = captionKey(language, style);
  const recentQueue = getRecentQueue(key);
  const recentTail = recentQueue.slice(-8);
  const repeatGuardText = recentTail.length
    ? `Не повторяй эти недавние подписи: ${recentTail.join(" ; ")}.`
    : "";

  if (!client) {
    return {
      ...fallbackCaption(language, style),
      source: "fallback"
    };
  }

  const imageBase64 = imageBuffer.toString("base64");

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 1.25,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              `Ты генератор мемов. По изображению придумай смешной и короткий текст для классического мема. Дай ответ СТРОГО в JSON: {\"topText\":\"...\",\"bottomText\":\"...\"}. Верхняя и нижняя строки до 6 слов каждая, CAPS LOCK, без оскорблений и политики. Язык подписи: ${language === "en" ? "English" : "Russian"}. Стиль юмора: ${style}. Каждый новый ответ должен быть заметно отличным от предыдущих. ${repeatGuardText}`
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${imageBase64}`
          }
        ]
      }
    ]
  });

  const raw = response.output_text || "";
  const parsed = extractJson(raw) || {};

  const topText = safeText(parsed.topText);
  const bottomText = safeText(parsed.bottomText);

  if (!topText && !bottomText) {
    return {
      ...fallbackCaption(language, style),
      source: "fallback"
    };
  }

  const dict = fallbackByLang[language];
  const recent = getRecentSet(key);
  const { topSet, bottomSet } = recentLineSets(recentQueue, 20);

  let finalTop = topText || pickFreshLine(dict.top, topSet);
  let finalBottom = bottomText || pickFreshLine(dict.bottom, bottomSet);

  // Force stronger variety even when model tends to repeat common lines.
  if (topSet.has(finalTop) || topSet.has(safeText(finalTop)) || Math.random() < 0.55) {
    finalTop = pickFreshLine(dict.top, topSet);
  }
  if (
    bottomSet.has(finalBottom) ||
    bottomSet.has(safeText(finalBottom)) ||
    Math.random() < 0.55
  ) {
    finalBottom = pickFreshLine(dict.bottom, bottomSet);
  }

  for (let i = 0; i < 6; i += 1) {
    if (!recent.has(captionSignature(finalTop, finalBottom))) {
      break;
    }

    finalTop = randomFrom(dict.top);
    finalBottom = randomFrom(dict.bottom);
  }

  if (recent.has(captionSignature(finalTop, finalBottom))) {
    const alt = fallbackCaption(language, style);
    finalTop = alt.topText;
    finalBottom = alt.bottomText;
  } else {
    rememberCaption(key, finalTop, finalBottom);
  }

  return {
    topText: finalTop,
    bottomText: finalBottom,
    source: "openai"
  };
}

module.exports = {
  generateMemeCaption
};
