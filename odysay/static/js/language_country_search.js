/*
 * Shared country picker.
 *
 * This module deliberately keeps the selected value as the canonical Korean
 * country name.  The visible label can change with the UI language without
 * breaking the currency, timezone, weather and existing database lookups.
 */
(function (global) {
    'use strict';

    function getCountryApi() {
        return global.OdysayCountries || null;
    }

    function getElement(target) {
        if (!target) return null;
        return typeof target === 'string' ? document.querySelector(target) : target;
    }

    function getLanguage() {
        return global.OdysayLanguage?.getLanguage?.() || 'ko';
    }

    class CountryPicker {
        constructor(options) {
            this.options = options || {};
            this.input = getElement(this.options.input);
            this.results = getElement(this.options.results);
            this.hiddenInput = getElement(this.options.hiddenInput);
            this.wrapper = getElement(this.options.wrapper) || this.input?.parentElement;
            this.itemClass = this.options.itemClass || 'country-option';
            this.emptyClass = this.options.emptyClass || 'country-no-result';
            this.activeClass = this.options.activeClass || 'selected';
            this.openClass = this.options.openClass || 'active';
            this.maxResults = this.options.maxResults || 80;
            this.selectedCountry = null;
            this.matches = [];
            this.activeIndex = -1;
            this.isOpen = false;

            if (!this.input || !this.results || !getCountryApi()) return;

            this.results.setAttribute('role', 'listbox');
            this.input.setAttribute('aria-autocomplete', 'list');
            this.input.setAttribute('aria-expanded', 'false');
            this.bindEvents();

            const initialCountry = getCountryApi().canonicalize(this.hiddenInput?.value || this.input.value);
            if (initialCountry) {
                this.select(initialCountry, { notify: false, keepOpen: false });
            }
        }

        bindEvents() {
            this.input.addEventListener('focus', () => this.open());
            this.input.addEventListener('click', () => this.open());

            this.input.addEventListener('input', () => {
                const countryApi = getCountryApi();
                this.selectedCountry = countryApi.canonicalize(this.input.value);
                if (this.hiddenInput) this.hiddenInput.value = this.selectedCountry || '';
                this.options.onInput?.(this.selectedCountry, this.input.value);
                this.open();
            });

            this.input.addEventListener('keydown', (event) => this.handleKeydown(event));

            document.addEventListener('pointerdown', (event) => {
                if (!this.wrapper?.contains(event.target)) this.close();
            });

            global.addEventListener('odysay:languagechange', () => {
                if (this.selectedCountry) {
                    this.input.value = getCountryApi().displayName(this.selectedCountry, getLanguage());
                }
                if (this.isOpen) this.render();
            });
        }

        open() {
            if (!this.input || !this.results) return;
            this.isOpen = true;
            this.render();
        }

        close() {
            if (!this.input || !this.results) return;
            this.isOpen = false;
            this.activeIndex = -1;
            this.results.classList.remove(this.openClass);
            this.results.style.display = 'none';
            this.input.setAttribute('aria-expanded', 'false');
        }

        render() {
            const countryApi = getCountryApi();
            if (!countryApi || !this.results) return;

            this.matches = countryApi.search(this.input.value).slice(0, this.maxResults);
            this.activeIndex = -1;
            this.results.replaceChildren();

            if (!this.matches.length) {
                const empty = document.createElement('div');
                empty.className = this.emptyClass;
                empty.setAttribute('role', 'status');
                empty.textContent = global.OdysayLanguage?.t?.('countrySearch.noResults') || '검색 결과가 없습니다.';
                this.results.append(empty);
            } else {
                this.matches.forEach((record, index) => {
                    const item = document.createElement('div');
                    item.className = this.itemClass;
                    item.setAttribute('role', 'option');
                    item.dataset.country = record.ko;
                    item.textContent = countryApi.displayName(record.ko, getLanguage());
                    item.addEventListener('mousedown', (event) => {
                        event.preventDefault();
                        this.select(record.ko);
                    });
                    item.addEventListener('mouseenter', () => this.setActive(index));
                    this.results.append(item);
                });
            }

            this.results.classList.add(this.openClass);
            this.results.style.display = 'block';
            this.input.setAttribute('aria-expanded', 'true');
        }

        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.close();
                return;
            }

            if (event.key === 'Enter') {
                if (!this.isOpen) return;
                event.preventDefault();
                if (this.matches.length) {
                    this.select(this.matches[this.activeIndex >= 0 ? this.activeIndex : 0].ko);
                }
                return;
            }

            if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;

            event.preventDefault();
            if (!this.isOpen) this.open();
            if (!this.matches.length) return;

            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const initialIndex = direction === 1 ? 0 : this.matches.length - 1;
            const next = this.activeIndex < 0
                ? initialIndex
                : (this.activeIndex + direction + this.matches.length) % this.matches.length;
            this.setActive(next);
        }

        setActive(index) {
            this.activeIndex = index;
            const items = this.results.querySelectorAll(`.${this.itemClass}`);
            items.forEach((item, itemIndex) => {
                const isActive = itemIndex === index;
                item.classList.toggle(this.activeClass, isActive);
                item.setAttribute('aria-selected', String(isActive));
                if (isActive) item.scrollIntoView({ block: 'nearest' });
            });
        }

        select(country, options = {}) {
            const countryApi = getCountryApi();
            const canonical = countryApi?.canonicalize(country);
            if (!canonical || !this.input) return;

            this.selectedCountry = canonical;
            this.input.value = countryApi.displayName(canonical, getLanguage());
            if (this.hiddenInput) this.hiddenInput.value = canonical;
            this.options.onSelect?.(canonical, countryApi.get(canonical));
            if (options.notify !== false) this.options.onChange?.(canonical, countryApi.get(canonical));
            if (!options.keepOpen) this.close();
        }

        getCanonicalValue() {
            return getCountryApi()?.canonicalize(this.hiddenInput?.value || this.input?.value) || null;
        }
    }

    global.OdysayCountrySearch = Object.freeze({
        create(options) {
            return new CountryPicker(options);
        },
        search(query) {
            return getCountryApi()?.search(query) || [];
        },
        canonicalize(value) {
            return getCountryApi()?.canonicalize(value) || null;
        },
        displayName(value, language = getLanguage()) {
            return getCountryApi()?.displayName(value, language) || value || '';
        }
    });
})(window);
