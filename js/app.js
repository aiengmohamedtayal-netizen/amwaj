/**
 * Amwaj Travel & Tourism — Main Application Logic
 * Category A License No. 1766 | Kafr El Sheikh, Egypt
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
    if (!modal || !img) return;
    img.src = src;
    img.alt = caption || 'Gallery image';
    if (cap) cap.textContent = caption || '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus trap: focus close btn
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
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn  = document.getElementById('mobileMenuBtn');
    if (!menu) return;
    const isHidden = menu.classList.toggle('hidden');
    if (btn) btn.setAttribute('aria-expanded', String(!isHidden));
}

/* =====================================================================
   CONTACT FORM SUBMIT
   ===================================================================== */
function handleContactSubmit(e) {
    e.preventDefault();
    const isAr = document.documentElement.getAttribute('lang') === 'ar';
    const msg  = isAr
        ? 'تم استلام استفساركم بنجاح. سيتواصل معكم فريق أمواج للسياحة خلال 24 ساعة.'
        : 'Inquiry received. Our travel advisors will contact you within 24 hours.';
    if (window.showToast) window.showToast(msg);
    e.target.reset();
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
   SCROLL REVEAL — IntersectionObserver
   ===================================================================== */
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        // Fallback: show everything immediately
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
        return;
    }
    const io = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in-view');
                io.unobserve(e.target); // fire once
            }
        }),
        { threshold: 0.07, rootMargin: '0px 0px -36px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
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
    if (themeBtn) {
        const prefersDark = !('theme' in localStorage)
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : localStorage.theme === 'dark';
        document.documentElement.classList.toggle('dark', prefersDark);

        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
        });
    }

    /* --- Mobile Menu -------------------------------------------- */
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);

    /* --- Escape Key: close modals ------------------------------- */
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
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

    /* --- Scroll Reveal ------------------------------------------ */
    initScrollReveal();

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
