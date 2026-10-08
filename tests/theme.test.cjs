// Run with: node --test tests/theme.test.cjs (no third-party dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../odysay/static/js/theme.js'), 'utf8');

function page({ saved = null, dark = false, blocked = false } = {}) {
    const handlers = {};
    const root = { dataset: {}, style: {} };
    const icon = {};
    const button = {
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelector() { return icon; },
    };
    const media = { matches: dark, addEventListener(_, callback) { this.change = callback; } };
    const store = { value: saved, writes: 0 };
    class Element { closest() { return button; } }
    const context = vm.createContext({
        Element,
        document: {
            readyState: 'loading', documentElement: root,
            querySelectorAll() { return [button]; },
            addEventListener(name, callback) { handlers[name] = callback; },
        },
        window: {
            matchMedia() { return media; },
            addEventListener(name, callback) { handlers[name] = callback; },
        },
        localStorage: {
            getItem() { if (blocked) throw new Error('storage blocked'); return store.value; },
            setItem(_, value) { if (blocked) throw new Error('storage blocked'); store.value = value; store.writes++; },
        },
    });
    vm.runInContext(source, context);
    handlers.DOMContentLoaded();
    return { root, button, icon, store, media, handlers, context,
        click: () => handlers.click({ target: new Element() }) };
}

test('one click toggles once and survives a new page', () => {
    const p = page();
    assert.equal(p.root.dataset.theme, 'light');
    p.click();
    assert.equal(p.root.dataset.theme, 'dark');
    assert.equal(p.root.dataset.bsTheme, 'dark');
    assert.equal(p.button.attributes['aria-pressed'], 'true');
    assert.equal(p.store.value, 'dark');
    assert.equal(page({ saved: p.store.value }).root.dataset.theme, 'dark');
    vm.runInContext(source, p.context);
    p.click();
    assert.equal(p.root.dataset.theme, 'light');
    assert.equal(p.store.writes, 2);
});

test('system preference applies only until an explicit selection', () => {
    const p = page({ dark: true, saved: 'invalid' });
    assert.equal(p.root.dataset.theme, 'dark');
    assert.equal(p.store.writes, 0);
    p.media.matches = false;
    p.media.change();
    assert.equal(p.root.dataset.theme, 'light');
    p.click();
    p.media.change();
    assert.equal(p.root.dataset.theme, 'dark');
    assert.equal(page({ saved: 'light', dark: true }).root.dataset.theme, 'light');
});

test('blocked storage does not prevent toggling', () => {
    const p = page({ blocked: true });
    p.click();
    assert.equal(p.root.dataset.theme, 'dark');
    p.click();
    assert.equal(p.root.dataset.theme, 'light');
});

test('other tabs synchronize and clearing preference returns to system mode', () => {
    const p = page({ saved: 'light', dark: true });
    p.store.value = 'dark';
    p.handlers.storage({ key: 'odysay-theme' });
    assert.equal(p.root.dataset.theme, 'dark');
    p.store.value = null;
    p.media.matches = false;
    p.handlers.storage({ key: null });
    assert.equal(p.root.dataset.theme, 'light');
});
