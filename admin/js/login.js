(function () {
  'use strict';

  const client = window.AmwajAdminClient;
  const form = document.getElementById('login-form');
  const feedback = document.getElementById('login-feedback');
  const submit = document.getElementById('login-submit');

  async function redirectIfAlreadyAuthorized() {
    const auth = await client.requireAdmin();
    if (auth.isAdmin) window.location.replace('/admin/');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = '';
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    submit.disabled = true;
    submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التحقق…';

    try {
      await client.signInWithPassword(email, password);
      const auth = await client.requireAdmin();
      if (!auth.isAdmin) {
        await client.signOut();
        throw new Error('هذا الحساب غير مخوّل للوصول إلى إدارة أمواج.');
      }
      window.location.replace('/admin/');
    } catch (error) {
      feedback.textContent = error.status === 400 || /invalid login credentials/i.test(error.message || '')
        ? 'بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.'
        : 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.';
      submit.disabled = false;
      submit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول';
    }
  });

  redirectIfAlreadyAuthorized();
}());
