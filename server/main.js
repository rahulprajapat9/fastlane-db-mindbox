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

let getAvailableCars = (coordinates) => {
  got.get(`https://api.deutschebahn.com/flinkster-api-ng/v1/bookingproposals?lat=${coordinates.latitude}&lon=${coordinates.longitude}&radius=2000&limit=10&providernetwork=1&expand=rentalobject`,
    { json: true, headers: { 'Authorization': 'Bearer 22f25a853aaa0539ba5a91f7363775f7' } }).then(result => {
      //return result.body.items
      pretty(result.body)
    }).catch(console.error)
}

let getTrainData = (start_station, end_station) => {
  return getSteps(start_station, end_station).then(result => {
    let steps = result.map((step, index) => {
      if (index > 0) {
        return getCarDistance(result[index - 1].coordinates, step.coordinates).then(ret => {
          step.drivingTimeFromPreviousStationInSeconds = ret.value
          step.drivingTimeText = ret.text
          //step.getAvailableCars = getAvailableCars(step.coordinates)
          return step
        })
      }
      return step
    })
    return Promise.all(steps)
  })
}


let getCarData = (origin, destination) => {
  return got.get(`https://maps.googleapis.com/maps/api/directions/json\?origin\=${origin}\&destination\=${destination}\&mode\=drive\&key\=${google_key}`, {
    json: true
  }).then(result => {
    return {
      "distance": _.get(result.body, 'routes.0.legs.0.distance', null),
      "duration": _.get(result.body, 'routes.0.legs.0.duration', null)
    }
  })
}

let getRawData = (origin, destination, departure_time) => {
  return got.get(`https://maps.googleapis.com/maps/api/directions/json\?origin\=${origin}\&destination\=${destination}\&transit_mode\=train\&mode\=transit\&key\=${google_key}`, {
    json: true
  }).then(result => {
    let start = {
      "coordinates": result.body.routes[0].legs[0].start_location,
      "name": result.body.routes[0].legs[0].start_address
    }
    let end = {
      "coordinates": result.body.routes[0].legs[0].end_location,
      "name": result.body.routes[0].legs[0].end_address
    }

    return Promise.all([getStation(start), getStation(end), getCarData(origin, destination)]).spread((start, end, cardata) => {
      return Promise.props({
        "train_route": getTrainData(start, end),
        "car_route": cardata
      })
    })
  })
}

let getCarDistance = (start, end) => {
  return got.get(`https://maps.googleapis.com/maps/api/distancematrix/json\?origins\=${start.latitude},${start.longitude}\&destinations=${end.latitude},${end.longitude}\&departure_time\=now\&key\=${google_key}`, {
    json: true
  }).then(result => {
    return _.get(result.body, 'rows.0.elements[0].duration_in_traffic', null)
  }).catch(console.error)
}

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
      return _(result).flattenDeep().uniqBy('coordinates').value()
    })
}

module.exports.getRawData = getRawData;

// getRawData("Bad Homburg", "Neubrandenburg", "now").then(result => pretty(result)).catch(console.error)
