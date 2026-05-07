function initMap(cases, hondius) {
  var map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: true,
    tap: false,
    dragging: !L.Browser.mobile,
    touchZoom: true,
    maxBounds: [[-70, -120], [70, 60]],
    maxBoundsViscosity: 1.0
  });

  map.fitBounds([[-55, -75], [55, 20]], { padding: [20, 20], maxZoom: 4 });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  var accentColor = '#1e40af';
  var dangerColor = '#991b1b';
  var monitorColor = '#6b7280';

  cases.countries.forEach(function(country) {
    var hasCases = country.cases_2026 > 0;
    var hasDeaths = country.deaths_2026 > 0;
    var isMonitoring = country.risk_level === 'MONITORING';

    if (!hasCases && !isMonitoring) return;

    var radius = hasCases ? Math.max(7, Math.sqrt(country.cases_2026) * 4.5) : 5;
    var color = hasDeaths ? dangerColor : (isMonitoring ? monitorColor : accentColor);
    var fillOpacity = hasCases ? 0.2 : 0.1;

    var circle = L.circleMarker([country.lat, country.lon], {
      radius: radius,
      fillColor: color,
      color: color,
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: fillOpacity
    }).addTo(map);

    var popup = '<strong style="font-size:14px">' + country.name + '</strong>';
    if (hasCases) {
      popup += '<br>Cases: <span class="popup-cases">' + country.cases_2026 + '</span>';
    }
    if (hasDeaths) {
      popup += '&ensp;Deaths: <span class="popup-deaths">' + country.deaths_2026 + '</span>';
    }
    if (country.cfr_percent > 0 && country.cases_2026 >= 2) {
      popup += '<br>CFR: ' + country.cfr_percent + '%';
    }
    if (country.risk_level) {
      popup += '<br>Risk level: <strong>' + country.risk_level + '</strong>';
    }
    if (country.virus) {
      popup += '<br>' + country.virus;
    }
    if (country.notes) {
      popup += '<br><span style="color:#6b7280;font-size:11px">' + country.notes + '</span>';
    }

    circle.bindPopup(popup, { maxWidth: 260 });
    circle.on('mouseover', function() { this.openPopup(); });
    circle.on('mouseout', function() { this.closePopup(); });

    // Case count label for major countries
    if (country.cases_2026 >= 10) {
      var label = L.divIcon({
        className: '',
        html: '<span style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:' + color + '">' + country.cases_2026 + '</span>',
        iconSize: [30, 14],
        iconAnchor: [-8, 7]
      });
      L.marker([country.lat, country.lon], { icon: label, interactive: false }).addTo(map);
    }
  });

  // MV Hondius ship track — prominent
  var trackCoords = hondius.track.map(function(p) { return [p.lat, p.lon]; });

  L.polyline(trackCoords, {
    color: '#374151',
    weight: 2.5,
    dashArray: '8, 5',
    opacity: 0.8
  }).addTo(map);

  hondius.track.forEach(function(point, i) {
    var isEvent = point.label.toLowerCase().indexOf('case') !== -1 ||
                  point.label.toLowerCase().indexOf('quarantine') !== -1;

    var markerColor = isEvent ? dangerColor : '#374151';
    var markerRadius = isEvent ? 6 : 3.5;
    var fillOp = isEvent ? 0.7 : 0.5;

    var marker = L.circleMarker([point.lat, point.lon], {
      radius: markerRadius,
      fillColor: markerColor,
      color: markerColor,
      weight: isEvent ? 2 : 1,
      fillOpacity: fillOp
    }).addTo(map);

    marker.bindPopup(
      '<strong>' + point.label + '</strong><br>' +
      '<span style="color:#6b7280">' + point.date + '</span>',
      { maxWidth: 220 }
    );

    marker.on('mouseover', function() { this.openPopup(); });
    marker.on('mouseout', function() { this.closePopup(); });
  });
}
