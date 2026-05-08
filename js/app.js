async function loadJSON(path) {
  return (await fetch(path)).json();
}

function renderKPIs(data) {
  document.getElementById('kpi-cases').textContent = data.summary.total_cases_2026.toLocaleString();
  document.getElementById('kpi-deaths').textContent = data.summary.total_deaths_2026.toLocaleString();
  document.getElementById('kpi-countries').textContent = data.summary.countries_affected;
  document.getElementById('kpi-clusters').textContent = data.summary.active_clusters;
  document.getElementById('last-updated').textContent = 'Updated ' + data.last_updated;
  document.getElementById('kpi-cfr-sub').textContent = 'Overall CFR: ' + data.summary.cfr_percent + '%';

  var d = data.summary.weekly_delta;
  if (d) {
    renderDelta('kpi-cases-delta', d.cases, 'cases');
    renderDelta('kpi-deaths-delta', d.deaths, 'deaths');
  }
}

function renderDelta(id, v, type) {
  var el = document.getElementById(id);
  if (!el || v === undefined) return;
  if (v === 0 && type === 'deaths') { el.className = 'delta delta-flat'; el.textContent = 'No new deaths this week'; return; }
  el.className = 'delta ' + (v > 0 ? 'delta-up' : v < 0 ? 'delta-down' : 'delta-flat');
  el.textContent = (v > 0 ? '+' : '') + v + ' this week';
}

function renderHeroChange(data, hondius) {
  var ct = document.getElementById('change-text');
  var cd = document.getElementById('change-delta');
  if (!ct) return;

  var lastCase = hondius.cases[hondius.cases.length - 1];
  ct.textContent = 'Case #' + hondius.total_cases + ': ' + lastCase.description;

  var d = data.summary.weekly_delta;
  var parts = [];
  if (d.cases) parts.push((d.cases > 0 ? '+' : '') + d.cases + ' cases');
  if (d.deaths) parts.push((d.deaths > 0 ? '+' : '') + d.deaths + ' death' + (d.deaths !== 1 ? 's' : ''));
  if (!d.deaths) parts.push('no new deaths');
  cd.textContent = parts.join(' · ') + ' this week';
}

function renderAlertBanner(data, hondius) {
  if (hondius.total_deaths > 0) {
    document.getElementById('alert-banner').style.display = '';
    document.getElementById('alert-text').textContent =
      'MV Hondius · ' + hondius.total_cases + ' cases · ' + hondius.total_deaths +
      ' deaths · CFR ' + hondius.cfr_percent + '% · Quarantined off Cape Verde';
  }
}

function renderEpiStats(data) {
  var badge = document.getElementById('risk-badge');
  if (badge) {
    badge.textContent = 'WHO: ' + data.summary.who_risk_global;
    badge.className = 'risk-badge risk-' + data.summary.who_risk_global.toLowerCase().replace(' ', '-');
  }
  var r = document.getElementById('methodology-reviewed');
  if (r) r.textContent = data.last_updated;
}

function renderRoutePanel(hondius) {
  var ul = document.getElementById('route-timeline');
  if (!ul) return;
  ul.innerHTML = '';
  hondius.track.forEach(function(stop) {
    var isEvent = stop.label.toLowerCase().indexOf('case') !== -1 ||
                  stop.label.toLowerCase().indexOf('quarantine') !== -1;
    var li = document.createElement('li');
    li.className = 'route-stop' + (isEvent ? ' event' : '');
    var dateShort = stop.date.substring(5);
    li.innerHTML = '<span class="route-date">' + dateShort + '</span> ' + stop.label;
    ul.appendChild(li);
  });
}

function renderClusterEpiStats(h) {
  document.getElementById('cluster-epi-stats').innerHTML = [
    { l: 'Cases', v: h.total_cases },
    { l: 'Deaths', v: h.total_deaths },
    { l: 'CFR', v: h.cfr_percent + '%' },
    { l: 'Attack rate', v: h.attack_rate_percent + '%' },
    { l: 'R₀ estimate', v: h.r0_estimate },
    { l: 'Gen. interval', v: h.generation_interval_days + ' days' }
  ].map(function(s) {
    return '<div class="stat"><span class="stat-value">' + s.v +
      '</span><span class="stat-label">' + s.l + '</span></div>';
  }).join('');
}

