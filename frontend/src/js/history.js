// frontend/src/js/history.js - VERSIÓN CONECTADA A LA API
import { api } from './api.js';
import { state } from './state.js';
import { _escapeHTML } from './utils.js';

export const History = {
  // La función 'log' ahora envía la entrada al backend
  async log(action, description) {
    try {
      await api.logHistory({ action_type: action, description: description });
      // Opcional: podríamos actualizar el estado local, pero es más
      // seguro y simple recargar desde la BD cuando se abra el modal.
    } catch (error) {
      console.error('No se pudo registrar la acción en el historial:', error);
    }
  },

  // La función 'render' ahora obtiene el historial desde el backend
  async render() {
    const container = document.getElementById('history-log-container');
    if (!container) return;

    try {
      // 1. Pedimos el historial a la API
      const logs = await api.getHistory();
      state.history = logs; // Actualizamos el estado local

      // 2. Renderizamos el historial
      if (logs.length === 0) {
        container.innerHTML = '<p class="text-slate-400">No hay actividad reciente.</p>';
        return;
      }

      container.innerHTML = logs.map(log => {
        const date = new Date(log.created_at);
        const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
            <p class="text-sm text-slate-800 dark:text-slate-200">${log.description}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 text-right">${timeString}</p>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error("Error al renderizar el historial:", error);
      container.innerHTML = '<p class="text-red-500">No se pudo cargar el historial.</p>';
    }
  }
};