const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Desktop
  const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('http://localhost:3000');
  await pageDesktop.waitForTimeout(2000); // wait for map and data to load
  await pageDesktop.screenshot({ path: 'desktop.png' });

  // Mobile
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000');
  await pageMobile.waitForTimeout(2000);
  await pageMobile.screenshot({ path: 'mobile.png' });

  await browser.close();
})();
