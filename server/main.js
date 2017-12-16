const Promise = require('bluebird')
const hafas = require('db-hafas')
const _ = require('lodash')
const got = require('got-retry')
const geolib = require('geolib')
const moment = require('moment')
const utf8 = require('utf8')

const google_key = 'AIzaSyD3f1jXRREEX4pSowzDvdQ-K6eJDYh6s6w'
const db_key = 'Bearer 22f25a853aaa0539ba5a91f7363775f7'

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
  /* return got.get(`https://api.deutschebahn.com/flinkster-api-ng/v1/bookingproposals?lat=${coordinates.latitude}&lon=${coordinates.longitude}&radius=2000&limit=10&providernetwork=1&expand=rentalobject`,
    { json: true, headers: { 'Authorization': db_key }, retries: 100}).then(result => {
      return result.body.items.map(item => {
        got.get(item.price.href, { json: true, headers: { 'Authorization': db_key } }).then(price => {
          item.price = price
          return item
        })
      })
    }).catch(console.error)*/
  return null
}

let getTrainData = (journey) => {
  return getSteps(journey).then(result => {
    let steps = Promise.resolve(result).map((step, index) => {
      if (index <= 0) {
        return step
      }
      return Promise.all([getCarDistance(result[index - 1].coordinates, step.coordinates),
      getAvailableCars(step.coordinates)]).spread((distance, cars) => {
        step.drivingTimeFromPreviousStationInSeconds = distance.value
        step.drivingTimeText = distance.text
        step.availableCars = cars
        return step
      })
    })
    return Promise.all(steps)
  })
}


let getCarRoute = (origin, destination, departure_time) => {
  return got.get(`https://maps.googleapis.com/maps/api/distancematrix/json\?origins\=${origin.latitude},${origin.longitude}\&destinations\=${destination.latitude},${destination.longitude}\&mode\=drive\&key\=${google_key}&traffic_model=optimistic&departure_time=${departure_time}`, {
    json: true
  }).then(result => {
    return {
      "duration": _.get(result.body, 'rows.0.elements[0].duration_in_traffic', null)
    }
  }).catch(console.error)
}


let getCarData = (journey) => {
  let pairs = journey.parts.filter(part => {
    // Discard pairs that are less than 2km away
    return geolib.getDistance(part.origin.coordinates, part.destination.coordinates) > 2000
  })
  return Promise.resolve(pairs).map(part => {
    return getCarRoute(part.origin.coordinates, part.destination.coordinates,
    moment(part.departure).unix()).then(route => {
      let carRoute = {
        "from": part.origin.name,
        "to": part.destination.name,
        "car_route": route,
      }
      return carRoute
    })
  })
}


let aggregate = (start, end, departure_time) => {
  console.log(departure_time)

  return hafas.journeys(start.id, end.id, {
    passedStations: true,
    results: 10,
    when: moment.unix(departure_time).toDate(),
    transfers: 20
  }).then(result => {
    let journey = result[0]
    return Promise.all([getTrainData(journey),
    getCarData(journey)]).spread((traindata, cardata) => {
      return Promise.props({
        "train_route": traindata,
        "suggested_car_routes": cardata
      })
    })
  }).catch(console.error)
}


let getRawData = (origin, destination, departure_time) => {
  return got.get(`https://maps.googleapis.com/maps/api/directions/json\?origin\=${encodeURIComponent(origin)}\&destination\=${destination}\&transit_mode\=train\&mode\=transit\&key\=${google_key}`, {
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
    return Promise.all([getStation(start), getStation(end)]).spread((start, end) => {
      return aggregate(start, end, departure_time)
    })
  }).catch(console.error)
}

let getCarDistance = (start, end, departure_time) => {
  return got.get(`https://maps.googleapis.com/maps/api/distancematrix/json\?origins\=${start.latitude},${start.longitude}\&destinations=${end.latitude},${end.longitude}\&departure_time\=now\&key\=${google_key}&traffic_model=optimistic`, {
    json: true
  }).then(result => {
    return _.get(result.body, 'rows.0.elements[0].duration_in_traffic', null)
  }).catch(console.error)
}

let getSteps = (journey) => {
  let parts = journey.parts.filter(part => _.get(part, 'passed'))
  let result = parts.map(part => {
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
  return Promise.resolve(_(result).flattenDeep().uniqBy('coordinates').value())
}

module.exports.getRawData = getRawData;

// getRawData("Bad Homburg", "Neubrandenburg", "now").then(result => pretty(result)).catch(console.error)
// getRawData("Bad Homburg", "Neubrandenburg", Math.floor(1513420630986)).then(result => pretty(result)).catch(console.error)
