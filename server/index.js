//clean shutdown
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

// Initialize Koop
const Koop = require('koop')
const koop = new Koop()

// Install the Mongo Provider
const mongo = require('../')
koop.register(mongo)

// Start listening for http traffic
const config = require('config')
const port = config.port || 3000
koop.server.listen(port)
console.log(`Koop Mongo listening on ${port}`)
