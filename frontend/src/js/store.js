export const Store = {
  getUsers: () => JSON.parse(localStorage.getItem('app_users')) || [],
  saveUsers: (users) => localStorage.setItem('app_users', JSON.stringify(users)),
  getTasks: () => JSON.parse(localStorage.getItem('app_tasks')) || [],
  saveTasks: (tasks) => localStorage.setItem('app_tasks', JSON.stringify(tasks)),
  getHistory: () => JSON.parse(localStorage.getItem('app_history')) || [],
  saveHistory: (history) => localStorage.setItem('app_history', JSON.stringify(history)),
  getTheme: () => localStorage.getItem('app_theme') || 'light',
  saveTheme: (theme) => localStorage.setItem('app_theme', theme),
  
  // Manejo de sesión de usuario
  getCurrentUser: () => JSON.parse(localStorage.getItem('app_currentUser')),
  saveCurrentUser: (user) => localStorage.setItem('app_currentUser', JSON.stringify(user)),
  clearCurrentUser: () => localStorage.removeItem('app_currentUser'),
};