var fs = require('fs'),
  crypto = require('crypto');

// a function that is given an instance of Koop at init
var Controller = function( mongo, BaseController ){

  var controller = {};
  controller.__proto__ = BaseController(); 

  controller.list = function(req, res){
    mongo.collections(function(err, data){
      if (err) {
        res.send( err, 500);
      } else {
        res.json( data );
      }
    });
  };

  controller.get = function(req, res){
    // Get the item 
    mongo.getFeatures( req.params.id, req.query, function(error, itemJson){
      if (error) {
        res.send( error, 500);
      } else if ( req.params.format ) {
        // change geojson to json
        req.params.format = req.params.format.replace('geojson', 'json');

        var dir = ['mongo', req.params.id ].join(':');
        // build the file key as an MD5 hash that's a join on the paams and look for the file 
        var toHash = JSON.stringify( req.params ) + JSON.stringify( req.query );
        var key = crypto.createHash('md5').update( toHash ).digest('hex');

        var path = ['files', dir].join('/');
        var fileName = key + '.' + req.params.format;
        mongo.files.exists( path, fileName, function( exists, path ){
          if ( exists ){
            if (path.substr(0, 4) == 'http'){
              res.redirect( path );      
            } else {
              res.sendfile( path );
            }
          } else {
            mongo.exportToFormat( req.params.format, dir, key, itemJson, {}, function(err, file){
              if (err){
                res.send(err, 500);
              } else {
                res.sendfile( file );
              }
            });
          }
        });
      } else { 
        res.json( itemJson );
      }
    });
  };

  controller.featureserver = function( req, res ){
    var callback = req.query.callback;
    delete req.query.callback;
    
    for (var k in req.body){
      req.query[k] = req.body[k];
    }

    mongo.getFeatures( req.params.id, req.query, function(err, geojson){
      if (err) {
        res.send( err, 500);
      } else {
        // pass to the shared logic for FeatureService routing
        delete req.query.geometry;
        delete req.query.where;
        req.query.idField = req.query.idField || 'id';
        controller.processFeatureServer( req, res, err, [geojson], callback);
      }
    });
    
  };

  controller.preview = function(req, res){
    res.render(__dirname + '/../views/demo', { locals:{ id: req.params.id } });
  };

  return controller;

}

module.exports = Controller;
