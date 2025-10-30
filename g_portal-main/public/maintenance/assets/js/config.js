/**
 * Glohe Bakım Yönetim Sistemi - Konfigürasyon
 * Tüm uygulama sabitleri ve ayarları
 */

const CONFIG = {
  // Supabase
  SUPABASE: {
    URL: 'https://mignlffeyougoefuyayr.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzM4NDUsImV4cCI6MjA3NDcwOTg0NX0.WOvAMx4L3IzovJILgwCG7lRZeHhvOl_n7J1LR5A8SX0',
    STORAGE_BUCKET: 'maintenance-photos'
  },

  // Fotoğraf yükleme ayarları
  PHOTO_UPLOAD: {
    MAX_FILES: 2,
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },

  // Bakım durumları
  STATUS: {
    SCHEDULED: {
      value: 'scheduled',
      label: 'Planlandı',
      color: '#3b82f6', // blue
      icon: '📅'
    },
    PENDING: {
      value: 'pending',
      label: 'Bekliyor',
      color: '#eab308', // yellow
      icon: '⏳'
    },
    IN_PROGRESS: {
      value: 'in_progress',
      label: 'Devam Ediyor',
      color: '#f97316', // orange
      icon: '⚙️'
    },
    COMPLETED: {
      value: 'completed',
      label: 'Tamamlandı',
      color: '#22c55e', // green
      icon: '✅'
    },
    OVERDUE: {
      value: 'overdue',
      label: 'Gecikmiş',
      color: '#ef4444', // red
      icon: '⚠️'
    },
    CANCELLED: {
      value: 'cancelled',
      label: 'İptal Edildi',
      color: '#6b7280', // gray
      icon: '❌'
    }
  },

  // Öncelik seviyeleri
  PRIORITY: {
    NORMAL: {
      value: 0,
      label: 'Normal',
      color: '#64748b'
    },
    HIGH: {
      value: 1,
      label: 'Yüksek',
      color: '#f97316'
    },
    URGENT: {
      value: 2,
      label: 'Acil',
      color: '#ef4444'
    }
  },

  // Bakım frekansları
  FREQUENCY: {
    WEEKLY: {
      value: 'weekly',
      label: 'Haftalık',
      icon: '📆'
    },
    MONTHLY: {
      value: 'monthly',
      label: 'Aylık',
      icon: '📅'
    },
    QUARTERLY: {
      value: 'quarterly',
      label: '3 Aylık',
      icon: '📊'
    },
    SEMI_ANNUAL: {
      value: 'semi-annual',
      label: '6 Aylık',
      icon: '📈'
    },
    ANNUAL: {
      value: 'annual',
      label: 'Yıllık',
      icon: '📋'
    }
  },

  // Türkçe ay isimleri
  MONTHS_TR: {
    1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
    5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
    9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
  },

  // Türkçe gün isimleri
  DAYS_TR: {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
    7: 'Pazar'
  },

  // Türkçe gün kısaltmaları
  DAYS_SHORT_TR: {
    1: 'Pzt',
    2: 'Sal',
    3: 'Çar',
    4: 'Per',
    5: 'Cum',
    6: 'Cmt',
    7: 'Paz'
  },

  // Filtre seçenekleri
  FILTERS: {
    TODAY: {
      value: 'today',
      label: 'Bugün',
      icon: '📍'
    },
    NEXT_7_DAYS: {
      value: 'next_7_days',
      label: 'Sonraki 7 Gün',
      icon: '📅'
    },
    THIS_MONTH: {
      value: 'this_month',
      label: 'Bu Ay',
      icon: '📆'
    },
    OVERDUE: {
      value: 'overdue',
      label: 'Gecikmiş',
      icon: '⚠️'
    },
    ALL: {
      value: 'all',
      label: 'Tümü',
      icon: '📋'
    }
  },

  // Makine kategorileri
  MACHINE_CATEGORIES: {
    UK: {
      value: 'ÜK',
      label: 'Üretim',
      color: '#3b82f6'
    },
    TD: {
      value: 'TD',
      label: 'Teknik Destek',
      color: '#8b5cf6'
    },
    UT: {
      value: 'ÜT',
      label: 'Üretim Teknik',
      color: '#06b6d4'
    },
    NA: {
      value: 'NA',
      label: 'Genel Alan',
      color: '#10b981'
    }
  },

  // Tablo pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  },

  // Chart renkleri
  CHART_COLORS: {
    PRIMARY: '#667eea',
    SECONDARY: '#764ba2',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#3b82f6',
    LIGHT: '#f3f4f6',
    DARK: '#1f2937'
  },

  // API ayarları
  API: {
    TIMEOUT: 30000, // 30 saniye
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 saniye
  },

  // Local storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'glohe_auth_token',
    USER_DATA: 'glohe_user_data',
    THEME: 'glohe_theme',
    LAST_VIEW: 'glohe_last_view',
    TABLE_FILTERS: 'glohe_table_filters',
    CALENDAR_YEAR: 'glohe_calendar_year'
  },

  // View isimleri
  VIEWS: {
    DASHBOARD: 'dashboard',
    CALENDAR: 'calendar',
    PENDING_TASKS: 'pending-tasks',
    MACHINE_DETAILS: 'machine-details',
    MAINTENANCE_FORM: 'maintenance-form',
    REPORTS: 'reports'
  },

  // FullCalendar locale ayarları
  FULLCALENDAR_LOCALE: {
    code: 'tr',
    week: {
      dow: 1, // Pazartesi ile başla
      doy: 4
    },
    buttonText: {
      prev: 'Önceki',
      next: 'Sonraki',
      today: 'Bugün',
      month: 'Ay',
      week: 'Hafta',
      day: 'Gün',
      list: 'Liste'
    },
    weekText: 'Hf',
    allDayText: 'Tüm gün',
    moreLinkText: 'daha fazla',
    noEventsText: 'Gösterilecek etkinlik yok'
  },

  // Export ayarları
  EXPORT: {
    EXCEL: {
      FILENAME: 'bakim_raporu',
      SHEET_NAME: 'Bakım Kayıtları'
    },
    PDF: {
      FILENAME: 'bakim_raporu',
      ORIENTATION: 'portrait',
      UNIT: 'mm',
      FORMAT: 'a4'
    }
  },

  // Hata mesajları
  ERROR_MESSAGES: {
    NETWORK: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
    AUTH: 'Kimlik doğrulama hatası. Lütfen tekrar giriş yapın.',
    PERMISSION: 'Bu işlem için yetkiniz yok.',
    NOT_FOUND: 'İstenen kayıt bulunamadı.',
    VALIDATION: 'Lütfen tüm zorunlu alanları doldurun.',
    UPLOAD: 'Dosya yükleme hatası. Lütfen tekrar deneyin.',
    GENERIC: 'Bir hata oluştu. Lütfen tekrar deneyin.'
  },

  // Başarı mesajları
  SUCCESS_MESSAGES: {
    SAVE: 'Kayıt başarıyla kaydedildi.',
    UPDATE: 'Kayıt başarıyla güncellendi.',
    DELETE: 'Kayıt başarıyla silindi.',
    UPLOAD: 'Dosya başarıyla yüklendi.',
    EXPORT: 'Rapor başarıyla oluşturuldu.'
  },

  // Uygulama bilgileri
  APP: {
    NAME: 'Glohe Bakım Yönetim Sistemi',
    VERSION: '2.0.0',
    DESCRIPTION: 'Akıllı Bakım Planlama Platformu',
    COMPANY: 'Glohe'
  }
};

// Config'i window'a bağla
window.CONFIG = CONFIG;

// Export (ES6 module desteği varsa)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
