/*
 * Amwaj customer reviews.
 * Existing testimonial cards remain meaningful initial HTML. This module progressively
 * appends only admin-approved reviews and submits new feedback as pending records.
 */
(function () {
    'use strict';

    const config = window.AMWAJ_CONFIG && window.AMWAJ_CONFIG.supabase;
    const approvedGrid = document.getElementById('approvedReviewsGrid');
    const form = document.getElementById('reviewForm');
    const panel = document.getElementById('reviewFormPanel');
    const openButton = document.getElementById('openReviewForm');
    const closeButton = document.getElementById('closeReviewForm');
    const feedback = document.getElementById('reviewFormStatus');
    const cooldownKey = 'amwaj_review_submission_cooldown_until';
    const cooldownMs = 60 * 1000;

    const copy = {
        ar: {
            sent: 'شكرًا لمشاركتك رأيك. استلمنا المراجعة وسيراجعها فريق أمواج قبل نشرها.',
            wait: 'يرجى الانتظار دقيقة قبل إرسال رأي آخر.',
            validation: 'يرجى إدخال الاسم والتقييم ورأي لا يقل عن 10 أحرف.',
            generic: 'تعذر إرسال الرأي الآن. يرجى المحاولة مرة أخرى لاحقًا.',
            malicious: 'شكرًا لمشاركتك رأيك. استلمنا المراجعة وسيراجعها فريق أمواج قبل نشرها.',
            stars: 'من 5 نجوم'
        },
        en: {
            sent: 'Thank you for sharing your feedback. Amwaj will review it before it is published.',
            wait: 'Please wait one minute before submitting another review.',
            validation: 'Please provide your name, a rating, and a review with at least 10 characters.',
            generic: 'Your review could not be sent right now. Please try again later.',
            malicious: 'Thank you for sharing your feedback. Amwaj will review it before it is published.',
            stars: 'out of 5 stars'
        }
    };

    function language() {
        return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar';
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function stars(rating) {
        const safeRating = Math.min(5, Math.max(1, Number(rating) || 0));
        const icon = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
        return `<div class="flex text-goldAccent-500 text-xs gap-1" aria-label="${safeRating} ${copy[language()].stars}">${icon.repeat(safeRating)}</div>`;
    }

    function reviewCard(item, index) {
        const delay = index % 3 === 1 ? ' reveal-d1' : index % 3 === 2 ? ' reveal-d2' : '';
        return `<article class="surface-layer p-6 space-y-4 flex flex-col justify-between h-full reveal${delay}" data-customer-review-id="${escapeHtml(item.id)}">
            <div class="space-y-3">
                ${stars(item.rating)}
                <p class="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-line">&ldquo;${escapeHtml(item.review_text)}&rdquo;</p>
            </div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">${escapeHtml(item.customer_name)}</h4>
        </article>`;
    }

    function setFeedback(type, message) {
        if (!feedback) return;
        feedback.className = `mt-4 rounded-xl px-4 py-3 text-xs font-semibold border ${type === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200' : 'border-tealCustom-200 bg-tealCustom-50 text-tealCustom-700 dark:border-tealCustom-900/60 dark:bg-tealCustom-950/40 dark:text-tealCustom-200'}`;
        feedback.textContent = message;
        feedback.hidden = false;
    }

    function setPanel(open) {
        if (!panel) return;
        panel.hidden = !open;
        if (open) {
            panel.classList.add('in-view');
            openButton?.setAttribute('aria-expanded', 'true');
            feedback && (feedback.hidden = true);
            window.setTimeout(() => form?.querySelector('[name="customer_name"]')?.focus(), 0);
        } else {
            openButton?.setAttribute('aria-expanded', 'false');
        }
    }

    function cooldownActive() {
        const until = Number(localStorage.getItem(cooldownKey) || 0);
        return Number.isFinite(until) && until > Date.now();
    }

    async function loadApprovedReviews() {
        if (!approvedGrid || !config || !config.url || !config.publishableKey) return;
        try {
            const query = new URLSearchParams({
                select: 'id,customer_name,rating,review_text,reviewed_at,submitted_at',
                status: 'eq.approved',
                order: 'reviewed_at.desc,submitted_at.desc',
                limit: '12'
            });
            const response = await fetch(`${config.url}/rest/v1/customer_reviews?${query.toString()}`, {
                headers: { apikey: config.publishableKey, Accept: 'application/json' }
            });
            if (!response.ok) throw new Error(`Customer reviews request failed (${response.status})`);
            const rows = await response.json();
            if (!Array.isArray(rows) || !rows.length) return;
            approvedGrid.insertAdjacentHTML('beforeend', rows.map(reviewCard).join(''));
            approvedGrid.dataset.source = 'supabase';
            approvedGrid.querySelectorAll('[data-customer-review-id].reveal').forEach((card) => card.classList.add('in-view'));
        } catch (error) {
            // Keep the meaningful static testimonials visible when Supabase is unavailable.
            console.warn('Amwaj customer reviews enhancement unavailable; static testimonials remain visible.', error);
        }
    }

    async function submitReview(event) {
        event.preventDefault();
        const locale = language();
        const values = new FormData(form);
        const customerName = String(values.get('customer_name') || '').trim();
        const rating = Number(values.get('rating'));
        const reviewText = String(values.get('review_text') || '').trim();
        const honeypot = String(values.get('company_website') || '').trim();

        if (honeypot) {
            form.reset();
            setFeedback('success', copy[locale].malicious);
            setPanel(false);
            return;
        }
        if (cooldownActive()) {
            setFeedback('error', copy[locale].wait);
            return;
        }
        if (customerName.length < 2 || customerName.length > 90 || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10 || reviewText.length > 1200) {
            setFeedback('error', copy[locale].validation);
            return;
        }

        if (!config || !config.url || !config.publishableKey) {
            setFeedback('error', copy[locale].generic);
            return;
        }

        const submit = form.querySelector('[type="submit"]');
        const priorHtml = submit?.innerHTML;
        if (submit) {
            submit.disabled = true;
            submit.classList.add('opacity-60', 'cursor-not-allowed');
        }
        try {
            const response = await fetch(`${config.url}/rest/v1/customer_reviews`, {
                method: 'POST',
                headers: {
                    apikey: config.publishableKey,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal'
                },
                body: JSON.stringify({ customer_name: customerName, rating, review_text: reviewText })
            });
            if (!response.ok) throw new Error(`Customer review submission failed (${response.status})`);
            localStorage.setItem(cooldownKey, String(Date.now() + cooldownMs));
            form.reset();
            setFeedback('success', copy[locale].sent);
        } catch (error) {
            console.warn('Amwaj customer review submission failed.', error);
            setFeedback('error', copy[locale].generic);
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.classList.remove('opacity-60', 'cursor-not-allowed');
                if (priorHtml) submit.innerHTML = priorHtml;
            }
        }
    }

    openButton?.addEventListener('click', () => setPanel(true));
    closeButton?.addEventListener('click', () => setPanel(false));
    form?.addEventListener('submit', submitReview);
    loadApprovedReviews();
}());
