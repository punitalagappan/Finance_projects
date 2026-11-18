// App Store metadata limits and release-config sanity checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP, iosRedirect } from '../public/app.config.js';

const listing = JSON.parse(fs.readFileSync(new URL('../store/listing.json', import.meta.url)));

test('App Store text fits Apple limits', () => {
  assert.ok(listing.name.length <= 30, `name ${listing.name.length}`);
  assert.ok(listing.subtitle.length <= 30, `subtitle ${listing.subtitle.length}`);
  assert.ok(listing.promotionalText.length <= 170, `promo ${listing.promotionalText.length}`);
  assert.ok(listing.keywords.length <= 100, `keywords ${listing.keywords.length}`);
  assert.ok(listing.description.length <= 4000, `description ${listing.description.length}`);
  assert.ok(listing.whatsNew.length <= 4000);
});

test('Store metadata avoids third-party trademarks in name, subtitle and keywords', () => {
  const risky = /fitbit|whoop|pixel|google|apple|oura|garmin/i;
  for (const k of ['name', 'subtitle', 'keywords', 'promotionalText']) {
    if (k === 'promotionalText') continue; // compatibility wording is allowed in promo/description
    assert.ok(!risky.test(listing[k]), `${k} contains a trademark`);
  }
  assert.ok(!/whoop/i.test(listing.description), 'description should not name competitors');
});

test('Screenshots and icon exist at App Store sizes', () => {
  const shots = fs.readdirSync(new URL('../store/screenshots/6.9in/', import.meta.url)).filter((f) => f.endsWith('.jpg'));
  assert.ok(shots.length >= 3 && shots.length <= 10);
  assert.ok(fs.existsSync(new URL('../store/icon-1024.png', import.meta.url)));
});

test('OAuth redirect derives from the iOS client ID', () => {
  assert.equal(iosRedirect(''), null);
  const r = iosRedirect('123-abc.apps.googleusercontent.com');
  assert.equal(r.scheme, 'com.googleusercontent.apps.123-abc');
  assert.equal(r.uri, 'com.googleusercontent.apps.123-abc:/oauth2redirect');
  assert.match(APP.bundleId, /^[a-z0-9.-]+$/i);
});
