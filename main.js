const Promise = require('bluebird')
const hafas = require('db-hafas')
const _ = require('lodash')
const got = require('got')
const geolib = require('geolib')

const google_key = 'AIzaSyD3f1jXRREEX4pSowzDvdQ-K6eJDYh6s6w'

let pretty = (str) => console.log(JSON.stringify(str, null, 2))

let getStation = (location) => {
  return hafas.locations(location.name, {
    fuzzy: true
  }).then(locs => {
    locs = locs.filter(loc => _.get(loc, 'coordinates'))
    return _.sortBy(locs, loc => {
      return geolib.getDistance({
          latitude: location.coordinates.lat,
          longitude: location.coordinates.lng
        },
        loc.coordinates)
    })
  }).then(result => result[0])
}

got.get(`https://maps.googleapis.com/maps/api/directions/json\?origin\=Bad+Homburg\&destination\=Neubrandenburg\&transit_mode\=train\&mode\=transit\&key\=${google_key}`, {
    json: true
  })
  .then(result => {
    let start = {
      "coordinates": result.body.routes[0].legs[0].start_location,
      "name": result.body.routes[0].legs[0].start_address
    }
    let end = {
      "coordinates": result.body.routes[0].legs[0].end_location,
      "name": result.body.routes[0].legs[0].end_address
    }

    return Promise.props({
      "start_station": getStation(start),
      "end_station": getStation(end)
    })
  }).then(stations => {
    getSteps(stations.start_station, stations.end_station).then(result => {
      pretty(result)
    })
  }).catch(console.error)

let getSteps = (start, end) => {
  return hafas.journeys(start.id, end.id, {
      passedStations: true
    })
    .then((journeys) => {
      let parts = journeys[0].parts.filter(part => _.get(part, 'passed'))
      return parts.map(part => {
        return part.passed.map(passed => {
          let stat = passed.station
          return {
            "name": stat.name,
            "coordinates": stat.coordinates,
            "arrival": passed.arrival,
            "departure": passed.departure
          }
        })
      })
    }).then(result => {
      return _(result).flattenDeep().uniqBy('coordinates') 
    })  
}

//.then((output) => console.log(JSON.stringify(output, null, 2)))
