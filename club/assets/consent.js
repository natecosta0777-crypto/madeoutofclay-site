(function () {
  "use strict";

  var KEY = "moc-club-analytics-consent-v1";
  var loaded = false;

  function readChoice() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (_) {}
  }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", "G-B4ZQX8FJ8J", {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });

    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=G-B4ZQX8FJ8J";
    document.head.appendChild(ga);

    var metricool = document.createElement("script");
    metricool.async = true;
    metricool.src = "https://tracker.metricool.com/resources/be.js";
    metricool.onload = function () {
      if (window.beTracker) {
        window.beTracker.t({ hash: "9a57567d14513fb7d65dbe5bdc6e9372" });
      }
    };
    document.head.appendChild(metricool);
  }

  function createBanner() {
    var banner = document.createElement("section");
    banner.className = "club-consent";
    banner.id = "club-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "club-consent-title");
    banner.innerHTML =
      '<div><strong id="club-consent-title">Your privacy choice</strong>' +
      '<p>Optional Google Analytics and Metricool measurements help us improve the library. They do not load unless an adult accepts. <a href="/privacy">Privacy details</a></p></div>' +
      '<div class="club-consent__actions">' +
      '<button type="button" data-club-consent="decline">Decline</button>' +
      '<button type="button" class="club-consent__accept" data-club-consent="accept">Accept analytics</button>' +
      '</div>';
    document.body.appendChild(banner);
    return banner;
  }

  function setVisible(banner, visible) {
    banner.hidden = !visible;
    if (visible) banner.querySelector("button").focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var banner = createBanner();
    var choice = readChoice();

    if (choice === "accept") loadAnalytics();
    if (!choice) setVisible(banner, true);

    banner.addEventListener("click", function (event) {
      var button = event.target.closest("[data-club-consent]");
      if (!button) return;
      var value = button.getAttribute("data-club-consent");
      saveChoice(value);
      setVisible(banner, false);
      if (value === "accept") loadAnalytics();
      if (value === "decline" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      }
    });

    var footer = document.querySelector("footer");
    if (footer) {
      var manage = document.createElement("button");
      manage.type = "button";
      manage.className = "club-privacy-manage";
      manage.textContent = "Privacy choices";
      manage.addEventListener("click", function () { setVisible(banner, true); });
      footer.appendChild(manage);
    }
  });
})();
