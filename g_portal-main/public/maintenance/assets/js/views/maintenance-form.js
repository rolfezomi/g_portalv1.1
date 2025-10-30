/**
 * Glohe Bakım Yönetim Sistemi - Maintenance Form View
 * Bakım kaydı oluşturma/düzenleme formu
 */

const MaintenanceFormView = {
  record: null,
  recordId: null,
  checklistTemplate: null,

  async render(containerId, recordId = null) {
    this.recordId = recordId;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner">Form yükleniyor...</div>';

    try {
      // Load data
      if (recordId) {
        const records = await supabaseClient.getMaintenanceRecords({ id: recordId });
        this.record = records[0];
      }

      this.checklistTemplate = await supabaseClient.getDefaultChecklistTemplate();

      container.innerHTML = this.getHTML();
      this.initForm();
    } catch (error) {
      container.innerHTML = `<div class="error-message">Form yükleme hatası: ${error.message}</div>`;
    }
  },

  getHTML() {
    const isEdit = !!this.record;
    const isCompleted = this.record?.status === 'completed';

    return `
      <div class="maintenance-form-view">
        <div class="form-header">
          <h1>${isEdit ? 'Bakım Kaydı Düzenle' : 'Yeni Bakım Kaydı'}</h1>
          <button class="btn btn-secondary" onclick="history.back()">
            ← Geri
          </button>
        </div>

        <form id="maintenance-form" class="maintenance-form">
          <div class="form-section">
            <h2>Temel Bilgiler</h2>
            <div class="form-row">
              <div class="form-field">
                <label>Makine *</label>
                <select id="machine-select" name="machine_id" required ${isCompleted ? 'disabled' : ''}>
                  <option value="">Seçiniz...</option>
                </select>
              </div>
              <div class="form-field">
                <label>Bakım Tipi *</label>
                <input type="text" name="maintenance_type" value="${this.record?.maintenance_type || ''}" required ${isCompleted ? 'disabled' : ''}>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Planlanan Tarih *</label>
                <input type="date" name="scheduled_date" value="${DateUtils.toInputDate(this.record?.scheduled_date || new Date())}" required ${isCompleted ? 'disabled' : ''}>
              </div>
              <div class="form-field">
                <label>Durum</label>
                <select name="status" ${isCompleted ? 'disabled' : ''}>
                  ${Object.values(CONFIG.STATUS).map(s => `
                    <option value="${s.value}" ${this.record?.status === s.value ? 'selected' : ''}>${s.label}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="form-field">
              <label>Notlar</label>
              <textarea name="notes" rows="3" ${isCompleted ? 'disabled' : ''}>${this.record?.notes || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h2>Kontrol Listesi</h2>
            <div id="checklist-container"></div>
          </div>

          <div class="form-section">
            <h2>Fotoğraflar</h2>
            <div id="photo-uploader-container"></div>
          </div>

          ${!isCompleted ? `
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="history.back()">
                İptal
              </button>
              <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          ` : ''}
        </form>
      </div>
    `;
  },

  async initForm() {
    // Load machines
    const machines = await supabaseClient.getMachines();
    const machineSelect = document.getElementById('machine-select');
    machines.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = `${m.machine_no} - ${m.machine_name}`;
      if (this.record?.machine_id === m.id) option.selected = true;
      machineSelect.appendChild(option);
    });

    // Render checklist
    if (this.checklistTemplate) {
      ChecklistComponent.render(
        'checklist-container',
        this.checklistTemplate.items,
        this.record?.checklist_results || {}
      );

      if (this.record?.status === 'completed') {
        ChecklistComponent.disable('checklist-container');
      }
    }

    // Init photo uploader
    if (this.record?.status !== 'completed') {
      PhotoUploader.create('photo-uploader-container', {
        existingPhotos: this.record?.photos || []
      });
    } else {
      // Show existing photos only
      const container = document.getElementById('photo-uploader-container');
      if (this.record?.photos && this.record.photos.length > 0) {
        container.innerHTML = `
          <div class="photo-grid">
            ${this.record.photos.map(url => `
              <img src="${url}" class="photo-item" onclick="window.open('${url}', '_blank')">
            `).join('')}
          </div>
        `;
      } else {
        container.innerHTML = '<p class="text-muted">Fotoğraf yüklenmemiş.</p>';
      }
    }

    // Form submit
    document.getElementById('maintenance-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  },

  async handleSubmit() {
    try {
      // Validate checklist
      const checklistValidation = ChecklistComponent.validate('checklist-container');
      if (!checklistValidation.valid) {
        alert('Lütfen tüm zorunlu alanları doldurun:\n' + checklistValidation.errors.join('\n'));
        return;
      }

      // Get form data
      const formData = new FormData(document.getElementById('maintenance-form'));
      const data = {
        machine_id: formData.get('machine_id'),
        maintenance_type: formData.get('maintenance_type'),
        scheduled_date: formData.get('scheduled_date'),
        status: formData.get('status'),
        notes: formData.get('notes'),
        checklist_results: ChecklistComponent.getResults('checklist-container'),
        performed_by: authManager.getCurrentUserId(),
        completed_date: formData.get('status') === 'completed' ? new Date().toISOString() : null
      };

      // Upload photos
      const photoUrls = await PhotoUploader.uploadAll('photo-uploader-container', this.recordId || 'temp');
      data.photos = photoUrls;

      // Save
      if (this.recordId) {
        await supabaseClient.updateMaintenanceRecord(this.recordId, data);
        alert('Bakım kaydı güncellendi!');
      } else {
        await supabaseClient.createMaintenanceRecord(data);
        alert('Bakım kaydı oluşturuldu!');
      }

      App.showView('pending-tasks');
    } catch (error) {
      alert('Kayıt hatası: ' + error.message);
    }
  },

  cleanup() {
    this.record = null;
    this.recordId = null;
  }
};

window.MaintenanceFormView = MaintenanceFormView;
