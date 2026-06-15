(function () {
  "use strict";

  // Conversion tracking helper – fires to GA4 (gtag), Plausible or dataLayer
  // if any is present. Safe no-op until you add an analytics snippet in <head>.
  function trackEvent(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      }
      if (typeof window.plausible === "function") {
        window.plausible(name, params ? { props: params } : undefined);
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: name }, params || {}));
      }
    } catch (e) { /* tracking must never break the page */ }
  }

  // Sticky header shadow
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Reveal on scroll
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("visible"); });
  }

  // Contact form (Web3Forms)
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var key = form.querySelector('[name="access_key"]');
      if (!key || key.value === "REPLACE_WITH_WEB3FORMS_KEY") {
        status.className = "form-status is-err";
        status.textContent = "Formulář se právě dokončuje – zatím nám prosím zavolejte nebo napište SMS na 603 89 00 00.";
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      status.className = "form-status is-sending";
      status.textContent = "Odesílám…";
      if (btn) btn.disabled = true;
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            status.className = "form-status is-ok";
            status.textContent = "Děkujeme! Zprávu jsme dostali a brzy se vám ozveme.";
            trackEvent("generate_lead", { method: "form" });
            form.reset();
          } else {
            status.className = "form-status is-err";
            status.textContent = "Odeslání se nezdařilo. Zavolejte nám prosím na 603 89 00 00.";
          }
        })
        .catch(function () {
          status.className = "form-status is-err";
          status.textContent = "Odeslání se nezdařilo. Zavolejte nám prosím na 603 89 00 00.";
        })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  }

  // Track click-to-call / SMS / e-mail as conversions (GA4 / Plausible / dataLayer)
  document.addEventListener("click", function (e) {
    var t = e.target;
    var link = t && t.closest ? t.closest('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]') : null;
    if (!link) return;
    var href = link.getAttribute("href") || "";
    var method = href.lastIndexOf("tel:", 0) === 0 ? "phone"
      : href.lastIndexOf("sms:", 0) === 0 ? "sms"
      : "email";
    trackEvent("contact_click", { method: method });
  }, true);
})();
