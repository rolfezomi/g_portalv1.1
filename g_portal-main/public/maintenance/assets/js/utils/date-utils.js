/**
 * Glohe Bakım Yönetim Sistemi - Date Utilities
 * Tarih işleme ve formatlama yardımcı fonksiyonları
 */

const DateUtils = {
  /**
   * Tarih formatla (DD.MM.YYYY)
   */
  formatDate(date) {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  },

  /**
   * Tarih ve saat formatla (DD.MM.YYYY HH:MM)
   */
  formatDateTime(date) {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const dateStr = this.formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${dateStr} ${hours}:${minutes}`;
  },

  /**
   * Saat formatla (HH:MM)
   */
  formatTime(time) {
    if (!time) return '09:00';

    // "HH:MM:SS" veya "HH:MM" formatı
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    return time;
  },

  /**
   * Relative time (örn: "2 gün önce", "3 saat sonra")
   */
  relativeTime(date) {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const absDiff = Math.abs(diff);

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const isFuture = diff > 0;

    if (days > 0) {
      return isFuture ? `${days} gün sonra` : `${days} gün önce`;
    } else if (hours > 0) {
      return isFuture ? `${hours} saat sonra` : `${hours} saat önce`;
    } else if (minutes > 0) {
      return isFuture ? `${minutes} dakika sonra` : `${minutes} dakika önce`;
    } else {
      return 'Şimdi';
    }
  },

  /**
   * Bugün mü kontrol et
   */
  isToday(date) {
    if (!date) return false;

    const d = new Date(date);
    const today = new Date();

    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  },

  /**
   * Gelecekte mi kontrol et
   */
  isFuture(date) {
    if (!date) return false;

    const d = new Date(date);
    const now = new Date();

    return d.getTime() > now.getTime();
  },

  /**
   * Geçmişte mi kontrol et
   */
  isPast(date) {
    if (!date) return false;

    const d = new Date(date);
    const now = new Date();

    return d.getTime() < now.getTime();
  },

  /**
   * Sonraki N gün içinde mi kontrol et
   */
  isWithinDays(date, days) {
    if (!date) return false;

    const d = new Date(date);
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return d.getTime() >= now.getTime() && d.getTime() <= future.getTime();
  },

  /**
   * Ay adını al
   */
  getMonthName(month) {
    return CONFIG.MONTHS_TR[month] || '';
  },

  /**
   * Gün adını al
   */
  getDayName(dayOfWeek) {
    return CONFIG.DAYS_TR[dayOfWeek] || '';
  },

  /**
   * Kısa gün adını al
   */
  getDayShortName(dayOfWeek) {
    return CONFIG.DAYS_SHORT_TR[dayOfWeek] || '';
  },

  /**
   * Haftanın gününü al (1=Pazartesi, 7=Pazar)
   */
  getDayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 ? 7 : day; // Pazar'ı 7 yap
  },

  /**
   * Ayın kaçıncı haftası (1-4)
   */
  getWeekOfMonth(date) {
    const d = new Date(date);
    const dayOfMonth = d.getDate();

    if (dayOfMonth >= 1 && dayOfMonth <= 7) return 1;
    if (dayOfMonth >= 8 && dayOfMonth <= 14) return 2;
    if (dayOfMonth >= 15 && dayOfMonth <= 21) return 3;
    return 4;
  },

  /**
   * Bugünün tarihini al (YYYY-MM-DD)
   */
  getToday() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  },

  /**
   * Şu anki zamanı al (HH:MM:SS)
   */
  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * N gün sonrasını al
   */
  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  /**
   * Ayın ilk gününü al
   */
  getFirstDayOfMonth(year, month) {
    return `${year}-${String(month).padStart(2, '0')}-01`;
  },

  /**
   * Ayın son gününü al
   */
  getLastDayOfMonth(year, month) {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  },

  /**
   * İki tarih arasındaki gün farkını al
   */
  daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * SQL tarih formatına çevir (YYYY-MM-DD)
   */
  toSQLDate(date) {
    if (!date) return null;

    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  },

  /**
   * SQL tarih+saat formatına çevir (YYYY-MM-DD HH:MM:SS)
   */
  toSQLDateTime(date) {
    if (!date) return null;

    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    return d.toISOString().replace('T', ' ').split('.')[0];
  },

  /**
   * Input date formatına çevir (YYYY-MM-DD - HTML5 input type="date" için)
   */
  toInputDate(date) {
    return this.toSQLDate(date);
  },

  /**
   * Input time formatına çevir (HH:MM - HTML5 input type="time" için)
   */
  toInputTime(time) {
    if (!time) return '09:00';

    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    return '09:00';
  },

  /**
   * Tarih geçerli mi kontrol et
   */
  isValidDate(date) {
    const d = new Date(date);
    return !isNaN(d.getTime());
  },

  /**
   * Tarih aralığı oluştur
   */
  getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  /**
   * Yılın tüm aylarını al
   */
  getMonthsOfYear(year) {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push({
        value: month,
        label: CONFIG.MONTHS_TR[month],
        firstDay: this.getFirstDayOfMonth(year, month),
        lastDay: this.getLastDayOfMonth(year, month)
      });
    }
    return months;
  },

  /**
   * Gecikme gün sayısını hesapla ve renk kodu döndür
   */
  getOverdueDays(scheduledDate) {
    if (!scheduledDate) return { days: 0, color: 'gray', text: '-' };

    const scheduled = new Date(scheduledDate);
    const now = new Date();
    const diff = Math.floor((now - scheduled) / (1000 * 60 * 60 * 24));

    if (diff <= 0) {
      return { days: 0, color: 'green', text: 'Zamanında' };
    } else if (diff <= 7) {
      return { days: diff, color: 'orange', text: `${diff} gün gecikme` };
    } else {
      return { days: diff, color: 'red', text: `${diff} gün gecikme` };
    }
  },

  /**
   * Bakım durumuna göre tarih renklendirmesi
   */
  getDateColorClass(date, status) {
    if (status === 'completed') return 'date-completed';
    if (status === 'cancelled') return 'date-cancelled';

    const today = new Date();
    const scheduled = new Date(date);

    if (scheduled < today) {
      return 'date-overdue';
    } else if (this.isToday(date)) {
      return 'date-today';
    } else if (this.isWithinDays(date, 7)) {
      return 'date-upcoming';
    }

    return 'date-future';
  }
};

// Global'e bağla
window.DateUtils = DateUtils;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateUtils;
}
