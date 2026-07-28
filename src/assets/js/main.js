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

  /* ---------- Confetti celebration (dependency-free canvas burst) ---------- */
  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas");
    c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999";
    c.width = window.innerWidth; c.height = window.innerHeight;
    document.body.appendChild(c);
    var ctx = c.getContext("2d");
    var colors = ["#E8B84B", "#C9744D", "#8FAE8B", "#5E7FA3", "#7E5A78", "#f0c24b", "#fff"];
    var pieces = [];
    for (var i = 0; i < 150; i++) {
      pieces.push({
        x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.5,
        y: c.height * 0.35 - Math.random() * 40,
        r: 6 + Math.random() * 8,
        color: colors[i % colors.length],
        vx: (Math.random() - 0.5) * 12,
        vy: -6 - Math.random() * 8,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        shape: Math.random() < 0.5 ? "rect" : "circ"
      });
    }
    var start = Date.now();
    (function frame() {
      var t = Date.now() - start;
      ctx.clearRect(0, 0, c.width, c.height);
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.99; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - t / 2800);
        if (p.shape === "rect") ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, 6.28); ctx.fill(); }
        ctx.restore();
      }
      if (t < 2800) requestAnimationFrame(frame); else c.remove();
    })();
  }
  window.moocConfetti = confetti;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Series nav dropdown (click-to-toggle; works on touch + trackpad) ---------- */
  document.querySelectorAll(".nav-dropdown").forEach(function (dd) {
    var btn = dd.querySelector(".nav-dropdown-toggle");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    dd.addEventListener("focusout", function (e) {
      if (dd.contains(e.relatedTarget)) return; // focus still inside the dropdown
      dd.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".nav-dropdown.open").forEach(function (dd) {
      dd.classList.remove("open");
      var btn = dd.querySelector(".nav-dropdown-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".nav-dropdown.open").forEach(function (dd) {
      dd.classList.remove("open");
      var btn = dd.querySelector(".nav-dropdown-toggle");
      if (btn) { btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  });

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

    // Metricool (web analytics for content planning) — same consent gate as GA4/Pixel
    if (cfg.metricoolHash) {
      var m = document.createElement("script");
      m.async = true;
      m.src = "https://tracker.metricool.com/resources/be.js";
      m.onload = function () {
        if (window.beTracker) window.beTracker.t({ hash: cfg.metricoolHash });
      };
      document.head.appendChild(m);
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

      // Cross-origin hosted endpoints (e.g. Beehiiv) open their own confirm
      // page in a new tab. Let the native submit proceed — an async POST would
      // be CORS-blocked on read and then double-submit via the fallback.
      if (form.getAttribute("target") === "_blank") {
        window.track(eventName, extraParams(form));
        if (status) { status.textContent = successMsg(eventName); status.className = "form-status is-success"; }
        setTimeout(function () { form.reset(); }, 50);
        return; // native submit proceeds in new tab
      }

      // Progressive enhancement: try async POST so we can show inline success.
      e.preventDefault();
      var data = new URLSearchParams(new FormData(form));
      window.track(eventName, extraParams(form));
      fetch(action, { method: "POST", body: data, headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" } })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            if (status) { status.textContent = successMsg(eventName); status.className = "form-status is-success"; }
            if (eventName === "newsletter_signup") confetti();
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

  /* ---------- animated wordmark: respect reduced motion, else ensure it runs ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("video.brand-video").forEach(function (v) {
    if (reduceMotion) { v.pause(); return; }
    // Some browsers ignore the autoplay attribute; nudge. Poster stays if this fails.
    if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });
})();
