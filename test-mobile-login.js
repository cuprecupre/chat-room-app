// Test automatizado para verificar login en diferentes dispositivos
// Ejecutar con: node test-mobile-login.js

const puppeteer = require('puppeteer');

const devices = [
  {
    name: 'iPhone 12 iOS 17',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 }
  },
  {
    name: 'iPhone 12 iOS 18',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 }
  },
  {
    name: 'iPad iOS 17',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 820, height: 1180 }
  }
];

async function testLoginOnDevice(device) {
  console.log(`🧪 Testing ${device.name}...`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Ver el navegador
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configurar User Agent y viewport
  await page.setUserAgent(device.userAgent);
  await page.setViewport(device.viewport);
  
  try {
    // Navegar a la app
    await page.goto('http://localhost:5173'); // Ajustar URL
    
    // Esperar a que cargue la página
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Buscar y hacer clic en el botón de Google usando evaluate
    const buttonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const googleButton = buttons.find(btn => btn.textContent.includes('Continuar con Google'));
      if (googleButton) {
        googleButton.click();
        return true;
      }
      return false;
    });
    
    if (!buttonFound) {
      throw new Error('Botón de Google no encontrado');
    }
    
    // Verificar que se abre la página de Google (redirect)
    await page.waitForFunction(() => window.location.href.includes('accounts.google.com'), { timeout: 10000 });
    
    console.log(`✅ ${device.name}: Login redirect funciona correctamente`);
    
  } catch (error) {
    console.log(`❌ ${device.name}: Error - ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function runTests() {
  console.log('🚀 Iniciando tests de login móvil...\n');
  
  for (const device of devices) {
    await testLoginOnDevice(device);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa entre tests
  }
  
  console.log('\n✨ Tests completados');
}

runTests().catch(console.error);
