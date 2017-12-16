<template>
  <q-layout
    ref="layout"
    view="lHh Lpr fff"
    :left-class="{'bg-grey-2': true}"
  >
    <q-toolbar slot="header">
      <q-btn flat @click="$refs.layout.toggleLeft()">
        <q-icon name="menu" />
      </q-btn>

      <q-toolbar-title>Fastlane</q-toolbar-title>
    </q-toolbar>

    <div slot="left">
      <q-list no-border link inset-delimiter>
        <q-list-header>Essential Links</q-list-header>
        <q-item @click="launch('http://quasar-framework.org')">
          <q-item-side icon="school" />
          <q-item-main label="Docs" sublabel="quasar-framework.org" />
        </q-item>
        <q-item @click="launch('http://forum.quasar-framework.org')">
          <q-item-side icon="record_voice_over" />
          <q-item-main label="Forum" sublabel="forum.quasar-framework.org" />
        </q-item>
        <q-item @click="launch('https://gitter.im/quasarframework/Lobby')">
          <q-item-side icon="chat" />
          <q-item-main label="Gitter Channel" sublabel="Quasar Lobby" />
        </q-item>
        <q-item @click="launch('https://twitter.com/quasarframework')">
          <q-item-side icon="rss feed" />
          <q-item-main label="Twitter" sublabel="@quasarframework" />
        </q-item>
      </q-list>
    </div>

    <div class="layout-padding justify-center" style="padding-top: 5px;">
      <q-card class="relative-position" style="padding: 1px 10px 10px;">
        <q-inner-loading :visible="querying">
          <q-spinner-gears size="50px" color="brown-9" style="z-index: 1337;"></q-spinner-gears>
        </q-inner-loading>
        <q-field icon="location_on">
          <q-input v-model="start_name" type="text" placeholder="Start" clearable>
            <q-autocomplete
              @search="searchLocation"
              :min-characters="3"
              @selected="selectedStartLocation"
            />
          </q-input>
        </q-field>
        
        <q-field icon="location_on">
          <q-input v-model="destination_name" type="text" placeholder="Destination" clearable>
            <q-autocomplete
              @search="searchLocation"
              :min-characters="3"
              @selected="selectedDestinationLocation"
            />
          </q-input>
        </q-field>
        <q-field
          icon="schedule"
          helper="Pick a time when you want to leave">
          <q-datetime
            type="datetime"
            v-model="departure"
            :format24h="true"
            float-label="Departure"
          />
        </q-field>

        <q-btn round @click="query" color="brown-5" icon="directions" style="float: right; margin-top: -22px; z-index: 2" />
      </q-card>
      <br><br>
      <q-card class="bigger" v-if="bestRoute && !mapping">
        <q-card-title>
          {{bestRoute[bestRoute.length - 1].dst}}
          <div slot="right" class="row items-center">
            {{ route.totaltime || '6h 30min' }} <q-icon name="hourglass_empty" />
          </div>
        </q-card-title>
        <q-card-main>
            <q-progress :percentage="60" stripe animate style="height: 5px; opacity: 0.6; margin-top: -10px;" />
            <br>
            <div class="row xs-gutter" style="text-align: center;" v-for="point in bestRoute">
              <div class="col-3">
                <span class="text-faded">{{getTime(point.arrival)}}</span><br>
                <q-icon name="directions_car" v-if="point.medium === 'car'" size="30px" style="background-color: white" />
                <q-icon name="train" v-if="point.medium === 'train'" size="30px" style="background-color: white" />
                <br>
                <span class="text-faded">{{getTime(point.departure)}}</span>
              </div>
              <div class="col-6">
                <br>
                {{point.dst}}
              </div>
              <div class="col-3">
                <span class="text-faded">{{point.time}}</span>
              </div>
              <br><br>
            </div>
            <!-- <div class="row xs-gutter" style="text-align: center;">
              <div class="col-3">
                <q-icon name="directions_boat" size="30px" style="background-color: white" /><br>
                <span class="text-faded">10:00</span>
              </div>
              <div class="col-3">
                <q-icon name="directions_bike" size="30px" style="background-color: white" /><br>
                <span class="text-faded">10:00</span>
              </div>
              <div class="col-3">
                <q-icon name="directions_transit" size="30px" style="background-color: white" /><br>
                <span class="text-faded">10:00</span>
              </div>
              <div class="col-3">
                <q-icon name="directions_walk" size="30px" style="background-color: white" /><br>
                <span class="text-faded">10:00</span>

                directions_boat
                directions_bike
                directions_bus
                directions_car
                directions_railway
                directions_subway
                directions_transit
                directions_walk
                flight
                train
                tram
                person_pin
                local_taxi

              </div>
            </div>-->
        </q-card-main>
        <q-card-separator />
        <q-card-actions>
          <q-btn flat round small><q-icon name="event" /> Kalender</q-btn>
          <q-btn flat>DB-Navigator</q-btn>
          <q-btn flat>Google Maps</q-btn>
        </q-card-actions>
      </q-card>
    </div>
    
    <div class="map" v-show="mapping"></div>
  </q-layout>
