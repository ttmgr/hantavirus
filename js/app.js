async function loadJSON(path) {
  var resp = await fetch(path);
  return resp.json();
}

function renderKPIs(data) {
  document.getElementById('kpi-cases').textContent = data.summary.total_cases_2026.toLocaleString();
  document.getElementById('kpi-deaths').textContent = data.summary.total_deaths_2026.toLocaleString();
  document.getElementById('kpi-countries').textContent = data.summary.countries_affected;
  document.getElementById('kpi-clusters').textContent = data.summary.active_clusters;
  document.getElementById('last-updated').textContent = 'Updated ' + data.last_updated;

  var delta = data.summary.weekly_delta;
  if (delta) {
    renderDelta('kpi-cases-delta', delta.cases);
    renderDelta('kpi-deaths-delta', delta.deaths);
  }
}

function renderDelta(id, value) {
  var el = document.getElementById(id);
  if (!el || value === undefined) return;
  var cls = value > 0 ? 'delta-up' : value < 0 ? 'delta-down' : 'delta-flat';
  var prefix = value > 0 ? '+' : '';
  el.className = 'delta ' + cls;
  el.textContent = prefix + value + ' this week';
}

function renderEpiStats(data) {
  var s = data.summary;
  document.getElementById('epi-cfr').textContent = s.cfr_percent + '%';
  document.getElementById('epi-risk').textContent = s.who_risk_global;
  document.getElementById('epi-lag').textContent = s.data_lag_hours + 'h';
  document.getElementById('epi-def').textContent = 'WHO 2026';

  var badge = document.getElementById('risk-badge');
  if (badge) {
    badge.textContent = 'WHO: ' + s.who_risk_global;
    badge.className = 'risk-badge risk-' + s.who_risk_global.toLowerCase().replace(' ', '-');
  }
}

function renderAlertBanner(data, hondius) {
  if (hondius.total_cases > 0 && hondius.total_deaths > 0) {
    var banner = document.getElementById('alert-banner');
    var text = document.getElementById('alert-text');
    banner.style.display = '';
    text.textContent = 'MV Hondius cluster: ' + hondius.total_cases + ' cases, ' +
      hondius.total_deaths + ' deaths. ' + hondius.current_status +
      ' CFR ' + hondius.cfr_percent + '%.';
  }
}

function renderClusterEpiStats(hondius) {
  var container = document.getElementById('cluster-epi-stats');
  var stats = [
    { label: 'Cases', value: hondius.total_cases },
    { label: 'Deaths', value: hondius.total_deaths },
    { label: 'CFR', value: hondius.cfr_percent + '%' },
    { label: 'Attack Rate', value: hondius.attack_rate_percent + '%' },
    { label: 'R0 Estimate', value: hondius.r0_estimate },
    { label: 'Generation Interval', value: hondius.generation_interval_days + ' days' }
  ];
  container.innerHTML = stats.map(function(s) {
    return '<div class="stat"><span class="stat-value">' + s.value +
      '</span><span class="stat-label">' + s.label + '</span></div>';
  }).join('');
}

function renderClusterTable(data) {
  var tbody = document.getElementById('cluster-tbody');
  tbody.innerHTML = '';
  data.cases.forEach(function(c) {
    var statusClass = 'status-recovering';
    if (c.outcome.toLowerCase().indexOf('deceased') !== -1) statusClass = 'status-deceased';
    else if (c.outcome.toLowerCase().indexOf('hospitalized') !== -1) statusClass = 'status-hospitalized';

    var linkText = c.linked_to !== null ? ' [linked to #' + c.linked_to + ']' : ' [index case]';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + c.date + '</td>' +
      '<td>' + c.nationality + '</td>' +
      '<td>' + c.description + '<span style="color:#6b7280;font-size:11px">' + linkText + '</span></td>' +
      '<td class="' + statusClass + '">' + c.outcome + '</td>';
    tbody.appendChild(tr);
  });
}

function renderNews(data) {
  var list = document.getElementById('news-list');
  list.innerHTML = '';
  data.articles.forEach(function(article) {
    var li = document.createElement('li');
    li.className = 'news-item';
    li.innerHTML =
      '<span class="news-date">' + article.date + '</span>' +
      '<span class="news-source">' + article.source + '</span>' +
      '<div>' +
        '<a href="' + article.url + '" target="_blank" rel="noopener" class="news-title">' + article.title + '</a>' +
        '<div class="news-summary">' + article.summary + '</div>' +
      '</div>';
    list.appendChild(li);
  });
}

async function init() {
  var cases = await loadJSON('data/cases.json');
  var hondius = await loadJSON('data/hondius.json');
  var historical = await loadJSON('data/historical.json');
  var news = await loadJSON('data/news.json');

  renderKPIs(cases);
  renderEpiStats(cases);
  renderAlertBanner(cases, hondius);
  renderClusterEpiStats(hondius);
  renderClusterTable(hondius);
  renderNews(news);
  initMap(cases, hondius);
  initCharts(cases, historical);
}

document.addEventListener('DOMContentLoaded', init);
