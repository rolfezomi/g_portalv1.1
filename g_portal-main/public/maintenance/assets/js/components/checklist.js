/**
 * Glohe Bakım Yönetim Sistemi - Checklist Component
 * Dinamik bakım checklist bileşeni
 */

const ChecklistComponent = {
  /**
   * Checklist render et
   */
  render(containerId, items, results = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Checklist container not found:', containerId);
      return;
    }

    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = '<p class="no-data">Checklist tanımlanmamış.</p>';
      return;
    }

    const checklistHTML = items.map((item, index) => {
      return this.renderItem(item, index, results[item.id]);
    }).join('');

    container.innerHTML = `<div class="checklist">${checklistHTML}</div>`;

    // Event listeners ekle
    this.attachEventListeners(containerId);
  },

  /**
   * Tek bir checklist item'ı render et
   */
  renderItem(item, index, value = null) {
    const required = item.required ? '<span class="required">*</span>' : '';
    const itemId = `checklist-item-${item.id}`;

    let inputHTML = '';

    switch (item.type) {
      case 'checkbox':
        inputHTML = `
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="${itemId}"
              data-item-id="${item.id}"
              ${value === true || value === 'true' ? 'checked' : ''}
            >
            <span class="checkbox-text">${item.label}${required}</span>
          </label>
        `;
        break;

      case 'radio':
        inputHTML = `
          <div class="radio-group">
            <label class="radio-group-label">${item.label}${required}</label>
            ${(item.options || []).map(option => `
              <label class="radio-label">
                <input
                  type="radio"
                  name="${itemId}"
                  value="${option}"
                  data-item-id="${item.id}"
                  ${value === option ? 'checked' : ''}
                >
                <span>${option}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'text':
        inputHTML = `
          <label class="text-label">
            <span>${item.label}${required}</span>
            <input
              type="text"
              name="${itemId}"
              data-item-id="${item.id}"
              placeholder="${item.placeholder || ''}"
              value="${value || ''}"
              class="text-input"
            >
          </label>
        `;
        break;

      case 'number':
        inputHTML = `
          <label class="text-label">
            <span>${item.label}${required}</span>
            <input
              type="number"
              name="${itemId}"
              data-item-id="${item.id}"
              placeholder="${item.placeholder || ''}"
              value="${value || ''}"
              min="${item.min || 0}"
              max="${item.max || ''}"
              class="text-input"
            >
          </label>
        `;
        break;

      case 'textarea':
        inputHTML = `
          <label class="textarea-label">
            <span>${item.label}${required}</span>
            <textarea
              name="${itemId}"
              data-item-id="${item.id}"
              placeholder="${item.placeholder || ''}"
              class="textarea-input"
              rows="3"
            >${value || ''}</textarea>
          </label>
        `;
        break;

      case 'select':
        inputHTML = `
          <label class="select-label">
            <span>${item.label}${required}</span>
            <select
              name="${itemId}"
              data-item-id="${item.id}"
              class="select-input"
            >
              <option value="">Seçiniz...</option>
              ${(item.options || []).map(option => `
                <option value="${option}" ${value === option ? 'selected' : ''}>
                  ${option}
                </option>
              `).join('')}
            </select>
          </label>
        `;
        break;

      default:
        inputHTML = `<p>Desteklenmeyen item tipi: ${item.type}</p>`;
    }

    return `
      <div class="checklist-item ${item.required ? 'required-item' : ''}" data-item-id="${item.id}">
        ${inputHTML}
      </div>
    `;
  },

  /**
   * Event listeners ekle
   */
  attachEventListeners(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Checkbox değişikliklerini dinle
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleChange(e.target);
      });
    });

    // Radio değişikliklerini dinle
    container.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleChange(e.target);
      });
    });

    // Text input değişikliklerini dinle
    container.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(input => {
      input.addEventListener('input', (e) => {
        this.handleChange(e.target);
      });
    });
  },

  /**
   * Input değişikliğini işle
   */
  handleChange(input) {
    const itemId = input.dataset.itemId;
    if (!itemId) return;

    // Required validation
    const item = input.closest('.checklist-item');
    if (item && item.classList.contains('required-item')) {
      const isValid = this.validateItem(input);
      if (isValid) {
        item.classList.remove('invalid');
      } else {
        item.classList.add('invalid');
      }
    }

    // Custom event dispatch (form submit için)
    const event = new CustomEvent('checklistChange', {
      detail: {
        itemId: itemId,
        value: this.getInputValue(input)
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Input değerini al
   */
  getInputValue(input) {
    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      const name = input.name;
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    } else {
      return input.value;
    }
  },

  /**
   * Item validasyonu
   */
  validateItem(input) {
    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      const name = input.name;
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked !== null;
    } else {
      return input.value.trim() !== '';
    }
  },

  /**
   * Tüm checklist sonuçlarını al
   */
  getResults(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};

    const results = {};

    container.querySelectorAll('[data-item-id]').forEach(input => {
      const itemId = input.dataset.itemId;
      if (!itemId) return;

      const value = this.getInputValue(input);
      if (value !== null && value !== undefined) {
        results[itemId] = value;
      }
    });

    return results;
  },

  /**
   * Checklist validasyonu
   */
  validate(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { valid: true, errors: [] };

    const errors = [];
    let isValid = true;

    container.querySelectorAll('.required-item').forEach(item => {
      const input = item.querySelector('[data-item-id]');
      if (!input) return;

      const valid = this.validateItem(input);
      if (!valid) {
        isValid = false;
        const label = item.querySelector('label, .radio-group-label')?.textContent || 'Alan';
        errors.push(`${label.replace('*', '').trim()} zorunludur`);
        item.classList.add('invalid');
      } else {
        item.classList.remove('invalid');
      }
    });

    return {
      valid: isValid,
      errors: errors
    };
  },

  /**
   * Checklist'i temizle
   */
  clear(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });

    container.querySelectorAll('input[type="radio"]').forEach(input => {
      input.checked = false;
    });

    container.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(input => {
      input.value = '';
    });

    container.querySelectorAll('.invalid').forEach(item => {
      item.classList.remove('invalid');
    });
  },

  /**
   * Checklist'i devre dışı bırak (completed bakımlar için)
   */
  disable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('input, textarea, select').forEach(input => {
      input.disabled = true;
    });
  },

  /**
   * Checklist'i aktif et
   */
  enable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('input, textarea, select').forEach(input => {
      input.disabled = false;
    });
  },

  /**
   * Checklist sonuçlarını göster (readonly)
   */
  renderResults(containerId, items, results) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = '<p class="no-data">Checklist sonuçları bulunamadı.</p>';
      return;
    }

    let html = '<div class="checklist-results">';

    items.forEach(item => {
      const result = results[item.id];
      let valueDisplay = '-';

      if (item.type === 'checkbox') {
        valueDisplay = result ? '✅ Evet' : '❌ Hayır';
      } else if (result !== null && result !== undefined) {
        valueDisplay = result;
      }

      html += `
        <div class="checklist-result-item">
          <span class="result-label">${item.label}:</span>
          <span class="result-value">${valueDisplay}</span>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }
};

// Global'e bağla
window.ChecklistComponent = ChecklistComponent;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChecklistComponent;
}
