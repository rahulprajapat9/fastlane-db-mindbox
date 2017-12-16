/* eslint-disable */

import _ from 'lodash'
import points from './points'
import styles from './styles'
import animateRoute from './animation'

const gmaps = window.google.maps
let filters = {}

function Route (options) {
  this.options = this.extend(this._options, options)
  this.init()
}

let startMarker = null
let destinationMarker = null

Route.prototype = {

  // default options
  _options: {
    initializeFilters: true,
    animate: false
  },

  map: {},

  mapTileListener: null,

  coordinates: [],

  line: {},

  enabledFilters: {},

  init: function () {
    this.enabledFilters = {}
    this.parseJSON(points)
  },

  parseJSON: function (data) {
    this.coordinates = data.map(function (item) {
      item.lat = item.latitude
      item.lng = item.longitude
      item.googLatLng = new gmaps.LatLng(item.latitude, item.longitude)
      return item
    })

    this.drawMap()
  },

  setCoordinates: function (data) {
    this.coordinates = data.map(function (item) {
      item.lat = item.latitude
      item.lng = item.longitude
      item.googLatLng = new gmaps.LatLng(item.latitude, item.longitude)
      return item
    })
  },

  drawMap: function () {
    var self = this

    self.map = new gmaps.Map(document.querySelector('.map'), {
      center: new gmaps.LatLng(52.228462,10.629374),
      zoom: 6,
      mapTypeId: gmaps.MapTypeId.ROADMAP,
      styles: styles,
      panControl: false,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      scrollwheel: false,
      zoomControlOptions: {
        position: gmaps.ControlPosition.LEFT_BOTTOM,
        style: gmaps.ZoomControlStyle.LARGE
      }
    })

    // Wait map to be fully loaded before set the markers
    self.mapTileListener = gmaps.event.addListener(self.map, 'tilesloaded', function () {
      self.setMarkers()
      gmaps.event.removeListener(self.tileListener)
    })
  },
  setMarkers: function () {
    var self = this
    var pin = new gmaps.MarkerImage('statics/pin.png', null, null, null, new gmaps.Size(26, 31))

    startMarker = new gmaps.Marker({
      position: self.coordinates[0].googLatLng,
      icon: pin
      // animation: google.maps.Animation.DROP
    })

    destinationMarker = new google.maps.Marker({
      position: self.coordinates[self.coordinates.length-1].googLatLng,
      icon: pin
      // animation: google.maps.Animation.DROP
    })

    // self.updateRoutes()
  },
  updateMarkers: function (start, destination) {
    if (start) {
      startMarker.position = new gmaps.LatLng(start.lat, start.lng)
      startMarker.setMap(this.map)
    }

    if (destination) {
      destinationMarker.position = new gmaps.LatLng(destination.lat, destination.lng)
      destinationMarker.setMap(this.map)
    }

    console.log('Updated markers')
  },
  updateRoutes: function() {
    var pathCoordinates = this.normalizeCoordinates()

    if(this.options.animate) {
      this.enabledFilters = {}
      pathCoordinates = this.normalizeCoordinates()
      animateRoute(pathCoordinates, this.map)
      return
    }

    this.line = new gmaps.Polyline({
      path: pathCoordinates,
      geodesic: false,
      strokeColor: '#f1d32e',
      strokeOpacity: 1,
      strokeWeight: 2
    })

    this.line.setMap(this.map)
  },
  // Remove potentially erroneous points
  normalizeCoordinates: function() {
    var self = this
    var filtersList = _.keys(self.enabledFilters)

    return _.reduce(filtersList, function(memo, filter) {
      return self.enabledFilters[filter](memo)
    }, self.coordinates)
  },
  playAnimation: function() {
    if (this.line.setMap) {
      this.line.setMap(null)
    }

    this.options.animate = true
    this.updateRoutes()
  },
  extend: function(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key]
      }
    }
    return a
  }
}

export default Route
