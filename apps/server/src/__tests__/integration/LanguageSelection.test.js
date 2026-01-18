const Room = require("../../Room");
const { wordData } = require("../../words");

// Helper to check if a word belongs to a language
function isWordInLanguage(word, lang) {
    const langWords = wordData[lang];
    // Flatten all words for that language
    const allWords = Object.values(langWords).flat();
    return allWords.includes(word);
}

describe("Language Selection Integration", () => {
    const hostUser = { uid: "host1", name: "Host", photoURL: null };
    const player2 = { uid: "p2", name: "Player 2", photoURL: null };
    const player3 = { uid: "p3", name: "Player 3", photoURL: null };

    test("Room created with 'es' should select Spanish words", () => {
        const room = new Room(hostUser, { language: 'es' });
        room.addPlayer(player2);
        room.addPlayer(player3);

        // Start match
        room.startMatch(hostUser.uid);

        const secretWord = room.currentMatch.secretWord;

        // Verify language
        expect(room.language).toBe('es');
        expect(room.currentMatch.language).toBe('es');

        // Verify word is in Spanish dict
        const isSpanish = isWordInLanguage(secretWord, 'es');
        const isEnglish = isWordInLanguage(secretWord, 'en');

        // Note: Some words might exist in both (comparatively rare, but "radio" etc)
        // Check if it's DEFINITELY not English if exclusively Spanish, or just exists in Spanish
        console.log(`[ES Test] Secret word: ${secretWord}`);
        expect(isSpanish).toBe(true);
    });

    test("Room created with 'en' should select English words", () => {
        const room = new Room(hostUser, { language: 'en' });
        room.addPlayer(player2);
        room.addPlayer(player3);

        // Start match
        room.startMatch(hostUser.uid);

        const secretWord = room.currentMatch.secretWord;

        // Verify language
        expect(room.language).toBe('en');
        expect(room.currentMatch.language).toBe('en');

        // Verify word is in English dict
        const isEnglish = isWordInLanguage(secretWord, 'en');

        console.log(`[EN Test] Secret word: ${secretWord}`);
        expect(isEnglish).toBe(true);
    });

    test("Room defaulted should use 'es'", () => {
        const room = new Room(hostUser, {}); // No language
        room.addPlayer(player2);
        room.addPlayer(player3);

        room.startMatch(hostUser.uid);

        expect(room.language).toBe('es');
        expect(room.currentMatch.language).toBe('es');

        const secretWord = room.currentMatch.secretWord;
        expect(isWordInLanguage(secretWord, 'es')).toBe(true);
    });

    test("Updating room options should update language", () => {
        // 1. Create room (defaults to 'es')
        const room = new Room(hostUser, {});
        room.addPlayer(player2);
        room.addPlayer(player3);

        expect(room.language).toBe('es');

        // 2. Update options to 'en'
        room.updateOptions(hostUser.uid, { language: 'en' });

        // 3. Verify room language updated
        expect(room.language).toBe('en');

        // 4. Start match
        room.startMatch(hostUser.uid);

        // 5. Verify match language is 'en' and word is English
        expect(room.currentMatch.language).toBe('en');
        const secretWord = room.currentMatch.secretWord;

        console.log(`[Update Test] Secret word: ${secretWord}`);
        expect(isWordInLanguage(secretWord, 'en')).toBe(true);
    });
});
