## Mongo Provider for [Koop](https://github.com/Esri/koop)
-----------

[![Greenkeeper badge](https://badges.greenkeeper.io/koopjs/koop-provider-mongo.svg)](https://greenkeeper.io/)

This provider makes it possible to access a collection of json documents in MongoDB as either GeoJSON or an Esri FeatureService. This is particular useful for making maps and doing analysis on the web.

## Installation

To install/use this provider you first need a working installation of [Koop](https://github.com/Esri/koop). Then from within the koop directory you'll need to run the following:

  ```
    npm install https://github.com/chelm/koop-mongo/tarball/master
  ```

In order for the provider to connect to a mongo db instance you'll need to pass in the MongoDB connection string. This is done by adding the connection string to Koop's application configuration JSON. 

