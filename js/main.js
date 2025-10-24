document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var nav = document.querySelector('.nav');
    var toggle = nav ? nav.querySelector('.nav__toggle') : null;
    var linksContainer = nav ? nav.querySelector('.nav__links') : null;
    var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('.nav__links a')) : [];

    function closeNav() {
        if (!toggle || !linksContainer) {
            return;
        }
        toggle.setAttribute('aria-expanded', 'false');
        linksContainer.classList.remove('is-open');
        body.classList.remove('is-nav-open');
    }

    if (toggle && linksContainer) {
        toggle.addEventListener('click', function () {
            var expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            linksContainer.classList.toggle('is-open');
            body.classList.toggle('is-nav-open', !expanded);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeNav();
            }
        });

        navLinks.forEach(function (link) {
            link.addEventListener('click', closeNav);
        });
    }

    var copyButtons = document.querySelectorAll('.topbar__copy');
    if (copyButtons.length) {
        copyButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var value = button.getAttribute('data-copy') || '';
                if (!value) {
                    return;
                }
                var textToCopy = value.replace(/\s+/g, ' ').trim();

                function markCopied() {
                    copyButtons.forEach(function (btn) {
                        btn.classList.remove('is-copied');
                    });
                    button.classList.add('is-copied');
                    window.setTimeout(function () {
                        button.classList.remove('is-copied');
                    }, 1600);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy).then(markCopied).catch(function () {
                        fallbackCopy(textToCopy, markCopied);
                    });
                } else {
                    fallbackCopy(textToCopy, markCopied);
                }
            });
        });
    }

    function fallbackCopy(text, callback) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.warn('Copy not supported', err);
        }
        document.body.removeChild(textarea);
        if (typeof callback === 'function') {
            callback();
        }
    }

    var modalTriggers = document.querySelectorAll('.modal-trigger');
    var modals = document.querySelectorAll('.modal');
    var modalPrintButtons = document.querySelectorAll('[data-modal-print]');
    var activeModal = null;
    var lastFocusedElement = null;
    var focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    function getFocusableElements(modal) {
        return Array.prototype.slice.call(modal.querySelectorAll(focusableSelectors));
    }

    function openModal(id) {
        var modal = document.getElementById(id);
        if (!modal) {
            return;
        }
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-modal-open');
        activeModal = modal;
        var focusable = getFocusableElements(modal);
        if (focusable.length) {
            focusable[0].focus();
        }
    }

    function closeModal() {
        if (!activeModal) {
            return;
        }
        activeModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-modal-open');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
        activeModal = null;
    }

    function printModal(modal) {
        if (!modal) {
            return;
        }
        var bodyContent = modal.querySelector('.modal__body');
        if (!bodyContent) {
            return;
        }
        var title = modal.querySelector('.modal__header h2');
        var printWindow = window.open('', '_blank', 'width=900,height=960');
        if (!printWindow) {
            return;
        }
        printWindow.document.write('<html><head><title>' + (title ? title.textContent : document.title) + '</title>');
        printWindow.document.write('<style>body{font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:2rem;max-width:960px;margin:auto;}h1,h2,h3{font-family:inherit;color:#111c3f;}ul{padding-left:1.2rem;}button{display:none;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(bodyContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    modalTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function (event) {
            event.preventDefault();
            var target = trigger.getAttribute('data-modal');
            openModal(target);
        });
    });

    modals.forEach(function (modal) {
        var overlay = modal.querySelector('[data-modal-close]');
        modal.querySelectorAll('[data-modal-close]').forEach(function (closeEl) {
            closeEl.addEventListener('click', closeModal);
        });
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
    });

    modalPrintButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var modal = button.closest('.modal');
            printModal(modal);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (!activeModal) {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal();
            return;
        }
        if (event.key === 'Tab') {
            var focusable = getFocusableElements(activeModal);
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (event.shiftKey) {
                if (document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }
    });

    if (navLinks.length && 'IntersectionObserver' in window) {
        var sections = document.querySelectorAll('main section[id]');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var targetId = entry.target.id;
                    navLinks.forEach(function (link) {
                        var href = link.getAttribute('href') || '';
                        var id = href.startsWith('#') ? href.slice(1) : href;
                        link.classList.toggle('is-active', id === targetId);
                    });
                }
            });
        }, { rootMargin: '-45% 0px -15% 0px', threshold: 0.15 });

        sections.forEach(function (section) {
            observer.observe(section);
        });

        window.addEventListener('scroll', function () {
            if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 2) {
                var lastId = sections.length ? sections[sections.length - 1].id : null;
                if (!lastId) {
                    return;
                }
                navLinks.forEach(function (link) {
                    var href = link.getAttribute('href') || '';
                    var id = href.startsWith('#') ? href.slice(1) : href;
                    link.classList.toggle('is-active', id === lastId);
                });
            }
        });
    }

    function initCarousel(carousel) {
        var track = carousel.querySelector('[data-carousel-track]');
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-slide]'));
        var prev = carousel.querySelector('[data-carousel-prev]');
        var next = carousel.querySelector('[data-carousel-next]');
        var dotsContainer = carousel.querySelector('[data-carousel-dots]');
        var autoplay = carousel.getAttribute('data-autoplay') === 'true';
        var interval = parseInt(carousel.getAttribute('data-interval'), 10) || 7000;
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var current = 0;
        var timer = null;
        var dots = [];
        var pointerStartX = null;

        function createDots() {
            if (!dotsContainer) {
                return;
            }
            dotsContainer.innerHTML = '';
            slides.forEach(function (_, index) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'carousel__dot';
                dot.setAttribute('aria-label', 'Afficher la réalisation ' + (index + 1));
                dot.addEventListener('click', function () {
                    goTo(index, true);
                });
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });
        }

        function updateControls() {
            if (!prev && !next) {
                return;
            }
            var hasPrev = current > 0;
            var hasNext = current < slides.length - 1;
            if (prev) {
                prev.disabled = !hasPrev;
                prev.classList.toggle('is-hidden', !hasPrev);
                prev.setAttribute('aria-disabled', hasPrev ? 'false' : 'true');
            }
            if (next) {
                next.disabled = !hasNext;
                next.classList.toggle('is-hidden', !hasNext);
                next.setAttribute('aria-disabled', hasNext ? 'false' : 'true');
            }
        }

        function updateAria() {
            slides.forEach(function (slide, index) {
                var hidden = index !== current;
                slide.setAttribute('aria-hidden', hidden ? 'true' : 'false');
                slide.tabIndex = hidden ? -1 : 0;
            });
            dots.forEach(function (dot, index) {
                var active = index === current;
                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-current', active ? 'true' : 'false');
            });
        }

        function goTo(index, userInitiated) {
            if (!track) {
                return;
            }
            var nextIndex = Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0));
            if (nextIndex === current && index !== current) {
                if (!userInitiated) {
                    pauseAutoplay();
                }
                updateControls();
                return;
            }
            current = nextIndex;
            track.style.transform = 'translateX(-' + current * 100 + '%)';
            updateAria();
            updateControls();
            if (userInitiated) {
                restartAutoplay();
            }
        }

        function goNext(userInitiated) {
            if (current >= slides.length - 1) {
                if (!userInitiated) {
                    pauseAutoplay();
                }
                return;
            }
            goTo(current + 1, userInitiated);
        }

        function goPrev(userInitiated) {
            if (current <= 0) {
                return;
            }
            goTo(current - 1, userInitiated);
        }

        function restartAutoplay() {
            if (!autoplay || prefersReducedMotion) {
                return;
            }
            if (timer) {
                window.clearInterval(timer);
            }
            if (slides.length > 1) {
                timer = window.setInterval(function () {
                    goNext(false);
                }, interval);
            }
        }

        function pauseAutoplay() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        createDots();
        goTo(0, false);
        updateControls();

        if (prev) {
            prev.addEventListener('click', function () {
                goPrev(true);
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                goNext(true);
            });
        }

        if (carousel) {
            carousel.addEventListener('mouseenter', pauseAutoplay);
            carousel.addEventListener('mouseleave', restartAutoplay);
        }

        if (track) {
            track.addEventListener('pointerdown', function (event) {
                pointerStartX = event.clientX;
                track.setPointerCapture(event.pointerId);
            });
            track.addEventListener('pointerup', function (event) {
                if (pointerStartX === null) {
                    return;
                }
                var deltaX = event.clientX - pointerStartX;
                pointerStartX = null;
                if (Math.abs(deltaX) > 40) {
                    if (deltaX < 0) {
                        goNext(true);
                    } else {
                        goPrev(true);
                    }
                }
            });
            track.addEventListener('pointercancel', function () {
                pointerStartX = null;
            });
        }

        if (autoplay && !prefersReducedMotion) {
            restartAutoplay();
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    pauseAutoplay();
                } else {
                    restartAutoplay();
                }
            });
        }
    }

    var carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(initCarousel);


