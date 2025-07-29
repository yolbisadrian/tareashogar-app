// frontend/src/js/task.js - VERSIÓN FINAL CON HISTORY.LOG INCLUIDO
import { state } from './state.js';
import { UI } from './ui.js';
import { History } from './history.js';
import { _escapeHTML } from './utils.js';
import { api } from './api.js';

export const TaskUI = {
  _getFilteredAndSortedTasks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterStatus = document.getElementById('filter-select').value;
    const filteredTasks = state.tasks.filter(task => (task.text || '').toLowerCase().includes(searchTerm) && (filterStatus === 'all' || task.status === filterStatus));
    filteredTasks.sort((a, b) => {
      const aVal = a[state.sort.by], bVal = b[state.sort.by];
      let comparison = (aVal > bVal) ? 1 : (aVal < bVal) ? -1 : 0;
      return state.sort.order === 'desc' ? comparison * -1 : comparison;
    });
    return filteredTasks;
  },
  async renderTasks() {
    try { state.tasks = await api.getTasks(); } catch (error) { console.error("Error cargando tareas:", error); UI.showToast("No se pudieron cargar las tareas", "error"); state.tasks = []; }
    const tabla = document.getElementById('tablaTareas');
    Array.from(tabla.querySelectorAll('tr.task-row')).forEach(row => row.remove());
    const tasksToRender = this._getFilteredAndSortedTasks();
    document.getElementById('empty-state-row').classList.toggle('hidden', tasksToRender.length > 0);
    tasksToRender.forEach(task => {
        const estadoColor = task.status === "Completada" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
        const fila = document.createElement("tr");
        fila.className = "task-row bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50";
        fila.dataset.id = task.id;
        if (task.status === 'Pendiente') fila.draggable = true;
        const fechaFormateada = task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : '';
        fila.innerHTML = `
          <td class="p-4 font-medium task-cell">${_escapeHTML(task.text)}</td>
          <td class="p-4 text-slate-500 dark:text-slate-400">${_escapeHTML(task.assigned_to || 'Cualquiera')}</td>
          <td class="p-4"><button class="estado-btn font-semibold px-3 py-1 text-xs rounded-full ${estadoColor}">${task.status}</button></td>
          <td class="p-4 text-slate-500 dark:text-slate-400 task-cell">${fechaFormateada}</td>
          <td class="p-4 text-center"><div class="flex justify-center items-center gap-2">
            <button class="reminder-btn text-slate-400 hover:text-amber-500" title="Crear Recordatorio"><svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg></button>
            <button class="focus-btn text-slate-400 hover:text-sky-500" title="Modo Concentración"><svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 6.098v11.805a.75.75 0 001.127.65l9.528-5.902a.75.75 0 000-1.302L8.127 5.448A.75.75 0 007 6.098z" /></svg></button>
            <button class="task-edit-btn text-slate-400 hover:text-sky-500" title="Editar Tarea"><svg class="w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
            <button class="task-delete-btn text-slate-400 hover:text-red-500" title="Eliminar Tarea"><svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
          </div></td>`;
        tabla.insertBefore(fila, document.getElementById('new-task-row'));
    });
    this.updateSortIcons();
    this.updateProgressBar();
  },
  updateProgressBar() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'Completada').length;
    const perc = total === 0 ? 0 : (completed / total) * 100;
    document.getElementById('progress-bar-completed').style.width = `${perc}%`;
    document.getElementById('progress-bar-text').textContent = total > 0 ? `${completed} de ${total} completadas (${Math.round(perc)}%)` : 'Añade una tarea.';
  },
  async handleAddTask() {
    const textInput = document.getElementById("nuevaTarea");
    const text = textInput.value.trim();
    if (!text) return UI.showToast('error', 'Descripción obligatoria.');
    const taskData = { text, assigned_to: document.getElementById("nuevoUsuario").value, due_date: document.getElementById("nuevaFecha").value || null };
    try { 
      await api.createTask(taskData); 
      History.log('create', `<b>${state.currentUser.username}</b> creó la tarea: "${_escapeHTML(text)}"`);
      await this.renderTasks(); 
      textInput.value = ''; 
      document.getElementById("nuevaFecha").value = ''; 
    } catch(e) { UI.showToast('Error al agregar tarea.', 'error'); }
  },
  async handleDeleteTask(btn) {
    const taskId = btn.closest('tr').dataset.id;
    UI.showConfirmModal('Eliminar Tarea', '¿Seguro?', async () => {
      try { 
        const task = state.tasks.find(t => t.id == taskId);
        await api.deleteTask(taskId); 
        History.log('delete', `<b>${state.currentUser.username}</b> eliminó la tarea: "${_escapeHTML(task.text)}"`);
        await this.renderTasks(); 
        UI.hideModal('confirmModal'); 
      } catch(e) { UI.showToast('Error al eliminar tarea.', 'error'); }
    });
  },
  handleEditTask(btn) { this.editCell(btn.closest('tr').querySelector('td.task-cell')); },
  async toggleStatus(taskId) {
    const task = state.tasks.find(t => t.id == taskId);
    if (!task) return;
    const newStatus = task.status === 'Pendiente' ? 'Completada' : 'Pendiente';
    try { 
      await api.updateTask(taskId, { status: newStatus }); 
      History.log('complete', `<b>${state.currentUser.username}</b> marcó la tarea "${_escapeHTML(task.text)}" como ${newStatus}.`);
      await this.renderTasks(); 
    } catch(e) { UI.showToast('Error al actualizar tarea.', 'error'); }
  },
  async editCell(td) {
    if (td.querySelector('input')) return;
    const row = td.closest('tr'); const taskId = row.dataset.id;
    const isDate = td.cellIndex === 3; const original = td.textContent.trim();
    td.innerHTML = ''; const input = document.createElement("input");
    input.type = isDate ? 'date' : 'text'; input.value = original;
    input.className = "w-full bg-white dark:bg-slate-700 p-1 border border-sky-500 rounded";
    const save = async () => {
      const value = input.value.trim();
      if (value && value !== original) {
        try { 
          const property = isDate ? 'due_date' : 'text';
          await api.updateTask(taskId, { [property]: value });
          History.log('edit', `<b>${state.currentUser.username}</b> editó la tarea "${_escapeHTML(original)}".`);
          await this.renderTasks(); 
        } catch(e) { UI.showToast('Error al editar.', 'error'); this.renderTasks(); }
      } else this.renderTasks();
    };
    input.onblur = save; input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') this.renderTasks(); };
    td.appendChild(input); input.focus();
  },
  sort(by) {
    state.sort.by = by; state.sort.order = state.sort.order === 'asc' ? 'desc' : 'asc';
    this.renderTasks();
  },
  updateSortIcons() {
    document.getElementById('sort-icon-text').textContent = '';
    document.getElementById('sort-icon-date').textContent = '';
    const icon = state.sort.order === 'asc' ? ' ▲' : ' ▼';
    document.getElementById(`sort-icon-${state.sort.by}`).textContent = icon;
  },
  async cargarTareasAutomaticas() {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const tareasDefault = [{ text: 'Lavar los platos' }, { text: 'Sacar la basura' }, { text: 'Limpiar el baño' }];
    if (state.users.length === 0) { UI.showToast('error', 'Agregue un usuario (local) primero.'); return; }
    const newTasksPayload = tareasDefault.map(t => {
      const user = state.users[Math.floor(Math.random() * state.users.length)];
      return { text: t.text, assigned_to: user.username, due_date: fechaHoy };
    });
    try {
      await api.createBatchTasks(newTasksPayload); 
      History.log('create', `<b>Sistema</b> creó ${newTasksPayload.length} tareas de ejemplo.`);
      await this.renderTasks();
      UI.showToast('success', `${newTasksPayload.length} tareas de ejemplo agregadas.`);
    } catch (error) { UI.showToast('error', 'Error al crear tareas automáticas.'); }
  },
  async clearAllTasks() {
    if (state.tasks.length === 0) return UI.showToast('info', 'La lista ya está vacía.');
    UI.showConfirmModal('Limpiar Todas las Tareas', '¿Seguro?', async () => {
      try { 
        await api.clearAllTasks();
        History.log('delete', `<b>${state.currentUser.username}</b> eliminó todas las tareas.`);
        await this.renderTasks(); 
        UI.hideModal('confirmModal'); 
      } catch(e) { UI.showToast('Error al limpiar.', 'error'); }
    });
  }
};