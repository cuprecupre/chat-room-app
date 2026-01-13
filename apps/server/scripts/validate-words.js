const fs = require('fs');
const path = require('path');

const WORDS_PATH = path.join(__dirname, '../data/words.json');

function validateWords() {
    console.log('--- Validating words.json ---');

    let data;
    try {
        const content = fs.readFileSync(WORDS_PATH, 'utf8');
        data = JSON.parse(content);
    } catch (error) {
        console.error('❌ Error: words.json is not a valid JSON file.');
        console.error(error.message);
        process.exit(1);
    }

    const languages = Object.keys(data);
    if (!languages.includes('es') || !languages.includes('en')) {
        console.error('❌ Error: Missing "es" or "en" root keys.');
        process.exit(1);
    }

    const esCategories = Object.keys(data.es);
    const enCategories = Object.keys(data.en);

    let hasErrors = false;

    // 1. Check if both languages have the same number of categories
    if (esCategories.length !== enCategories.length) {
        console.warn(`⚠️ Warning: Categories count mismatch (ES: ${esCategories.length}, EN: ${enCategories.length})`);
    }

    // 2. Cross-reference categories and word counts
    // We assume ES is the source of truth for category naming mapping if needed, 
    // but here we check for strict symmetry in terms of logic.
    // However, category names are translated strings. We need a way to map them.
    // In this app, categories are used as keys. Let's see if they are identical.

    // Check missing categories (using index match if they were intended to be positional, 
    // but usually they are checked by presence)

    esCategories.forEach((cat, index) => {
        const enCatName = enCategories[index];
        const esWords = data.es[cat];
        const enWords = data.en[enCatName] || [];

        console.log(`Checking category [${index}]: ES "${cat}" vs EN "${enCatName || 'MISSING'}"`);

        if (!enCatName) {
            console.error(`❌ Error: Category "${cat}" in ES has no counterpart in EN at index ${index}`);
            hasErrors = true;
            return;
        }

        if (esWords.length !== enWords.length) {
            console.error(`❌ Error: Word count mismatch in category "${cat}"/"${enCatName}". ES: ${esWords.length}, EN: ${enWords.length}`);
            hasErrors = true;
        }

        // Check for duplicates
        const esDuplicates = esWords.filter((w, i) => esWords.indexOf(w) !== i);
        if (esDuplicates.length > 0) {
            console.error(`❌ Error: Duplicates in ES "${cat}": ${esDuplicates.join(', ')}`);
            hasErrors = true;
        }

        const enDuplicates = enWords.filter((w, i) => enWords.indexOf(w) !== i);
        if (enDuplicates.length > 0) {
            console.error(`❌ Error: Duplicates in EN "${enCatName}": ${enDuplicates.join(', ')}`);
            hasErrors = true;
        }
    });

    if (hasErrors) {
        console.log('\n❌ Validation FAILED. Please fix the errors above.');
        process.exit(1);
    } else {
        console.log('\n✅ Validation PASSED. words.json is perfectly synchronized.');
    }
}

validateWords();
