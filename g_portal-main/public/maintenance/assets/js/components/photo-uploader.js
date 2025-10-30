/**
 * Glohe Bakım Yönetim Sistemi - Photo Uploader Component
 * Drag & Drop fotoğraf yükleme bileşeni
 */

const PhotoUploader = {
  dropzones: {},

  /**
   * Photo uploader oluştur
   */
  create(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Photo uploader container not found:', containerId);
      return null;
    }

    const config = {
      maxFiles: options.maxFiles || CONFIG.PHOTO_UPLOAD.MAX_FILES,
      maxSize: options.maxSize || CONFIG.PHOTO_UPLOAD.MAX_SIZE_BYTES,
      acceptedTypes: options.acceptedTypes || CONFIG.PHOTO_UPLOAD.ALLOWED_TYPES,
      onUpload: options.onUpload || null,
      onRemove: options.onRemove || null,
      existingPhotos: options.existingPhotos || []
    };

    // HTML oluştur
    container.innerHTML = `
      <div class="photo-uploader">
        <div class="upload-area" id="${containerId}-dropzone">
          <div class="upload-icon">📸</div>
          <p class="upload-text">Fotoğrafları buraya sürükleyin veya tıklayın</p>
          <p class="upload-hint">En fazla ${config.maxFiles} fotoğraf, maksimum ${Math.floor(config.maxSize / (1024 * 1024))}MB</p>
          <input
            type="file"
            id="${containerId}-file-input"
            accept="image/*"
            multiple
            style="display: none;"
          >
        </div>
        <div class="photo-previews" id="${containerId}-previews"></div>
      </div>
    `;

    // Mevcut fotoğrafları göster
    if (config.existingPhotos.length > 0) {
      this.renderExistingPhotos(containerId, config.existingPhotos);
    }

    // Event listeners ekle
    this.attachEventListeners(containerId, config);

    // Store config
    this.dropzones[containerId] = {
      config: config,
      files: [],
      uploadedUrls: [...config.existingPhotos]
    };

    return this.dropzones[containerId];
  },

  /**
   * Event listeners ekle
   */
  attachEventListeners(containerId, config) {
    const dropzone = document.getElementById(`${containerId}-dropzone`);
    const fileInput = document.getElementById(`${containerId}-file-input`);

    if (!dropzone || !fileInput) return;

    // Click to upload
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(containerId, e.target.files);
    });

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      this.handleFiles(containerId, e.dataTransfer.files);
    });
  },

  /**
   * Dosyaları işle
   */
  handleFiles(containerId, fileList) {
    const dropzoneData = this.dropzones[containerId];
    if (!dropzoneData) return;

    const { config, files } = dropzoneData;
    const newFiles = Array.from(fileList);

    // Dosya sayısı kontrolü
    const totalFiles = files.length + newFiles.length + dropzoneData.uploadedUrls.length;
    if (totalFiles > config.maxFiles) {
      alert(`En fazla ${config.maxFiles} fotoğraf yükleyebilirsiniz!`);
      return;
    }

    // Her dosyayı validate et ve ekle
    newFiles.forEach(file => {
      const validation = this.validateFile(file, config);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      // Preview oluştur
      this.addPreview(containerId, file);

      // Dosyayı listeye ekle
      dropzoneData.files.push(file);
    });
  },

  /**
   * Dosya validasyonu
   */
  validateFile(file, config) {
    // Boyut kontrolü
    if (file.size > config.maxSize) {
      return {
        valid: false,
        message: `${file.name} çok büyük! Maksimum ${Math.floor(config.maxSize / (1024 * 1024))}MB`
      };
    }

    // Tip kontrolü
    if (!config.acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `${file.name} desteklenmeyen format!`
      };
    }

    return { valid: true };
  },

  /**
   * Preview ekle
   */
  addPreview(containerId, file) {
    const previewsContainer = document.getElementById(`${containerId}-previews`);
    if (!previewsContainer) return;

    const reader = new FileReader();
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    reader.onload = (e) => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'photo-preview';
      previewDiv.id = previewId;
      previewDiv.dataset.filename = file.name;

      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <div class="preview-overlay">
          <button class="remove-btn" onclick="PhotoUploader.removeFile('${containerId}', '${previewId}', '${file.name}')">
            ✕
          </button>
        </div>
        <div class="preview-info">
          <span class="filename">${file.name}</span>
          <span class="filesize">${this.formatFileSize(file.size)}</span>
        </div>
      `;

      previewsContainer.appendChild(previewDiv);
    };

    reader.readAsDataURL(file);
  },

  /**
   * Mevcut fotoğrafları render et
   */
  renderExistingPhotos(containerId, photos) {
    const previewsContainer = document.getElementById(`${containerId}-previews`);
    if (!previewsContainer) return;

    photos.forEach((url, index) => {
      const previewId = `existing-${index}`;
      const previewDiv = document.createElement('div');
      previewDiv.className = 'photo-preview existing';
      previewDiv.id = previewId;
      previewDiv.dataset.url = url;

      previewDiv.innerHTML = `
        <img src="${url}" alt="Mevcut fotoğraf ${index + 1}">
        <div class="preview-overlay">
          <button class="remove-btn" onclick="PhotoUploader.removeExisting('${containerId}', '${previewId}', '${url}')">
            ✕
          </button>
        </div>
        <div class="preview-badge">Mevcut</div>
      `;

      previewsContainer.appendChild(previewDiv);
    });
  },

  /**
   * Dosya kaldır
   */
  removeFile(containerId, previewId, filename) {
    const dropzoneData = this.dropzones[containerId];
    if (!dropzoneData) return;

    // Preview'ı DOM'dan kaldır
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.remove();
    }

    // Dosyayı listeden kaldır
    dropzoneData.files = dropzoneData.files.filter(f => f.name !== filename);

    console.log('File removed:', filename);
  },

  /**
   * Mevcut fotoğrafı kaldır
   */
  removeExisting(containerId, previewId, url) {
    const dropzoneData = this.dropzones[containerId];
    if (!dropzoneData) return;

    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
      return;
    }

    // Preview'ı DOM'dan kaldır
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.remove();
    }

    // URL'i listeden kaldır
    dropzoneData.uploadedUrls = dropzoneData.uploadedUrls.filter(u => u !== url);

    // Callback çağır
    if (dropzoneData.config.onRemove) {
      dropzoneData.config.onRemove(url);
    }

    console.log('Existing photo removed:', url);
  },

  /**
   * Tüm dosyaları yükle
   */
  async uploadAll(containerId, maintenanceRecordId) {
    const dropzoneData = this.dropzones[containerId];
    if (!dropzoneData) {
      throw new Error('Dropzone not found');
    }

    const { files, config } = dropzoneData;

    if (files.length === 0) {
      return dropzoneData.uploadedUrls; // Sadece mevcut URL'leri döndür
    }

    try {
      // Her dosyayı yükle
      const uploadPromises = files.map(file =>
        supabaseClient.uploadPhoto(file, maintenanceRecordId)
      );

      const results = await Promise.all(uploadPromises);

      // URL'leri topla
      const newUrls = results.map(r => r.url);
      dropzoneData.uploadedUrls.push(...newUrls);

      // Yüklenen dosyaları temizle
      dropzoneData.files = [];

      // Callback çağır
      if (config.onUpload) {
        config.onUpload(newUrls);
      }

      console.log('All photos uploaded:', newUrls);
      return dropzoneData.uploadedUrls;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  },

  /**
   * Tüm URL'leri al
   */
  getUrls(containerId) {
    const dropzoneData = this.dropzones[containerId];
    return dropzoneData ? dropzoneData.uploadedUrls : [];
  },

  /**
   * Bekleyen dosya sayısı
   */
  getPendingCount(containerId) {
    const dropzoneData = this.dropzones[containerId];
    return dropzoneData ? dropzoneData.files.length : 0;
  },

  /**
   * Tümünü temizle
   */
  clear(containerId) {
    const dropzoneData = this.dropzones[containerId];
    if (!dropzoneData) return;

    dropzoneData.files = [];
    dropzoneData.uploadedUrls = [];

    const previewsContainer = document.getElementById(`${containerId}-previews`);
    if (previewsContainer) {
      previewsContainer.innerHTML = '';
    }

    const fileInput = document.getElementById(`${containerId}-file-input`);
    if (fileInput) {
      fileInput.value = '';
    }
  },

  /**
   * Dosya boyutunu formatla
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Destroy
   */
  destroy(containerId) {
    if (this.dropzones[containerId]) {
      delete this.dropzones[containerId];
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
};

// Global'e bağla
window.PhotoUploader = PhotoUploader;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoUploader;
}
