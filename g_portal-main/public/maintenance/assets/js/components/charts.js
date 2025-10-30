/**
 * Glohe Bakım Yönetim Sistemi - Charts Component
 * Chart.js tabanlı grafik bileşenleri
 */

const Charts = {
  /**
   * Aylık bakım dağılım grafiği (Line Chart)
   */
  createMonthlyDistributionChart(canvasId, distribution) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error('Canvas element not found:', canvasId);
      return null;
    }

    // Destroy existing chart if exists
    if (ctx.chart) {
      ctx.chart.destroy();
    }

    const months = Object.keys(distribution).map(m => CONFIG.MONTHS_TR[parseInt(m)]);
    const scheduledData = Object.values(distribution).map(d => d.scheduled || 0);
    const completedData = Object.values(distribution).map(d => d.completed || 0);
    const overdueData = Object.values(distribution).map(d => d.overdue || 0);

    ctx.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Planlandı',
            data: scheduledData,
            borderColor: CONFIG.CHART_COLORS.INFO,
            backgroundColor: CONFIG.CHART_COLORS.INFO + '20',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Tamamlandı',
            data: completedData,
            borderColor: CONFIG.CHART_COLORS.SUCCESS,
            backgroundColor: CONFIG.CHART_COLORS.SUCCESS + '20',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Gecikmiş',
            data: overdueData,
            borderColor: CONFIG.CHART_COLORS.DANGER,
            backgroundColor: CONFIG.CHART_COLORS.DANGER + '20',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Aylık Bakım Dağılımı',
            font: {
              size: 16
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    return ctx.chart;
  },

  /**
   * Bakım durumu dağılımı (Doughnut Chart)
   */
  createStatusDistributionChart(canvasId, stats) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error('Canvas element not found:', canvasId);
      return null;
    }

    if (ctx.chart) {
      ctx.chart.destroy();
    }

    const labels = ['Bekleyen', 'Tamamlanan', 'Gecikmiş'];
    const data = [
      stats.pendingCount || 0,
      stats.completedThisMonth || 0,
      stats.overdueCount || 0
    ];
    const colors = [
      CONFIG.CHART_COLORS.WARNING,
      CONFIG.CHART_COLORS.SUCCESS,
      CONFIG.CHART_COLORS.DANGER
    ];

    ctx.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Bakım Durumu Dağılımı',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return ctx.chart;
  },

  /**
   * Makine kategori dağılımı (Bar Chart)
   */
  createCategoryDistributionChart(canvasId, machines) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error('Canvas element not found:', canvasId);
      return null;
    }

    if (ctx.chart) {
      ctx.chart.destroy();
    }

    // Kategorilere göre grupla
    const categoryCount = {};
    machines.forEach(machine => {
      const category = machine.category || 'Diğer';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const labels = Object.keys(categoryCount);
    const data = Object.values(categoryCount);
    const colors = labels.map(cat => {
      const categoryObj = Object.values(CONFIG.MACHINE_CATEGORIES).find(c => c.value === cat);
      return categoryObj ? categoryObj.color : CONFIG.CHART_COLORS.INFO;
    });

    ctx.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Makine Sayısı',
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Kategori Bazlı Makine Dağılımı',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    return ctx.chart;
  },

  /**
   * Bakım frekansı dağılımı (Pie Chart)
   */
  createFrequencyDistributionChart(canvasId, schedules) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error('Canvas element not found:', canvasId);
      return null;
    }

    if (ctx.chart) {
      ctx.chart.destroy();
    }

    // Frekanslara göre grupla
    const frequencyCount = {};
    schedules.forEach(schedule => {
      const freq = schedule.frequency || 'Diğer';
      frequencyCount[freq] = (frequencyCount[freq] || 0) + 1;
    });

    const labels = Object.keys(frequencyCount).map(freq => {
      const freqObj = Object.values(CONFIG.FREQUENCY).find(f => f.value === freq);
      return freqObj ? freqObj.label : freq;
    });
    const data = Object.values(frequencyCount);

    const colors = [
      CONFIG.CHART_COLORS.PRIMARY,
      CONFIG.CHART_COLORS.SECONDARY,
      CONFIG.CHART_COLORS.INFO,
      CONFIG.CHART_COLORS.SUCCESS,
      CONFIG.CHART_COLORS.WARNING
    ];

    ctx.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Bakım Frekansı Dağılımı',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return ctx.chart;
  },

  /**
   * Haftalık performans grafiği (Line Chart)
   */
  createWeeklyPerformanceChart(canvasId, weekData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error('Canvas element not found:', canvasId);
      return null;
    }

    if (ctx.chart) {
      ctx.chart.destroy();
    }

    const days = Object.keys(weekData).map(d => CONFIG.DAYS_SHORT_TR[parseInt(d)]);
    const completedData = Object.values(weekData).map(d => d.completed || 0);
    const plannedData = Object.values(weekData).map(d => d.planned || 0);

    ctx.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Planlanan',
            data: plannedData,
            borderColor: CONFIG.CHART_COLORS.INFO,
            backgroundColor: CONFIG.CHART_COLORS.INFO + '40',
            tension: 0.3,
            fill: false
          },
          {
            label: 'Tamamlanan',
            data: completedData,
            borderColor: CONFIG.CHART_COLORS.SUCCESS,
            backgroundColor: CONFIG.CHART_COLORS.SUCCESS + '40',
            tension: 0.3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Bu Haftanın Performansı',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    return ctx.chart;
  },

  /**
   * Tüm grafikleri yok et (memory cleanup)
   */
  destroyAll() {
    document.querySelectorAll('canvas').forEach(canvas => {
      if (canvas.chart) {
        canvas.chart.destroy();
        canvas.chart = null;
      }
    });
  },

  /**
   * Grafiği güncelle (data değiştiğinde)
   */
  updateChart(chart, newData) {
    if (!chart) return;

    chart.data.datasets.forEach((dataset, index) => {
      if (newData.datasets && newData.datasets[index]) {
        dataset.data = newData.datasets[index].data;
      }
    });

    if (newData.labels) {
      chart.data.labels = newData.labels;
    }

    chart.update();
  },

  /**
   * Grafiği yeniden boyutlandır
   */
  resizeChart(chart) {
    if (chart) {
      chart.resize();
    }
  },

  /**
   * Grafik renklerini değiştir (dark mode için)
   */
  toggleDarkMode(chart, isDark) {
    if (!chart) return;

    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    chart.options.plugins.legend.labels.color = textColor;
    chart.options.plugins.title.color = textColor;

    if (chart.options.scales) {
      Object.keys(chart.options.scales).forEach(scaleKey => {
        chart.options.scales[scaleKey].ticks.color = textColor;
        chart.options.scales[scaleKey].grid.color = gridColor;
      });
    }

    chart.update();
  }
};

// Global'e bağla
window.Charts = Charts;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}
