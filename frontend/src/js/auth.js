import { state } from './state.js';
import { Store } from './store.js';
import { UI } from './ui.js';
import { UserUI } from './user.js';
import { FocusMode } from './focus.js';
import { api } from './api.js';

export const Auth = {
  _hash: (str) => btoa(str),
  async register(username, password, secretQ, secretA) {
    if (password.length < 8) { UI.showToast('La contraseña debe tener al menos 8 caracteres.', 'error'); return false; }
    try {
      await api.register({ username, password, secret_q: secretQ, secret_a: secretA });
      UI.showToast('¡Usuario registrado con éxito! Por favor, inicia sesión.', 'success'); return true;
    } catch (error) { console.error('Error en Auth.register:', error); UI.showToast(error.message, 'error'); return false; }
  },
  async login(username, password) {
    try {
      const result = await api.login({ username, password });
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('username', result.user.username);
      state.currentUser = { username: result.user.username }; return true;
    } catch (error) { console.error('Error en Auth.login:', error); UI.showToast(error.message, 'error'); return false; }
  },
  logout() {
    localStorage.removeItem('authToken'); localStorage.removeItem('username');
    state.currentUser = null; FocusMode.stop(); UI.showScreen('loginScreen');
  },
  async findUserForRecovery(username) {
    try { const result = await api.recoverStep1({ username }); return result.secret_question; }
    catch (error) { console.error('Error en Auth.findUserForRecovery:', error); UI.showToast(error.message, 'error'); return null; }
  },
  async resetPassword(username, secret_a, new_password) {
    try { await api.resetPassword({ username, secret_a, new_password }); return true; }
    catch (error) { console.error('Error en Auth.resetPassword:', error); UI.showToast(error.message, 'error'); return false; }
  },
  addUser(username, password) {
    if (state.users.find(u => u.username.toLowerCase() === username.toLowerCase())) { UI.showToast('El nombre de usuario ya existe.', 'error'); return; }
    state.users.push({ username, password: this._hash(password), secretQ: 'Admin', secretA: this._hash('admin'), points: 0 });
    Store.saveUsers(state.users); UserUI.renderUsers(); UserUI.populateUserDropdowns();
    UI.showToast(`Usuario ${username} agregado (localmente).`, 'success');
  },
  deleteUser(username) {
    if (username === state.currentUser.username) { UI.showToast('No puedes eliminarte a ti mismo.', 'error'); return; }
    state.users = state.users.filter(u => u.username !== username);
    Store.saveUsers(state.users); UserUI.renderUsers(); UserUI.populateUserDropdowns();
    UI.showToast(`Usuario ${username} eliminado (localmente).`, 'info');
  }
};