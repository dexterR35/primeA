(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ======================================================================
       OBSERVER HELPERS
       ----------------------------------------------------------------------
       One factory for every "do something when this enters the viewport"
       job on the page. Falls back to running the callback immediately when
       IntersectionObserver is unavailable, so nothing is ever left hidden.
       ====================================================================== */

  function onEnter(nodes, callback, options) {
    var list = Array.prototype.slice.call(nodes);
    if (!list.length) return null;

    if (!("IntersectionObserver" in window)) {
      list.forEach(function (el) {
        callback(el);
      });
      return null;
    }

    var io = new IntersectionObserver(function (entries, self) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        self.unobserve(entry.target);
        callback(entry.target);
      });
    }, options || {});

    list.forEach(function (el) {
      io.observe(el);
    });
    return io;
  }

  var LAZY_MARGIN = "300px 0px";

  function swapSources(picture) {
    picture.querySelectorAll("source[data-srcset]").forEach(function (source) {
      source.srcset = source.getAttribute("data-srcset");
      source.removeAttribute("data-srcset");
    });
  }

  function loadImage(img) {
    var box = img.closest(".lazy-media");
    var picture = img.closest("picture");

    function settle(ok) {
      if (!box) return;
      box.classList.add(ok ? "is-loaded" : "is-failed");
    }

    img.addEventListener(
      "load",
      function () {
        settle(true);
      },
      { once: true },
    );
    img.addEventListener(
      "error",
      function () {
        settle(false);
      },
      { once: true },
    );

    if (picture) swapSources(picture);

    if (img.getAttribute("data-srcset")) {
      img.srcset = img.getAttribute("data-srcset");
      img.removeAttribute("data-srcset");
    }
    if (img.getAttribute("data-src")) {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
    }

    /* already in the cache: the load event may never fire */
    if (img.complete && img.naturalWidth > 0) settle(true);
  }

  function initLazyMedia() {
    onEnter(
      document.querySelectorAll(
        "img[data-src]:not([data-hero-img]), img[data-srcset]:not([data-hero-img])",
      ),
      loadImage,
      { rootMargin: LAZY_MARGIN },
    );

    onEnter(
      document.querySelectorAll("[data-bg]"),
      function (el) {
        el.classList.add("is-bg-loaded");
        el.removeAttribute("data-bg");
      },
      { rootMargin: LAZY_MARGIN },
    );
  }

  var AUTOPLAY_MS = 4500;

  /* Run after the page has finished loading, never during it. Waiting for
       `load` is the point: starting a timer at boot can fire while the hero
       and fonts are still arriving, which is exactly what we are avoiding.
       requestIdleCallback is preferred but Safari shipped it late, so a plain
       timer races it - first one wins. */
  function whenIdle(fn) {
    var ran = false;
    function once() {
      if (ran) return;
      ran = true;
      fn();
    }
    function schedule() {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(once, { timeout: 2000 });
      }
      window.setTimeout(once, 1000);
    }
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
  }

  function initHero() {
    var stage = document.getElementById("heroStage");
    if (!stage) return;

    var slides = Array.prototype.slice.call(
      stage.querySelectorAll(".hero_slide"),
    );
    if (!slides.length) return;

    var dotsWrap = document.getElementById("heroDots");
    var hero = stage.closest(".hero");
    var btnPrev = document.querySelector("[data-hero-prev]");
    var btnNext = document.querySelector("[data-hero-next]");
    var single = slides.length < 2;

    var index = Math.max(
      0,
      slides.indexOf(stage.querySelector(".hero_slide.is-active")),
    );
    var timer = null;
    var dots = [];
    var booted = false;

    /* a single slide needs no chrome */
    if (single) {
      if (hero) {
        var controls = hero.querySelector(".hero_controls");
        if (controls) controls.hidden = true;
        hero.removeAttribute("aria-roledescription");
      }
      paint(0);
      return;
    }

    /* ---- indicators ---- */
    if (dotsWrap) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute(
          "aria-label",
          "Slide " + (i + 1) + " of " + slides.length,
        );
        dot.addEventListener("click", function () {
          go(i);
          restart();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    /* Slide 1 ships its image in the markup (it is the LCP element). The rest
         carry data-src and are pulled in here - during idle time, and always
         ahead of the slide actually being needed, so a switch never lands on an
         empty frame. */
    function ensureLoaded(slide) {
      if (!slide) return;
      var img = slide.querySelector("img[data-src], img[data-srcset]");
      if (img) loadImage(img);
    }

    function paint(next) {
      index = (next + slides.length) % slides.length;

      ensureLoaded(slides[index]);
      /* One ahead - but not on the first paint, which would pull slide 2 in
           at load time and undo the deferral. It is a safety net for the case
           where idle never ran; normally everything is already in by then. */
      if (booted) ensureLoaded(slides[(index + 1) % slides.length]);

      slides.forEach(function (slide, i) {
        var on = i === index;
        slide.classList.toggle("is-active", on);
        slide.setAttribute("aria-hidden", on ? "false" : "true");
        /* keep off-screen copy and links out of the tab order */
        if ("inert" in slide) slide.inert = !on;
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    }

    function go(next) {
      paint(next);
    }
    function next() {
      paint(index + 1);
    }
    function prev() {
      paint(index - 1);
    }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(next, AUTOPLAY_MS);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    function restart() {
      stop();
      start();
    }

    /* ---- controls ---- */
    if (btnPrev)
      btnPrev.addEventListener("click", function () {
        prev();
        restart();
      });
    if (btnNext)
      btnNext.addEventListener("click", function () {
        next();
        restart();
      });

    if (hero) {
      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      hero.addEventListener("focusin", stop);
      hero.addEventListener("focusout", start);

      hero.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          prev();
          restart();
        }
        if (e.key === "ArrowRight") {
          next();
          restart();
        }
      });

      /* touch swipe */
      var x0 = null;
      hero.addEventListener(
        "touchstart",
        function (e) {
          x0 = e.changedTouches[0].clientX;
          stop();
        },
        { passive: true },
      );
      hero.addEventListener(
        "touchend",
        function (e) {
          if (x0 === null) return;
          var dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 45) {
            dx < 0 ? next() : prev();
          }
          x0 = null;
          start();
        },
        { passive: true },
      );
    }

    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    /* don't burn cycles cross-fading a hero nobody is looking at */
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.isIntersecting ? start() : stop();
          });
        },
        { threshold: 0.15 },
      ).observe(hero);
    }

    paint(index);
    booted = true;
    start();

    /* everything else, once the page has settled */
    whenIdle(function () {
      slides.forEach(ensureLoaded);
    });
  }

  /* ======================================================================
       STICKY HEADER STATE
       ====================================================================== */

  function initHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();
  }

  /* ======================================================================
       SMOOTH ANCHOR SCROLL
       ====================================================================== */

  function initScrollLinks() {
    document.querySelectorAll("a[data-scroll]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id.charAt(0) !== "#" || id.length < 2) return;

        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ======================================================================
       SCROLL REVEAL
       ====================================================================== */

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    onEnter(
      items,
      function (el) {
        el.classList.add("is-visible");
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
  }

  /* ======================================================================
       REQUEST FORM
       ====================================================================== */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxxtnm--TyPW1NaUrGhZa9CaeSlr1QU-gYxImCn2DmgHLID3h-vq3VPAFVumzWVhW0/exec";

  var ERRORS = {
    invalid_name: "Numele nu pare valid. Folosește doar litere.",
    invalid_email: "Adresa de email nu pare validă.",
    invalid_signature: "Semnătura nu pare validă. Scrie-ți numele complet.",
    duplicate: "Această adresă de email a trimis deja o cerere.",
    token: "Sesiunea a expirat. Reîncarcă pagina și încearcă din nou.",
    busy: "Primim multe cereri chiar acum. Te rugăm să revii în câteva minute.",
    server: "Ceva nu a funcționat. Te rugăm să încerci din nou.",
    network: "Conexiunea a eșuat. Verifică internetul și încearcă din nou.",
  };

  /* Apps Script can briefly queue concurrent executions. Never leave a
       visitor's button disabled forever if Google does not complete a fetch. */
  var TOKEN_TIMEOUT_MS = 12000;
  var SUBMIT_TIMEOUT_MS = 30000;

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer;

    if (controller) options.signal = controller.signal;

    return new Promise(function (resolve, reject) {
      timer = window.setTimeout(function () {
        if (controller) controller.abort();
        var error = new Error("timeout");
        error.code = "timeout";
        reject(error);
      }, timeoutMs);

      fetch(url, options).then(resolve, reject);
    }).then(
      function (response) {
        window.clearTimeout(timer);
        return response;
      },
      function (error) {
        window.clearTimeout(timer);
        throw error;
      },
    );
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  var tokens = (function () {
    var pending = null;

    function refresh() {
      if (!ENDPOINT) return null;
      pending = fetchWithTimeout(
        ENDPOINT + "?action=token",
        {
          method: "GET",
          credentials: "omit",
          cache: "no-store",
        },
        TOKEN_TIMEOUT_MS,
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          return data && data.ok ? data.token : "";
        })
        .catch(function () {
          return "";
        }); // offline: submit reports it
      return pending;
    }

    return {
      prime: function () {
        if (!pending) refresh();
      },
      take: function () {
        var current = pending;
        pending = null;
        refresh();
        return current || pending || Promise.resolve("");
      },
    };
  })();

  function sendRequest(token, data) {
    return fetchWithTimeout(
      ENDPOINT,
      {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          signature: data.signature,
          company: data.company,
          token: token,
        }),
      },
      SUBMIT_TIMEOUT_MS,
    ).then(function (r) {
      return r.json();
    });
  }

  function submitRequest(data) {
    var tokenRetries = 0;
    var busyRetries = 0;
    var networkRetries = 0;
    var ambiguousRetry = false;

    function attempt() {
      return tokens
        .take()
        .then(function (token) {
          if (!token) throw new Error("token_fetch");
          return sendRequest(token, data);
        })
        .then(
          function (result) {
            if (result && result.ok) return result;

            var code = result && result.error ? result.error : "server";
            /* If the first response was lost after its row was written, the
               retry correctly finds that email. For this attempt that means
               success, not a duplicate error. */
            if (code === "duplicate" && ambiguousRetry) return { ok: true };
            if (code === "token" && tokenRetries < 1) {
              tokenRetries++;
              return delay(1600).then(attempt);
            }
            if (code === "busy" && busyRetries < 1) {
              busyRetries++;
              return delay(1200).then(attempt);
            }
            return result;
          },
          function (error) {
            if (networkRetries < 1) {
              networkRetries++;
              ambiguousRetry = true;
              return delay(1200).then(attempt);
            }
            throw error;
          },
        );
    }

    return attempt();
  }

  function initForm(form) {
    if (!form) return;

    var panel = form.closest(".form-panel_inner") || form.parentNode;
    var done = panel.querySelector(".form-done");
    var status = form.querySelector(".form_status");
    var dateEl = form.querySelector(".signature-meta_date");
    var resetBtn = panel.querySelector("[data-form-reset]");
    var submitBtn = form.querySelector('button[type="submit"]');
    var SUBMIT_LABEL = submitBtn ? submitBtn.textContent : "";

    form.addEventListener(
      "focusin",
      function () {
        tokens.prime();
      },
      { once: true },
    );
    var submitting = false;

    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    var rules = {
      fullName: function (v) {
        if (!v) return "Te rugăm să îți scrii numele complet.";
        if (v.length < 2) return "Numele pare prea scurt.";
        return "";
      },
      email: function (v) {
        if (!v) return "Te rugăm să îți scrii adresa de email.";
        if (!EMAIL_RE.test(v)) return "Adresa de email nu pare validă.";
        return "";
      },
      signature: function (v) {
        if (!v) return "Te rugăm să semnezi cu numele tău complet.";
        if (v.length < 2) return "Semnătura pare prea scurtă.";
        return "";
      },
    };

    function showError(name, message) {
      var input = form.elements[name];
      var slot = form.querySelector('[data-error-for="' + name + '"]');
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
      if (!slot) return;
      slot.textContent = message;
      slot.hidden = !message;
    }

    function readValues() {
      var out = {};
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        out[name] = input ? (input.value || "").trim() : "";
      });
      return out;
    }

    /* clear a field's error as soon as the user edits it */
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener("input", function () {
        showError(name, "");
      });
      input.addEventListener("blur", function () {
        var data = readValues();
        showError(name, rules[name](data[name], data));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (submitting) return;
      var pot = form.elements.company;
      if (pot && pot.value !== "") {
        showSuccess();
        return;
      }

      var data = readValues();
      var firstBad = null;

      Object.keys(rules).forEach(function (name) {
        var message = rules[name](data[name], data);
        showError(name, message);
        if (message && !firstBad) firstBad = name;
      });

      if (firstBad) {
        if (status)
          status.textContent = "Te rugăm să corectezi câmpurile marcate.";
        var el = form.elements[firstBad];
        if (el && el.focus) el.focus();
        return;
      }

      if (status) status.textContent = "";
      submitting = true;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Se trimite…";
      }

      /* No endpoint configured yet: keep the original local demo. */
      if (!ENDPOINT) {
        window.setTimeout(showSuccess, 700);
        return;
      }

      data.company = pot ? pot.value : "";
      submitRequest(data)
        .then(function (result) {
          if (result && result.ok) {
            showSuccess();
            return;
          }

          var code = result && result.error ? result.error : "server";
          fail(code);
        })
        .catch(function () {
          fail("network");
        });
    });

    function fail(code) {
      submitting = false;
      if (status) status.textContent = ERRORS[code] || ERRORS.server;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_LABEL;
      }
    }

    function showSuccess() {
      form.hidden = true;
      if (!done) return;
      done.hidden = false;
      var heading = done.querySelector("h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        if (heading.focus) heading.focus();
      }
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        submitting = false;
        form.reset();
        Object.keys(rules).forEach(function (name) {
          showError(name, "");
        });
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = SUBMIT_LABEL;
        }
        if (done) done.hidden = true;
        form.hidden = false;
        if (form.elements.fullName) form.elements.fullName.focus();
      });
    }
  }

  var DISMISS_ON_ESC = false;

  function initModals() {
    var openers = document.querySelectorAll("[data-modal-open]");
    if (!openers.length) return;

    var lastFocused = null;
    var scrollY = 0;
    var locked = false;

    function lockScroll() {
      if (locked) return;
      locked = true;

      /* Width the scrollbar currently occupies. Zero where scrollbars
           overlay (macOS, touch), 10-17px on Windows and Linux. Measured
           before locking, because locking is what removes it. */
      var gutter = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty("--sb-gutter", gutter + "px");
      scrollY = window.scrollY;
      document.body.style.top = -scrollY + "px";
      document.body.classList.add("is-modal-open");
    }

    /* Idempotent on purpose: closing fires both close() and the dialog's own
         `close` event, so this runs twice per dismissal. Without the guard the
         second run re-issues the scroll restore. */
    function unlockScroll() {
      if (!locked) return;
      locked = false;

      document.body.classList.remove("is-modal-open");
      document.body.style.top = "";
      document.documentElement.style.removeProperty("--sb-gutter");

      var root = document.documentElement;
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = previous;
    }

    function open(dialog) {
      if (!dialog || dialog.open) return;
      lastFocused = document.activeElement;
      lockScroll();

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        /* pre-dialog browsers: still usable, just without the top layer */
        dialog.setAttribute("open", "");
        dialog.classList.add("is-fallback");
      }

      dialog.classList.add("is-open");

      var target =
        dialog.querySelector("[data-modal-close]") ||
        dialog.querySelector('input:not([tabindex="-1"])');
      if (target && target.focus) target.focus({ preventScroll: true });
    }

    function close(dialog) {
      if (!dialog) return;
      dialog.classList.remove("is-open");

      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");

      unlockScroll();
      if (lastFocused && lastFocused.focus)
        lastFocused.focus({ preventScroll: true });
    }

    openers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var dialog = document.getElementById(
          btn.getAttribute("data-modal-open"),
        );
        if (!dialog) return; /* no dialog? let the href scroll instead */
        e.preventDefault();
        open(dialog);
      });
    });

    document.querySelectorAll("dialog[data-modal]").forEach(function (dialog) {
      dialog.querySelectorAll("[data-modal-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          close(dialog);
        });
      });

      /* Escape fires `cancel` before `close` - swallowing it keeps the
           dialog up, exactly as asked. */
      dialog.addEventListener("cancel", function (e) {
        if (DISMISS_ON_ESC) return;
        e.preventDefault();
      });

      /* if anything else closes it, make sure the page is usable again */
      dialog.addEventListener("close", function () {
        dialog.classList.remove("is-open");
        unlockScroll();
      });
    });
  }

  /* ======================================================================
       BOOT
       ====================================================================== */

  function boot() {
    initLazyMedia();
    initHeader();
    initHero();
    initScrollLinks();
    initReveal();
    document.querySelectorAll("form.form").forEach(initForm);
    initModals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
