import time
import json, pandas

with open("input/export.json") as json_data:
    routes = json.load(json_data)

print routes

routes_raw = pandas.DataFrame.from_dict(routes, orient='columns', dtype=None)

routes_lat_long = pandas.DataFrame.from_dict(routes_raw['coordinates'].to_dict(), orient='index', dtype=None)

routes_df = routes_raw[['name','arrival','departure']].merge(routes_lat_long, left_index=True, right_index=True)

print routes_df

routes_df.to_csv('output/export.csv', encoding='utf-8')