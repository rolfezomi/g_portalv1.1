/**
 * Glohe Bakım Yönetim Sistemi - Calendar View
 * FullCalendar.js ile interaktif bakım takvimi
 */

const CalendarView = {
  calendar: null,
  currentYear: new Date().getFullYear(),

  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="calendar-view">
        <div class="calendar-header">
          <h1>Bakım Takvimi</h1>
          <div class="calendar-controls">
            <select id="year-selector" class="select-input">
              ${this.getYearOptions()}
            </select>
            <button class="btn btn-secondary" onclick="CalendarView.exportCalendar()">
              📥 Excel İndir
            </button>
          </div>
        </div>

        <div id="calendar-container"></div>

        <!-- Event Detail Modal -->
        <div id="event-modal" class="modal hidden">
          <div class="modal-overlay" onclick="CalendarView.closeModal()"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="event-modal-title">Bakım Detayı</h2>
              <button class="modal-close-btn" onclick="CalendarView.closeModal()">✕</button>
            </div>
            <div id="event-modal-body" class="modal-body"></div>
          </div>
        </div>
      </div>
    `;

    await this.initCalendar();
    this.attachEventListeners();
  },

  async initCalendar() {
    const calendarEl = document.getElementById('calendar-container');
    if (!calendarEl) return;

    // Load events
    const events = await supabaseClient.getYearCalendar(this.currentYear);

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      ...CONFIG.FULLCALENDAR_LOCALE,
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: events,
      eventClick: (info) => {
        this.showEventDetail(info.event);
      },
      height: 'auto'
    });

    this.calendar.render();
  },

  showEventDetail(event) {
    const props = event.extendedProps;
    const modal = document.getElementById('event-modal');
    const modalBody = document.getElementById('event-modal-body');

    modalBody.innerHTML = `
      <div class="event-detail">
        <p><strong>Makine:</strong> ${props.machine?.machine_no} - ${props.machine?.machine_name}</p>
        <p><strong>Bakım Tipi:</strong> ${props.maintenance_type}</p>
        <p><strong>Tarih:</strong> ${DateUtils.formatDate(props.scheduled_date)}</p>
        <p><strong>Saat:</strong> ${DateUtils.formatTime(props.scheduled_time)}</p>
        <p><strong>Durum:</strong> <span class="status-badge status-${props.status}">${CONFIG.STATUS[props.status.toUpperCase()]?.label}</span></p>
        <p><strong>Frekans:</strong> ${CONFIG.FREQUENCY[props.frequency.toUpperCase()]?.label}</p>
        ${props.notes ? `<p><strong>Notlar:</strong> ${props.notes}</p>` : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="App.showMaintenanceForm('${props.id}')">
          Bakımı Gerçekleştir
        </button>
        <button class="btn btn-secondary" onclick="CalendarView.closeModal()">
          Kapat
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('event-modal').classList.add('hidden');
  },

  attachEventListeners() {
    document.getElementById('year-selector').addEventListener('change', async (e) => {
      this.currentYear = parseInt(e.target.value);

      // Show loading
      const calendarEl = document.getElementById('calendar-container');
      calendarEl.innerHTML = '<div class="loading-spinner" style="padding: 40px; text-align: center;">Takvim yükleniyor...</div>';

      try {
        // Destroy existing calendar
        if (this.calendar) {
          this.calendar.destroy();
          this.calendar = null;
        }

        // Reinitialize calendar with new year
        await this.initCalendar();

        console.log(`✅ Takvim ${this.currentYear} yılına güncellendi`);
      } catch (error) {
        console.error('Takvim güncelleme hatası:', error);
        alert('Takvim yüklenirken hata oluştu: ' + error.message);
      }
    });
  },

  getYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '';
    for (let year = currentYear - 1; year <= currentYear + 3; year++) {
      options += `<option value="${year}" ${year === this.currentYear ? 'selected' : ''}>${year}</option>`;
    }
    return options;
  },

  async exportCalendar() {
    try {
      const events = await supabaseClient.getYearCalendar(this.currentYear);
      await ExportUtils.exportCalendarToExcel(events, this.currentYear);
      alert('Takvim başarıyla Excel\'e aktarıldı!');
    } catch (error) {
      alert('Export hatası: ' + error.message);
    }
  },

  cleanup() {
    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }
  }
};

window.CalendarView = CalendarView;