function renderClusterTable(data) {
  var tbody = document.getElementById('cluster-tbody');
  tbody.innerHTML = '';
  data.cases.forEach(function(c) {
    var lo = c.outcome.toLowerCase();
    var cls = lo.indexOf('deceased') !== -1 ? 'status-deceased' : lo.indexOf('hospitalized') !== -1 ? 'status-hospitalized' : 'status-recovering';
    var sym = lo.indexOf('deceased') !== -1 ? '✖' : lo.indexOf('hospitalized') !== -1 ? '●' : '✔';
    var link = c.linked_to !== null ? ' [linked #' + c.linked_to + ']' : ' [index]';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + c.date + '</td>' +
      '<td>' + c.nationality + '</td>' +
      '<td class="td-description" title="' + c.description + link + '">' + c.description +
        '<span style="color:#6b7280;font-size:11px">' + link + '</span></td>' +
      '<td><span class="status-badge ' + cls + '"><span class="status-symbol">' + sym + '</span> ' + c.outcome + '</span></td>';
    tbody.appendChild(tr);
  });
}

function classifySeverity(a) {
  var t = (a.title + ' ' + a.summary).toLowerCase();
  if (t.indexOf('death') !== -1 || t.indexOf('fatali') !== -1 || t.indexOf('risk assessment') !== -1) return 'alert';
  if (t.indexOf('advisory') !== -1 || t.indexOf('travel') !== -1 || t.indexOf('warning') !== -1) return 'advisory';
  if (t.indexOf('case') !== -1 || t.indexOf('update') !== -1 || t.indexOf('surveillance') !== -1 || t.indexOf('confirm') !== -1) return 'update';
  return 'background';
}

var sevLabels = { alert: 'Alert', advisory: 'Advisory', update: 'Update', background: 'Background' };

function renderTimelineFeed(data) {
  var feed = document.getElementById('timeline-feed');
  if (!feed) return;
  feed.innerHTML = '';
  var VIS = 5;

  data.articles.forEach(function(a, i) {
    var sev = classifySeverity(a);
    var div = document.createElement('div');
    div.className = 'timeline-item severity-' + sev + (i >= VIS ? ' news-hidden' : '');
    div.innerHTML =
      '<div class="timeline-header">' +
        '<span class="timeline-date">' + a.date + '</span>' +
        '<span class="timeline-source">' + a.source + '</span>' +
        '<span class="timeline-severity sev-' + sev + '">' + sevLabels[sev] + '</span>' +
      '</div>' +
      '<a href="' + a.url + '" target="_blank" rel="noopener" class="timeline-title">' + a.title + '</a>' +
      '<div class="timeline-summary">' + a.summary + '</div>';
    feed.appendChild(div);
  });

  if (data.articles.length > VIS) {
    var btn = document.createElement('button');
    btn.className = 'news-show-more';
    btn.textContent = 'Show ' + (data.articles.length - VIS) + ' older updates';
    btn.onclick = function() {
      var h = feed.querySelectorAll('.news-hidden');
      for (var j = 0; j < h.length; j++) h[j].classList.remove('news-hidden');
      btn.remove();
    };
    feed.parentElement.appendChild(btn);
  }
}

async function init() {
  var cases = await loadJSON('data/cases.json');
  var hondius = await loadJSON('data/hondius.json');
  var historical = await loadJSON('data/historical.json');
  var news = await loadJSON('data/news.json');

  renderKPIs(cases);
  renderEpiStats(cases);
  renderHeroChange(cases, hondius);
  renderAlertBanner(cases, hondius);
  renderRoutePanel(hondius);
  renderClusterEpiStats(hondius);
  renderClusterTable(hondius);
  renderTimelineFeed(news);
  initMap(cases, hondius);
  initCharts(cases, historical);
}

document.addEventListener('DOMContentLoaded', init);
