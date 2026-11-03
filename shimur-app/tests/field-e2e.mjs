// Field documentation: urgency, location and the phone QR (2026-11-03). Runs against `next dev`, /api mocked.
// Run: npx next dev -p 3300 & node tests/field-e2e.mjs [photo.png]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3300';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
const photo = process.argv[2] ? fs.readFileSync(process.argv[2]) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
let failures = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++; };

const findings = [];
async function setup(context, posts) {
  await context.route(/fonts\.(googleapis|gstatic)\.com|appofapp-gh\.vercel\.app|supabase\.co/, r => r.abort());
  await context.route(/\/api\/me/, r => r.fulfill({ json: { editor: true, email: 'shtanat5@gmail.com' } }));
  await context.route(/\/api\/findings/, async r => {
    if (r.request().method() === 'POST') {
      const body = r.request().postDataBuffer()?.toString('latin1') ?? '';
      const notes = Buffer.from(body.match(/name="notes"\r\n\r\n([\s\S]*?)\r\n--/)?.[1] ?? '', 'latin1').toString('utf8');
      posts.push(notes);
      findings.unshift({ id: `f${findings.length}`, location_desc: 'חזית צפונית', notes, created_at: new Date().toISOString(), photo_url: null });
      return r.fulfill({ json: { success: true } });
    }
    return r.fulfill({ json: { findings } });
  });
}

const browser = await chromium.launch();
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    geolocation: { latitude: 31.812281, longitude: 34.644832, accuracy: 7 }, permissions: ['geolocation'] });
  const posts = [];
  await setup(context, posts);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // the personal sign-in link (#editor=key); /api/me is mocked to accept it
  await page.goto(BASE + '/field/1#editor=test_key_for_e2e_only_000', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.field-urgency', { timeout: 60000 });
  ok((await page.locator('.field-urgency button').count()) === 4, 'phone: four urgency buttons');
  ok(!(await page.locator('.phone-qr').isVisible().catch(() => false)), 'phone: no QR on the phone itself');
  await page.locator('input[placeholder^="חזית"]').fill('חזית צפונית, קומה 2');
  await page.locator('#photo-input').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: photo });
  await page.waitForSelector('.field-loc a', { timeout: 10000 });
  ok((await page.locator('.field-loc').textContent()).includes('דיוק 7'), 'phone: the location is taken with the photo');
  await page.waitForSelector('.field-street', { timeout: 15000 }).catch(() => {});
  ok((await page.locator('.field-loc').textContent()).includes("ז'בוטינסקי"), 'phone: the street is named from the municipality layer');
  await page.locator('.field-urgency button', { hasText: 'נדרש תיקון' }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: SHOTS + 'field-phone.png', fullPage: true });
  await page.locator('button', { hasText: 'שמור ממצא' }).click();
  await page.waitForSelector('.finding-extras', { timeout: 10000 });
  ok(posts[0]?.includes('דחיפות: נדרש תיקון') && posts[0]?.includes('31.81228,34.64483') && posts[0]?.includes("רחוב: ז'בוטינסקי, רובע א"), `phone: urgency and place go with the finding (${JSON.stringify(posts[0])})`);
  ok((await page.locator('.finding-extras').first().textContent()).includes('נדרש תיקון'), 'phone: the saved finding shows its urgency');
  ok((await page.locator('.finding-extras a').first().getAttribute('href'))?.includes('google.com/maps?q=31.81228'), 'phone: the saved finding links to the map');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'phone: no horizontal scroll');
  ok(errs.length === 0, `phone: no page errors (${errs.join(' | ')})`);
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  await setup(context, []);
  const page = await context.newPage();
  await page.goto(BASE + '/field', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.phone-qr-code svg', { timeout: 60000 });
  ok(await page.locator('.phone-qr').isVisible(), 'desktop: the field list offers a QR to the phone');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'field-desktop.png' });
  // the streets layer on the map
  await page.goto(BASE + '/map', { waitUntil: 'networkidle', timeout: 120000 });
  await page.locator('button', { hasText: 'רחובות העיר' }).click();
  await page.waitForFunction(() => document.querySelectorAll('path.leaflet-interactive').length > 1000, null, { timeout: 30000 }).catch(() => {});
  ok((await page.locator('path.leaflet-interactive').count()) > 1000, `map: the city streets layer draws (${await page.locator('path.leaflet-interactive').count()} paths)`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + 'map-streets.png' });
  await context.close();
}
// ---------- rephotography: the earlier photo over the live camera ----------
{
  const cam = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const context = await cam.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    geolocation: { latitude: 31.81231, longitude: 34.64487, accuracy: 6 }, permissions: ['geolocation', 'camera'] });
  const posts = [];
  findings.length = 0;
  findings.push({ id: 'old1', location_desc: 'חזית מערבית', notes: "דחיפות: מעקב\nמיקום: 31.81228,34.64483 (דיוק 7 מ')", created_at: '2026-06-01T09:00:00Z', photo_url: '/before.png' });
  await setup(context, posts);
  await context.route(/\/before\.png$/, r => r.fulfill({ contentType: 'image/png', body: photo }));
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/field/1#editor=test_key_for_e2e_only_000', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.rephoto-open', { timeout: 60000 });
  await page.locator('.rephoto-open').click();
  await page.waitForSelector('.rephoto video');
  await page.waitForFunction(() => document.querySelector('.rephoto video')?.videoWidth > 0, null, { timeout: 15000 });
  ok(await page.locator('.rephoto-ghost').isVisible(), 'rephoto: the earlier photo lies over the live camera');
  await page.locator('.rephoto input[type=range]').fill('70');
  ok((await page.locator('.rephoto-ghost').evaluate(e => getComputedStyle(e).opacity)) === '0.7', 'rephoto: the slider sets how see-through it is');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'rephoto-camera.png' });
  await page.locator('.rephoto-shoot').click();
  await page.waitForSelector('.rephoto-pair', { timeout: 10000 });
  ok((await page.locator('.rephoto').count()) === 0, 'rephoto: the camera closes after the shot');
  ok((await page.locator('input[placeholder^="חזית"]').inputValue()) === 'חזית מערבית', 'rephoto: the place carries over from the earlier finding');
  await page.waitForSelector('.field-loc a', { timeout: 10000 });
  await page.screenshot({ path: SHOTS + 'rephoto-pair.png', fullPage: true });
  await page.locator('button', { hasText: 'שמור ממצא' }).click();
  await page.waitForSelector('.finding-repeat', { timeout: 10000 });
  ok(/צילום חוזר של: old1 · [^\r\n]+ · \d+ מ' מהצילום הקודם/.test(posts[0] ?? ''), `rephoto: the finding names the one it repeats and the distance (${JSON.stringify(posts[0])})`);
  ok((await page.locator('.finding-repeat').first().textContent()).includes("מ' מנקודת הצילום הקודמת"), 'rephoto: the saved pair says how far apart the two shots were');
  // Esc closes the camera
  await page.locator('.rephoto-open').first().click();
  await page.waitForSelector('.rephoto');
  await page.keyboard.press('Escape');
  ok((await page.locator('.rephoto').count()) === 0, 'rephoto: Esc closes it');
  ok(errs.length === 0, `rephoto: no page errors (${errs.join(' | ')})`);
  await context.close();
  await cam.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
