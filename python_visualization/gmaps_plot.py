# Last-modified: 21 Oct 2013 05:35:16 PM

import numpy as np
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
import csv, os, scipy, time
import pandas
from PIL import *

data = np.loadtxt('input/sample_from_yannick.csv',dtype=np.str,delimiter=',',skiprows=1)
'''print data'''
fig = plt.figure(figsize=(12,12))

ax = fig.add_axes([0.1,0.1,0.8,0.8])

m = Basemap(llcrnrlon=6.,llcrnrlat=47.,urcrnrlon=16.,urcrnrlat=55.,
#m = Basemap(llcrnrlon=0.,llcrnrlat=0.,urcrnrlon=180.,urcrnrlat=90.,
            projection='lcc',lat_1=50.,lon_0=10.,
            resolution ='l',area_thresh=1000.)

m.drawcoastlines(linewidth=0.5)
m.drawcountries(linewidth=0.5)
m.drawstates(linewidth=0.5)
# m.bluemarble(ax=ax)

# Creates parallels and meridians
m.drawparallels(np.arange(10.,35.,5.),labels=[1,0,0,1])
m.drawmeridians(np.arange(-120.,-80.,5.),labels=[1,0,0,1])
m.drawmapboundary(fill_color='aqua')

colnames = ['Name','Latitude','Longitude']
data = pandas.read_csv('input/sample_from_yannick.csv', names=colnames)
names = list(data.Name)
lat = list(data.Latitude)
long = list(data.Longitude)

lat.pop(0)
long.pop(0)
names.pop(0)

long = [float(item) for item in long]
lat = [float(item) for item in lat]

x,y = m(long, lat)
m.plot(x, y, 'bo', markersize=6)
m.plot(x, y, 'r-', markersize=3)

labels = names
for label, xpt, ypt in zip(labels, x, y):
    plt.text(xpt+10000, ypt, label)

plt.show()



'''
#Plots points on map
for colorName in color_dict.keys():

    plt.plot(
        x[colorName == colorNames],
        y[colorName == colorNames],
        linestyle ='-',
        label=colorName,
        color=color_dict[colorName],
        linewidth=5 )

    lg = plt.legend()

    lg.get_frame().set_facecolor('grey')

plt.show()
'''