# Koop Provider Mongo

This is a cache type provider for [Koop](https://koopjs.github.io). It pulls GeoJSON data from a MongoDB document collection and translates the response into EsriJSON with some Feature Service capabilities to support ArcGIS products. 
If the document collection contains GeoJSON this provider will work, otherwise additional work may be needed for formatting a feature.   
This provider implements Koop's request ID parameter to enable querying for specified document collections. 

eg. http://localhost:3000/mongo/restaurants/featureserver/0/query

eg. http://localhost:3000/mongo/volunteers/featureserver/0/query  

## Mongo Quick Tips

Start mongo on bitnami ``` sudo /opt/bitnami/ctlscript.sh start mongodb ```

Stop mongo on bitnami ``` sudo /opt/bitnami/ctlscript.sh stop mongodb ```

Restart mongo on bitnami ``` sudo /opt/bitnami/ctlscript.sh restart mongodb ```

Open mongo shell ``` mongo ```

Show databases in shell ``` show dbs ```

Use a database ``` use <db> ```

Show collections in a database ``` show collections ```

Quit mongo shell ``` \q ```

Import JSON documents into Mongo ``` mongoimport --db geodata -c restaurants --file "food_inspections.geojson" --jsonArray ```

~ note the geojson file should only contain the features array piece and nothing else, ie. [feat1, feat2, feat3]

## Sample data for loading into MongoDB
[volunteers.geojson](https://gist.github.com/phpmaps/149df07dda69bb16dddec1a6e524dd76)

## How to use

You can use this as a plugin to an existing Koop server or use the default server or docker implementations

### Configuration

1. Update the config.js file with you mongo connection url

### Server
1. Go into /server and run `npm install`
2. Run `npm start`

### Docker
1. From the project root
1. `npm run docker-build` or `docker build -t koop-provider-mongo .`
1. `npm run docker-start` or `docker run -it -p 8080:8080 koop-provider-mongo`

### In an existing Koop Server
```js
//clean shutdown
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

// Initialize Koop
const Koop = require('koop')
const koop = new Koop()

// Install the Mongo Provider
const mongo = require('koop-mongo')
koop.register(mongo)

// Start listening for http traffic
const config = require('config')
const port = config.port || 3000
koop.server.listen(port)
console.log(`Koop Mongo listening on ${port}`)
```
