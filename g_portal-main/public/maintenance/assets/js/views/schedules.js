/**
 * Glohe Bakım Yönetim Sistemi - Schedules View
 * Bakım periyotlarını yönetme sayfası
 */

const SchedulesView = {
  schedules: [],
  machines: [],
  editingId: null,

  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Periyotlar yükleniyor...</div>';

    try {
      await this.loadData();
      container.innerHTML = this.getHTML();
      this.attachEventListeners();
    } catch (error) {
      console.error('Schedules view error:', error);
      container.innerHTML = `<div class="error-message">Hata: ${error.message}</div>`;
    }
  },

  async loadData() {
    [this.schedules, this.machines] = await Promise.all([
      supabaseClient.getMaintenanceSchedules(),
      supabaseClient.getMachines()
    ]);
  },

  getHTML() {
    return `
      <div class="schedules-view">
        <div class="schedules-header">
          <h1>Bakım Periyotları</h1>
          <button class="btn btn-primary" onclick="SchedulesView.openAddModal()">
            ➕ Yeni Periyot Ekle
          </button>
        </div>

        <div class="schedules-info">
          <p>📋 Bakım periyotlarını buradan yönetebilirsiniz. Periyot eklendiğinde veya güncellendiğinde, takvim otomatik olarak yeniden oluşturulacaktır.</p>
        </div>

        ${this.renderSchedulesTable()}

        <!-- Add/Edit Modal -->
        <div id="schedule-modal" class="modal hidden">
          <div class="modal-overlay" onclick="SchedulesView.closeModal()"></div>
          <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
              <h2 id="modal-title">Yeni Periyot Ekle</h2>
              <button class="modal-close-btn" onclick="SchedulesView.closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <form id="schedule-form" onsubmit="SchedulesView.handleSubmit(event)">
                <div class="form-field">
                  <label>Makine *</label>
                  <select id="machine-select" name="machine_id" required>
                    <option value="">Seçiniz...</option>
                    ${this.machines.map(m => `
                      <option value="${m.id}">${m.machine_no} - ${m.machine_name}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-field">
                  <label>Bakım Tipi *</label>
                  <input type="text" name="maintenance_type" placeholder="Örn: Genel Bakım, Temizlik" required>
                </div>

                <div class="form-field">
                  <label>Frekans *</label>
                  <select name="frequency" id="frequency-select" required onchange="SchedulesView.handleFrequencyChange()">
                    <option value="">Seçiniz...</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">3 Aylık</option>
                    <option value="semi-annual">6 Aylık</option>
                    <option value="annual">Yıllık</option>
                  </select>
                </div>

                <div class="form-field" id="months-field" style="display: none;">
                  <label>Aylar *</label>
                  <div class="months-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${Object.entries(CONFIG.MONTHS_TR).map(([num, name]) => `
                      <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" name="months" value="${num}">
                        <span>${name}</span>
                      </label>
                    `).join('')}
                  </div>
                  <small style="color: #6b7280;">Bakım yapılacak ayları seçin</small>
                </div>

                <input type="hidden" id="schedule-id" name="id">

                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" onclick="SchedulesView.closeModal()">İptal</button>
                  <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Regenerate Calendar Confirmation Modal -->
        <div id="regenerate-modal" class="modal hidden">
          <div class="modal-overlay" onclick="SchedulesView.closeRegenerateModal()"></div>
          <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
              <h2>Takvimi Yeniden Oluştur</h2>
              <button class="modal-close-btn" onclick="SchedulesView.closeRegenerateModal()">✕</button>
            </div>
            <div class="modal-body">
              <p>Periyot değişiklikleri için takvimleri yeniden oluşturmak ister misiniz?</p>
              <p><strong>Not:</strong> Mevcut planlanan bakımlar silinip yeni periyoda göre oluşturulacaktır.</p>
              <div class="form-field">
                <label>Hangi yıllar için oluşturulsun?</label>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <label><input type="checkbox" name="regen-year" value="2025" checked> 2025</label>
                  <label><input type="checkbox" name="regen-year" value="2026" checked> 2026</label>
                  <label><input type="checkbox" name="regen-year" value="2027" checked> 2027</label>
                  <label><input type="checkbox" name="regen-year" value="2028"> 2028</label>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="SchedulesView.closeRegenerateModal()">İptal</button>
                <button type="button" class="btn btn-primary" onclick="SchedulesView.regenerateCalendar()">Oluştur</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSchedulesTable() {
    if (!this.schedules || this.schedules.length === 0) {
      return '<p class="no-data">Henüz bakım periyodu eklenmemiş.</p>';
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Makine</th>
            <th>Bakım Tipi</th>
            <th>Frekans</th>
            <th>Aylar</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          ${this.schedules.map(schedule => `
            <tr>
              <td>
                <strong>${schedule.machine?.machine_no || '-'}</strong><br>
                <span class="text-muted">${schedule.machine?.machine_name || '-'}</span>
              </td>
              <td>${schedule.maintenance_type}</td>
              <td>${CONFIG.FREQUENCY[schedule.frequency.toUpperCase()]?.label || schedule.frequency}</td>
              <td>
                ${schedule.frequency === 'weekly'
                  ? '<span class="text-muted">Tüm haftalar</span>'
                  : this.formatMonths(schedule.months)}
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="SchedulesView.editSchedule('${schedule.id}')">
                  ✏️ Düzenle
                </button>
                <button class="btn btn-sm btn-danger" onclick="SchedulesView.deleteSchedule('${schedule.id}')">
                  🗑️ Sil
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  formatMonths(months) {
    if (!months || months.length === 0) return '-';
    return months.map(m => CONFIG.MONTHS_TR[m]).join(', ');
  },

  handleFrequencyChange() {
    const frequency = document.getElementById('frequency-select').value;
    const monthsField = document.getElementById('months-field');

    if (frequency === 'weekly') {
      monthsField.style.display = 'none';
    } else {
      monthsField.style.display = 'block';
    }
  },

  openAddModal() {
    this.editingId = null;
    document.getElementById('modal-title').textContent = 'Yeni Periyot Ekle';
    document.getElementById('schedule-form').reset();
    document.getElementById('schedule-id').value = '';
    document.getElementById('schedule-modal').classList.remove('hidden');
  },

  async editSchedule(id) {
    this.editingId = id;
    const schedule = this.schedules.find(s => s.id === id);
    if (!schedule) return;

    document.getElementById('modal-title').textContent = 'Periyot Düzenle';
    document.getElementById('schedule-id').value = schedule.id;
    document.getElementById('machine-select').value = schedule.machine_id;
    document.querySelector('[name="maintenance_type"]').value = schedule.maintenance_type;
    document.getElementById('frequency-select').value = schedule.frequency;

    this.handleFrequencyChange();

    // Set months
    if (schedule.months && schedule.months.length > 0) {
      document.querySelectorAll('[name="months"]').forEach(cb => {
        cb.checked = schedule.months.includes(parseInt(cb.value));
      });
    }

    document.getElementById('schedule-modal').classList.remove('hidden');
  },

  async deleteSchedule(id) {
    if (!confirm('Bu periyodu silmek istediğinizden emin misiniz?')) return;

    try {
      await supabaseClient.getClient()
        .from('maintenance_schedules')
        .delete()
        .eq('id', id);

      alert('Periyot silindi!');
      await this.render('main-content');

      // Ask to regenerate calendar
      document.getElementById('regenerate-modal').classList.remove('hidden');
    } catch (error) {
      alert('Silme hatası: ' + error.message);
    }
  },

  async handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const frequency = formData.get('frequency');
    let months = [];

    if (frequency !== 'weekly') {
      const checkedMonths = Array.from(document.querySelectorAll('[name="months"]:checked'));
      if (checkedMonths.length === 0) {
        alert('Lütfen en az bir ay seçin!');
        return;
      }
      months = checkedMonths.map(cb => parseInt(cb.value));
    }

    const data = {
      machine_id: formData.get('machine_id'),
      maintenance_type: formData.get('maintenance_type'),
      frequency: frequency,
      months: months,
      is_active: true
    };

    try {
      const scheduleId = formData.get('id');

      if (scheduleId) {
        // Update
        await supabaseClient.getClient()
          .from('maintenance_schedules')
          .update(data)
          .eq('id', scheduleId);
        alert('Periyot güncellendi!');
      } else {
        // Insert
        await supabaseClient.getClient()
          .from('maintenance_schedules')
          .insert([data]);
        alert('Periyot eklendi!');
      }

      this.closeModal();
      await this.render('main-content');

      // Ask to regenerate calendar
      document.getElementById('regenerate-modal').classList.remove('hidden');
    } catch (error) {
      alert('Kayıt hatası: ' + error.message);
    }
  },

  async regenerateCalendar() {
    const checkedYears = Array.from(document.querySelectorAll('[name="regen-year"]:checked'))
      .map(cb => parseInt(cb.value));

    if (checkedYears.length === 0) {
      alert('Lütfen en az bir yıl seçin!');
      return;
    }

    try {
      for (const year of checkedYears) {
        // Delete existing calendar events for that year
        await supabaseClient.getClient()
          .from('maintenance_calendar')
          .delete()
          .eq('year', year);

        // Call the SQL function to regenerate
        await supabaseClient.getClient()
          .rpc('generate_maintenance_calendar', { p_year: year });
      }

      alert(`${checkedYears.join(', ')} yılları için takvim başarıyla yeniden oluşturuldu!`);
      this.closeRegenerateModal();
    } catch (error) {
      alert('Takvim oluşturma hatası: ' + error.message);
    }
  },

  closeModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
  },

  closeRegenerateModal() {
    document.getElementById('regenerate-modal').classList.add('hidden');
  },

  attachEventListeners() {
    // Already handled by inline onclick handlers
  },

  cleanup() {
    this.schedules = [];
    this.machines = [];
    this.editingId = null;
  }
};

window.SchedulesView = SchedulesView;
