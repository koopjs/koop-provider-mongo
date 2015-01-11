var mongojs = require('mongojs');

var mongo = function( koop ){
  
  var mongo = {};
  mongo.__proto__ = koop.BaseModel( koop );
  
  // connect to the mongo db from the higher level koop config 
  mongo.db = mongojs.connect(koop.config.mongo.conn, ['mountains']);

  // list all the collections
  mongo.collections = function(callback) {
    mongo.db.getCollectionNames(callback);
  };

  // get all the features/rows from mongo, and them into GeoJSON
  // NOTE: this code will need to be customized to what structure of data is in the collection 
  mongo.getFeatures = function( id, options, callback ){
    var self = this;
    mongo.db[id+''].find({}, function(err, docs ){
      if (err) {
        callback(err, null);
      } else {
        var geojson = {type:'FeatureCollection', features:[]};
        var feature;

        // CREATE GEOJSON FROM DOCS
        // REPLACE THIS CODE WITH CODE THAT WOULD TURN A DOC INTO A GEOJSON FEATURE
        docs.forEach(function(doc,i){
          feature = {
            type:'Feature',
            properties: {id: i},
            geometry: {
              type:'Point',
              coordinates: [0,0]
            }
          };
          geojson.features.push(feature);      
        });
        callback( null, geojson );
      }
    });
  };

  return mongo;

};


module.exports = mongo;

