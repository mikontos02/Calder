/* Calder Dental Studio — homepage interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var desktopNav = window.matchMedia('(min-width: 64em)');

  /* ---------- Header: solid state once the page has scrolled ---------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    var sentinel = document.querySelector('.header-sentinel');
    if (!header || !sentinel || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '24px 0px 0px 0px' }).observe(sentinel);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    var label = document.querySelector('[data-menu-label]');
    if (!toggle || !menu) return;

    function focusables() {
      return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
    }

    function setOpen(open, returnFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close menu' : 'Open menu';
      menu.hidden = !open;
      header.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) {
        menu.querySelector('a').focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true', true);
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false, false);
    });

    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') {
        setOpen(false, true);
        return;
      }
      // Keep keyboard focus inside the open menu (toggle + menu links)
      if (e.key === 'Tab') {
        var items = focusables();
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Close if the viewport grows into the desktop layout
    desktopNav.addEventListener('change', function (e) {
      if (e.matches && !menu.hidden) setOpen(false, false);
    });
  }

  /* ---------- Current section indicator in the main nav ---------- */
  function initNavSpy() {
    var links = document.querySelectorAll('.primary-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (entry.isIntersecting) {
          Array.prototype.forEach.call(links, function (l) { l.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Array.prototype.forEach.call(links, function (a) {
      var section = document.getElementById(a.getAttribute('href').slice(1));
      if (!section) return;
      map[section.id] = a;
      io.observe(section);
    });
  }

  /* ---------- Gentle reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      // Page heroes are above the fold: reveal them on load rather than waiting for scroll
    var hero = document.querySelectorAll('[data-hero] [data-reveal]');
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(hero, function (el, i) {
        el.style.transitionDelay = i * 90 + 'ms';
        el.classList.add('is-in');
      });
    });

    Array.prototype.forEach.call(items, function (el) {
      if (el.closest('[data-hero]')) return; el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) {
      // Small stagger for siblings that enter together
      var siblings = el.parentElement.querySelectorAll(':scope > [data-reveal]');
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.transitionDelay = Math.min(index, 4) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Treatments: one open at a time ----------
     Mobile: each item expands in place. Desktop: the image and detail panel
     beside the list mirror the active item. Without JS every item is open. */
  function initServices() {
    var root = document.querySelector('[data-services]');
    if (!root) return;
    var items = root.querySelectorAll('.svc');
    var media = root.querySelectorAll('[data-media]');
    var panel = root.querySelector('[data-services-panel]');

    function renderPanel(item) {
      if (!panel) return;
      var index = Array.prototype.indexOf.call(items, item) + 1;
      var step = document.createElement('p');
      step.className = 'services__panel-step';
      step.textContent = item.querySelector('.svc__name').textContent + ' · 0' + index + ' / 0' + items.length;
      panel.innerHTML = '';
      panel.appendChild(step);
      var body = document.createElement('div');
      body.appendChild(item.querySelector('.svc__text').cloneNode(true));
      panel.appendChild(body);
      panel.appendChild(item.querySelector('.svc__more .btn').cloneNode(true));
    }

    function activate(item, allowCollapse) {
      var collapsing = allowCollapse && item.classList.contains('is-active');
      Array.prototype.forEach.call(items, function (it) {
        var on = !collapsing && it === item;
        it.classList.toggle('is-active', on);
        it.querySelector('.svc__trigger').setAttribute('aria-expanded', String(on));
      });
      if (collapsing) return;
      Array.prototype.forEach.call(media, function (img) {
        img.classList.toggle('is-active', img.dataset.media === item.dataset.svc);
      });
      renderPanel(item);
    }

    Array.prototype.forEach.call(items, function (item) {
      item.querySelector('.svc__trigger').addEventListener('click', function () {
        activate(item, !desktopNav.matches);
      });
    });

    renderPanel(root.querySelector('.svc.is-active') || items[0]);
  }

  /* ---------- Treatment pre-selection for the request form ----------
     Sources: same-page links with data-book-treatment, and ?treatment=… in the URL
     (used by treatment buttons and the homepage quick-start form). */
  function initBookingLinks() {
    var select = document.getElementById('f-treatment');
    if (!select) return;

    function choose(value) {
      Array.prototype.forEach.call(select.options, function (opt) {
        if (opt.text === value) select.value = opt.value;
      });
    }

    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-book-treatment]');
      if (link) choose(link.getAttribute('data-book-treatment'));
    });

    var fromUrl = new URLSearchParams(location.search).get('treatment');
    if (fromUrl) choose(fromUrl);
  }

  /* ---------- Appointment request form ----------
     Used by the contact page (#request) form.
     Field rules come from native attributes (required, type, pattern, min, maxlength);
     messages below make them specific. Nothing is stored in the browser. */
  function initForm() {
    var form = document.querySelector('[data-booking-form]');
    if (!form) return;
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');
    var submitHTML = submit.innerHTML;
    var submitting = false;

    form.setAttribute('novalidate', '');

    var messages = {
      'f-name': {
        valueMissing: 'Please enter your name.',
        tooShort: 'Please enter your full name.'
      },
      'f-phone': {
        valueMissing: 'Please enter a phone number so we can arrange your appointment.',
        patternMismatch: 'Please enter a valid phone number, using digits, spaces and + ( ) - only.'
      },
      'f-email': {
        valueMissing: 'Please enter your email address.',
        typeMismatch: 'Please enter a valid email address, such as name@example.com.'
      },
      'f-other': { valueMissing: 'Please tell us briefly what your visit is about.' },
      'f-date': {
        rangeUnderflow: 'Please choose today or a later date.',
        badInput: 'Please enter a complete date.'
      },
      'f-message': { tooLong: 'Please keep your message to 500 characters or fewer.' },
      'f-consent': { valueMissing: 'Please confirm we may contact you about this request.' }
    };

    function errorFor(field) {
      if (field.disabled) return '';
      var v = field.validity;
      var m = messages[field.id] || {};
      var text = field.type === 'checkbox' ? '' : field.value.trim();
      // Treat whitespace-only answers as empty, and require a meaningful name
      if (field.required && field.type !== 'checkbox' && !text) return m.valueMissing || 'This field is required.';
      if (field.id === 'f-name' && text.length < 2) return m.tooShort;
      if (v.valueMissing) return m.valueMissing || 'This field is required.';
      if (v.badInput) return m.badInput || 'Please check this field.';
      if (v.typeMismatch) return m.typeMismatch || 'Please check this field.';
      if (v.patternMismatch) return m.patternMismatch || 'Please check the format.';
      if (v.rangeUnderflow) return m.rangeUnderflow || 'Please check this value.';
      if (v.tooLong || (field.maxLength > 0 && field.value.length > field.maxLength)) return m.tooLong || 'This is too long.';
      return '';
    }

    function validateField(field) {
      var out = form.querySelector('[data-error-for="' + field.id + '"]');
      if (!out) return true;
      var msg = errorFor(field);
      out.textContent = msg;
      if (msg) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      return !msg;
    }

    function showStatus(state, html, focusStatus) {
      status.hidden = false;
      status.setAttribute('data-state', state);
      status.innerHTML = html;
      if (focusStatus) status.focus();
    }

    function localToday() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // Dates: no past days (set from the visitor's own clock)
    Array.prototype.forEach.call(form.querySelectorAll('[data-min-today]'), function (input) {
      input.min = localToday();
    });

    // "Other" reason reveals a short clarification field
    Array.prototype.forEach.call(form.querySelectorAll('[data-other-toggle]'), function (select) {
      var wrap = document.getElementById(select.getAttribute('data-other-toggle'));
      var input = wrap && wrap.querySelector('input');
      if (!input) return;
      function sync() {
        var on = select.value === 'Other';
        wrap.hidden = !on;
        input.disabled = !on;
        input.required = on;
        if (!on) validateField(input);
      }
      select.addEventListener('change', sync);
      sync();
    });

    // Character counters for capped text areas
    Array.prototype.forEach.call(form.querySelectorAll('[data-counter-for]'), function (counter) {
      var field = document.getElementById(counter.getAttribute('data-counter-for'));
      function update() {
        counter.textContent = field.value.length + ' / ' + field.maxLength;
        counter.classList.toggle('is-near', field.value.length > field.maxLength * 0.9);
      }
      field.addEventListener('input', update);
      update();
    });

    // Re-check a field once the person has interacted with it
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validateField(e.target);
    });
    form.addEventListener('change', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' || e.target.type === 'date') validateField(e.target);
    });
    form.addEventListener('focusout', function (e) {
      if (e.target.value && e.target.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')) validateField(e.target);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return; // ignore double clicks while a request is in flight

      var invalid = [];
      Array.prototype.forEach.call(form.querySelectorAll('[data-error-for]'), function (out) {
        var field = document.getElementById(out.getAttribute('data-error-for'));
        if (field && !validateField(field)) invalid.push(field);
      });

      if (invalid.length) {
        var list = invalid.map(function (f) {
          var text = form.querySelector('[data-error-for="' + f.id + '"]').textContent;
          return '<li><a href="#' + f.id + '">' + text + '</a></li>';
        }).join('');
        showStatus('error', '<strong>Please check ' + (invalid.length === 1 ? 'one field' : invalid.length + ' fields') + '.</strong><ul>' + list + '</ul>', false);
        invalid[0].focus(); // the summary above is announced by its live region
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');

      // No backend connected yet: be honest, keep everything the person typed.
      if (!endpoint) {
        showStatus('info',
          '<strong>Online requests aren’t connected yet.</strong>' +
          'Your details look good, but this form isn’t linked to the clinic’s booking system, so nothing has been sent. ' +
          'Your answers are still here. Please contact the clinic directly for now.', true);
        return;
      }

      submitting = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      submit.textContent = 'Sending…';

      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          showStatus('success',
            '<strong>Thank you, your request has been sent.</strong>' +
            'The team will contact you to arrange a time. Your appointment isn’t confirmed until you hear from us.', true);
        })
        .catch(function () {
          showStatus('error',
            '<strong>Sorry, your request couldn’t be sent.</strong>' +
            'Please try again in a moment, or contact the clinic directly. Your answers have been kept.', true);
        })
        .then(function () {
          submitting = false;
          submit.disabled = false;
          form.removeAttribute('aria-busy');
          submit.innerHTML = submitHTML;
        });
    });

    // Error summary links move focus to the field
    status.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#f-"]');
      if (!a) return;
      e.preventDefault();
      var field = document.getElementById(a.getAttribute('href').slice(1));
      field.scrollIntoView({ block: 'center' });
      field.focus({ preventScroll: true });
    });
  }

  function initYear() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = new Date().getFullYear();
  }

  initHeader();
  initMenu();
  initNavSpy();
  initReveal();
  initServices();
  initBookingLinks();
  initForm();
  initYear();
})();
