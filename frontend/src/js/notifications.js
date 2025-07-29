// notifications.js - Tareas atrasadas y para hoy
import { state } from './state.js';
import { _escapeHTML } from './utils.js';

export const NotificationsUI = {
  generateNotifications() {
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingTasks = state.tasks.filter(t => t.status === 'Pendiente');
    const overdueTasks = pendingTasks.filter(t => t.date < todayStr);
    const todayTasks = pendingTasks.filter(t => t.date === todayStr);

    this.renderNotificationList(document.getElementById('overdue-tasks-container'), overdueTasks, 'No hay tareas atrasadas. ¡Buen trabajo!');
    this.renderNotificationList(document.getElementById('today-tasks-container'), todayTasks, 'No hay tareas programadas para hoy.');
  },

  renderNotificationList(container, tasks, emptyMessage) {
    container.innerHTML = '';
    if (tasks.length === 0) {
      container.innerHTML = `<p class="text-slate-500 dark:text-slate-400 text-sm italic">${emptyMessage}</p>`;
      return;
    }
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'p-3 rounded-lg bg-slate-100 dark:bg-slate-700';
      taskDiv.innerHTML = `
        <p class="font-medium text-slate-800 dark:text-slate-200">${_escapeHTML(task.text)}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">Asignada a: <b>${_escapeHTML(task.user)}</b> - Fecha: ${task.date}</p>`;
      container.appendChild(taskDiv);
    });
  }
};