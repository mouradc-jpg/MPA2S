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
       ============================ */
    (function setupContactForm() {
        // 1) Sélectionne le formulaire de la section #contact
        var form = document.querySelector('#contact .form') || document.querySelector('form.form');
        if (!form) return;

        // 2) Ton URL de déploiement Apps Script ("/exec")
        var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwRJQ40tbhjH01M1MSeB_bip2RfbREsm0KpbEZuuGlg8Lv0wOL-5jaCBjo9BeTDKWOu5A/exec';

        // 3) Met à jour l'action pour garder un fallback si JS désactivé
        form.setAttribute('action', ENDPOINT);
        form.setAttribute('method', 'POST');

        // 4) Zone de statut (si absente, on en crée une)
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

            // Honeypot (si présent dans le HTML)
            var honeypot = form.querySelector('input[name="_gotcha"]');
            if (honeypot && honeypot.value.trim() !== '') {
                // On fait comme si c'était ok (bot)
                form.reset();
                statusEl.textContent = 'Merci !';
                return;
            }

            // Validation HTML5
            if (typeof form.reportValidity === 'function') {
                if (!form.reportValidity()) {
                    return;
                }
            } else if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
                return;
            }

            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            statusEl.textContent = 'Envoi en cours…';

            // Petite pause anti-bot
            setTimeout(function () {
                var data = new FormData(form);

                fetch(ENDPOINT, {
                    method: 'POST',
                    body: data
                })
                .then(function (res) {
                    if (res.type === 'opaque') {
                        return { text: null };
                    }
                    if (!res.ok) {
                        throw new Error('HTTP ' + res.status);
                    }
                    return res.text().then(function (text) {
                        return { text: text };
                    });
                })
                .then(function (result) {
                    if (!result) {
                        return;
                    }
                    if (result.text === null) {
                        form.reset();
                        statusEl.textContent = 'Merci ! Votre message a bien été envoyé.';
                        return;
                    }
                    try {
                        var json = JSON.parse(result.text);
                        if (json && json.ok) {
                            form.reset();
                            statusEl.textContent = 'Merci ! Votre message a bien été envoyé.';
                            return;
                        }
                    } catch (_) {
                        /* ignore, ce n'est pas du JSON */
                    }

                    form.reset();
                    statusEl.textContent = 'Merci ! Votre message a bien été envoyé.';
                })
                .catch(function (err) {
                    statusEl.textContent = "Oups, une erreur est survenue. Réessayez dans un instant.";
                    console.error('[Contact form] ', err);
                })
                .finally(function () {
                    if (submitBtn) submitBtn.disabled = false;
                });
            }, 600);
        });
    })();
});
