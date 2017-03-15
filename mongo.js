'use strict'
const config = require('config')
const MongoClient = require('mongodb')

module.exports = function (koop) {

  this.getData = (req, callback) => {
    var url = config.get('mongo.connectionUrl')
    MongoClient.connect(url, (err, db) => {
      var features = []
      var collection = db.collection('restaurants')
      var stream = collection.find({}).stream()
      stream.on('data', (doc) => {
        features.push(this.formatFeature(doc))
      })
      stream.on('end', ()=>{
        var geojson = this.translate(features)
        callback(null, geojson) // hand the geojson back to Koop
        db.close()
      });
    });
  }

  this.translate = (data) => {
    var geojson = {type:'FeatureCollection', features:data}
    geojson.ttl = 60 * 60
    return geojson
  }

  this.formatFeature = (doc) => {
    return {
        type:'Feature',
        properties: doc.properties,
        geometry: doc.geometry
    };
  }
}