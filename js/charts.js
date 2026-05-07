function initCharts(cases, historical) {
  var accent = '#1e40af';
  var danger = '#991b1b';
  var grey = '#9ca3af';

  timelineChart(cases, accent, danger);
  regionalChart(cases, accent, danger);
  historicalChartEU(historical, accent, grey);
  historicalChartUS(historical, accent, grey);
}

function timelineChart(cases, accent, danger) {
  var ctx = document.getElementById('chart-timeline').getContext('2d');
  var labels = cases.timeline.map(function(d) { return d.date; });
  var casesData = cases.timeline.map(function(d) { return d.cumulative_cases; });
  var deathsData = cases.timeline.map(function(d) { return d.cumulative_deaths; });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cumulative cases',
          data: casesData,
          borderColor: accent,
          backgroundColor: accent + '1a',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2
        },
        {
          label: 'Cumulative deaths',
          data: deathsData,
          borderColor: danger,
          backgroundColor: danger + '1a',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 }
        }
      },
      scales: {
        x: {
          ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { color: '#e5e7eb' }
        }
      }
    }
  });
}

function regionalChart(cases, accent, danger) {
  var ctx = document.getElementById('chart-regional').getContext('2d');
  var countries = cases.countries
    .filter(function(c) { return c.cases_2026 > 0; })
    .sort(function(a, b) { return b.cases_2026 - a.cases_2026; });

  var labels = countries.map(function(c) { return c.name; });
  var casesData = countries.map(function(c) { return c.cases_2026; });
  var deathsData = countries.map(function(c) { return c.deaths_2026; });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cases',
          data: casesData,
          backgroundColor: accent + '40',
          borderColor: accent,
          borderWidth: 1
        },
        {
          label: 'Deaths',
          data: deathsData,
          backgroundColor: danger + '40',
          borderColor: danger,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { color: '#e5e7eb' }
        },
        y: {
          ticks: { font: { family: 'Inter', size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

function historicalChartEU(historical, accent, grey) {
  var ctx = document.getElementById('chart-historical-eu').getContext('2d');
  var euData = historical.eu_ecdc.annual;
  var deData = historical.de_rki.annual;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: euData.map(function(d) { return d.year; }),
      datasets: [
        {
          label: 'EU/EEA (ECDC)',
          data: euData.map(function(d) { return d.cases; }),
          backgroundColor: accent + '30',
          borderColor: accent,
          borderWidth: 1
        },
        {
          label: 'Germany (RKI)',
          data: deData.map(function(d) { return d.cases; }),
          backgroundColor: grey + '30',
          borderColor: grey,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 }
        }
      },
      scales: {
        x: {
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { color: '#e5e7eb' }
        }
      }
    }
  });
}

function historicalChartUS(historical, accent, grey) {
  var ctx = document.getElementById('chart-historical-us').getContext('2d');
  var usData = historical.us_cdc.annual;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: usData.map(function(d) { return d.year; }),
      datasets: [
        {
          label: 'United States (CDC)',
          data: usData.map(function(d) { return d.cases; }),
          backgroundColor: accent + '30',
          borderColor: accent,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 }
        }
      },
      scales: {
        x: {
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { family: 'Inter', size: 10 } },
          grid: { color: '#e5e7eb' }
        }
      }
    }
  });
}
