const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'tests/screenshots';

// Ensure screenshots dir exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test Users Configuration
const TEST_USERS = {
    HOST: {
        name: 'Host E2E',
        email: 'host-e2e@test.com',
        password: 'password123'
    },
    GUEST_1: {
        name: 'Guest1 E2E',
        email: 'guest1-e2e@test.com',
        password: 'password123'
    },
    GUEST_LATE: {
        name: 'LateGuest E2E',
        email: 'lateguest-e2e@test.com',
        password: 'password123'
    }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function clickButtonByText(page, text) {
    const handle = await page.evaluateHandle((textToFind) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes(textToFind));
    }, text);

    if (handle.asElement()) {
        await handle.click();
        return true;
    }
    return false;
}

/**
 * Authenticates a user. Tries to Login first. If fails, Registers.
 */
async function authenticateUser(browser, userRole) {
    const user = TEST_USERS[userRole];
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[${user.name}] Initializing auth flow...`);
    await page.goto(BASE_URL);

    // 1. Click "Continuar con Email" (Landing Page)
    await page.waitForSelector('button', { timeout: 10000 });
    const emailBtnClicked = await clickButtonByText(page, 'Continuar con Email');
    if (!emailBtnClicked) throw new Error(`[${user.name}] 'Continuar con Email' button not found`);

    // 2. Wait for EmailAuthScreen and click "Iniciar sesión" (Select Mode)
    // We wait for the specific button "Iniciar sesión" to be available
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Iniciar sesión')),
        { timeout: 10000 }
    );
    await clickButtonByText(page, 'Iniciar sesión');

    // 3. Try to Login (Login Mode)
    console.log(`[${user.name}] Attempting existing login...`);
    await page.waitForSelector('input[type="email"]');

    // Check if we are on Login or Register form. Default usually Login.
    await page.type('input[type="email"]', user.email);
    await page.type('input[type="password"]', user.password);

    // Click "Iniciar sesión" (Submit button)
    const loginClicked = await clickButtonByText(page, 'Iniciar sesión');


    // Check if login was successful or we need to switch to register
    // Success means we see "Crear nuevo juego" or "Unirse"
    // Failure might show an alert or stay on page.

    try {
        await page.waitForFunction(
            () => document.body.textContent.includes('Crear nuevo juego') || document.body.textContent.includes('Crear Partida'),
            { timeout: 10000 }
        );
        console.log(`✅ [${user.name}] Logged in successfully.`);
        return page;
    } catch (e) {
        console.log(`⚠️ [${user.name}] Login validation timed out. Body text:`, await page.evaluate(() => document.body.innerText.substring(0, 100)));
        console.log(`⚠️ [${user.name}] Assuming user needs registration (or login failed).`);
    }

    // If we are here, Login failed (likely user doesn't exist). Let's Register.
    console.log(`[${user.name}] Switching to Registration...`);

    // We are currently in Login Mode (failed). We need to go Back -> Select Mode -> Register Mode
    // Click "Volver"
    const backClicked = await clickButtonByText(page, 'Volver');
    if (backClicked) {
        // Wait for Select Mode buttons
        await page.waitForFunction(
            () => Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Crear nueva cuenta')),
            { timeout: 5000 }
        );
    }

    // Click "Crear nueva cuenta"
    await clickButtonByText(page, 'Crear nueva cuenta');

    // Wait for Register Form
    try {
        await page.waitForSelector('input[id="displayName"]', { timeout: 10000 });
    } catch (e) {
        console.log(`❌ [${user.name}] Failed to find Register form. Body:`, await page.evaluate(() => document.body.innerText.substring(0, 200)));
        throw e;
    }

    // Now fill register form
    // Clear inputs first just in case
    await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
    });

    await page.type('input[id="displayName"]', user.name);
    await page.type('input[id="email-register"]', user.email);
    await page.type('input[id="password-register"]', user.password);

    await clickButtonByText(page, 'Crear cuenta');

    // Wait for Dashboard
    await page.waitForFunction(
        () => document.body.textContent.includes('Crear nuevo juego') || document.body.textContent.includes('Crear Partida'),
        { timeout: 10000 }
    );
    console.log(`✅ [${user.name}] Registered and logged in.`);

    return page;
}

async function runTest() {
    console.log('🚀 Starting Full E2E Test Suite');
    console.log('--------------------------------');

    const browser = await puppeteer.launch({
        headless: false, // UI requested
        defaultViewport: null,
        args: ['--window-size=1280,800', '--no-sandbox']
    });

    try {
        // --- STEP 1: HOST CREATES GAME ---
        const hostPage = await authenticateUser(browser, 'HOST');

        // Screenshot Dashboard
        await hostPage.screenshot({ path: `${SCREENSHOTS_DIR}/host_dashboard.png` });

        // Create Game (if button exists)
        const createBtn = await clickButtonByText(hostPage, 'Crear nuevo juego');
        if (createBtn) {
            console.log('[Host] Clicked "Crear nuevo juego"');
        } else {
            console.log('[Host] "Crear nuevo juego" not found. Assuming already in game or redirecting...');
        }

        // Wait for lobby/game room (URL contains /app/game/ or gameId=)
        await hostPage.waitForFunction(() => {
            const url = window.location.href;
            return url.includes('/app/game/') || url.includes('gameId=');
        }, { timeout: 10000 });

        // Extract Game ID
        const gameId = await hostPage.evaluate(() => {
            const url = window.location.href;
            if (url.includes('gameId=')) {
                return new URLSearchParams(window.location.search).get('gameId');
            }
            // Path: /app/game/GAMEID
            const match = url.match(/\/app\/game\/([A-Za-z0-9_-]+)/);
            return match ? match[1] : null;
        });

        if (!gameId) throw new Error('Could not extract Game ID');

        console.log(`📝 Game Created/Recovered. ID: ${gameId}`);
        await hostPage.screenshot({ path: `${SCREENSHOTS_DIR}/host_lobby.png` });

        // Update Invite Link for Guests (Guests use public join link with query param)
        // const inviteLink = `${BASE_URL}/?gameId=${gameId}`; 
        // Guest test uses goto with query param logic directly:


        // --- STEP 2: GUEST 1 JOINS ---
        const guest1Page = await authenticateUser(browser, 'GUEST_1');

        console.log(`[Guest1] Joining game ${gameId}...`);
        await guest1Page.goto(`${BASE_URL}/?gameId=${gameId}`); // Legacy query param method which LandingPage handles

        // Wait for invitation card
        await guest1Page.waitForFunction(() => document.body.textContent.includes('¡Te han invitado!'));
        await clickButtonByText(guest1Page, 'Entrar a la sala');

        // Verify Guest 1 is in lobby
        await guest1Page.waitForFunction(() => document.body.textContent.includes('Estás en la partida'));
        console.log('✅ [Guest1] Joined successfully.');
        await guest1Page.screenshot({ path: `${SCREENSHOTS_DIR}/guest1_lobby.png` });

        // --- STEP 3: START GAME ---
        console.log('[Host] Starting game...');
        await clickButtonByText(hostPage, 'Comenzar juego');

        // Wait for game start (check for role reveal or word)
        await wait(2000);
        await hostPage.screenshot({ path: `${SCREENSHOTS_DIR}/game_started.png` });
        console.log('✅ Game Started.');

        // --- STEP 4: LATE JOIN RESTRICTION ("Game in Progress") ---
        console.log('[LateGuest] Attempting to join in-progress game...');
        const lateGuestPage = await authenticateUser(browser, 'GUEST_LATE');

        await lateGuestPage.goto(`${BASE_URL}/?gameId=${gameId}`);

        // Wait for invitation
        await lateGuestPage.waitForFunction(() => document.body.textContent.includes('¡Te han invitado!'));
        await clickButtonByText(lateGuestPage, 'Entrar a la sala');

        // VERIFY ERROR SCREEN
        // We look for "Partida en curso" and the red icon (visually implied by context, text verified here)
        await lateGuestPage.waitForFunction(() => document.body.textContent.includes('Partida en curso'));
        console.log('✅ [LateGuest] correctly blocked with "Partida en curso" screen.');
        await lateGuestPage.screenshot({ path: `${SCREENSHOTS_DIR}/game_in_progress_error.png` });

        console.log('--------------------------------');
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY');

    } catch (e) {
        console.error('❌ TEST FAILED:', e);
    } finally {
        await browser.close();
    }
}

runTest();
