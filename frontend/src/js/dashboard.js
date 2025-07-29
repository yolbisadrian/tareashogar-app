// dashboard.js - Gráficos de tareas por usuario y estado
import { state } from './state.js';

export const DashboardUI = {
  userChart: null,
  statusChart: null,
  
  generateCharts() {
    this.destroyCharts(); 
    this.generateUserTasksChart(); 
    this.generateStatusTasksChart();
  },

  destroyCharts() { 
    if (this.userChart) this.userChart.destroy(); 
    if (this.statusChart) this.statusChart.destroy(); 
  },

  generateUserTasksChart() {
    const ctx = document.getElementById('userTasksChart').getContext('2');
    const tasksPerUser = state.users.map(u => ({ 
      username: u.username, 
      count: state.tasks.filter(t => t.user === u.username).length 
    })).filter(d => d.count > 0);

    this.userChart = new Chart(ctx, {
      type: 'pie', 
      data: { 
        labels: tasksPerUser.map(d => d.username), 
        datasets: [{ 
          data: tasksPerUser.map(d => d.count), 
          backgroundColor: ['#38bdf8', '#fbbf24', '#34d399', '#f87171', '#818cf8', '#a78bfa'], 
          borderWidth: 2 
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { position: 'top' } 
        } 
      }
    });
  },

  generateStatusTasksChart() {
    const ctx = document.getElementById('statusTasksChart').getContext('2');
    const pendientes = state.tasks.filter(t => t.status === 'Pendiente').length; 
    const completadas = state.tasks.length - pendientes;
    
    this.statusChart = new Chart(ctx, {
      type: 'bar', 
      data: { 
        labels: ['Pendientes', 'Completadas'], 
        datasets: [{ 
          label: 'Número de Tareas', 
          data: [pendientes, completadas], 
          backgroundColor: ['#fbbf24', '#34d399'] 
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
          y: { 
            beginAtZero: true, 
            ticks: { stepSize: 1 } 
          } 
        }, 
        plugins: { 
          legend: { display: false } 
        } 
      }
    });
  }
};