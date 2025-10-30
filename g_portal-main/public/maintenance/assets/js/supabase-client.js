/**
 * Glohe Bakım Yönetim Sistemi - Supabase Client
 * Tüm database işlemleri için merkezi client
 */

class SupabaseClient {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Supabase client'ı başlat
   */
  init() {
    if (this.initialized) {
      return this.client;
    }

    try {
      this.client = supabase.createClient(
        CONFIG.SUPABASE.URL,
        CONFIG.SUPABASE.ANON_KEY
      );
      this.initialized = true;
      console.log('✅ Supabase client initialized');
      return this.client;
    } catch (error) {
      console.error('❌ Supabase initialization error:', error);
      throw new Error('Supabase bağlantısı kurulamadı');
    }
  }

  /**
   * Client'ı al
   */
  getClient() {
    if (!this.initialized) {
      return this.init();
    }
    return this.client;
  }

  // ==================== MAKİNELER ====================

  /**
   * Tüm makineleri getir
   */
  async getMachines(filters = {}) {
    try {
      let query = this.getClient()
        .from('machines')
        .select('*')
        .order('machine_no', { ascending: true });

      // Filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`machine_no.ilike.%${filters.search}%,machine_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getMachines error:', error);
      throw error;
    }
  }

  /**
   * Makine detaylarını getir
   */
  async getMachine(machineId) {
    try {
      const { data, error } = await this.getClient()
        .from('machines')
        .select('*')
        .eq('id', machineId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('getMachine error:', error);
      throw error;
    }
  }

  // ==================== BAKIM SCHEDULE'LARI ====================

  /**
   * Tüm bakım schedule'larını getir
   */
  async getMaintenanceSchedules(filters = {}) {
    try {
      let query = this.getClient()
        .from('maintenance_schedules')
        .select(`
          *,
          machines!inner (
            id,
            machine_no,
            machine_name,
            category,
            location,
            status
          )
        `)
        .order('created_at', { ascending: false });

      // Filters
      if (filters.machineId) {
        query = query.eq('machine_id', filters.machineId);
      }
      if (filters.frequency) {
        query = query.eq('frequency', filters.frequency);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Flatten data
      return (data || []).map(item => ({
        ...item,
        machine: item.machines
      }));
    } catch (error) {
      console.error('getMaintenanceSchedules error:', error);
      throw error;
    }
  }

  // ==================== BAKIM TAKVİMİ ====================

  /**
   * Belirli tarih aralığı için takvim etkinliklerini getir
   */
  async getCalendarEvents(startDate, endDate, filters = {}) {
    try {
      let query = this.getClient()
        .from('maintenance_calendar')
        .select(`
          *,
          machines!inner (
            id,
            machine_no,
            machine_name,
            category,
            location
          ),
          maintenance_schedules!inner (
            id,
            maintenance_type,
            description
          )
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });

      // Filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.machineId) {
        query = query.eq('machine_id', filters.machineId);
      }
      if (filters.frequency) {
        query = query.eq('frequency', filters.frequency);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format for FullCalendar
      return (data || []).map(item => ({
        id: item.id,
        title: `${item.machines.machine_no} - ${item.maintenance_type}`,
        start: `${item.scheduled_date}T${item.scheduled_time}`,
        backgroundColor: this.getStatusColor(item.status),
        borderColor: this.getStatusColor(item.status),
        extendedProps: {
          ...item,
          machine: item.machines,
          schedule: item.maintenance_schedules
        }
      }));
    } catch (error) {
      console.error('getCalendarEvents error:', error);
      throw error;
    }
  }

  /**
   * Yıl için takvim etkinliklerini getir
   */
  async getYearCalendar(year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return this.getCalendarEvents(startDate, endDate);
  }

  // ==================== BAKIM KAYITLARI ====================

  /**
   * Bakım kayıtlarını getir (bekleyen, tamamlanan, gecikmiş)
   */
  async getMaintenanceRecords(filters = {}) {
    try {
      let query = this.getClient()
        .from('maintenance_records')
        .select(`
          *,
          machines!inner (
            id,
            machine_no,
            machine_name,
            category,
            location,
            status
          )
        `)
        .order('scheduled_date', { ascending: true });

      // Filters
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }
      if (filters.machineId) {
        query = query.eq('machine_id', filters.machineId);
      }
      if (filters.dateFrom) {
        query = query.gte('scheduled_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('scheduled_date', filters.dateTo);
      }
      if (filters.priority !== undefined) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Flatten data
      return (data || []).map(item => ({
        ...item,
        machine: item.machines
        // NOT: performed_by user bilgisi auth.users'dan direkt çekilemez
        // Frontend'de performed_by UUID'si ile ayrı sorgu yapılmalı veya
        // user_profiles gibi bir tablo oluşturulmalı
      }));
    } catch (error) {
      console.error('getMaintenanceRecords error:', error);
      throw error;
    }
  }

  /**
   * Bekleyen bakımları getir
   */
  async getPendingMaintenance(filter = 'all') {
    const now = new Date();
    const filters = { status: ['pending', 'in_progress', 'overdue'] };

    switch (filter) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filters.dateFrom = today;
        filters.dateTo = today;
        break;
      case 'next_7_days':
        filters.dateFrom = now.toISOString().split('T')[0];
        const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        filters.dateTo = next7.toISOString().split('T')[0];
        break;
      case 'this_month':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filters.dateFrom = firstDay.toISOString().split('T')[0];
        filters.dateTo = lastDay.toISOString().split('T')[0];
        break;
      case 'overdue':
        filters.status = ['overdue'];
        filters.dateTo = now.toISOString().split('T')[0];
        break;
    }

    return this.getMaintenanceRecords(filters);
  }

  /**
   * Yeni bakım kaydı oluştur
   */
  async createMaintenanceRecord(record) {
    try {
      const { data, error } = await this.getClient()
        .from('maintenance_records')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('createMaintenanceRecord error:', error);
      throw error;
    }
  }

  /**
   * Bakım kaydını güncelle
   */
  async updateMaintenanceRecord(id, updates) {
    try {
      const { data, error } = await this.getClient()
        .from('maintenance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updateMaintenanceRecord error:', error);
      throw error;
    }
  }

  /**
   * Bakımı tamamla
   */
  async completeMaintenance(id, completionData) {
    const updates = {
      status: 'completed',
      completed_date: new Date().toISOString(),
      ...completionData
    };
    return this.updateMaintenanceRecord(id, updates);
  }

  // ==================== CHECKLIST ŞABLONLARI ====================

  /**
   * Checklist şablonlarını getir
   */
  async getChecklistTemplates(filters = {}) {
    try {
      let query = this.getClient()
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.maintenanceType) {
        query = query.eq('maintenance_type', filters.maintenanceType);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getChecklistTemplates error:', error);
      throw error;
    }
  }

  /**
   * Default checklist şablonunu getir
   */
  async getDefaultChecklistTemplate() {
    try {
      const { data, error } = await this.getClient()
        .from('checklist_templates')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('getDefaultChecklistTemplate error:', error);
      throw error;
    }
  }

  // ==================== FOTO YÜKLEME ====================

  /**
   * Fotoğraf yükle
   */
  async uploadPhoto(file, maintenanceRecordId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${maintenanceRecordId}/${Date.now()}.${fileExt}`;
      const filePath = `maintenance-photos/${fileName}`;

      const { data, error } = await this.getClient()
        .storage
        .from(CONFIG.SUPABASE.STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Public URL'i al
      const { data: urlData } = this.getClient()
        .storage
        .from(CONFIG.SUPABASE.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('uploadPhoto error:', error);
      throw error;
    }
  }

  /**
   * Birden fazla fotoğraf yükle
   */
  async uploadPhotos(files, maintenanceRecordId) {
    const uploadPromises = files.map(file => this.uploadPhoto(file, maintenanceRecordId));
    return Promise.all(uploadPromises);
  }

  /**
   * Fotoğrafı sil
   */
  async deletePhoto(filePath) {
    try {
      const { error } = await this.getClient()
        .storage
        .from(CONFIG.SUPABASE.STORAGE_BUCKET)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('deletePhoto error:', error);
      throw error;
    }
  }

  // ==================== İSTATİSTİKLER ====================

  /**
   * Dashboard istatistiklerini getir
   */
  async getDashboardStats() {
    try {
      const now = new Date().toISOString().split('T')[0];

      // Paralel sorgular
      const [
        totalMachines,
        totalSchedules,
        pendingCount,
        overdueCount,
        completedThisMonth
      ] = await Promise.all([
        // Toplam makine
        this.getClient().from('machines').select('id', { count: 'exact', head: true }),
        // Toplam schedule
        this.getClient().from('maintenance_schedules').select('id', { count: 'exact', head: true }),
        // Bekleyen bakımlar
        this.getClient().from('maintenance_records')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress']),
        // Gecikmiş bakımlar
        this.getClient().from('maintenance_records')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'overdue'),
        // Bu ay tamamlanan
        this.getClient().from('maintenance_records')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_date', `${now.substring(0, 7)}-01`)
      ]);

      return {
        totalMachines: totalMachines.count || 0,
        totalSchedules: totalSchedules.count || 0,
        pendingCount: pendingCount.count || 0,
        overdueCount: overdueCount.count || 0,
        completedThisMonth: completedThisMonth.count || 0
      };
    } catch (error) {
      console.error('getDashboardStats error:', error);
      throw error;
    }
  }

  /**
   * Aylık bakım dağılımını getir (chart için)
   */
  async getMonthlyDistribution(year) {
    try {
      const { data, error } = await this.getClient()
        .from('maintenance_calendar')
        .select('month, status')
        .eq('year', year);

      if (error) throw error;

      // Aylara göre grupla
      const distribution = {};
      for (let month = 1; month <= 12; month++) {
        distribution[month] = {
          scheduled: 0,
          completed: 0,
          overdue: 0,
          total: 0
        };
      }

      (data || []).forEach(item => {
        if (distribution[item.month]) {
          distribution[item.month][item.status]++;
          distribution[item.month].total++;
        }
      });

      return distribution;
    } catch (error) {
      console.error('getMonthlyDistribution error:', error);
      throw error;
    }
  }

  // ==================== YARDIMCI FONKSİYONLAR ====================

  /**
   * Status'a göre renk al
   */
  getStatusColor(status) {
    const statusObj = Object.values(CONFIG.STATUS).find(s => s.value === status);
    return statusObj ? statusObj.color : CONFIG.CHART_COLORS.INFO;
  }
}

// Singleton instance
const supabaseClient = new SupabaseClient();

// Global'e bağla
window.supabaseClient = supabaseClient;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supabaseClient;
}
