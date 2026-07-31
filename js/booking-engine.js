/**
 * Amwaj Travel & Tourism - Multi-Step Booking & Search Engine
 * Enterprise WhatsApp Booking Flow with Auto Request ID & Anti-Spam Protection
 * Official Category A License No. 1766 (Kafr El Sheikh, Egypt)
 */

let currentBookingStep = 1;
const TOTAL_BOOKING_STEPS = 3;

function openBookingModal(destinationName = '') {
    if (destinationName) {
        const modalDestInput = document.getElementById('modalDestInput');
        if (modalDestInput) modalDestInput.value = destinationName;
    }
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    resetBookingSteps();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('hidden');
}

function resetBookingSteps() {
    showBookingStep(1);
}

function showBookingStep(step) {
    currentBookingStep = step;
    for (let i = 1; i <= TOTAL_BOOKING_STEPS; i++) {
        const stepEl = document.getElementById(`bookingStep${i}`);
        const indicatorEl = document.getElementById(`stepIndicator${i}`);

        if (stepEl) {
            stepEl.classList.toggle('hidden', i !== step);
        }

        if (indicatorEl) {
            const isActive = i <= step;
            indicatorEl.classList.toggle('bg-brand-500', isActive);
            indicatorEl.classList.toggle('text-white', isActive);
            indicatorEl.classList.toggle('bg-slate-200', !isActive);
            indicatorEl.classList.toggle('text-slate-500', !isActive);
            indicatorEl.classList.toggle('dark:bg-slate-800', !isActive);
        }
    }
}

function nextBookingStep() {
    if (currentBookingStep < TOTAL_BOOKING_STEPS) {
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
    if (window.processWhatsAppBooking) {
        const success = window.processWhatsAppBooking(e.target);
        if (success) {
            closeBookingModal();
        }
    }
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
