// Word service - loads word data from JSON file with bilingual support
const wordData = require("../data/words.json");

// Flatten word categories into array of {word, category} objects for a specific language
function flattenWords(lang = 'es') {
    const langWords = wordData[lang] || wordData['es'];
    return Object.entries(langWords).flatMap(([category, arr]) =>
        arr.map((word) => ({ word, category }))
    );
}

// Cache for flattened words by language
const wordCache = {};

/**
 * Get a random word with its category
 * @param {string} lang - Language code ('es' or 'en')
 * @returns {Object} { word: string, category: string }
 */
function getRandomWordWithCategory(lang = 'es') {
    // Ensure both caches are populated
    if (!wordCache['es']) wordCache['es'] = flattenWords('es');
    if (!wordCache['en']) wordCache['en'] = flattenWords('en');

    // Pick random from requested language (or default)
    const targetCache = wordCache[lang] || wordCache['es'];
    const idx = Math.floor(Math.random() * targetCache.length);

    // Retrieve the word pair using parallel index
    // Note: This relies on words.json having identical structure/order for keys and arrays
    const esItem = wordCache['es'][idx];
    const enItem = wordCache['en'][idx];

    // Fallback if index out of bounds (should not happen if files are symmetrical)
    const selectedItem = targetCache[idx];

    return {
        word: selectedItem.word,
        category: selectedItem.category,
        translations: {
            es: esItem ? { word: esItem.word, category: esItem.category } : null,
            en: enItem ? { word: enItem.word, category: enItem.category } : null
        }
    };
}

module.exports = {
    wordData,
    getRandomWordWithCategory,
};
