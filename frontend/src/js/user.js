// user.js - Gestión de usuarios desde interfaz admin
import { state } from './state.js';
import { UI } from './ui.js';
import { Auth } from './auth.js';
import { _escapeHTML } from './utils.js';

export const UserUI = {
  populateUserDropdowns() {
    const select = document.getElementById('nuevoUsuario');
    select.innerHTML = '';
    if (state.users.length === 0) {
      select.innerHTML = '<option disabled>Agrega un usuario</option>';
    } else {
      state.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        select.appendChild(option);
      });
    }
  },

  renderUsers() {
    const container = document.getElementById('user-list-container');
    container.innerHTML = state.users.length === 0 ? '<p class="text-slate-500 text-center">No hay usuarios.</p>' : '';
    state.users.forEach(user => {
      const isCurrentUser = user.username === state.currentUser.username;
      const userDiv = document.createElement('div');
      userDiv.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-700';
      userDiv.innerHTML = `
          <span class="font-medium">${_escapeHTML(user.username)} ${isCurrentUser ? '(Tú)' : ''}</span>
          <button onclick="UserUI.handleDeleteUser('${user.username}')" class="text-red-500 hover:text-red-700 disabled:opacity-50" ${isCurrentUser ? 'disabled' : ''}><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg></button>`;
      container.appendChild(userDiv);
    });
  },

  handleDeleteUser(username) {
    UI.showConfirmModal('Eliminar Usuario', `¿Seguro que quieres eliminar a ${username}?`, () => {
      Auth.deleteUser(username);
      UI.hideModal('confirmModal');
    });
  },
};