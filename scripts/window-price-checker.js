const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('results', { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const products = [
  ['neo', 'https://www.widuro.de/p/aluplast-ideal-neo'],
  ['lumaxx', 'https://www.widuro.de/p/gealan-lumaxx'],
  ['green', 'https://www.widuro.de/p/salamander-greenevolution-flex-76-md'],
  ['energy', 'https://www.widuro.de/p/drutex-iglo-energy-classic'],
  ['edge', 'https://www.widuro.de/p/drutex-iglo-edge']
];

async function cookie(page) {
  for (const t of ['Alle akzeptieren', 'Akzeptieren', 'Alles akzeptieren', 'OK']) {
    try {
      const x = page.getByText(t, { exact: false }).first();
      if (await x.count()) await x.click({ force: true, timeout: 700 });
    } catch {}
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const out = {};
  for (const [key, url] of products) {
    const page = await browser.newPage({ locale: 'de-DE', viewport: { width: 1440, height: 1200 } });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await sleep(3200);
      await cookie(page);
      const btn = page.getByText('Jetzt konfigurieren', { exact: false }).first();
      if (await btn.count()) {
        await btn.click({ force: true });
        await sleep(4500);
      }
      const frames = [];
      for (const f of page.frames()) {
        try {
          const text = (await f.locator('body').innerText().catch(() => '')).slice(0, 45000);
          const controls = await f.evaluate(() => [...document.querySelectorAll('input,select,textarea,button,[role=button]')]
            .filter(x => x.offsetParent !== null)
            .map(x => ({
              tag: x.tagName,
              type: x.type || '',
              name: x.name || '',
              id: x.id || '',
              value: x.value || '',
              placeholder: x.placeholder || '',
              text: (x.innerText || x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 200),
              parent: (x.parentElement?.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 300),
              outer: x.outerHTML.slice(0, 900)
            }))
            .filter(x => /breit|höhe|width|height|maß|mass|dreh|kipp|glas|verglas|profil|beschlag|scharn|verdeckt|preis|price|warenkorb|bestell/i.test(JSON.stringify(x)))
            .slice(0, 700));
          frames.push({ url: f.url(), text, controls });
        } catch {}
      }
      out[key] = { url: page.url(), title: await page.title(), frames };
    } catch (e) {
      out[key] = { error: String(e), url: page.url(), text: (await page.locator('body').innerText().catch(() => '')).slice(0, 15000) };
    }
    await page.close();
  }
  fs.writeFileSync('results/widuro-inspect.json', JSON.stringify(out, null, 2));
  await browser.close();
})();
