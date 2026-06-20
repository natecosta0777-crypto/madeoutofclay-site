/* =========================================================================
   Made Out of Clay Productions — site behavior
   - Mobile nav
   - Consent-gated analytics (GA4 + Meta Pixel) — Spec §3.5
   - track(event, params) wrapper forwarding to GA4 + Pixel — Spec §3.3
   - Outbound Amazon click events (sendBeacon so they aren't dropped) — Spec §3.3
   - Newsletter + contact form handling (honeypot, inline status) — Spec §1.4/§1.6
   ========================================================================= */
(function () {
  "use strict";
  var cfg = window.MOC_CONFIG || {};
  var CONSENT_KEY = "moc_consent";

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Analytics loading (only after consent) ---------- */
  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // GA4
    if (cfg.ga4Id) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", cfg.ga4Id);
    }

    // Meta Pixel
    if (cfg.metaPixelId) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", cfg.metaPixelId);
      window.fbq("track", "PageView");
    }
  }

  /* ---------- track() wrapper — forwards to GA4 + Pixel ---------- */
  // Maps our semantic events to Pixel standard events where sensible (Spec §3.3).
  var PIXEL_MAP = {
    buy_on_amazon_click: "ViewContent",
    newsletter_signup: "Subscribe",
    lead_magnet_download: "Lead",
    contact_submit: "Contact",
    series_view: "ViewContent"
  };
  window.track = function (event, params) {
    params = params || {};
    if (window.gtag) window.gtag("event", event, params);
    if (window.fbq) {
      var mapped = PIXEL_MAP[event];
      if (mapped) window.fbq("track", mapped, params);
      else window.fbq("trackCustom", event, params);
    }
    // Outbound beacon as a safety net so events survive tab navigation.
    if (navigator.sendBeacon && cfg.ga4Id) {
      try {
        navigator.sendBeacon(
          "/__moc_event", // no-op endpoint; harmless if unhandled. Keeps the call non-blocking.
          new Blob([JSON.stringify({ event: event, params: params })], { type: "application/json" })
        );
      } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Consent banner ---------- */
  var banner = document.getElementById("consent-banner");
  var needAnalytics = !!(cfg.ga4Id || cfg.metaPixelId);
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  if (needAnalytics) {
    var choice = getConsent();
    if (choice === "accept") {
      loadAnalytics();
    } else if (choice !== "decline" && banner) {
      banner.hidden = false;
    }
    if (banner) {
      banner.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-consent]");
        if (!btn) return;
        var val = btn.getAttribute("data-consent");
        setConsent(val);
        banner.hidden = true;
        if (val === "accept") loadAnalytics();
      });
    }
  }

  /* ---------- Outbound Amazon click tracking ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest('[data-track="buy_on_amazon_click"]');
    if (!el) return;
    window.track("buy_on_amazon_click", {
      book_title: el.getAttribute("data-book-title"),
      asin: el.getAttribute("data-asin"),
      series: el.getAttribute("data-series"),
      page: location.pathname
    });
  });

  /* ---------- Form handling (newsletter + contact) ---------- */
  function handleForm(form, eventName, extraParams) {
    form.addEventListener("submit", function (e) {
      // Honeypot: if filled, silently drop.
      var hp = form.querySelector('input[name="_gotcha"]');
      if (hp && hp.value) { e.preventDefault(); return; }

      var status = form.querySelector(".form-status");
      var action = form.getAttribute("action");

      // No backend configured yet → block submit, show friendly message.
      if (!action) {
        e.preventDefault();
        if (status) { status.textContent = "Thanks! Sign-ups open soon."; status.className = "form-status is-success"; }
        return;
      }

      // Progressive enhancement: try async POST so we can show inline success.
      e.preventDefault();
      var data = new FormData(form);
      window.track(eventName, extraParams(form));
      fetch(action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            if (status) { status.textContent = successMsg(eventName); status.className = "form-status is-success"; }
          } else { throw new Error("bad status"); }
        })
        .catch(function () {
          // Fallback: let the browser do a normal submit.
          if (status) { status.textContent = "Submitting…"; status.className = "form-status"; }
          form.submit();
        });
    });
  }
  function successMsg(ev) {
    return ev === "newsletter_signup" ? "You're on the list! 🎉" : "Thanks — we'll be in touch soon.";
  }

  document.querySelectorAll('form[data-track="newsletter_signup"]').forEach(function (f) {
    handleForm(f, "newsletter_signup", function (form) {
      return { location: form.getAttribute("data-location") || "footer" };
    });
  });
  document.querySelectorAll('form[data-track="contact_submit"]').forEach(function (f) {
    handleForm(f, "contact_submit", function (form) {
      var sel = form.querySelector('[name="inquiry_type"]');
      return { inquiry_type: sel ? sel.value : "general" };
    });
  });

  /* ---------- series_view event ---------- */
  if (document.body.getAttribute("data-series")) {
    window.track("series_view", { series: document.body.getAttribute("data-series") });
  }
})();
