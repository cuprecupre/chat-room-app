const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5173';

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function authenticateUser(browser, name) {
    // Creating a new incognito browser context for each user
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    // Enable console logging from page
    page.on('console', msg => console.log(`[${name} CONSOLE] ${msg.type()}: ${msg.text()}`));
    // Enable page error logging (uncaught exceptions)
    page.on('pageerror', err => console.log(`[${name} ERROR] ${err.toString()}`));

    // Simulate desktop
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[${name}] Navigating to home...`);
    await page.goto(BASE_URL);

    // Click "Continuar con Email"
    try {
        await page.waitForSelector('button', { timeout: 30000 });
        const emailAuthBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Continuar con Email'));
        });

        if (!emailAuthBtn) throw new Error(`[${name}] "Continuar con Email" button not found`);
        await emailAuthBtn.click();
    } catch (e) {
        console.error(`[${name}] Error clicking "Continuar con Email":`, e.message);
        throw e;
    }

    // Click "Crear nueva cuenta"
    try {
        await page.waitForSelector('button', { timeout: 30000 });
        const createAccountBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Crear nueva cuenta'));
        });
        if (!createAccountBtn) throw new Error(`[${name}] "Crear nueva cuenta" button not found`);
        await createAccountBtn.click();
    } catch (e) {
        console.error(`[${name}] Error clicking "Crear nueva cuenta":`, e.message);
        throw e;
    }

    // Fill Registration Form
    const email = `testuser_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
    const password = 'password123';

    await page.waitForSelector('input[id="displayName"]', { timeout: 30000 });
    await page.type('input[id="displayName"]', name);
    await page.type('input[id="email-register"]', email);
    await page.type('input[id="password-register"]', password);

    console.log(`[${name}] Registering as ${email}...`);

    // Submit
    const submitBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent.includes('Crear cuenta') && b.type === 'submit');
    });
    await submitBtn.click();

    // Wait for Lobby (look for "Crear nuevo juego")
    try {
        await page.waitForFunction(
            () => document.body.textContent.includes('Crear nuevo juego'),
            { timeout: 30000 }
        );
        console.log(`[${name}] Authenticated successfully!`);
    } catch (e) {
        console.error(`[${name}] Failed to reach lobby.`);
        throw e;
    }

    return page;
}

