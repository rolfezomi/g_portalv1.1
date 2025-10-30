/**
 * Glohe Bakım Yönetim Sistemi - Pending Tasks View
 * Bekleyen bakımlar listesi ve filtreleme
 */

const PendingTasksView = {
  tasks: [],
  currentFilter: 'all',

  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="pending-tasks-view">
        <div class="view-header">
          <h1>Bekleyen Bakımlar</h1>
          <button class="btn btn-primary" onclick="App.showView('maintenance-form')">
            ➕ Yeni Bakım
          </button>
        </div>

        <div class="filters-bar">
          ${Object.values(CONFIG.FILTERS).map(filter => `
            <button
              class="filter-btn ${filter.value === this.currentFilter ? 'active' : ''}"
              onclick="PendingTasksView.applyFilter('${filter.value}')"
            >
              ${filter.icon} ${filter.label}
            </button>
          `).join('')}
        </div>

        <div id="tasks-container"></div>
      </div>
    `;

    await this.loadTasks();
  },

  async loadTasks() {
    try {
      this.tasks = await supabaseClient.getPendingMaintenance(this.currentFilter);
      this.renderTasks();
    } catch (error) {
      console.error('Load tasks error:', error);
    }
  },

  renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    if (!this.tasks || this.tasks.length === 0) {
      container.innerHTML = '<p class="no-data">Bekleyen bakım bulunamadı.</p>';
      return;
    }

    // Sort: overdue first, then by date
    const sorted = [...this.tasks].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return new Date(a.scheduled_date) - new Date(b.scheduled_date);
    });

    container.innerHTML = `
      <div class="tasks-stats">
        <p>Toplam ${this.tasks.length} bakım</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Öncelik</th>
            <th>Makine</th>
            <th>Bakım Tipi</th>
            <th>Planlanan Tarih</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(task => `
            <tr class="${task.status === 'overdue' ? 'row-overdue' : ''}">
              <td>
                <span class="priority-badge priority-${task.priority}">
                  ${CONFIG.PRIORITY[Object.keys(CONFIG.PRIORITY)[task.priority]]?.label}
                </span>
              </td>
              <td>
                <strong>${task.machine?.machine_no}</strong><br>
                <span class="text-muted">${task.machine?.machine_name}</span>
              </td>
              <td>${task.maintenance_type}</td>
              <td>
                ${DateUtils.formatDate(task.scheduled_date)}<br>
                <span class="text-muted">${DateUtils.relativeTime(task.scheduled_date)}</span>
              </td>
              <td>
                <span class="status-badge status-${task.status}">
                  ${CONFIG.STATUS[task.status.toUpperCase()]?.label}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="App.showMaintenanceForm('${task.id}')">
                  Başlat
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  async applyFilter(filter) {
    this.currentFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    await this.loadTasks();
  },

  cleanup() {
    this.tasks = [];
  }
};

window.PendingTasksView = PendingTasksView;
