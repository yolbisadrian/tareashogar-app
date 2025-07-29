// leaderboard.js - Clasificación de usuarios por puntos
import { state } from './state.js';
import { _escapeHTML } from './utils.js';

export const LeaderboardUI = {
  renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';
    const sortedUsers = [...state.users].sort((a, b) => (b.points || 0) - (a.points || 0));

    if (sortedUsers.length === 0) {
      container.innerHTML = '<p class="text-slate-500 text-center">No hay usuarios en la clasificación.</p>';
      return;
    }

    sortedUsers.forEach((user, index) => {
      const rank = index + 1;
      let rankDisplay = (rank === 1) ? '<span>👑</span>' : (rank === 2) ? '<span>🥈</span>' : (rank === 3) ? '<span>🥉</span>' : `<span class="font-semibold text-slate-400">${rank}</span>`;
      
      const userDiv = document.createElement('div');
      userDiv.className = 'flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700';
      userDiv.innerHTML = `
        <div class="flex items-center gap-4">
          ${rankDisplay}
          <span class="font-medium">${_escapeHTML(user.username)}</span>
        </div>
        <span class="font-bold text-sky-500">${user.points || 0} pts</span>`;
      container.appendChild(userDiv);
    });
  }
};