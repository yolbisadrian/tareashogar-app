// focus.js - Temporizador y modo concentración
import { UI } from './ui.js';
import { TaskUI } from './task.js';

export const FocusMode = {
  timerId: null,
  endTime: null,
  taskId: null,
  start(minutes, taskId) {
    this.taskId = taskId;
    this.endTime = Date.now() + minutes * 60000;
    this.timerId = setInterval(() => this.updateDisplay(), 1000);
    this.updateDisplay();
  },
  stop() {
    clearInterval(this.timerId);
    this.timerId = null;
  },
  updateDisplay() {
    const remaining = this.endTime - Date.now();
    if (remaining <= 0) {
      this.stop();
      document.getElementById('focus-timer').textContent = "00:00";
      UI.showToast('info', '¡Se acabó el tiempo de concentración!');
      return;
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.getElementById('focus-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },
  completeTask() {
    this.stop();
    TaskUI.toggleStatus(this.taskId);
    UI.hideFocusMode();
    UI.showToast('success', '¡Tarea completada! +10 puntos');
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
  }
};