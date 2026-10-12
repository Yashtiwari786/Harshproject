/**
 * Lost2Found Admin & Staff Command Suite Helper
 */

// Global Badge Formatters for Admin & Staff Tables
window.getRoleBadge = function(role) {
  if (role === 'ADMIN') return '<span class="badge bg-danger-subtle text-danger border border-danger fw-bold px-2.5 py-1 rounded-pill"><i class="fa-solid fa-shield-halved me-1"></i> ADMIN</span>';
  if (role === 'STAFF') return '<span class="badge bg-primary-subtle text-primary border border-primary fw-bold px-2.5 py-1 rounded-pill"><i class="fa-solid fa-user-shield me-1"></i> STAFF</span>';
  return '<span class="badge bg-success-subtle text-success border border-success fw-bold px-2.5 py-1 rounded-pill"><i class="fa-solid fa-graduation-cap me-1"></i> STUDENT</span>';
};

window.getStatusBadge = function(status) {
  if (status === 'ACTIVE') return '<span class="badge bg-success text-white px-2.5 py-1 rounded-pill shadow-sm"><i class="fa-solid fa-circle-check me-1"></i> ACTIVE</span>';
  if (status === 'SUSPENDED') return '<span class="badge bg-danger text-white px-2.5 py-1 rounded-pill shadow-sm"><i class="fa-solid fa-ban me-1"></i> SUSPENDED</span>';
  return `<span class="badge bg-secondary text-white px-2.5 py-1 rounded-pill">${status}</span>`;
};

document.addEventListener('DOMContentLoaded', () => {
  // Enforce Staff/Admin RBAC protection on all /admin/ pages
  if (window.location.pathname.includes('/admin/')) {
    if (window.Auth) {
      Auth.requireRole(['ADMIN', 'STAFF']);
    }

    // Highlight current page in sidebar
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.admin-sidebar-nav .admin-nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.endsWith(href)) {
        item.classList.add('active');
      } else if (href && !currentPath.endsWith(href)) {
        item.classList.remove('active');
      }
    });
  }
});
