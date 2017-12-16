import time
import json, pandas, numpy
from datetime import datetime

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

routes_df.to_csv('output/export.csv', encoding='utf-8')

convert_to_json = 1
if convert_to_json:
    result_json = []
    for i in range(routes_df.shape[0]):
        row = routes_df.iloc[i]
        newRow = {
            "lat": row['latitude'],
            "long": row['longitude'],
            "time": row['train_duration'],
            "medium": row['medium'],

        }
        result_json.append(newRow)

    print result_json

    filename = 'output/best_path.json'
    with open(filename, 'w') as outfile:
        json.dump(result_json, outfile)
