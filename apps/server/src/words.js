// Word service - loads word data from JSON file
const path = require('path');
const wordCategories = require('../data/words.json');

// Flatten word categories into array of {word, category} objects
const wordsFlat = Object.entries(wordCategories).flatMap(([category, arr]) => 
  arr.map((word) => ({ word, category }))
);

/**
 * Get a random word with its category
 * @returns {Object} { word: string, category: string }
 */
function getRandomWordWithCategory() {
  const idx = Math.floor(Math.random() * wordsFlat.length);
  return wordsFlat[idx];
}

module.exports = { 
  wordCategories, 
  words: wordsFlat, 
  getRandomWordWithCategory 
};

