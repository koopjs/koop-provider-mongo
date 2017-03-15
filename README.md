# Koop Provider Mongo

This is a cache type provider for [Koop](https://koopjs.github.io). It pulls data from MongoDB and translates the response to GeoJSON and then gets served out a EsriJSON with Feature Service capabilities for use with ArcGIS products.

## Mongo Quick Tips


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