/* ============================
   Contact (Google Apps Script)
   Option A: no-cors (fire-and-forget)
   ============================ */
(function setupContactForm() {
  // 1) Sélectionne le formulaire de la section #contact
  var form = document.querySelector('#contact .form') || document.querySelector('form.form');
  if (!form) return;

  // 2) URL de déploiement Apps Script ("/exec")
  var ENDPOINT = 'https://script.google.com/a/macros/mpa2s.com/s/AKfycbxYnPa2lN0CVV340KYIHoYd1hRxggqr-Oa69wg-k9uCqnUt4eyfr7ynOIK8SXTOaZ9K6A/exec';

  // 3) Garde un fallback si JS désactivé
  form.setAttribute('action', ENDPOINT);
  form.setAttribute('method', 'POST');

  // 4) Zone de statut (créée si absente)
  var statusEl = document.getElementById('form-status');
  if (!statusEl) {
    statusEl = document.createElement('p');
    statusEl.id = 'form-status';
    statusEl.setAttribute('aria-live', 'polite');
    var actions = form.querySelector('.form__actions') || form;
    actions.appendChild(statusEl);
  }

  // 5) Soumission asynchrone
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot (si présent)
    var honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value.trim() !== '') {
      form.reset();
      statusEl.textContent = 'Merci !';
      return;
    }

    // Validation HTML5
    if (typeof form.reportValidity === 'function') {
      if (!form.reportValidity()) return;
    } else if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    statusEl.textContent = 'Envoi en cours…';

    // Petite pause anti-bot
    setTimeout(async function () {
      try {
        // Sérialisation en x-www-form-urlencoded
        var fd = new FormData(form);
        var params = new URLSearchParams();
        fd.forEach(function (value, key) {
          // Normalise le consentement checkbox en "on"/"off"
          if (key === 'consent') {
            params.append('consent', value ? 'on' : 'off');
          } else {
            params.append(key, value);
          }
        });

        await fetch(ENDPOINT, {
          method: 'POST',
          mode: 'no-cors', // clé: réponse opaque, pas de CORS
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        // Pas de res.json()/res.text() ici (opaque)
        form.reset();
        statusEl.textContent = 'Merci ! Votre message a bien été envoyé.';
      } catch (err) {
        console.error('[Contact form]', err);
        statusEl.textContent = "Oups, une erreur est survenue. Réessayez dans un instant.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }, 600);
  });
})(); 
});
