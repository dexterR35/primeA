/* ==========================================================================
   LOJA PRIVATĂ - theme switch
   --------------------------------------------------------------------------
   Loaded RENDER-BLOCKING in <head>, before the first paint. That is the whole
   point of it being its own file rather than part of app.js: the attribute
   has to be on <html> before the browser paints, or a returning light-mode
   visitor gets a black flash. It is a separate file rather than an inline
   <script> because the page ships a strict CSP (script-src 'self'), which
   forbids inline script - and widening the CSP for a theme switch would be a
   poor trade.

   Contract with the CSS:
     <html data-theme="dark">   assets/css/style.css        (the default)
     <html data-theme="light">  assets/css/theme-light.css

   The attribute is ALWAYS written, so no stylesheet has to guess.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'lp-theme';
  var DARK  = 'dark';
  var LIGHT = 'light';

  /* What a visitor who has never touched the switch gets.
     'dark'   - the designed default (this is a dark-first brand)
     'system' - follow the operating system, and keep following it
     Changing this one string is the whole configuration. */
  var DEFAULT = DARK;

  var THEME_COLOR = { dark: '#111220', light: '#fbfaf8' };

  var LABEL = {
    /* the label describes what the click DOES, not what is on screen */
    dark:  'Comută pe modul luminos',
    light: 'Comută pe modul întunecat'
  };

  var root  = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;


  /* ----------------------------------------------------------------------
     Storage. Safari in private mode throws on read AND on write, and a
     browser set to block site data throws on both too, so every access is
     wrapped. A visitor whose storage is unavailable simply gets a switch
     that works for the session and forgets afterwards.
     ---------------------------------------------------------------------- */

  function stored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return (v === DARK || v === LIGHT) ? v : null;
    } catch (e) { return null; }
  }

  function remember(theme) {
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* no-op */ }
  }

  function systemTheme() {
    return (media && media.matches) ? LIGHT : DARK;
  }

  function preferred() {
    return stored() || (DEFAULT === 'system' ? systemTheme() : DEFAULT);
  }


  /* ----------------------------------------------------------------------
     Apply. Runs once immediately (before paint) and again on every switch.
     ---------------------------------------------------------------------- */

  function apply(theme) {
    root.setAttribute('data-theme', theme);

    /* The browser chrome - address bar on mobile, form controls, the canvas
       behind an over-scroll - follows these two, not the stylesheet. */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
    root.style.colorScheme = theme;

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', LABEL[theme]);
      btn.setAttribute('title', LABEL[theme]);
    });
  }

  /* before the first paint */
  apply(preferred());


  /* ----------------------------------------------------------------------
     Wire the switch once the markup exists.
     ---------------------------------------------------------------------- */

  function current() {
    return root.getAttribute('data-theme') === LIGHT ? LIGHT : DARK;
  }

  function toggle() {
    var next = current() === LIGHT ? DARK : LIGHT;
    remember(next);
    apply(next);
  }

  function bind() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });

    /* the label depends on the current theme, and the buttons only exist now */
    apply(current());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }


  /* ----------------------------------------------------------------------
     Stay in sync.
     ---------------------------------------------------------------------- */

  /* Another tab of the same site switched: follow it, without re-storing. */
  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY) return;
    apply(preferred());
  });

  /* The OS switched. Only relevant while the visitor has made no choice of
     their own - an explicit choice outranks the system, in both directions. */
  if (media) {
    var onSystemChange = function () {
      if (DEFAULT !== 'system' || stored()) return;
      apply(systemTheme());
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);   /* Safari < 14 */
  }
})();
