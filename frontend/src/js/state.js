// state.js - Estado global compartido
export const state = {
  currentUser: null,
  users: [],
  tasks: [],
  history: [],
  recoveryUser: null,
  sort: { by: 'date', order: 'asc' }
};