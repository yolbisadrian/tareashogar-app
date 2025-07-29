import { state } from './state.js';
import { Store } from './store.js';
import { UI } from './ui.js';
import { Auth } from './auth.js';
import { TaskUI } from './task.js';
import { UserUI } from './user.js';
import { DashboardUI } from './dashboard.js';
import { FocusMode } from './focus.js';
import { History } from './history.js';

const App = {
  async init() {
    state.users = Store.getUsers(); state.history = Store.getHistory();
    UI.applyTheme(); this.initEventListeners();
    const token = localStorage.getItem('authToken');
    if (token) {
      state.currentUser = { username: localStorage.getItem('username') };
      await this.loadMainScreen();
    } else UI.showScreen('loginScreen');
    try {
    // Obtenemos la lista FRESCA de usuarios desde la base de datos
    const usersFromDB = await api.getUsers();
    // Actualizamos el estado global. ¡Esto es crucial!
    state.users = usersFromDB;
  } catch (error) {
    console.error("Error al cargar la lista de usuarios:", error);
    UI.showToast("No se pudo cargar la lista de usuarios.", "error");
  }

  UserUI.populateUserDropdowns(); 
  UserUI.renderUsers();
  await TaskUI.renderTasks(); 
  },
  async loadMainScreen() {
    UI.showScreen('main-app-wrapper');
    document.getElementById('current-username-display').textContent = `Conectado como: ${state.currentUser.username}`;
    UserUI.populateUserDropdowns(); UserUI.renderUsers();
    await TaskUI.renderTasks(); 

  },
  initEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = 'Iniciando...';
      const success = await Auth.login(e.target.username.value, e.target.password.value);
      if (success) await this.loadMainScreen();
      btn.disabled = false; btn.textContent = 'Iniciar sesión';
    });
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = 'Registrando...';
      const success = await Auth.register(e.target['reg-username'].value, e.target['reg-password'].value, e.target['reg-secret-q'].value, e.target['reg-secret-a'].value);
      if (success) { e.target.reset(); UI.showScreen('loginScreen'); }
      btn.disabled = false; btn.textContent = 'Registrarse';
    });
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const username = e.target['forgot-username'].value;
      const question = await Auth.findUserForRecovery(username);
      if (question) {
        document.getElementById('forgot-step1').classList.add('hidden');
        const step2 = document.getElementById('forgot-step2');
        step2.classList.remove('hidden'); step2.dataset.username = username;
        document.getElementById('secret-question-display').textContent = question;
      }
    });
    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const step2 = document.getElementById('forgot-step2');
      const { username } = step2.dataset;
      const success = await Auth.resetPassword(username, e.target['secret-answer'].value, e.target['new-password'].value);
      if (success) {
        UI.showToast('Contraseña restablecida.', 'success'); UI.showScreen('loginScreen');
        step2.classList.add('hidden'); document.getElementById('forgot-step1').classList.remove('hidden');
        e.target.reset(); document.getElementById('forgotPasswordForm').reset();
      }
    });
    document.getElementById('addUserForm').addEventListener('submit', (e) => { e.preventDefault(); Auth.addUser(e.target['add-user-username'].value, e.target['add-user-password'].value); e.target.reset(); });
    document.getElementById('add-task-btn').addEventListener('click', () => TaskUI.handleAddTask());
    document.getElementById('focus-complete-btn').addEventListener('click', () => FocusMode.completeTask());
    const tablaTareas = document.getElementById('tablaTareas');
    tablaTareas.addEventListener('click', (e) => {
        const button = e.target.closest('button'); if (!button) return;
        const row = button.closest('tr'); if (!row) return; const taskId = row.dataset.id;
        if (button.classList.contains('task-delete-btn')) TaskUI.handleDeleteTask(button);
        else if (button.classList.contains('task-edit-btn')) TaskUI.handleEditTask(button);
        else if (button.classList.contains('estado-btn')) TaskUI.toggleStatus(taskId);
        else if (button.classList.contains('focus-btn')) UI.showFocusMode(taskId);
        else if (button.classList.contains('reminder-btn')) UI.setReminder(taskId);
    });
    // EN: frontend/src/js/main.js, dentro de initEventListeners()

tablaTareas.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const row = button.closest('tr');
    if (!row) return;
    const taskId = row.dataset.id;

    if (button.classList.contains('task-delete-btn')) TaskUI.handleDeleteTask(button);
    else if (button.classList.contains('task-edit-btn')) TaskUI.handleEditTask(button);
    else if (button.classList.contains('estado-btn')) TaskUI.toggleStatus(taskId);
    else if (button.classList.contains('focus-btn')) UI.showFocusMode(taskId); // Llama a la función de UI
    else if (button.classList.contains('reminder-btn')) UI.setReminder(taskId); // Llama a la función de UI
});
}
};

// Exponemos los objetos al window para que los onclick del HTML funcionen
window.UI = UI; 
window.Auth = Auth; 
window.TaskUI = TaskUI; 
window.UserUI = UserUI;
window.History = History;

document.addEventListener('DOMContentLoaded', () => App.init());