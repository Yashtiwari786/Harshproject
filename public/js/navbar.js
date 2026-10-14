/**
 * Lost2Found Dynamic Navbar & Global Footer Component
 * Connects all pages and handles live notification counters and responsive menus
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  checkUnreadNotifications();
});

function renderNavbar() {
  const navContainer = document.getElementById('navbarContainer');
  if (!navContainer) return;

  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const currentPath = window.location.pathname;

  let roleLinks = '';
  let authLinks = '';

  if (isLoggedIn && user) {
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      roleLinks += `
        <li class="nav-item">
          <a class="nav-link ${currentPath.includes('/admin') ? 'active' : ''}" href="/admin/dashboard.html">
            <i class="fa-solid fa-shield-halved text-primary me-1"></i> Admin Command
          </a>
        </li>
      `;
    }

    authLinks = `
      <li class="nav-item">
        <a class="nav-link ${currentPath.includes('dashboard.html') ? 'active' : ''}" href="/dashboard.html">
          <i class="fa-solid fa-gauge me-1"></i> Dashboard
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link ${currentPath.includes('notifications.html') ? 'active' : ''} position-relative" href="/notifications.html">
          <i class="fa-solid fa-bell me-1"></i>
          <span class="d-none d-lg-inline">Alerts</span>
          <span id="unreadNavBadge" class="badge rounded-pill bg-danger ms-1 d-none animate-pulse">
            0
          </span>
        </a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm" style="width:34px; height:34px; font-weight:700; font-size:0.85rem;">
            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span class="fw-semibold">${user.name ? user.name.split(' ')[0] : 'Account'}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 animate-slide-up" aria-labelledby="userDropdown">
          <li><span class="dropdown-header text-muted">${user.email} (${user.role})</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="/dashboard.html"><i class="fa-solid fa-table-columns text-primary me-2"></i> My Dashboard</a></li>
          <li><a class="dropdown-item" href="/profile.html"><i class="fa-solid fa-user text-secondary me-2"></i> Profile & Security</a></li>
          <li><a class="dropdown-item" href="/dashboard.html#claims"><i class="fa-solid fa-file-signature text-warning me-2"></i> My Claims & Codes</a></li>
          ${user.role === 'ADMIN' ? `<li><a class="dropdown-item" href="/admin/dashboard.html"><i class="fa-solid fa-shield-halved text-danger me-2"></i> Admin Panel</a></li>` : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger fw-semibold" href="#" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket me-2"></i> Sign Out</a></li>
        </ul>
      </li>
    `;
  } else {
    authLinks = `
      <li class="nav-item">
        <a class="nav-link ${currentPath.includes('login.html') ? 'active' : ''}" href="/login.html">
          <i class="fa-solid fa-right-to-bracket me-1"></i> Login
        </a>
      </li>
      <li class="nav-item ms-lg-2">
        <a class="btn btn-primary-custom btn-sm rounded-pill px-3 shadow-sm" href="/register.html">
          <i class="fa-solid fa-user-plus me-1"></i> Register
        </a>
      </li>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-custom">
      <div class="container">
        <a class="navbar-brand text-decoration-none" href="/index.html">
          <div class="logo-icon-premium"><i class="fa-solid fa-graduation-cap"></i></div>
          <div class="d-flex flex-column">
            <span class="brand-title">LOST<span class="brand-accent">2</span>FOUND</span>
            <span class="brand-subtitle">Campus Management System</span>
          </div>
        </a>

        <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li class="nav-item">
              <a class="nav-link ${currentPath.endsWith('/') || currentPath.includes('index.html') ? 'active' : ''}" href="/index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('lost-items.html') ? 'active' : ''}" href="/lost-items.html">Lost Directory</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('found-items.html') ? 'active' : ''}" href="/found-items.html">Found Directory</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('how-it-works.html') ? 'active' : ''}" href="/how-it-works.html">How It Works</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${currentPath.includes('about.html') ? 'active' : ''}" href="/about.html">About</a>
            </li>
            ${roleLinks}
          </ul>

          <div class="d-flex align-items-center">
            <ul class="navbar-nav align-items-center mb-0">
              ${authLinks}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const footerContainer = document.getElementById('footerContainer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="footer-custom">
      <div class="container">
        
        <!-- Institutional Top Bar -->
        <div class="d-flex justify-content-between align-items-center pb-4 mb-4 border-bottom border-secondary border-opacity-25 flex-wrap gap-3">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-40 px-3 py-1.5 rounded-pill fw-bold">
              <i class="fa-solid fa-building-columns text-primary me-1"></i> Official College Campus Portal
            </span>
            <span class="badge bg-success bg-opacity-20 text-white border border-success border-opacity-40 px-3 py-1.5 rounded-pill fw-semibold">
              <i class="fa-solid fa-circle-check text-success me-1"></i> Live Verification Active
            </span>
          </div>
          <div class="small text-white-50">
            <i class="fa-solid fa-shield-halved text-success me-1"></i> Privacy Shield & Secure Handover Protocols Enforced
          </div>
        </div>

        <div class="row g-4 mb-4">
          <!-- Column 1: Brand & Overview -->
          <div class="col-lg-4 col-md-6">
            <a class="navbar-brand text-white mb-3 d-inline-flex align-items-center gap-2 text-decoration-none" href="/index.html">
              <div class="logo-icon-premium"><i class="fa-solid fa-graduation-cap"></i></div>
              <div class="d-flex flex-column">
                <span class="brand-title text-white">LOST<span class="brand-accent">2</span>FOUND</span>
                <span class="brand-subtitle text-white-50">Campus Management System</span>
              </div>
            </a>
            <p class="small text-white-50 mb-3" style="line-height: 1.7;">
              The certified centralized campus property repository. Connecting students, faculty, and campus security through cryptographic handover codes, anti-fraud privacy shielding, and smart 6-factor matching.
            </p>
            <div class="d-flex flex-wrap gap-2 pt-1">
              <span class="footer-badge"><i class="fa-solid fa-lock text-success"></i> 256-Bit SSL</span>
              <span class="footer-badge"><i class="fa-solid fa-user-shield text-info"></i> RBAC Security</span>
              <span class="footer-badge"><i class="fa-solid fa-certificate text-warning"></i> Certified Campus Hub</span>
            </div>
          </div>

          <!-- Column 2: Public Directories -->
          <div class="col-lg-2 col-md-3 col-6">
            <div class="footer-heading"><i class="fa-solid fa-compass text-primary"></i> Directories</div>
            <ul class="list-unstyled small footer-links mb-0">
              <li class="mb-2"><a href="/index.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Campus Home</a></li>
              <li class="mb-2"><a href="/lost-items.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Lost Directory</a></li>
              <li class="mb-2"><a href="/found-items.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Found Directory</a></li>
              <li class="mb-2"><a href="/how-it-works.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> How It Works</a></li>
              <li class="mb-2"><a href="/about.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> About Platform</a></li>
            </ul>
          </div>

          <!-- Column 3: Student Actions -->
          <div class="col-lg-3 col-md-3 col-6">
            <div class="footer-heading"><i class="fa-solid fa-graduation-cap text-success"></i> Student Hub</div>
            <ul class="list-unstyled small footer-links mb-0">
              <li class="mb-2"><a href="/dashboard.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Student Dashboard</a></li>
              <li class="mb-2"><a href="/dashboard.html#claims"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Handover Codes</a></li>
              <li class="mb-2"><a href="/report-lost.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Report Lost Item</a></li>
              <li class="mb-2"><a href="/report-found.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Deposit Found Item</a></li>
              <li class="mb-2"><a href="/notifications.html"><i class="fa-solid fa-angle-right me-1.5 text-muted"></i> Alerts & Broadcasts</a></li>
            </ul>
          </div>

          <!-- Column 4: Campus Security Helpdesk -->
          <div class="col-lg-3 col-md-12">
            <div class="footer-heading"><i class="fa-solid fa-building-shield text-danger"></i> Security Office</div>
            <div class="p-3 rounded-3 border border-secondary border-opacity-25" style="background: rgba(255, 255, 255, 0.03);">
              <p class="small text-white-50 mb-2">
                <i class="fa-solid fa-location-dot me-2 text-danger"></i> Main Administration Block, Room 102
              </p>
              <p class="small text-white-50 mb-2">
                <i class="fa-solid fa-phone me-2 text-success"></i> Direct Desk: <strong>Ext 4022</strong>
              </p>
              <p class="small text-white-50 mb-2">
                <i class="fa-solid fa-envelope me-2 text-primary"></i> security@college.edu
              </p>
              <div class="small text-white-50 pt-2 border-top border-secondary border-opacity-25">
                <i class="fa-solid fa-clock me-1 text-warning"></i> <strong>Physical Custody Hours:</strong><br>
                Mon - Sat: 9:00 AM - 5:30 PM
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom Bar -->
        <div class="footer-bottom-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            © 2026 <strong>Lost2Found</strong> — Integrated College Campus Property Recovery System. All rights reserved.
          </div>
          <div class="d-flex gap-3">
            <span><i class="fa-solid fa-shield-halved text-success me-1"></i> Privacy Shield Active</span>
            <span><i class="fa-solid fa-check text-info me-1"></i> Campus Verified</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

async function checkUnreadNotifications() {
  if (!Auth.isLoggedIn()) return;
  try {
    const res = await API.request('/notifications', { method: 'GET', suppressAutoLogout: true });
    if (res.success && res.unreadCount > 0) {
      const badge = document.getElementById('unreadNavBadge');
      if (badge) {
        badge.textContent = res.unreadCount > 9 ? '9+' : res.unreadCount;
        badge.classList.remove('d-none');
      }
    }
  } catch (e) {
    // Silent fail — never kick the user out for a background notification fetch
  }
}
