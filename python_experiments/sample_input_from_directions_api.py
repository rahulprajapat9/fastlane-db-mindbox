import googlemaps
from datetime import datetime
import polyline

# key associated with rahul.prajapat9@gmail.com
gmaps = googlemaps.Client(key='AIzaSyDXHtLAgfmGCZxYiuHYnDjebooyU4_K4o4')

'''
# Geocoding an address
geocode_result = gmaps.geocode('1600 Amphitheatre Parkway, Mountain View, CA')

# Look up an address with reverse geocoding
reverse_geocode_result = gmaps.reverse_geocode((40.714224, -73.961452))

'''

# Request directions via public transit
now = datetime.now()
directions_result = gmaps.directions("db mindbox, berlin",
                                     "berlin hbf",
                                     mode="transit",
                                     departure_time=now)

print directions_result