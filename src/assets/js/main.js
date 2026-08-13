/* =========================================================================
   Made Out of Clay Productions — site behavior
   - Mobile nav
   - Consent-gated analytics (GA4) — Spec §3.5
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
    function setMenu(open) {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Current navigation state ---------- */
  var pageUrl = document.body.getAttribute("data-page-url") || location.pathname;
  document.querySelectorAll(".nav-menu a").forEach(function (link) {
    if (link.origin !== location.origin) return;
    var prefix = link.getAttribute("data-nav-prefix") || link.pathname;
    var isCurrent = prefix === "/" ? pageUrl === "/" : pageUrl.indexOf(prefix) === 0;
    if (link.pathname === "/books/" && (pageUrl.indexOf("/series/") === 0 || pageUrl.indexOf("/read/") === 0)) isCurrent = true;
    if (isCurrent) link.setAttribute("aria-current", "page");
  });

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
  var analyticsEnabled = false;
  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    analyticsEnabled = true;

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

  }

  /* ---------- track() wrapper — forwards semantic events to GA4 ---------- */
  window.track = function (event, params) {
    if (!analyticsEnabled) return;
    params = params || {};
    if (window.gtag) window.gtag("event", event, params);
  };

  /* ---------- Consent banner ---------- */
  var banner = document.getElementById("consent-banner");
  var needAnalytics = !!cfg.ga4Id;
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
        if (val === "accept") {
          loadAnalytics();
          if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied" });
        } else {
          analyticsEnabled = false;
          if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
        }
      });
    }
    document.querySelectorAll("[data-manage-consent]").forEach(function (button) {
      button.addEventListener("click", function () {
        banner.hidden = false;
        banner.querySelector("[data-consent]").focus();
      });
    });
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

  var product = document.querySelector("[data-product-title]");
  if (product) {
    window.track("book_detail_view", {
      book_title: product.getAttribute("data-product-title"),
      series: product.getAttribute("data-product-series")
    });
  }

  document.addEventListener("click", function (event) {
    var preview = event.target.closest('[data-track="preview_start"]');
    if (!preview) return;
    window.track("preview_start", {
      book_title: preview.getAttribute("data-book-title"),
      page: location.pathname
    });
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link || link.hostname !== "club.madeoutofclayprod.com") return;
    window.track(link.pathname.indexOf("/schools") === 0 ? "school_interest_click" : "book_club_click", {
      destination: link.href,
      page: location.pathname
    });
  });

  /* ---------- Catalog filters ---------- */
  var catalogSeries = document.getElementById("catalog-series");
  var catalogTheme = document.getElementById("catalog-theme");
  var catalogItems = Array.prototype.slice.call(document.querySelectorAll(".catalog-item"));
  function filterCatalog() {
    if (!catalogItems.length) return;
    var seriesValue = catalogSeries ? catalogSeries.value : "all";
    var themeValue = catalogTheme ? catalogTheme.value : "all";
    var visible = 0;
    catalogItems.forEach(function (item) {
      var seriesMatch = seriesValue === "all" || item.getAttribute("data-series") === seriesValue;
      var themes = " " + (item.getAttribute("data-themes") || "") + " ";
      var themeMatch = themeValue === "all" || themes.indexOf(" " + themeValue + " ") !== -1;
      item.hidden = !(seriesMatch && themeMatch);
      if (!item.hidden) visible += 1;
    });
    var count = document.getElementById("catalog-count");
    if (count) count.textContent = "Showing " + visible + " of " + catalogItems.length + " print titles.";
    var empty = document.getElementById("catalog-empty");
    if (empty) empty.hidden = visible !== 0;
  }
  if (catalogSeries) catalogSeries.addEventListener("change", filterCatalog);
  if (catalogTheme) catalogTheme.addEventListener("change", filterCatalog);
  var catalogReset = document.getElementById("catalog-reset");
  if (catalogReset) catalogReset.addEventListener("click", function () {
    if (catalogSeries) catalogSeries.value = "all";
    if (catalogTheme) catalogTheme.value = "all";
    filterCatalog();
    if (catalogSeries) catalogSeries.focus();
  });

  /* ---------- Journal topic filter ---------- */
  var journalTopic = document.getElementById("journal-topic");
  if (journalTopic) {
    journalTopic.addEventListener("change", function () {
      var topic = journalTopic.value;
      var shown = 0;
      document.querySelectorAll(".journal-tile").forEach(function (tile) {
        tile.hidden = topic !== "all" && tile.getAttribute("data-topic") !== topic;
        if (!tile.hidden) shown += 1;
      });
      var empty = document.getElementById("journal-empty");
      if (empty) empty.hidden = shown !== 0;
    });
  }

})();
