import time
import json, pandas, numpy, sys
from datetime import datetime
from pandas import Series

#with open("../export.json") as json_data:
#    routes = json.load(json_data)
lines = sys.stdin.readlines()
routes_json = json.loads(lines[0])

routes = routes_json['train_route']

routes_raw = pandas.DataFrame.from_dict(routes, orient='columns', dtype=None)
col_names = list(routes_raw)

# Handling NaN of src
routes_raw.set_value(0, 'arrival', routes_raw.iloc[0]['departure'])
routes_raw.set_value(0, 'drivingTimeFromPreviousStationInSeconds', 0)

# Handling NaN of dst
#routes_raw.set_value(-1, 'departure', routes_raw.iloc[-1]['arrival'])

routes_lat_long = pandas.DataFrame.from_dict(routes_raw['coordinates'].to_dict(), orient='index', dtype=None)

routes_df = routes_raw[['name','arrival','departure','drivingTimeFromPreviousStationInSeconds']].merge(routes_lat_long, left_index=True, right_index=True)



# handleing departure NaN
is_it_nan = routes_df['departure'].isnull()
is_it_nan_list = Series.tolist(is_it_nan)

nan_index = []
for i in range(len(is_it_nan_list)):
    if is_it_nan_list[i]:
        nan_index.append(i)

for i in range(len(nan_index)):
    routes_df.set_value(nan_index[i], 'departure', routes_df.iloc[nan_index[i]]['arrival'])

# handleing arrival NaN
is_it_nan = routes_df['arrival'].isnull()
is_it_nan_list = Series.tolist(is_it_nan)

nan_index = []
for i in range(len(is_it_nan_list)):
    if is_it_nan_list[i]:
        nan_index.append(i)

for i in range(len(nan_index)):
    routes_df.set_value(nan_index[i], 'arrival', routes_df.iloc[nan_index[i]]['departure'])



#routes_df.to_csv('output/export1.csv', encoding='utf-8')

routes_df = routes_df.dropna()
routes_df = routes_df.reset_index()

routes_df['train_duration'] = 0

# comparing train duration and car duration
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

# routes_df.to_csv('output/export3.csv', encoding='utf-8')

# train routes : convert to json
convert_to_json = 1
if convert_to_json:
    result_json = []
    for i in range(routes_df.shape[0]):
        row = routes_df.iloc[i]
        newRow = {
            "name":row['name'],
            "coordinates":{
                "lat": row['latitude'],
                "long": row['longitude'],
            },
            "time":{
                "departure":row['departure'],
                "arrival":row['arrival'],
            },
            "medium": row['medium'],
        }
        result_json.append(newRow)

    print json.dumps(result_json)
