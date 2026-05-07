function initMap(cases, hondius) {
  var map = L.map('map', {
    center: [10, -20],
    zoom: 2,
    scrollWheelZoom: true,
    zoomControl: true,
    tap: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  var accentColor = '#1e40af';
  var dangerColor = '#991b1b';
  var riskColors = {
    'ELEVATED': '#854d0e',
    'HIGH': '#991b1b',
    'LOW': '#1e40af',
    'MONITORING': '#6b7280'
  };

  cases.countries.forEach(function(country) {
    if (country.cases_2026 === 0 && country.deaths_2026 === 0 && country.risk_level !== 'MONITORING') return;

    var radius = country.cases_2026 > 0 ? Math.max(6, Math.sqrt(country.cases_2026) * 4) : 5;
    var color = country.deaths_2026 > 0 ? dangerColor : (riskColors[country.risk_level] || accentColor);

    var circle = L.circleMarker([country.lat, country.lon], {
      radius: radius,
      fillColor: color,
      color: color,
      weight: 1.5,
      opacity: 0.8,
      fillOpacity: 0.25
    }).addTo(map);

    var popup =
      '<strong>' + country.name + '</strong>' +
      '<br>Cases: <span class="popup-cases">' + country.cases_2026 + '</span>';
    if (country.deaths_2026 > 0) {
      popup += '&ensp;Deaths: <span class="popup-deaths">' + country.deaths_2026 + '</span>';
    }
    if (country.cfr_percent > 0 && country.cases_2026 >= 2) {
      popup += '<br>CFR: ' + country.cfr_percent + '%';
    }
    if (country.risk_level) {
      popup += '<br>Risk: <strong>' + country.risk_level + '</strong>';
    }
    if (country.virus) {
      popup += '<br>' + country.virus;
    }
    if (country.notes) {
      popup += '<br><span style="color:#6b7280;font-size:11px">' + country.notes + '</span>';
    }

    circle.bindPopup(popup);

    circle.on('mouseover', function(e) { this.openPopup(); });
    circle.on('mouseout', function(e) { this.closePopup(); });
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

    var marker = L.circleMarker([point.lat, point.lon], {
      radius: markerRadius,
      fillColor: markerColor,
      color: markerColor,
      weight: 1,
      fillOpacity: 0.6
    }).addTo(map);

    marker.bindPopup(
      '<strong>' + point.label + '</strong><br>' +
      '<span style="color:#6b7280">' + point.date + '</span>'
    );

    marker.on('mouseover', function() { this.openPopup(); });
    marker.on('mouseout', function() { this.closePopup(); });
  });
}
