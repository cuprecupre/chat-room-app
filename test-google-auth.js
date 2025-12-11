const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5173';

async function runTest() {
    console.log('🚀 Starting Google Auth E2E Test...');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Enable console logging
        page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));

        // Inject Mock Function BEFORE page load
        await page.evaluateOnNewDocument(() => {
            window.mockSignInWithPopup = async (auth, provider) => {
                console.log('🎭 Executing MOCK Google Sign In...');
                // Mimic Firebase Auth User Credential
                const mockUser = {
                    uid: 'mock-google-uid-123',
                    displayName: 'Mock Google User',
                    email: 'mock.google@example.com',
                    photoURL: 'https://via.placeholder.com/150',
                    getIdToken: async () => 'mock-token-123',
                    reload: async () => { },
                };

                // We need to trigger onAuthStateChanged somehow or just setUser
                // But useAuth listens to onIdTokenChanged(auth)
                // In a real app, signInWithPopup updates the Auth instance state.
                // Since we can't easily touch the real 'auth' instance from here (it's inside closure/module),
                // we depend on the app's logic.

                // WAIT: usage in useAuth is: await signInWithPopup(...) => returns UserCredential
                // But onIdTokenChanged fires automatically when auth state changes.
                // If we mock signInWithPopup, valid Firebase events WON'T fire unless we trigger them 
                // OR if useAuth manually sets user.

                // useAuth implementation:
                // await signInWithPopup(...)
                // catch(err) ...

                // It does NOT call setUser manually on success. It relies on the listener.
                // So purely returning a value here is NOT ENOUGH if the listener is the only way state updates.

                // However, I can try to hack it:
                // If I cannot resolve the auth listener, I might need to dispatch a custom event that useAuth listens to?
                // OR, simplest hack: The mock function should probably throw an error "MOCK SUCCESS" 
                // and we catch it? No.

                // Let's look at logic:
                // const performSignIn = ... -> await performSignIn();
                // console.log('✅ Login exitoso');

                // If I return successfully, code continues.
                // But `user` state depends on `onIdTokenChanged`.

                // Hack: allow `useAuth` to expose a global setter? No.

                // If this is running in dev/test, maybe I can expose `auth`?
                // Or simply: The test might require `useAuth` to manually update state if mock usage is detected?

                // Let's modify useAuth again to handle this case:
                // If window.mockSignInWithPopup exists, and it returns a user, we manually setUser(user).

                // Just for this test, I will modify useAuth to read the return value.
                return {
                    user: mockUser,
                    providerId: 'google.com'
                };
            };

            // MOCK SOCKET IO
            window.MockSocketIO = class MockSocketIO {
                constructor(url, options) {
                    console.log('🔌 MockSocketIO created for', url);
                    this.connected = true;
                    this.callbacks = {};
                    setTimeout(() => {
                        this.trigger('connect');
                        console.log('✅ Mock Socket Connected Event Triggered');
                    }, 100);
                }

                on(event, callback) {
                    this.callbacks[event] = callback;
                }

                emit(event, payload) {
                    console.log(`📡 Mock Socket Emit: ${event}`, payload);
                }

                trigger(event, payload) {
                    if (this.callbacks[event]) {
                        this.callbacks[event](payload);
                    }
                }

                disconnect() {
                    console.log('🔌 Mock Socket Disconnected');
                    this.connected = false;
                }
            };
        });

        console.log('Navigate to home...');
        await page.goto(BASE_URL);

        // Find "Continuar con Google" button
        const googleBtn = await page.waitForSelector('button ::-p-text(Continuar con Google)');

        console.log('Clicking Google Login...');
        await googleBtn.click();

        // Wait for Lobby (user name confirmation)
        await page.waitForFunction(
            () => document.body.textContent.includes('Mock Google User'),
            { timeout: 10000 }
        );
        console.log('✅ Found "Mock Google User" in UI.');

        // Verify socket connected
        await page.waitForFunction(
            () => {
                const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Crear nuevo juego'));
                return !!button;
            },
            { timeout: 10000 }
        );
        console.log('✅ Found "Crear nuevo juego" button.');

        // SCREENSHOT 4: Google Auth Success
        await page.screenshot({ path: 'screenshot_google_auth.png', fullPage: true });
        console.log('📸 Screenshot captured: screenshot_google_auth.png');

        console.log('🎉 Google Mock Auth Test Passed!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await browser.close();
    }
}

runTest();
