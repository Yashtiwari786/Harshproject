/**
 * Lost2Found API Client Wrapper & Interactive UI Helpers
 */
const API_BASE = '/api';

class ApiClient {
  static getHeaders(isFormData = false) {
    const headers = {};
    const token = localStorage.getItem('l2f_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = { ...this.getHeaders(isFormData), ...(options.headers || {}) };
    // suppressAutoLogout: set true for background/optional requests that shouldn't kick the user out
    const suppressAutoLogout = options.suppressAutoLogout === true;

    const config = {
      method: options.method || 'GET',
      headers,
      ...options,
    };
    delete config.suppressAutoLogout;

    if (options.body && !isFormData && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Only auto-logout on 401 for explicit user-triggered requests, not background polls
        if (response.status === 401 && !suppressAutoLogout) {
          localStorage.removeItem('l2f_token');
          localStorage.removeItem('l2f_user');
          const p = window.location.pathname.toLowerCase();
          const isProtectedPage =
            p.includes('dashboard') ||
            p.includes('profile') ||
            p.includes('report-lost') ||
            p.includes('report-found') ||
            p.includes('claim.html') ||
            p.includes('/claim') ||
            p.includes('/admin');

          if (isProtectedPage && !p.includes('login') && !p.includes('register')) {
            window.location.href = '/login.html?expired=true';
          }
        }
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Request Error ${endpoint}]:`, error.message);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  static put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Animated Toast Notification
   */
  static showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }

    const iconMap = {
      success: 'fa-circle-check text-emerald-400',
      error: 'fa-circle-exclamation text-rose-400',
      info: 'fa-circle-info text-indigo-400',
      warning: 'fa-triangle-exclamation text-amber-400',
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast-custom ${type}`;
    toastEl.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="fa-solid ${iconMap[type] || 'fa-info'} fs-5"></i>
        <span style="font-weight: 500; font-size: 0.95rem;">${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white btn-sm" onclick="this.closest('.toast-custom').remove()"></button>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(10px)';
        setTimeout(() => toastEl.remove(), 300);
      }
    }, 4500);
  }

  /**
   * Copy to clipboard with visual feedback
   */
  static copyToClipboard(text, triggerBtn) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`Copied "${text}" to clipboard!`, 'success');
      if (triggerBtn) {
        const originalHtml = triggerBtn.innerHTML;
        triggerBtn.innerHTML = `<i class="fa-solid fa-check me-1"></i> Copied!`;
        triggerBtn.classList.add('btn-success');
        setTimeout(() => {
          triggerBtn.innerHTML = originalHtml;
          triggerBtn.classList.remove('btn-success');
        }, 2000);
      }
    }).catch(() => {
      this.showToast('Failed to copy to clipboard', 'error');
    });
  }

  /**
   * Animate number counters from 0 to target
   */
  static animateCounter(el, target, duration = 1200) {
    if (!el) return;
    const end = parseInt(target, 10) || 0;
    const start = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeProgress);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = end;
      }
    }

    requestAnimationFrame(update);
  }
}

window.API = ApiClient;
