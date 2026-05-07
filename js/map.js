function initMap(cases, hondius) {
  var map = L.map('map', {
    center: [10, -20],
    zoom: 2,
    scrollWheelZoom: true,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  var accentColor = '#1e40af';
  var dangerColor = '#991b1b';

  cases.countries.forEach(function(country) {
    if (country.cases_2026 === 0 && country.deaths_2026 === 0) return;

    var radius = Math.max(6, Math.sqrt(country.cases_2026) * 4);
    var color = country.deaths_2026 > 0 ? dangerColor : accentColor;

    var circle = L.circleMarker([country.lat, country.lon], {
      radius: radius,
      fillColor: color,
      color: color,
      weight: 1.5,
      opacity: 0.8,
      fillOpacity: 0.25
    }).addTo(map);

    var popup =
      '<strong>' + country.name + '</strong><br>' +
      'Cases: <span class="popup-cases">' + country.cases_2026 + '</span>';
    if (country.deaths_2026 > 0) {
      popup += '<br>Deaths: <span class="popup-deaths">' + country.deaths_2026 + '</span>';
    }
    if (country.virus) {
      popup += '<br>' + country.virus;
    }
    if (country.notes) {
      popup += '<br><span style="color:#6b7280;font-size:12px">' + country.notes + '</span>';
    }

    circle.bindPopup(popup);
  });

  // MV Hondius ship track
  var trackCoords = hondius.track.map(function(p) { return [p.lat, p.lon]; });

  L.polyline(trackCoords, {
    color: '#6b7280',
    weight: 2,
    dashArray: '6, 4',
    opacity: 0.7
  }).addTo(map);

  hondius.track.forEach(function(point) {
    var markerColor = '#6b7280';
    var markerRadius = 3;
    var isEvent = point.label.toLowerCase().indexOf('case') !== -1 ||
                  point.label.toLowerCase().indexOf('quarantine') !== -1;

    if (isEvent) {
      markerColor = dangerColor;
      markerRadius = 5;
    }

    L.circleMarker([point.lat, point.lon], {
      radius: markerRadius,
      fillColor: markerColor,
      color: markerColor,
      weight: 1,
      fillOpacity: 0.6
    }).addTo(map).bindPopup(
      '<strong>' + point.label + '</strong><br>' +
      '<span style="color:#6b7280">' + point.date + '</span>'
    );
  });
}
