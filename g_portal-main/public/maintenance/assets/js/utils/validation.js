/**
 * Glohe Bakım Yönetim Sistemi - Validation Utilities
 * Form validation ve veri doğrulama yardımcı fonksiyonları
 */

const Validation = {
  /**
   * Boş mu kontrol et
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
  },

  /**
   * Zorunlu alan kontrolü
   */
  required(value, fieldName = 'Alan') {
    if (this.isEmpty(value)) {
      return {
        valid: false,
        message: `${fieldName} zorunludur`
      };
    }
    return { valid: true };
  },

  /**
   * Email format kontrolü
   */
  email(value) {
    if (this.isEmpty(value)) {
      return { valid: true }; // Boş ise valid (required ile kullan)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        valid: false,
        message: 'Geçerli bir email adresi giriniz'
      };
    }

    return { valid: true };
  },

  /**
   * Minimum uzunluk kontrolü
   */
  minLength(value, min, fieldName = 'Alan') {
    if (this.isEmpty(value)) {
      return { valid: true }; // Boş ise valid (required ile kullan)
    }

    if (value.length < min) {
      return {
        valid: false,
        message: `${fieldName} en az ${min} karakter olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Maximum uzunluk kontrolü
   */
  maxLength(value, max, fieldName = 'Alan') {
    if (this.isEmpty(value)) {
      return { valid: true };
    }

    if (value.length > max) {
      return {
        valid: false,
        message: `${fieldName} en fazla ${max} karakter olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Sayı formatı kontrolü
   */
  number(value, fieldName = 'Alan') {
    if (this.isEmpty(value)) {
      return { valid: true };
    }

    if (isNaN(value) || isNaN(parseFloat(value))) {
      return {
        valid: false,
        message: `${fieldName} sayı olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Pozitif sayı kontrolü
   */
  positiveNumber(value, fieldName = 'Alan') {
    const numberCheck = this.number(value, fieldName);
    if (!numberCheck.valid) return numberCheck;

    if (parseFloat(value) < 0) {
      return {
        valid: false,
        message: `${fieldName} pozitif bir sayı olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Tarih format kontrolü
   */
  date(value, fieldName = 'Tarih') {
    if (this.isEmpty(value)) {
      return { valid: true };
    }

    if (!DateUtils.isValidDate(value)) {
      return {
        valid: false,
        message: `${fieldName} geçerli bir tarih olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Gelecek tarih kontrolü
   */
  futureDate(value, fieldName = 'Tarih') {
    const dateCheck = this.date(value, fieldName);
    if (!dateCheck.valid) return dateCheck;

    if (!DateUtils.isFuture(value)) {
      return {
        valid: false,
        message: `${fieldName} gelecekte bir tarih olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Tarih aralığı kontrolü
   */
  dateRange(startDate, endDate) {
    if (this.isEmpty(startDate) || this.isEmpty(endDate)) {
      return { valid: true };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return {
        valid: false,
        message: 'Bitiş tarihi başlangıç tarihinden önce olamaz'
      };
    }

    return { valid: true };
  },

  /**
   * Dosya boyutu kontrolü
   */
  fileSize(file, maxSizeMB = CONFIG.PHOTO_UPLOAD.MAX_SIZE_MB) {
    if (!file) {
      return { valid: true };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      return {
        valid: false,
        message: `Dosya boyutu en fazla ${maxSizeMB}MB olmalıdır`
      };
    }

    return { valid: true };
  },

  /**
   * Dosya tipi kontrolü
   */
  fileType(file, allowedTypes = CONFIG.PHOTO_UPLOAD.ALLOWED_TYPES) {
    if (!file) {
      return { valid: true };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Desteklenmeyen dosya tipi'
      };
    }

    return { valid: true };
  },

  /**
   * Dosya uzantısı kontrolü
   */
  fileExtension(filename, allowedExtensions = CONFIG.PHOTO_UPLOAD.ALLOWED_EXTENSIONS) {
    if (!filename) {
      return { valid: true };
    }

    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        message: `İzin verilen formatlar: ${allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  },

  /**
   * Çoklu dosya kontrolü
   */
  multipleFiles(files, maxFiles = CONFIG.PHOTO_UPLOAD.MAX_FILES) {
    if (!files || files.length === 0) {
      return { valid: true };
    }

    if (files.length > maxFiles) {
      return {
        valid: false,
        message: `En fazla ${maxFiles} dosya yükleyebilirsiniz`
      };
    }

    return { valid: true };
  },

  /**
   * Form validasyonu
   */
  validateForm(formData, rules) {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = formData[field];

      fieldRules.forEach(rule => {
        const result = this[rule.type](value, ...(rule.params || []), rule.message || field);

        if (!result.valid) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(result.message);
          isValid = false;
        }
      });
    });

    return {
      valid: isValid,
      errors
    };
  },

  /**
   * Form alanlarını temizle ve validate et
   */
  sanitizeAndValidate(formData, rules) {
    // Önce sanitize et
    const sanitized = {};
    Object.keys(formData).forEach(key => {
      const value = formData[key];

      if (typeof value === 'string') {
        // XSS koruması: HTML karakterlerini escape et
        sanitized[key] = this.escapeHtml(value.trim());
      } else {
        sanitized[key] = value;
      }
    });

    // Sonra validate et
    const validation = this.validateForm(sanitized, rules);

    return {
      ...validation,
      data: sanitized
    };
  },

  /**
   * HTML karakterlerini escape et (XSS koruması)
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Hata mesajlarını göster
   */
  displayErrors(errors, containerId = 'form-errors') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (Object.keys(errors).length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const errorList = document.createElement('ul');
    errorList.className = 'error-list';

    Object.values(errors).forEach(fieldErrors => {
      fieldErrors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
      });
    });

    container.appendChild(errorList);
  },

  /**
   * Form alanlarına hata class'ları ekle
   */
  markInvalidFields(errors) {
    // Önce tüm hataları temizle
    document.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
    });

    // Hatalı alanları işaretle
    Object.keys(errors).forEach(fieldName => {
      const field = document.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.classList.add('invalid');

        // Focus ilk hatalı alana
        if (!document.querySelector('.invalid:focus')) {
          field.focus();
        }
      }
    });
  },

  /**
   * Başarı mesajı göster
   */
  showSuccess(message, containerId = 'form-message') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="success-message">${message}</div>`;
    container.style.display = 'block';

    // 3 saniye sonra kapat
    setTimeout(() => {
      container.style.display = 'none';
      container.innerHTML = '';
    }, 3000);
  },

  /**
   * Hata mesajı göster
   */
  showError(message, containerId = 'form-message') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="error-message">${message}</div>`;
    container.style.display = 'block';
  },

  /**
   * Tüm mesajları temizle
   */
  clearMessages(containerId = 'form-message') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }
};

// Global'e bağla
window.Validation = Validation;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validation;
}
