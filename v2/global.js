const API_BASE = "https://marblehousewedding.com";

/**
 * Navigation loader
 */
async function loadNavigation() {
  const navContainer = document.getElementById('nav-placeholder');
  if (!navContainer) return;

  try {
    const response = await fetch('nav.html');
    const content = await response.text();
    navContainer.innerHTML = content;

    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    }
  } catch (err) {
    console.error("Nav load failed", err);
  }
}

// Boot
document.addEventListener('DOMContentLoaded', loadNavigation);