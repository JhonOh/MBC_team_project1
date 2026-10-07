const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../odysay/static/js/language.js'), 'utf8');

function loadPage(href, savedLanguage = null, storageBlocked = false) {
    const listeners = {};
    let stored = savedLanguage;
    const document = { title: '어딧세이', body: null, documentElement: {}, addEventListener() {} };
    const window = {
        location: { href },
        history: {
            state: { existing: 'state' },
            replaceState(state, title, url) {
                assert.equal(state, this.state);
                window.location.href = url;
            }
        },
        localStorage: {
            getItem() { if (storageBlocked) throw Error('Storage blocked'); return stored; },
            setItem(key, value) { if (storageBlocked) throw Error('Storage blocked'); stored = value; }
        },
        addEventListener(name, callback) { listeners[name] = callback; },
        dispatchEvent() {}
    };
    vm.runInNewContext(source, { window, document, URL, CustomEvent: class {} });
    return { window, document, listeners, getStored: () => stored };
}

test('explicit URL language wins over the saved preference and is saved for navigation', () => {
    const page = loadPage('https://odysay.test/homepage?lang=en', 'ko');
    assert.equal(page.window.OdysayLanguage.getLanguage(), 'en');
    assert.equal(page.document.documentElement.lang, 'en');
    const next = loadPage('https://odysay.test/homepage/trip_list', page.getStored());
    assert.equal(new URL(next.window.location.href).searchParams.get('lang'), 'en');
    assert.equal(loadPage('https://odysay.test/?lang=ko', 'en').getStored(), 'ko');
});

test('switching keeps page, search filters, coordinates, fragment and history state', () => {
    const page = loadPage('https://odysay.test/homepage?query=%ED%95%9C%EA%B5%AD&lat=37.5#map');
    page.window.OdysayLanguage.setLanguage('en');
    let url = new URL(page.window.location.href);
    assert.equal(url.pathname, '/homepage');
    assert.equal(url.searchParams.get('query'), '한국');
    assert.equal(url.searchParams.get('lat'), '37.5');
    assert.equal(url.hash, '#map');
    assert.equal(url.searchParams.get('lang'), 'en');
    page.window.OdysayLanguage.setLanguage('ko');
    url = new URL(page.window.location.href);
    assert.deepEqual(url.searchParams.getAll('lang'), ['ko']);
});

test('invalid or absent language falls back to saved language and then Korean', () => {
    assert.equal(loadPage('https://odysay.test/?lang=xx', 'en').getStored(), 'en');
    assert.equal(loadPage('https://odysay.test/').getStored(), 'ko');
});

test('explicit URL language works when localStorage is blocked', () => {
    const page = loadPage('https://odysay.test/?lang=en', null, true);
    assert.equal(page.window.OdysayLanguage.getLanguage(), 'en');
    page.window.OdysayLanguage.setLanguage('ko');
    assert.equal(new URL(page.window.location.href).searchParams.get('lang'), 'ko');
});

test('history navigation and restored pages follow the language in their URL', () => {
    const page = loadPage('https://odysay.test/?lang=en');
    page.window.location.href = 'https://odysay.test/?lang=ko';
    page.listeners.popstate();
    assert.equal(page.window.OdysayLanguage.getLanguage(), 'ko');
    page.window.location.href = 'https://odysay.test/?lang=en';
    page.listeners.pageshow({ persisted: true });
    assert.equal(page.window.OdysayLanguage.getLanguage(), 'en');
});

test('photo requirement uses a stable translation key in both languages', () => {
    const page = loadPage('https://odysay.test/homepage/upload?lang=en');
    const language = page.window.OdysayLanguage;
    assert.equal(language.t('upload.photoDescription'),
        'Add photos that showcase this destination. (At least 1 required; up to 10 photos)');
    language.setLanguage('ko');
    assert.equal(language.t('upload.photoDescription'),
        '여행지의 매력을 보여주는 사진을 추가해주세요. (*필수 1장, 1~10장)');
    const template = readFileSync(join(__dirname, '../odysay/templates/upload.html'), 'utf8');
    assert.match(template, /class="photo-info" data-i18n="upload\.photoDescription"/);
});
