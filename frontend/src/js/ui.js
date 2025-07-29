import { state } from './state.js';
import { api } from './api.js';
import { History } from './history.js';

export const UI = {
  showScreen(screenId) {
    document.querySelectorAll('#app-container > div, #app-container > #main-app-wrapper').forEach(screen => {
      screen.classList.add('hidden'); screen.style.display = 'none';
    });
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
      screenToShow.classList.remove('hidden');
      if (screenId.includes('Screen') || screenId === 'focusMode') screenToShow.style.display = 'flex';
      else screenToShow.style.display = 'block';
    }
  },
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    const toastContent = document.getElementById('toast-content');
    if (!toast || !toastContent) return;
    const colors = {
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      info: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
    };
    toastContent.className = `flex items-center w-full max-w-xs p-4 text-sm rounded-lg shadow-2xl ${colors[type]}`;
    toastContent.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
  },
  applyTheme() {
    const theme = localStorage.getItem('app_theme') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },
  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
  },
  showModal(modalId) { document.getElementById(modalId)?.classList.remove('hidden'); },
  hideModal(modalId) { document.getElementById(modalId)?.classList.add('hidden'); },
  
  showConfirmModal(title, text, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalText').textContent = text;
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('confirmBtn').addEventListener('click', onConfirm);
    this.showModal('confirmModal');
  },
  setReminder(taskId) {
  const task = state.tasks.find(t => t.id == taskId);
  if (!task) return;
  const minutes = prompt(`¿En cuántos minutos quieres un recordatorio para "${task.text}"?`);
  if (minutes && !isNaN(minutes) && minutes > 0) {
      setTimeout(() => {
          alert(`¡RECORDATORIO!\n\nTarea: "${task.text}"`);
      }, minutes * 60 * 1000);
      this.showToast(`Recordatorio para "${task.text}" establecido en ${minutes} minutos.`, 'success');
  } else if (minutes !== null) {
      this.showToast('Por favor, ingresa un número válido de minutos.', 'error');
    }
  },

  showFocusMode(taskId) {
    const task = state.tasks.find(t => t.id == taskId);
    if (!task) return;
    document.getElementById('focus-task-name').textContent = task.text;
    this.showScreen('focusMode');
  },
  hideFocusMode() { this.showScreen('main-app-wrapper'); },
  async showLeaderboard() {
    try {
        const users = await api.getUsers();
        state.users = users; // Actualizamos la lista local de usuarios
        const container = document.getElementById('leaderboard-container');
        container.innerHTML = '';
        users.forEach((user, index) => {
            const medal = ['🥇', '🥈', '🥉'][index] || '🔹';
            const userDiv = document.createElement('div');
            userDiv.className = 'flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700';
            userDiv.innerHTML = `<div class="flex items-center gap-3"><span class="text-xl">${medal}</span><span class="font-semibold">${user.username}</span></div><span class="font-bold text-sky-500">${user.points} pts</span>`;
            container.appendChild(userDiv);
        });
        this.showModal('leaderboardModal');
    } catch(e) { this.showToast('No se pudo cargar la clasificación.', 'error'); }
  },
  showAndGenerateNotifications() {
    const overdueContainer = document.getElementById('overdue-tasks-container');
    const todayContainer = document.getElementById('today-tasks-container');
    overdueContainer.innerHTML = ''; todayContainer.innerHTML = '';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    state.tasks.forEach(task => {
        if (task.status === 'Pendiente' && task.due_date) {
            const dueDate = new Date(task.due_date);
            if (dueDate < now) overdueContainer.innerHTML += `<p>- ${task.text}</p>`;
            else if (dueDate.getTime() === now.getTime()) todayContainer.innerHTML += `<p>- ${task.text}</p>`;
        }
    });
    if (overdueContainer.innerHTML === '') overdueContainer.innerHTML = '<p class="text-slate-400">Ninguna.</p>';
    if (todayContainer.innerHTML === '') todayContainer.innerHTML = '<p class="text-slate-400">Ninguna.</p>';
    this.showModal('notificationsModal');
  },
  submitFeedback(feedback) { this.showToast(`¡Gracias por tu feedback: ${feedback}!`, 'success'); this.hideModal('feedbackModal'); },
  openSidebar() {
    document.getElementById('sidebar-backdrop').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('-translate-x-full');
  },
  closeSidebar() {
    document.getElementById('sidebar-backdrop').classList.add('hidden');
    document.getElementById('sidebar').classList.add('-translate-x-full'); 
  },

showHistoryModal() {
  History.render();
  this.showModal('historyModal');
},
};