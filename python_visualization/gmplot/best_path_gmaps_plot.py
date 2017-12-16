import gmplot

import time
import json, pandas, numpy
from datetime import datetime
from pandas import Series

with open("export.json") as json_data:
    routes = json.load(json_data)

routes = routes['train_route']

routes_raw = pandas.DataFrame.from_dict(routes, orient='columns', dtype=None)

routes_lat_long = pandas.DataFrame.from_dict(routes_raw['coordinates'].to_dict(), orient='index', dtype=None)

routes_df = routes_raw[['name','arrival','departure','drivingTimeFromPreviousStationInSeconds']].merge(routes_lat_long, left_index=True, right_index=True)

# TO DO : handle src and dst NaN values properly

routes_df.to_csv('output/export.csv', encoding='utf-8')

routes_df = routes_df.dropna()
routes_df = routes_df.reset_index()

routes_df['train_duration'] = 0

for i in range(routes_df.shape[0] - 1):
    tm1 = datetime.strptime(routes_df.iloc[i]['departure'][:19], '%Y-%m-%dT%H:%M:%S')
    tm2 = datetime.strptime(routes_df.iloc[i+1]['arrival'][:19], '%Y-%m-%dT%H:%M:%S')

    routes_df.set_value(i+1, 'train_duration', (tm2-tm1).seconds)

routes_df['medium'] = 'train'

routes_df['medium'] = numpy.where(
    routes_df['train_duration'] -
    routes_df['drivingTimeFromPreviousStationInSeconds']  > 0,
    'car',
    'train'
)

gmap = gmplot.GoogleMapPlotter(51, 9, 9)

latitudes = Series.tolist(routes_df['latitude'])
longitudes = Series.tolist(routes_df['longitude'])

latitudes_marker = [latitudes[0],latitudes[-1]]
longitudes_marker = [longitudes[0],longitudes[-1]]

gmap.plot(latitudes, longitudes, 'blue', edge_width=6)



latitudes_car = []
longitudes_car = []
for i in range(routes_df.shape[0]):
    if routes_df.iloc[i]['medium'] == 'car':
        latitudes_car.append(routes_df.iloc[i - 1]['latitude'])
        latitudes_car.append(routes_df.iloc[i]['latitude'])
        longitudes_car.append(routes_df.iloc[i - 1]['longitude'])
        longitudes_car.append(routes_df.iloc[i]['longitude'])

        gmap.plot(latitudes_car, longitudes_car, 'yellow', edge_width=6)

        latitudes_car = []
        longitudes_car = []

gmap.scatter(latitudes, longitudes, '#3B0B39', size=800, marker=False)
gmap.scatter(latitudes_marker, longitudes_marker, 'r', marker=True)

#gmap.scatter(latitudes, longitudes, 'k', marker=True)
#gmap.heatmap(latitudes, longitudes)

gmap.draw("mymap.html")