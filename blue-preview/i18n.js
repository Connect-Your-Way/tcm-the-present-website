/* TCM The Present — i18n Language Toggle
   ===========================================
   Design preview implementation. Production note (GUIDELINE.md §12):
   The Astro build uses /en/ and /ko/ path prefixes with server-side
   language detection (Accept-Language header + cookie). This preview
   uses a client-side toggle + localStorage for static HTML compatibility.

   Architecture:
   - `data-lang` attribute on <html> drives CSS visibility rules.
   - `.en-only` / `.ko-only` elements hide/show via CSS in base.css.
   - localStorage key: 'tcm-lang' → 'en' | 'ko'
   - Early inline <script> in each page <head> sets data-lang before render.
   - This script wires up toggle buttons on DOMContentLoaded.
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'tcm-lang';
  var DEFAULT_LANG = 'en';

  function getCurrentLang() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; }
    catch (e) { return DEFAULT_LANG; }
  }

  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  /** Apply language to the document — updates html attrs and toggle button state. */
  function applyLang(lang) {
    // Drive CSS rules via data-lang attribute
    document.documentElement.setAttribute('data-lang', lang);
    // Update html[lang] for screen readers
    document.documentElement.lang = lang;

    // Update all toggle buttons (header + mobile nav + footer)
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('lang-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lang = getCurrentLang();
    applyLang(lang);

    // Wire up toggle buttons
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var newLang = btn.getAttribute('data-lang-btn');
        saveLang(newLang);
        applyLang(newLang);
      });
    });
  });

})();
