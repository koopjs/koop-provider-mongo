'use strict'
const config = require('config')
const MongoClient = require('mongodb')

module.exports = function (koop) {

  this.getData = (req, callback) => {
    var dataCollection = req.params.id
    var url = config.get('mongo.connectionUrl')
    MongoClient.connect(url, (err, db) => {
      var features = []
      var collection = db.collection(dataCollection)
      var stream = collection.find({}).stream()
      stream.on('data', (doc) => {
        features.push(this.formatFeature(doc))
      })
      stream.on('end', ()=>{
        db.close()
        var geojson = {
          type:'FeatureCollection', 
          features:features,
          tl: 1200, //20 minutes
          metadata:  {
            name: dataCollection,
            description: "GeoJSON document storage in MongoDB, analyse in ArcGIS"
          }
        }
        callback(null, geojson) // hand the geojson back to Koop
      });
    });
  }

  this.formatFeature = (doc) => {
    return {
        type:'Feature',
        properties: doc.properties,
        geometry: doc.geometry
    };
  }
}