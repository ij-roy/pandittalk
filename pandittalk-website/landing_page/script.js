/**
 * PanditTalk coming-soon — waitlist only
 */
const NOTIFY_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbwDCdsm2ZUpkFRwhNJx6uMvyywLjHH2xfOw54Y8IjsZRHqr1RSM0hSW6TbUv9oitALGsw/exec';

const form = document.getElementById('waitlistForm');
const emailInput = document.getElementById('email');
const notifyBtn = document.getElementById('notifyBtn');
const formMsg = document.getElementById('formMsg');
const btnLabel = notifyBtn ? notifyBtn.querySelector('.btn-label') : null;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setMessage(text, type) {
  if (!formMsg) return;
  formMsg.textContent = text;
  formMsg.classList.remove('is-ok', 'is-err');
  if (type) formMsg.classList.add(type);
}

function setBusy(busy) {
  if (!notifyBtn) return;
  notifyBtn.disabled = busy;
  if (btnLabel) {
    btnLabel.textContent = busy ? 'Saving…' : 'Notify Me';
  }
}

async function submitWaitlist(email) {
  if (!NOTIFY_SHEET_URL) {
    throw new Error('Waitlist is not connected yet.');
  }

  const response = await fetch(NOTIFY_SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      email,
      source: 'landing_page',
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Could not save your email.');
  }
  return data;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = (emailInput?.value || '').trim();

    if (!email) {
      setMessage('Enter your email address.', 'is-err');
      emailInput?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('That email doesn’t look right.', 'is-err');
      emailInput?.focus();
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const data = await submitWaitlist(email);
      notifyBtn?.classList.add('is-success');
      if (data.duplicate) {
        setMessage('You’re already on the list. We’ll be in touch.', 'is-ok');
      } else {
        setMessage('You’re in. We’ll ping you when PanditTalk launches.', 'is-ok');
        if (emailInput) emailInput.value = '';
      }
    } catch (err) {
      console.error('Waitlist failed:', err);
      setMessage('Couldn’t save that. Try again in a moment.', 'is-err');
    } finally {
      setBusy(false);
      window.setTimeout(() => notifyBtn?.classList.remove('is-success'), 800);
    }
  });
}
