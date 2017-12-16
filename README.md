# fastlane-db-mindbox
Inter connected transportation system Germany

## Building the Docker file:

```
docker build -t fastlane .
```

## Running the Docker file:

```
docker run  -it -p 8080:8080 fastlane
```

## Call the backend
```
http://192.168.99.100:8080/query?start=Bad+Homburg&destination=Neubrandenburg&departure=1513588457
```