</template>

<script>
import * as All from 'quasar'
import axios from 'axios'
import Route from './map/app/route'
import moment from 'moment'

const googleKey = 'AIzaSyD3f1jXRREEX4pSowzDvdQ-K6eJDYh6s6w'
const API = 'http://localhost:8085'

export default {
  name: 'index',
  components: All,
  data () {
    return {
      text: '',
      name: 'Foobar',
      start_name: '',
      destination_name: '',
      departure: null,
      querying: false,
      routes: null,
      route: null,
      mapping: true,
      bestRoute: null
    }
  },
  computed: {},
  methods: {
    query () {
      this.querying = true
      let timestamp = moment(this.departure).unix()

      axios.get(`${API}/animation?start=${this.start_name}&destination=${this.destination_name}&departure=${timestamp}`).then(res => {
        this.route.setCoordinates(res.data.map((point) => {
          return {
            latitude: point.coordinates.lat,
            longitude: point.coordinates.long,
            medium: point.medium
          }
        }))
        this.mapping = true
        this.querying = false
        setTimeout(() => {
          this.route.playAnimation()
        }, 1000)

        setTimeout(() => {
            this.mapping = false
          }, 9000)
      })

      axios.get(`${API}/route?start=${this.start_name}&destination=${this.destination_name}&departure=${timestamp}`).then(res => {
        this.bestRoute = res.data
      }).catch(e => {
        alert('Something went wrong with the routes')
      })
    },
    getDuration (route) {},
    getTime (t) {
      return moment(t).format('HH:mm')
    },
    getCoordinates (placeId) {
      let uri = `http://crossorigin.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${googleKey}`
      return axios.get(uri).then(res => {
        return res.data.result.geometry.location
      })
    },
    selectedStartLocation (item) {
      this.start_name = item.label
      this.getCoordinates(item.value).then(coordinates => {
        this.route.updateMarkers(coordinates, null)
      })
    },
    selectedDestinationLocation (item) {
      this.destination_name = item.label
      this.getCoordinates(item.value).then(coordinates => {
        this.route.updateMarkers(null, coordinates)
      })
    },
    searchLocation (location, done) {
      let uri = `http://crossorigin.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${location}&key=${googleKey}&language=de&location=50.904226,10.1842063&radius=1000`
      axios.get(uri).then(res => {
        let completions = res.data.predictions.map(prediction => {
          return {
            value: prediction.place_id,
            label: prediction.structured_formatting.main_text,
            sublabel: prediction.structured_formatting.secondary_text,
            icon: 'location_city',
            stamp: ''
          }
        })
        done(completions)
      })
    }
  },
  mounted () {
    this.route = new Route()
    // this.bestRoute = [{"arrival":"2017-12-17T00:47:00+01:00","src":"Frankfurt(Main)Süd","medium":"car","time":17039,"lat":50.099302,"dst":"Frankfurt(Main)Süd","departure":"2017-12-17T00:48:00+01:00","long":8.686178},{"arrival":"2017-12-17T07:06:00+01:00","src":"Potsdam Hbf","medium":"car","time":1239,"lat":52.391551,"dst":"Potsdam Hbf","departure":"2017-12-17T07:06:00+01:00","long":13.066711},{"arrival":"2017-12-17T07:53:00+01:00","src":"Messe Nord (S)/ICC, Berlin","medium":"train","time":0,"lat":52.506451,"dst":"Messe Nord (S)/ICC, Berlin","departure":"2017-12-17T07:53:00+01:00","long":13.28318}]
    // this.mapping = false
  },
  beforeDestroy () {}
}
</script>

<style lang="stylus">

</style>
