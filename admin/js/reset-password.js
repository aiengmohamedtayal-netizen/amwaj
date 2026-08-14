(function () {
  'use strict';

  const client = window.AmwajAdminClient;
  const form = document.getElementById('reset-password-form');
  const feedback = document.getElementById('reset-password-feedback');
  const submit = document.getElementById('reset-password-submit');
  const password = document.getElementById('new-password');
  const confirmation = document.getElementById('confirm-password');

  function setFeedback(message, success) {
    feedback.textContent = message;
    feedback.style.color = success ? '#087443' : '#b42318';
  }

  const session = client.captureEmailLinkSession();
  if (!session) {
    submit.disabled = true;
    password.disabled = true;
    confirmation.disabled = true;
    setFeedback('رابط تعيين كلمة المرور غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من مسؤول أمواج.', false);
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFeedback('', false);
    if (!form.reportValidity()) return;
    if (password.value !== confirmation.value) {
      setFeedback('كلمتا المرور غير متطابقتين.', false);
      confirmation.focus();
      return;
    }

    submit.disabled = true;
    submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ…';
    try {
      await client.updatePassword(password.value);
      setFeedback('تم تعيين كلمة المرور بنجاح. سيتم نقلك إلى لوحة الإدارة.', true);
      password.value = '';
      confirmation.value = '';
      window.setTimeout(() => window.location.replace('/admin/'), 1000);
    } catch (error) {
      setFeedback(error?.message || 'تعذر تعيين كلمة المرور. اطلب رابطًا جديدًا ثم حاول مرة أخرى.', false);
      submit.disabled = false;
      submit.innerHTML = '<i class="fa-solid fa-key"></i> حفظ كلمة المرور';
    }
  });
}());
