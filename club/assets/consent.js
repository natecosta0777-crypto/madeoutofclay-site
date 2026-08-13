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

  }

  function createBanner() {
    var banner = document.createElement("section");
    banner.className = "club-consent";
    banner.id = "club-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "club-consent-title");
    banner.innerHTML =
      '<div><strong id="club-consent-title">Your privacy choice</strong>' +
      '<p>Optional Google Analytics helps us improve the adult-facing Book Club pages. It is never loaded in the Clubhouse, Bookshelf, Reader, Characters, or Mailbox. <a href="/privacy">Privacy details</a></p>' +
      '<label class="club-consent__adult"><input type="checkbox" data-club-adult> I am a parent, caregiver, educator, or other adult.</label></div>' +
      '<div class="club-consent__actions">' +
      '<button type="button" data-club-consent="decline">Decline</button>' +
      '<button type="button" class="club-consent__accept" data-club-consent="accept" disabled>Accept analytics</button>' +
      '</div>';
    document.body.appendChild(banner);
    return banner;
  }

  function setVisible(banner, visible) {
    banner.hidden = !visible;
    if (visible) banner.querySelector("button").focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var childExperience = /^\/(app|reader|clubhouse|characters|letters)(\/|$)/.test(location.pathname);
    if (childExperience) return;
    var banner = createBanner();
    var choice = readChoice();

    if (choice === "accept") loadAnalytics();
    if (!choice) setVisible(banner, true);

    var adultCheck = banner.querySelector("[data-club-adult]");
    var acceptButton = banner.querySelector('[data-club-consent="accept"]');
    adultCheck.addEventListener("change", function () {
      acceptButton.disabled = !adultCheck.checked;
    });

    banner.addEventListener("click", function (event) {
      var button = event.target.closest("[data-club-consent]");
      if (!button) return;
      var value = button.getAttribute("data-club-consent");
      if (value === "accept" && !adultCheck.checked) return;
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

    document.addEventListener("submit", function (event) {
      if (!window.gtag) return;
      var form = event.target;
      var eventName = location.pathname.indexOf("/schools") === 0 ? "school_inquiry_submit" :
        (form.id === "printForm" ? "printable_updates_signup" :
        (form.id === "joinForm" ? "parent_note_signup" : "form_submit"));
      window.gtag("event", eventName, { page_path: location.pathname });
    });
  });
})();
