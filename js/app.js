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
  document.getElementById('kpi-cfr-sub').textContent = 'Overall CFR: ' + data.summary.cfr_percent + '%';

  var delta = data.summary.weekly_delta;
  if (delta) {
    renderDelta('kpi-cases-delta', delta.cases, 'cases');
    renderDelta('kpi-deaths-delta', delta.deaths, 'deaths');
  }
}

function renderDelta(id, value, type) {
  var el = document.getElementById(id);
  if (!el || value === undefined) return;
  if (value === 0 && type === 'deaths') {
    el.className = 'delta delta-flat';
    el.textContent = 'No new deaths this week';
    return;
  }
  var cls = value > 0 ? 'delta-up' : value < 0 ? 'delta-down' : 'delta-flat';
  el.className = 'delta ' + cls;
  el.textContent = (value > 0 ? '+' : '') + value + ' this week';
}

function renderEpiStats(data) {
  var s = data.summary;
  document.getElementById('epi-cfr').textContent = s.cfr_percent + '%';
  document.getElementById('epi-risk').textContent = s.who_risk_global;
  document.getElementById('epi-lag').textContent = s.data_lag_hours + 'h';

  var badge = document.getElementById('risk-badge');
  if (badge) {
    badge.textContent = 'WHO: ' + s.who_risk_global;
    badge.className = 'risk-badge risk-' + s.who_risk_global.toLowerCase().replace(' ', '-');
  }

  var reviewed = document.getElementById('methodology-reviewed');
  if (reviewed) reviewed.textContent = data.last_updated;
}

function renderAlertBanner(data, hondius) {
  if (hondius.total_cases > 0 && hondius.total_deaths > 0) {
    document.getElementById('alert-banner').style.display = '';
    document.getElementById('alert-text').textContent =
      'MV Hondius · ' + hondius.total_cases + ' cases · ' +
      hondius.total_deaths + ' deaths · CFR ' + hondius.cfr_percent +
      '% · ' + hondius.current_status;
  }
}

function renderClusterEpiStats(hondius) {
  var stats = [
    { label: 'Cases', value: hondius.total_cases },
    { label: 'Deaths', value: hondius.total_deaths },
    { label: 'CFR', value: hondius.cfr_percent + '%' },
    { label: 'Attack Rate', value: hondius.attack_rate_percent + '%' },
    { label: 'R0 Estimate', value: hondius.r0_estimate },
    { label: 'Generation Interval', value: hondius.generation_interval_days + ' days' }
  ];
  document.getElementById('cluster-epi-stats').innerHTML = stats.map(function(s) {
    return '<div class="stat"><span class="stat-value">' + s.value +
      '</span><span class="stat-label">' + s.label + '</span></div>';
  }).join('');
}

function outcomeToStatus(outcome) {
  var lower = outcome.toLowerCase();
  if (lower.indexOf('deceased') !== -1) return { cls: 'status-deceased', symbol: '✖' };
  if (lower.indexOf('hospitalized') !== -1) return { cls: 'status-hospitalized', symbol: '●' };
  return { cls: 'status-recovering', symbol: '✔' };
}

function renderClusterTable(data) {
  var tbody = document.getElementById('cluster-tbody');
  tbody.innerHTML = '';
  data.cases.forEach(function(c) {
    var status = outcomeToStatus(c.outcome);
    var linkText = c.linked_to !== null ? ' [linked to #' + c.linked_to + ']' : ' [index case]';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + c.date + '</td>' +
      '<td>' + c.nationality + '</td>' +
      '<td class="td-description" title="' + c.description + linkText + '">' +
        c.description + '<span style="color:#6b7280;font-size:11px">' + linkText + '</span></td>' +
      '<td><span class="status-badge ' + status.cls + '"><span class="status-symbol">' +
        status.symbol + '</span> ' + c.outcome + '</span></td>';
    tbody.appendChild(tr);
  });
}

function classifySeverity(article) {
  var t = (article.title + ' ' + article.summary).toLowerCase();
  if (t.indexOf('death') !== -1 || t.indexOf('deceased') !== -1 || t.indexOf('fatali') !== -1 || t.indexOf('risk assessment') !== -1) return 'alert';
  if (t.indexOf('advisory') !== -1 || t.indexOf('travel') !== -1 || t.indexOf('warning') !== -1) return 'advisory';
  if (t.indexOf('case') !== -1 || t.indexOf('update') !== -1 || t.indexOf('confirm') !== -1 || t.indexOf('surveillance') !== -1) return 'update';
  return 'background';
}

var severityLabels = { alert: 'Alert', advisory: 'Advisory', update: 'Update', background: 'Background' };

function renderNews(data) {
  var list = document.getElementById('news-list');
  list.innerHTML = '';
  var articles = data.articles;
  var VISIBLE_COUNT = 5;

  articles.forEach(function(article, i) {
    var severity = classifySeverity(article);
    var li = document.createElement('li');
    li.className = 'news-item' + (i >= VISIBLE_COUNT ? ' news-hidden' : '');
    li.innerHTML =
      '<span class="news-date">' + article.date + '</span>' +
      '<span><span class="news-source">' + article.source + '</span>' +
        '<span class="news-severity severity-' + severity + '">' + severityLabels[severity] + '</span></span>' +
      '<div>' +
        '<a href="' + article.url + '" target="_blank" rel="noopener" class="news-title">' + article.title + '</a>' +
        '<div class="news-summary">' + article.summary + '</div>' +
      '</div>';
    list.appendChild(li);
  });

  if (articles.length > VISIBLE_COUNT) {
    var btn = document.createElement('button');
    btn.className = 'news-show-more';
    btn.textContent = 'Show ' + (articles.length - VISIBLE_COUNT) + ' older updates';
    btn.onclick = function() {
      var hidden = list.querySelectorAll('.news-hidden');
      for (var j = 0; j < hidden.length; j++) hidden[j].classList.remove('news-hidden');
      btn.remove();
    };
    list.parentElement.appendChild(btn);
  }
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
