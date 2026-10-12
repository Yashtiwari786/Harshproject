/**
 * Lost2Found Authentication & Session Manager
 */
class AuthManager {
  static TOKEN_KEY = 'l2f_token';
  static USER_KEY = 'l2f_user';

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser() {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  static isLoggedIn() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static setSession(token, user) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/login.html';
  }

  static requireAuth() {
    if (!this.isLoggedIn()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?returnUrl=${returnUrl}`;
    }
  }

  static requireRole(allowedRoles) {
    this.requireAuth();
    const user = this.getUser();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!user || !roles.includes(user.role)) {
      if (window.API && window.API.showToast) {
        window.API.showToast('Access restricted: Insufficient permissions', 'warning');
      }
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 600);
    }
  }
}

window.Auth = AuthManager;
