var blue = '#2563eb';
var red = '#dc2626';
var grey = '#94a3b8';
var gridColor = '#e2e8f0';

var annotations = {
  annotations: {
    a1: { type: 'line', scaleID: 'x', value: '2026-04-12', borderColor: grey, borderWidth: 1, borderDash: [4,4],
      label: { display: true, content: 'First case', position: 'start', font: { size: 10, family: 'Inter' }, color: grey, backgroundColor: 'transparent' }},
    a2: { type: 'line', scaleID: 'x', value: '2026-04-15', borderColor: red, borderWidth: 1, borderDash: [4,4],
      label: { display: true, content: 'First death', position: 'start', font: { size: 10, family: 'Inter' }, color: red, backgroundColor: 'transparent' }},
    a3: { type: 'line', scaleID: 'x', value: '2026-05-01', borderColor: '#d97706', borderWidth: 1, borderDash: [4,4],
      label: { display: true, content: 'Quarantined', position: 'start', font: { size: 10, family: 'Inter' }, color: '#d97706', backgroundColor: 'transparent' }}
  }
};

var legend = { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 16 } };
var xScale = { ticks: { font: { family: 'Inter', size: 11 }, maxRotation: 45 }, grid: { display: false } };
var yScale = { beginAtZero: true, ticks: { font: { family: 'Inter', size: 11 } }, grid: { color: gridColor } };

function initCharts(cases, historical) {
  epiCurve(cases);
  cumulative(cases);
  regional(cases);

  var hist = document.getElementById('ref-historical');
  if (hist) {
    var done = false;
    new MutationObserver(function() {
      if (hist.classList.contains('open') && !done) {
        done = true;
        histEU(historical);
        histUS(historical);
      }
    }).observe(hist, { attributes: true, attributeFilter: ['class'] });
  }
}

function weeklyNew(tl) {
  var w = [];
  for (var i = 1; i < tl.length; i++) w.push({ date: tl[i].date, nc: tl[i].cumulative_cases - tl[i-1].cumulative_cases, nd: tl[i].cumulative_deaths - tl[i-1].cumulative_deaths });
  return w;
}

function epiCurve(cases) {
  var el = document.getElementById('chart-epicurve'); if (!el) return;
  var w = weeklyNew(cases.timeline);
  new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels: w.map(function(d){return d.date}), datasets: [
      { label: 'New cases', data: w.map(function(d){return d.nc}), backgroundColor: blue+'60', borderColor: blue, borderWidth: 1 },
      { label: 'New deaths', data: w.map(function(d){return d.nd}), backgroundColor: red+'60', borderColor: red, borderWidth: 1 }
    ]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend, annotation: annotations },
      scales: { x: xScale, y: Object.assign({}, yScale, { title: { display: true, text: 'Cases per period', font: { family: 'Inter', size: 11 } }}) }}
  });
}

function cumulative(cases) {
  var el = document.getElementById('chart-timeline'); if (!el) return;
  new Chart(el.getContext('2d'), {
    type: 'line',
    data: { labels: cases.timeline.map(function(d){return d.date}), datasets: [
      { label: 'Cumulative cases', data: cases.timeline.map(function(d){return d.cumulative_cases}), borderColor: blue, backgroundColor: blue+'1a', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
      { label: 'Cumulative deaths', data: cases.timeline.map(function(d){return d.cumulative_deaths}), borderColor: red, backgroundColor: red+'1a', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 }
    ]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend, annotation: annotations }, scales: { x: xScale, y: yScale }}
  });
}

function regional(cases) {
  var el = document.getElementById('chart-regional'); if (!el) return;
  var c = cases.countries.filter(function(x){return x.cases_2026>0}).sort(function(a,b){return b.cases_2026-a.cases_2026});
  new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels: c.map(function(x){return x.name+(x.cfr_percent>0&&x.cases_2026>=2?' ('+x.cfr_percent+'%)':'')}), datasets: [
      { label: 'Cases', data: c.map(function(x){return x.cases_2026}), backgroundColor: blue+'40', borderColor: blue, borderWidth: 1 },
      { label: 'Deaths', data: c.map(function(x){return x.deaths_2026}), backgroundColor: red+'40', borderColor: red, borderWidth: 1 }
    ]},
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: legend },
      scales: { x: Object.assign({}, yScale), y: { ticks: { font: { family: 'Inter', size: 12 }}, grid: { display: false }} }}
  });
}

function trend(data) {
  var n=data.length,sx=0,sy=0,sxy=0,sxx=0;
  for(var i=0;i<n;i++){sx+=i;sy+=data[i];sxy+=i*data[i];sxx+=i*i;}
  var m=(n*sxy-sx*sy)/(n*sxx-sx*sx),b=(sy-m*sx)/n;
  return data.map(function(_,i){return Math.round(b+m*i)});
}

function histEU(h) {
  var el = document.getElementById('chart-historical-eu'); if (!el) return;
  var eu=h.eu_ecdc.annual,de=h.de_rki.annual,euC=eu.map(function(d){return d.cases});
  new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels: eu.map(function(d){return d.year}), datasets: [
      { label: 'EU/EEA', data: euC, backgroundColor: blue+'30', borderColor: blue, borderWidth: 1 },
      { label: 'Germany', data: de.map(function(d){return d.cases}), backgroundColor: grey+'30', borderColor: grey, borderWidth: 1 },
      { label: 'Trend', data: trend(euC), type: 'line', borderColor: grey, borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false }
    ]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend }, scales: { x: xScale, y: yScale }}
  });
}

function histUS(h) {
  var el = document.getElementById('chart-historical-us'); if (!el) return;
  var us=h.us_cdc.annual;
  new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels: us.map(function(d){return d.year}), datasets: [
      { label: 'US (CDC)', data: us.map(function(d){return d.cases}), backgroundColor: blue+'30', borderColor: blue, borderWidth: 1 }
    ]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend }, scales: { x: xScale, y: yScale }}
  });
}
