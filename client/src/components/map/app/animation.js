/* eslint-disable */

const gmaps = window.google.maps
var animationIndex = 0

function animateRoute(coords, map) {

  var self = this,
      step = 0,
      numSteps = 70,
      animationSpeed = 0.50,
      offset = animationIndex,
      nextOffset = animationIndex + 1,
      departure, destination, nextStop, line, interval

  if (nextOffset >= coords.length) {
    clearInterval(interval)
    return false
  }

  let dep = coords[offset]
  let dest = coords[nextOffset]

  let strokeColor = '#F01414'
  if (dep.medium === 'car' || dest.medium === 'car') {
    strokeColor = '#0A1E6E'
  }

  departure = coords[offset].googLatLng
  destination = coords[nextOffset].googLatLng

  line = new gmaps.Polyline({
    path: [departure, departure],
    geodesic: false,
    strokeColor: strokeColor,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    map: map
  })

  interval = setInterval(function() {
    step++
    if (step > numSteps) {
      animationIndex++
      animateRoute(coords, map)
      clearInterval(interval)
    } else {
      nextStop = gmaps.geometry.spherical.interpolate(departure,destination,step/numSteps)
      line.setPath([departure, nextStop])
    }
  }, animationSpeed)
}

export default animateRoute
