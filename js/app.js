/**
 * Amwaj Travel & Tourism — Main Application Logic
 * Category A License No. 1766 | Kafr El Sheikh, Egypt
 * Enterprise UX, Motion Physics & Performance Systems
 */

/* =====================================================================
   TOAST NOTIFICATION
   ===================================================================== */
window.showToast = function(text) {
    const toast   = document.getElementById('toastMessage');
    const toastTx = document.getElementById('toastText');
    if (!toast || !toastTx) return;
    toastTx.textContent = text;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 3600);
};

/* =====================================================================
   DESTINATION FILTERING
   ===================================================================== */
window.filterDestinations = function(category) {
    document.querySelectorAll('.dest-filter').forEach(btn => {
        const active = btn.getAttribute('data-dest') === category;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.dest-card').forEach(card => {
        const show = category === 'all' || card.getAttribute('data-dest') === category;
        card.style.display = show ? '' : 'none';
    });
};

/* =====================================================================
   LIGHTBOX
   ===================================================================== */
function openLightbox(src, caption) {
    const modal = document.getElementById('lightboxModal');
    const img   = document.getElementById('lightboxImg');
    const cap   = document.getElementById('lightboxCaption');
    if (!modal || !img || !String(src || '').trim()) return;
    img.src = src;
    img.alt = caption || 'Gallery image';
    if (cap) cap.textContent = caption || '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = modal.querySelector('[data-close-lightbox]');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* =====================================================================
   MOBILE MENU
   ===================================================================== */
function setMobileMenuState(open, { restoreFocus = false } = {}) {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('mobileMenuBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    if (!menu) return;

    menu.classList.toggle('hidden', !open);
    menu.setAttribute('aria-hidden', String(!open));
    backdrop?.classList.toggle('hidden', !open);
    document.documentElement.classList.toggle('mobile-nav-open', open);

    if (btn) {
        btn.setAttribute('aria-expanded', String(open));
        btn.querySelector('i')?.classList.toggle('fa-bars', !open);
        btn.querySelector('i')?.classList.toggle('fa-xmark', open);
    }

    if (open) {
        window.setTimeout(() => menu.focus({ preventScroll: true }), 0);
    } else if (restoreFocus) {
        btn?.focus({ preventScroll: true });
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    setMobileMenuState(menu.classList.contains('hidden'));
}

function closeMobileMenu(options = {}) {
    setMobileMenuState(false, options);
}

/* =====================================================================
   ENTERPRISE WHATSAPP BOOKING DISPATCHER & ANTI-SPAM
   ===================================================================== */
window._formRenderTimestamp = Date.now();

function generateRequestId() {
    const d = new Date();
    const dateStr = d.getFullYear().toString() +
                    String(d.getMonth() + 1).padStart(2, '0') +
                    String(d.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `AMW-${dateStr}-${randomNum}`;
}

window.processWhatsAppBooking = function(form) {
    if (!form) return false;
    const isArabic = document.documentElement.getAttribute('lang') === 'ar';

    // 1. Anti-Spam: Honeypot field
    const honeypot = form.querySelector('[name="website_hp"]');
    if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot submission blocked via Honeypot check.');
        return false;
    }

    // 2. Anti-Spam: Minimum submission time (2.5 seconds)
    const timeElapsed = (Date.now() - (window._formRenderTimestamp || 0)) / 1000;
    if (timeElapsed < 2.5) {
        console.warn('Submission too fast, suspected automated script.');
    }

    // Extract form fields
    const nameInput = form.querySelector('[name="name"], [name="fullName"], #contactName') || form.querySelector('input[type="text"]');
    const destInput = form.querySelector('[name="destination"], #contactDestSelect, #searchDestSelect, #modalDestInput') || form.querySelector('select');
    const dateInput = form.querySelector('[name="date"], [name="travelDate"], #contactDate, input[type="date"]');
    const travelersInput = form.querySelector('[name="travelers"], [name="guests"], #contactTravelers') || { value: 'غير محدد' };
    const phoneInput = form.querySelector('[name="phone"], [name="mobile"], #contactPhone, input[type="tel"]');
    const emailInput = form.querySelector('[name="email"], #contactEmail, input[type="email"]'); // OPTIONAL
    const notesInput = form.querySelector('[name="notes"], [name="details"], #contactNotes, textarea');

    // Validation targets (Required fields)
    const fieldsToValidate = [
        { el: nameInput, labelAr: 'الاسم' },
        { el: destInput, labelAr: 'الوجهة السياحية' },
        { el: dateInput, labelAr: 'تاريخ السفر' },
        { el: phoneInput, labelAr: 'رقم الهاتف / الواتساب' }
    ];

    let firstInvalid = null;

    fieldsToValidate.forEach(f => {
        if (!f.el) return;
        const val = (f.el.value || '').trim();
        if (!val) {
            f.el.classList.add('border-red-500', 'ring-2', 'ring-red-500/30', 'animate-shake');
            if (!firstInvalid) firstInvalid = f.el;
        } else {
            f.el.classList.remove('border-red-500', 'ring-2', 'ring-red-500/30', 'animate-shake');
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const errMsg = isArabic 
            ? 'يرجى إكمال جميع الحقول المطلوبة باللون الأحمر' 
            : 'Please complete all required fields highlighted in red';
        if (window.showToast) window.showToast(errMsg);
        return false;
    }

    // Auto Request ID & Form Values Extraction
    const requestId = generateRequestId();
    const nameVal = nameInput ? nameInput.value.trim() : 'غير محدد';
    const destVal = destInput ? (destInput.options ? destInput.options[destInput.selectedIndex]?.text || destInput.value : destInput.value) : 'غير محدد';
    const dateVal = dateInput ? dateInput.value.trim() : 'غير محدد';
    const travelersVal = (travelersInput && travelersInput.value) ? travelersInput.value.trim() : 'غير محدد';
    const phoneVal = phoneInput ? phoneInput.value.trim() : 'غير محدد';
    const emailVal = (emailInput && emailInput.value.trim()) ? emailInput.value.trim() : 'غير محدد (اختياري)';
    const notesVal = (notesInput && notesInput.value.trim()) ? notesInput.value.trim() : 'لا توجد ملاحظات إضافية';

    // Structured Enterprise WhatsApp Message
    const waMessage = 
`السلام عليكم، أرغب في الاستفسار عن رحلة.
━━━━━━━━━━━━━━
🆔 رقم الطلب: ${requestId}
👤 الاسم: ${nameVal}
📍 الوجهة: ${destVal}
📅 تاريخ السفر: ${dateVal}
👥 عدد المسافرين: ${travelersVal}
📱 الهاتف: ${phoneVal}
📧 البريد: ${emailVal}
📝 تفاصيل الطلب: ${notesVal}
━━━━━━━━━━━━━━
برجاء التواصل معي لتأكيد البرنامج والأسعار.
شكراً لكم.`;

    // Disable Submit Button & Loading State (300ms delay)
    const submitBtn = form.querySelector('button[type="submit"]');
    let origText = '';
    if (submitBtn) {
        origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin ml-2"></i> ${isArabic ? 'جاري تحويلك إلى واتساب...' : 'Redirecting to WhatsApp...'}`;
    }

    setTimeout(() => {
        const waUrl = `https://wa.me/201070553080?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        const successMsg = isArabic 
            ? `تم إنشاء طلب الحجز برقم ${requestId}! جاري فتح المحادثة المباشرة على الواتساب.` 
            : `Request ${requestId} generated! Opening WhatsApp chat.`;
        if (window.showToast) window.showToast(successMsg);

        // Reset & Debounce (3s)
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origText;
            }
            form.reset();
        }, 3000);
    }, 300);

    return true;
};

function handleContactSubmit(e) {
    e.preventDefault();
    if (window.processWhatsAppBooking) {
        window.processWhatsAppBooking(e.target);
    }
}

/* =====================================================================
   DOWNLOAD SOURCE
   ===================================================================== */
function downloadPortfolioFile() {
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'amwaj_travel_website.html' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    window.showToast(isAr ? 'تم تصدير ملف الموقع بنجاح' : 'Website exported successfully');
}

/* =====================================================================
   SCROLL REVEAL SYSTEM — IntersectionObserver
   ===================================================================== */
function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
        return;
    }
    const io = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in-view');
                io.unobserve(e.target);
            }
        }),
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* =====================================================================
   SCROLL PHYSICS & PROGRESS ENGINE (60 FPS)
   ===================================================================== */
function initScrollPhysics() {
    const progressBar = document.getElementById('scrollProgressBar');
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateScrollState);
            ticking = true;
        }
    }

    function updateScrollState() {
        const currentScrollY = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

        // 1. Top Progress Bar Fill
        if (progressBar && totalHeight > 0) {
            const progress = Math.min(100, Math.max(0, (currentScrollY / totalHeight) * 100));
            progressBar.style.width = `${progress}%`;
        }

        // 2. Header Scrolled Elevation & Height Compaction
        if (header) {
            if (currentScrollY > 20) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        }

        // 3. Scroll Direction Tracking
        if (Math.abs(currentScrollY - lastScrollY) > 5) {
            document.body.setAttribute('data-scroll-dir', currentScrollY > lastScrollY ? 'down' : 'up');
            lastScrollY = currentScrollY;
        }

        ticking = false;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollState();
}

/* =====================================================================
   MOUSE SPOTLIGHT & 3D CARD TILT PHYSICS (60 FPS)
   ===================================================================== */
function initMousePhysics() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reducedMotion || !finePointer) return;

    const cards = document.querySelectorAll('.surface-layer, .travel-card-hover');

    cards.forEach(card => {
        let ticking = false;

        card.addEventListener('mousemove', e => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // Spotlight coordinates
                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);

                    // Bounded 3D Tilt (Max 3.5 deg)
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -3.5;
                    const rotateY = ((x - centerX) / centerX) * 3.5;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -6px, 0)`;

                    ticking = false;
                });
                ticking = true;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
        });
    });
}

/* =====================================================================
   ANIMATED STATISTICAL COUNTERS
   ===================================================================== */
function initAnimatedCounters() {
    const counterElements = document.querySelectorAll('[data-counter]');
    if (!counterElements.length) return;

    const setCounterValue = el => {
        const targetNum = parseInt(el.getAttribute('data-counter'), 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        if (!isNaN(targetNum)) el.textContent = `${prefix}${targetNum.toLocaleString()}${suffix}`;
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        counterElements.forEach(setCounterValue);
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const targetNum = parseInt(el.getAttribute('data-counter'), 10);
                const prefix = el.getAttribute('data-prefix') || '';
                const suffix = el.getAttribute('data-suffix') || '';

                if (isNaN(targetNum)) return;

                let current = 0;
                const duration = 1500;
                const startTime = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(1, elapsed / duration);
                    // Ease Out Expo
                    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    current = Math.floor(easeProgress * targetNum);

                    el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.textContent = `${prefix}${targetNum.toLocaleString()}${suffix}`;
                    }
                }

                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counterElements.forEach(el => observer.observe(el));
}

/* =====================================================================
   INIT ON DOM READY
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* --- Current Year -------------------------------------------- */
    const yrEl = document.getElementById('currentYear');
    if (yrEl) yrEl.textContent = new Date().getFullYear();

    /* --- Theme ---------------------------------------------------- */
    const themeBtn = document.getElementById('themeToggle');
    const mobileThemeBtn = document.getElementById('mobileThemeToggle');
    const prefersDark = !('theme' in localStorage)
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : localStorage.theme === 'dark';
    document.documentElement.classList.toggle('dark', prefersDark);

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
    };
    themeBtn?.addEventListener('click', toggleTheme);
    mobileThemeBtn?.addEventListener('click', toggleTheme);

    /* --- Mobile Menu -------------------------------------------- */
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);

    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
    mobileMenu?.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            const targetId = link.getAttribute('href');
            const target = targetId ? document.querySelector(targetId) : null;
            if (!target) return;

            event.preventDefault();
            closeMobileMenu();
            window.setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', targetId);
            }, 0);
        });
    });

    mobileMenu?.querySelectorAll('a:not([href^="#"])').forEach(link => {
        link.addEventListener('click', () => closeMobileMenu());
    });
    mobileMenuBackdrop?.addEventListener('click', () => closeMobileMenu({ restoreFocus: true }));
    window.matchMedia('(min-width: 1024px)').addEventListener('change', event => {
        if (event.matches) closeMobileMenu();
    });

    /* --- Escape Key: close modals ------------------------------- */
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        closeMobileMenu({ restoreFocus: true });
        closeLightbox();
        if (typeof closeBookingModal === 'function') closeBookingModal();
        const drawer = document.getElementById('aiDrawer');
        if (drawer && !drawer.classList.contains('hidden') && typeof toggleAiDrawer === 'function') toggleAiDrawer();
    });

    /* --- Overlay click to close modals -------------------------- */
    document.getElementById('lightboxModal')?.addEventListener('click', e => {
        if (e.target.id === 'lightboxModal') closeLightbox();
    });
    document.getElementById('bookingModal')?.addEventListener('click', e => {
        if (e.target.id === 'bookingModal' && typeof closeBookingModal === 'function') closeBookingModal();
    });

    /* --- Systems Initialization ---------------------------------- */
    initScrollReveal();
    initScrollPhysics();
    initMousePhysics();
    initAnimatedCounters();

    /* --- Nav: active section highlighting ----------------------- */
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    if (navLinks.length && 'IntersectionObserver' in window) {
        const sectionIO = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const link = document.querySelector(`nav a[href="#${e.target.id}"]`);
                if (link) link.classList.toggle('text-brand-500', e.isIntersecting);
            });
        }, { threshold: 0.35 });
        document.querySelectorAll('main section[id]').forEach(s => sectionIO.observe(s));
    }
});
