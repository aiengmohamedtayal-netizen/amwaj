/**
 * Amwaj Travel & Tourism - Multi-Step Booking & Search Engine
 * Official Category A License No. 1766 (Kafr El Sheikh, Egypt)
 */

let currentBookingStep = 1;
const totalBookingSteps = 3;

function openBookingModal(destName = '') {
    if (destName) {
        const modalDestInput = document.getElementById('modalDestInput');
        if (modalDestInput) modalDestInput.value = destName;
    }
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('hidden');
        resetBookingSteps();
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('hidden');
}

function resetBookingSteps() {
    currentBookingStep = 1;
    showBookingStep(1);
}

function showBookingStep(step) {
    currentBookingStep = step;
    for (let i = 1; i <= totalBookingSteps; i++) {
        const stepEl = document.getElementById(`bookingStep${i}`);
        const indicatorEl = document.getElementById(`stepIndicator${i}`);
        if (stepEl) {
            if (i === step) {
                stepEl.classList.remove('hidden');
            } else {
                stepEl.classList.add('hidden');
            }
        }
        if (indicatorEl) {
            if (i <= step) {
                indicatorEl.classList.add('bg-brand-500', 'text-white');
                indicatorEl.classList.remove('bg-slate-200', 'text-slate-500', 'dark:bg-slate-800');
            } else {
                indicatorEl.classList.remove('bg-brand-500', 'text-white');
                indicatorEl.classList.add('bg-slate-200', 'text-slate-500', 'dark:bg-slate-800');
            }
        }
    }
}

function nextBookingStep() {
    if (currentBookingStep < totalBookingSteps) {
        showBookingStep(currentBookingStep + 1);
    }
}

function prevBookingStep() {
    if (currentBookingStep > 1) {
        showBookingStep(currentBookingStep - 1);
    }
}

function handleBookingSubmit(e) {
    e.preventDefault();
    closeBookingModal();
    const isArabic = document.documentElement.getAttribute('lang') === 'ar';
    const msg = isArabic 
        ? 'تم إرسال طلب الحجز بنجاح! سيتواصل معك فريق أمواج بكفر الشيخ فوراً عبر الواتساب أو الهاتف.' 
        : 'Booking request submitted successfully! Our advisors will contact you shortly.';
    if (window.showToast) window.showToast(msg);
    e.target.reset();
}

/**
 * Enhanced Commercial Trip Search
 * Filters destinations grid dynamically and smooth-scrolls
 */
function handleTripSearch(e) {
    e.preventDefault();
    const destSelect = document.getElementById('searchDestSelect');
    const destVal = destSelect ? destSelect.value : 'all';
    
    if (window.filterDestinations) {
        window.filterDestinations(destVal);
    }

    const destSection = document.getElementById('destinations');
    if (destSection) {
        destSection.scrollIntoView({ behavior: 'smooth' });
    }
}
