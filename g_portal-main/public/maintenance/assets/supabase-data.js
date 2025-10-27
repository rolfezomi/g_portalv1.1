/**
 * Bakım Yönetimi - Supabase Veri Modülü
 * Machines ve Maintenance Schedules verilerini Supabase'den çeker
 */

// ==================== SUPABASE CLIENT ====================

// Supabase client'ı ana sayfadan alacağız (zaten mevcut)
// window.supabase global olarak tanımlı olmalı

/**
 * Supabase client'ın hazır olup olmadığını kontrol et
 *
 * @returns {boolean}
 */
function isSupabaseReady() {
  return typeof window.supabase !== 'undefined' && window.supabase !== null;
}

/**
 * Supabase client hazır değilse hata fırlat
 */
function ensureSupabase() {
  if (!isSupabaseReady()) {
    throw new Error('Supabase client hazır değil! Ana sayfada supabase client yüklendiğinden emin olun.');
  }
}

// ==================== MAKİNELER ====================

/**
 * Tüm makineleri Supabase'den çek
 *
 * @param {boolean} includeInactive - Pasif makineleri de getir
 * @returns {Promise<Array>} Makineler listesi
 */
async function fetchAllMachines(includeInactive = false) {
  ensureSupabase();

  try {
    let query = window.supabase
      .from('machines')
      .select('*')
      .order('machine_no', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Makineler çekilirken hata:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('fetchAllMachines error:', err);
    throw err;
  }
}

/**
 * Belirli bir makineyi getir
 *
 * @param {string} machineNo - Makine numarası
 * @returns {Promise<Object|null>} Makine objesi
 */
async function fetchMachine(machineNo) {
  ensureSupabase();

  try {
    const { data, error } = await window.supabase
      .from('machines')
      .select('*')
      .eq('machine_no', machineNo)
      .single();

    if (error) {
      console.error(`Makine ${machineNo} çekilirken hata:`, error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('fetchMachine error:', err);
    return null;
  }
}

// ==================== BAKIM PERİYOTLARI ====================

/**
 * Tüm bakım periyotlarını Supabase'den çek (JOIN ile machine bilgisi dahil)
 *
 * @param {boolean} includeInactive - Pasif schedule'ları da getir
 * @returns {Promise<Array>} Schedule'lar listesi
 */
async function fetchAllSchedules(includeInactive = false) {
  ensureSupabase();

  try {
    // JOIN ile machine bilgisini çek
    let query = window.supabase
      .from('maintenance_schedules')
      .select(`
        *,
        machines!inner (
          machine_no,
          machine_name,
          is_active
        )
      `);

    if (!includeInactive) {
      query = query.eq('is_active', true);
      // NOT: machines.is_active filtresini Supabase query'de YAPAMAYIZ
      // Bunun yerine client-side filter yapacağız
    }

    const { data, error } = await query;

    if (error) {
      console.error('Schedule\'lar çekilirken hata:', error);
      throw error;
    }

    // Flatten the data - machines objesini dışarı çıkar
    let flattenedData = (data || []).map(item => ({
      ...item,
      machine_no: item.machines.machine_no,
      machine_name: item.machines.machine_name,
      machine_is_active: item.machines.is_active
    }));

    // İnactive makineleri filtrele (client-side)
    if (!includeInactive) {
      flattenedData = flattenedData.filter(item => item.machine_is_active === true);
    }

    return flattenedData;
  } catch (err) {
    console.error('fetchAllSchedules error:', err);
    throw err;
  }
}

/**
 * Belirli bir makineye ait schedule'ları getir
 *
 * @param {string} machineNo - Makine numarası
 * @returns {Promise<Array>} Schedule'lar listesi
 */
async function fetchMachineSchedules(machineNo) {
  ensureSupabase();

  try {
    // İlk önce machine'in ID'sini bul
    const machine = await fetchMachine(machineNo);
    if (!machine) {
      throw new Error(`Makine ${machineNo} bulunamadı!`);
    }

    // machine_id ile schedules çek
    const { data, error } = await window.supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('machine_id', machine.id)
      .eq('is_active', true)
      .order('maintenance_type', { ascending: true });

    if (error) {
      console.error(`Makine ${machineNo} schedule'ları çekilirken hata:`, error);
      throw error;
    }

    // machine_no ve machine_name ekle
    const schedulesWithMachineInfo = (data || []).map(item => ({
      ...item,
      machine_no: machine.machine_no,
      machine_name: machine.machine_name
    }));

    return schedulesWithMachineInfo;
  } catch (err) {
    console.error('fetchMachineSchedules error:', err);
    throw err;
  }
}

// ==================== TOPLU VERİ ====================

/**
 * Makineler ve schedule'ları birlikte getir
 *
 * @returns {Promise<Object>} {machines: [], schedules: []}
 */
async function fetchMaintenanceData() {
  ensureSupabase();

  try {
    const [machines, schedules] = await Promise.all([
      fetchAllMachines(false),
      fetchAllSchedules(false)
    ]);

    return {
      machines,
      schedules
    };
  } catch (err) {
    console.error('fetchMaintenanceData error:', err);
    throw err;
  }
}

/**
 * Tüm veriyi çek ve analiz için hazırla
 *
 * @returns {Promise<Object>} {machines, schedules, calendars, stats, monthlyDensity}
 */
async function fetchAndAnalyze() {
  try {
    const { machines, schedules } = await fetchMaintenanceData();

    // MaintenanceAnalysis modülünü kullan
    if (typeof window.MaintenanceAnalysis === 'undefined') {
      throw new Error('MaintenanceAnalysis modülü yüklenmemiş!');
    }

    const MA = window.MaintenanceAnalysis;

    const calendars = MA.getAllMachineCalendars(machines, schedules);
    const stats = MA.calculateStatistics(machines, schedules);
    const monthlyDensity = MA.getMonthlyDensity(schedules);

    return {
      machines,
      schedules,
      calendars,
      stats,
      monthlyDensity
    };
  } catch (err) {
    console.error('fetchAndAnalyze error:', err);
    throw err;
  }
}

// ==================== SEARCH & FILTER ====================

/**
 * Makine ara (machine_no veya machine_name)
 *
 * @param {string} searchTerm - Arama terimi
 * @returns {Promise<Array>} Bulunan makineler
 */
async function searchMachines(searchTerm) {
  ensureSupabase();

  try {
    const { data, error } = await window.supabase
      .from('machines')
      .select('*')
      .or(`machine_no.ilike.%${searchTerm}%,machine_name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('machine_no', { ascending: true });

    if (error) {
      console.error('Makine arama hatası:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('searchMachines error:', err);
    throw err;
  }
}

/**
 * Belirli frequency'ye sahip schedule'ları getir
 *
 * @param {string} frequency - Frequency tipi
 * @returns {Promise<Array>} Schedule'lar
 */
async function fetchSchedulesByFrequency(frequency) {
  ensureSupabase();

  try {
    const { data, error } = await window.supabase
      .from('maintenance_schedules')
      .select(`
        *,
        machines!inner (
          machine_no,
          machine_name
        )
      `)
      .eq('frequency', frequency)
      .eq('is_active', true);

    if (error) {
      console.error(`Frequency ${frequency} schedule'ları çekilirken hata:`, error);
      throw error;
    }

    // Flatten the data
    const flattenedData = (data || []).map(item => ({
      ...item,
      machine_no: item.machines.machine_no,
      machine_name: item.machines.machine_name
    }));

    return flattenedData;
  } catch (err) {
    console.error('fetchSchedulesByFrequency error:', err);
    throw err;
  }
}

/**
 * Schedule olmayan makineleri bul
 *
 * @returns {Promise<Array>} Schedule olmayan makineler
 */
async function fetchMachinesWithoutSchedule() {
  ensureSupabase();

  try {
    const { machines, schedules } = await fetchMaintenanceData();

    // Schedule'lardaki machine_id'leri topla
    const machineIdsWithSchedule = new Set(
      schedules.map(s => s.machine_id)
    );

    // Schedule olmayan makineleri filtrele
    return machines.filter(m => !machineIdsWithSchedule.has(m.id));
  } catch (err) {
    console.error('fetchMachinesWithoutSchedule error:', err);
    throw err;
  }
}

// ==================== EXPORT ====================

window.MaintenanceData = {
  isSupabaseReady,
  fetchAllMachines,
  fetchMachine,
  fetchAllSchedules,
  fetchMachineSchedules,
  fetchMaintenanceData,
  fetchAndAnalyze,
  searchMachines,
  fetchSchedulesByFrequency,
  fetchMachinesWithoutSchedule
};