async function runTests() {
    console.log('🚀 Starting E2E Join Flow Tests...');

    const browser = await puppeteer.launch({
        headless: false, // Run in headful mode to see action
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // --- Step 1: Host creates game ---
        const hostPage = await authenticateUser(browser, 'HostUser');

        // Check if "Crear nuevo juego" button exists and click it
        const createGameBtn = await hostPage.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Crear nuevo juego'));
        });
        await createGameBtn.click();

        // Wait for Game Room
        await hostPage.waitForSelector('button', { timeout: 30000 }); // Wait for any button in game room
        // Verify we are in game room by checking URL param
        await hostPage.waitForFunction(() => window.location.search.includes('gameId='), { timeout: 30000 });

        const gameId = await hostPage.evaluate(() => {
            return new URLSearchParams(window.location.search).get('gameId');
        });

        console.log(`✅ Game Created. ID: ${gameId}`);
        const inviteLink = `${BASE_URL}/?gameId=${gameId}`;

        // --- Step 2: Early Bird checks Invitation Screen ---
        const guest1Page = await authenticateUser(browser, 'Guest1');

        console.log(`[Guest1] navigating to ${inviteLink} ...`);
        await guest1Page.goto(inviteLink);

        // Verify Invitation Screen
        await guest1Page.waitForFunction(
            () => document.body.textContent.includes('¡Te han invitado!'),
            { timeout: 30000 }
        );
        console.log('✅ [Guest1] Invitation Screen Verified: "¡Te han invitado!" found.');

        // Guest 1 joins
        const joinBtn = await guest1Page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Entrar a la sala'));
        });

        if (!joinBtn.asElement()) {
            const bodyHTML = await guest1Page.evaluate(() => document.body.innerHTML);
            console.log('[Guest1] DUMPING BODY HTML due to missing button:', bodyHTML);
            throw new Error('[Guest1] "Entrar a la sala" button not found');
        }
        // Check for Invitation Screen "¡Te han invitado!"
        await guest1Page.waitForFunction(
            () => document.body.textContent.includes('¡Te han invitado!'),
            { timeout: 30000 }
        );
        console.log('✅ [Guest1] Invitation Screen Verified: "¡Te han invitado!" found.');

        // SCREENSHOT 1: Invitation Screen
        await guest1Page.screenshot({ path: 'screenshot_invitation.png', fullPage: true });
        console.log('📸 Screenshot captured: screenshot_invitation.png');

        await joinBtn.click();

        // Wait for Guest 1 to be in game room
        await guest1Page.waitForFunction(() => !document.body.textContent.includes('¡Te han invitado!'), { timeout: 30000 });
        console.log('✅ [Guest1] Joined the game.');

        // --- Step 3: Host starts the game ---
        // Wait for Host to see Guest 1 in player list (optional but safer)
        await wait(2000);

        const startGameBtn = await hostPage.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Comenzar juego'));
        });

        if (!startGameBtn) throw new Error('Host cannot find "Comenzar juego" button');

        console.log('[Host] Starting game...');
        await startGameBtn.click();

        // Wait for game phase change (e.g. look for Role reveal or generic change)
        // We can assume if no error, it started.
        await wait(3000); // Give socket time to maintain state

        // --- Step 4: Late Joiner sees "Game in Progress" ---
        const guest2Page = await authenticateUser(browser, 'Guest2');

        console.log(`[Guest2] navigating to ${inviteLink} (Late Join)...`);
        await guest2Page.goto(inviteLink);

        // Wait for Invitation Screen to be ready
        try {
            await guest2Page.waitForFunction(
                () => document.body.textContent.includes('¡Te han invitado!'),
                { timeout: 30000 }
            );
        } catch (e) {
            const bodyHTML = await guest2Page.evaluate(() => document.body.innerHTML);
            console.log('[Guest2] DUMPING BODY HTML due to missing "¡Te han invitado!":', bodyHTML);
            throw e;
        }

        // Guest 2 must click join to trigger the error check on server
        const joinBtnGuest2 = await guest2Page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Entrar a la sala'));
        });
        if (joinBtnGuest2.asElement()) await joinBtnGuest2.click();

        try {
            await guest2Page.waitForFunction(
                () => document.body.textContent.includes('Partida ya iniciada'),
                { timeout: 30000 }
            );
            console.log('✅ [Guest2] Error Screen Verified: "Partida ya iniciada" found.');

            // SCREENSHOT 2: Game Full Error
            await guest2Page.screenshot({ path: 'screenshot_error_full.png', fullPage: true });
            console.log('📸 Screenshot captured: screenshot_error_full.png');

        } catch (e) {
            const bodyHTML = await guest2Page.evaluate(() => document.body.innerHTML);
            console.log('[Guest2] DUMPING BODY HTML due to missing "Partida ya iniciada":', bodyHTML);
            throw e;
        }


        // --- Step 5: Lost User sees "Game Not Found" ---
        const guest3Page = await authenticateUser(browser, 'Guest3');
        const fakeLink = `${BASE_URL}/?gameId=FAKE_ID_12345`;

        console.log(`[Guest3] navigating to ${fakeLink} ...`);
        await guest3Page.goto(fakeLink);

        // Wait for Invitation Screen to be ready
        try {
            await guest3Page.waitForFunction(
                () => document.body.textContent.includes('¡Te han invitado!'),
                { timeout: 30000 }
            );
        } catch (e) {
            const bodyHTML = await guest3Page.evaluate(() => document.body.innerHTML);
            console.log('[Guest3] DUMPING BODY HTML due to missing "¡Te han invitado!":', bodyHTML);
            throw e;
        }

        // Guest 3 must click join to trigger "Game not found" error
        const joinBtnGuest3 = await guest3Page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent.includes('Entrar a la sala'));
        });
        if (joinBtnGuest3.asElement()) await joinBtnGuest3.click();

        try {
            await guest3Page.waitForFunction(
                () => document.body.textContent.includes('Enlace no válido'),
                { timeout: 30000 }
            );
            console.log('✅ [Guest3] Error Screen Verified: "Enlace no válido" found.');

            // SCREENSHOT 3: Invalid Link Error
            await guest3Page.screenshot({ path: 'screenshot_error_invalid.png', fullPage: true });
            console.log('📸 Screenshot captured: screenshot_error_invalid.png');

        } catch (e) {
            const bodyHTML = await guest3Page.evaluate(() => document.body.innerHTML);
            console.log('[Guest3] DUMPING BODY HTML due to missing "Enlace no válido":', bodyHTML);
            throw e;
        }
        console.log('✅ [Guest3] Error Screen Verified: "Enlace no válido" found.');

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        await browser.close();
    }
}

runTests();
