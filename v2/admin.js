const API_BASE = "https://marblehousewedding.com";

/**
 * Auth Gate — runs before anything else renders.
 * Verifies password against the existing worker /api/admin endpoint.
 * Stores in sessionStorage so you only log in once per browser session.
 */
async function enforceAuth() {
  // Hide page content immediately
  document.body.style.visibility = 'hidden';

  const stored = sessionStorage.getItem('v2_admin_pass');
  if (stored && await verifyPassword(stored)) {
    unlockPage();
    return;
  }

  // Clear any stale/invalid stored password
  sessionStorage.removeItem('v2_admin_pass');
  showLoginOverlay();
}

async function verifyPassword(password) {
  try {
    const res = await fetch(`${API_BASE}/api/admin`, {
      method: 'GET',
      headers: { 'x-admin-password': password }
    });
    return res.ok;
  } catch {
    return false;
  }
}

function showLoginOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML = `
    <div style="
      position:fixed; inset:0; z-index:9999;
      display:flex; align-items:center; justify-content:center;
      background:#fdfdfd; font-family:'Lato',sans-serif;
    ">
      <div style="text-align:center; max-width:360px; padding:2rem;">
        <h1 style="font-family:'Playfair Display',serif; font-size:2rem; color:#5f8670; font-style:italic; margin-bottom:0.5rem;">
          E & D
        </h1>
        <p style="color:#999; font-size:0.85rem; margin-bottom:2rem; letter-spacing:0.1em; text-transform:uppercase;">
          Wedding Management
        </p>
        <input type="password" id="auth-password" placeholder="Enter password"
          style="
            width:100%; padding:0.75rem 1rem; border:1px solid #e6e6fa;
            border-radius:9999px; outline:none; text-align:center;
            font-size:0.95rem; margin-bottom:1rem;
          "
        />
        <button id="auth-submit"
          style="
            width:100%; padding:0.75rem; background:#5f8670; color:white;
            border:none; border-radius:9999px; cursor:pointer;
            font-size:0.85rem; letter-spacing:0.15em; text-transform:uppercase;
          "
        >
          Enter
        </button>
        <p id="auth-error" style="color:#e55; font-size:0.8rem; margin-top:1rem; display:none;">
          Incorrect password
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.visibility = 'visible';

  const input = document.getElementById('auth-password');
  const btn = document.getElementById('auth-submit');
  const error = document.getElementById('auth-error');

  async function attemptLogin() {
    const pw = input.value.trim();
    if (!pw) return;

    btn.textContent = '...';
    btn.disabled = true;

    if (await verifyPassword(pw)) {
      sessionStorage.setItem('v2_admin_pass', pw);
      overlay.remove();
      unlockPage();
    } else {
      error.style.display = 'block';
      btn.textContent = 'ENTER';
      btn.disabled = false;
      input.value = '';
      input.focus();
    }
  }

  btn.addEventListener('click', attemptLogin);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  input.focus();
}

function unlockPage() {
  document.body.style.visibility = 'visible';
  // Set flag and fire event so manage.html can init its data
  window._authReady = true;
  window.dispatchEvent(new Event('authReady'));
}

/**
 * Helper: get the stored admin password for use in admin pages
 */
function getAdminPassword() {
  return sessionStorage.getItem('v2_admin_pass') || '';
}

// Boot
document.addEventListener('DOMContentLoaded', enforceAuth);