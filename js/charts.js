var chartAnnotations = {
  annotations: {
    firstCase: {
      type: 'line', scaleID: 'x', value: '2026-04-12',
      borderColor: '#6b7280', borderWidth: 1, borderDash: [4, 4],
      label: { display: true, content: 'First case', position: 'start', font: { size: 10, family: 'Inter' }, color: '#6b7280', backgroundColor: 'transparent' }
    },
    firstDeath: {
      type: 'line', scaleID: 'x', value: '2026-04-15',
      borderColor: '#991b1b', borderWidth: 1, borderDash: [4, 4],
      label: { display: true, content: 'First death', position: 'start', font: { size: 10, family: 'Inter' }, color: '#991b1b', backgroundColor: 'transparent' }
    },
    quarantine: {
      type: 'line', scaleID: 'x', value: '2026-05-01',
      borderColor: '#854d0e', borderWidth: 1, borderDash: [4, 4],
      label: { display: true, content: 'Quarantined', position: 'start', font: { size: 10, family: 'Inter' }, color: '#854d0e', backgroundColor: 'transparent' }
    }
  }
};

function initCharts(cases, historical) {
  var accent = '#1e40af';
  var danger = '#991b1b';
  var grey = '#9ca3af';

  epiCurveChart(cases, accent, danger);
  timelineChart(cases, accent, danger);
  regionalChart(cases, accent, danger);

  // Historical charts render only when accordion opens
  var histSection = document.getElementById('ref-historical');
  if (histSection) {
    var rendered = false;
    var observer = new MutationObserver(function() {
      if (histSection.classList.contains('open') && !rendered) {
        rendered = true;
        historicalChartEU(historical, accent, grey);
        historicalChartUS(historical, accent, grey);
      }
    });
    observer.observe(histSection, { attributes: true, attributeFilter: ['class'] });
  }
}

function computeWeeklyNew(timeline) {
  var w = [];
  for (var i = 1; i < timeline.length; i++) {
    w.push({
      date: timeline[i].date,
      new_cases: timeline[i].cumulative_cases - timeline[i - 1].cumulative_cases,
      new_deaths: timeline[i].cumulative_deaths - timeline[i - 1].cumulative_deaths
    });
  }
  return w;
}

var baseScales = {
  x: { ticks: { font: { family: 'Inter', size: 12 }, maxRotation: 45 }, grid: { display: false } },
  y: { beginAtZero: true, ticks: { font: { family: 'Inter', size: 12 } }, grid: { color: '#e5e7eb' } }
};

var baseLegend = { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 16 } };

function epiCurveChart(cases, accent, danger) {
  var ctx = document.getElementById('chart-epicurve');
  if (!ctx) return;
  var weekly = computeWeeklyNew(cases.timeline);

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: weekly.map(function(d) { return d.date; }),
      datasets: [
        { label: 'New cases', data: weekly.map(function(d) { return d.new_cases; }), backgroundColor: accent + '60', borderColor: accent, borderWidth: 1 },
        { label: 'New deaths', data: weekly.map(function(d) { return d.new_deaths; }), backgroundColor: danger + '60', borderColor: danger, borderWidth: 1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: baseLegend, annotation: chartAnnotations },
      scales: {
        x: baseScales.x,
        y: { beginAtZero: true, ticks: { font: { family: 'Inter', size: 12 }, stepSize: 5 }, grid: { color: '#e5e7eb' },
          title: { display: true, text: 'Cases per period', font: { family: 'Inter', size: 12 } } }
      }
    }
  });
}

function timelineChart(cases, accent, danger) {
  var ctx = document.getElementById('chart-timeline');
  if (!ctx) return;

  new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: cases.timeline.map(function(d) { return d.date; }),
      datasets: [
        { label: 'Cumulative cases', data: cases.timeline.map(function(d) { return d.cumulative_cases; }),
          borderColor: accent, backgroundColor: accent + '1a', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
        { label: 'Cumulative deaths', data: cases.timeline.map(function(d) { return d.cumulative_deaths; }),
          borderColor: danger, backgroundColor: danger + '1a', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: baseLegend, annotation: chartAnnotations },
      scales: baseScales
    }
  });
}

function regionalChart(cases, accent, danger) {
  var ctx = document.getElementById('chart-regional');
  if (!ctx) return;
  var countries = cases.countries.filter(function(c) { return c.cases_2026 > 0; }).sort(function(a, b) { return b.cases_2026 - a.cases_2026; });

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: countries.map(function(c) { return c.name + (c.cfr_percent > 0 && c.cases_2026 >= 2 ? ' (CFR ' + c.cfr_percent + '%)' : ''); }),
      datasets: [
        { label: 'Cases', data: countries.map(function(c) { return c.cases_2026; }), backgroundColor: accent + '40', borderColor: accent, borderWidth: 1 },
        { label: 'Deaths', data: countries.map(function(c) { return c.deaths_2026; }), backgroundColor: danger + '40', borderColor: danger, borderWidth: 1 }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: baseLegend },
      scales: {
        x: { beginAtZero: true, ticks: { font: { family: 'Inter', size: 12 } }, grid: { color: '#e5e7eb' } },
        y: { ticks: { font: { family: 'Inter', size: 12 } }, grid: { display: false } }
      }
    }
  });
}

function computeTrendline(data) {
  var n = data.length, sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (var i = 0; i < n; i++) { sx += i; sy += data[i]; sxy += i * data[i]; sxx += i * i; }
  var m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n;
  return data.map(function(_, i) { return Math.round(b + m * i); });
}

function historicalChartEU(historical, accent, grey) {
  var ctx = document.getElementById('chart-historical-eu');
  if (!ctx) return;
  var eu = historical.eu_ecdc.annual, de = historical.de_rki.annual;
  var euC = eu.map(function(d) { return d.cases; });

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: eu.map(function(d) { return d.year; }),
      datasets: [
        { label: 'EU/EEA', data: euC, backgroundColor: accent + '30', borderColor: accent, borderWidth: 1 },
        { label: 'Germany', data: de.map(function(d) { return d.cases; }), backgroundColor: grey + '30', borderColor: grey, borderWidth: 1 },
        { label: 'EU trend', data: computeTrendline(euC), type: 'line', borderColor: '#9ca3af', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: baseLegend }, scales: baseScales }
  });
}

function historicalChartUS(historical, accent) {
  var ctx = document.getElementById('chart-historical-us');
  if (!ctx) return;
  var us = historical.us_cdc.annual;

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: us.map(function(d) { return d.year; }),
      datasets: [{ label: 'US (CDC)', data: us.map(function(d) { return d.cases; }), backgroundColor: accent + '30', borderColor: accent, borderWidth: 1 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: baseLegend }, scales: baseScales }
  });
}
