async function loadJSON(path) {
  const resp = await fetch(path);
  return resp.json();
}

function renderKPIs(data) {
  document.getElementById('kpi-cases').textContent = data.summary.total_cases_2026.toLocaleString();
  document.getElementById('kpi-deaths').textContent = data.summary.total_deaths_2026.toLocaleString();
  document.getElementById('kpi-countries').textContent = data.summary.countries_affected;
  document.getElementById('kpi-clusters').textContent = data.summary.active_clusters;
  document.getElementById('last-updated').textContent = 'Updated ' + data.last_updated;
}

function renderNews(data) {
  const list = document.getElementById('news-list');
  list.innerHTML = '';
  data.articles.forEach(function(article) {
    const li = document.createElement('li');
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

function renderClusterTable(data) {
  const tbody = document.getElementById('cluster-tbody');
  tbody.innerHTML = '';
  data.cases.forEach(function(c) {
    var statusClass = 'status-recovering';
    if (c.outcome.toLowerCase().indexOf('deceased') !== -1) statusClass = 'status-deceased';
    else if (c.outcome.toLowerCase().indexOf('hospitalized') !== -1) statusClass = 'status-hospitalized';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + c.date + '</td>' +
      '<td>' + c.nationality + '</td>' +
      '<td>' + c.description + '</td>' +
      '<td class="' + statusClass + '">' + c.outcome + '</td>';
    tbody.appendChild(tr);
  });
}

async function init() {
  var cases = await loadJSON('data/cases.json');
  var hondius = await loadJSON('data/hondius.json');
  var historical = await loadJSON('data/historical.json');
  var news = await loadJSON('data/news.json');

  renderKPIs(cases);
  renderNews(news);
  renderClusterTable(hondius);
  initMap(cases, hondius);
  initCharts(cases, historical);
}

document.addEventListener('DOMContentLoaded', init);
