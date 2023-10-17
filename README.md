# koop-provider-mongo

Provider to fetch data from a MongoDb instance.  It can access any database/collection on your instance by assigning the `id` route-parameter a delimited value in the form of `database-name::collection-name`.

## Data considerations
As per MongoDB specifications, [each document/record in your dataset will have a unique-identifier](https://www.mongodb.com/docs/manual/core/document/#the-_id-field), `_id`.  At insert time, you can choose to assign this value manually, or allow Mongo to generate it automatically. In terms of your provider metadata, this means that you could always use `_id` as the value of your provider's `idField` (an attribute used to flag which GeoJSON property is the unique-identifier).

If your data has a geometry, you should consider using [geospatial index](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-geospatial/).  While not necessary, it will likely speed any queries including a geometry operation.

## Usage

Register the provider with Koop:

```js
const Koop = require('@koopjs/koop-core');
const koop = new Koop({ logLevel: 'info'});
const mongoProvider = require('@koopjs/provider-mongodb');

koop.register(mongoProvider, { connnectString, databases });
```

### Registration/Config parameters
The provider can be configured with registration options or the use of the `config` module with an entry key `"mongodb"` in the JSON configuration document.  See below, for an example of using the `config` approach 


#### `connectString`: string
A MongoDB connection string, e.g., `mongodb://localhost:27017`. 

#### `databases`: object
A key/value populated object that serves as a metadata lookup/dictionary for any database/collection on your MongoDB instance that you wish to provide access.  For example, if imagine you have a database called `db1` and it has a collection called `my-collection`.  You can set up the `databases` object so as to provide metadata for `my-collection`:

```js
{
  db1: {
    'my-collection': {
      geometryField: 'location', // field holding a record's GeoJSON geometry.
      idField: '_id', // field to treat as the unique-id.  Default: `_id`.
      cacheTtl: 0, // number of seconds to cache results from MongoDb. Default: 0.
      crs: 4326, // Coordinate reference system of geometry. Default: 4326.
      maxRecordCount: 2000, // Max number of records to return in a page. Default: 2000.
    }
  }
}
```

Note that for each collection, you may configure the options above.  If you do not assign a field to `geometryField`, the collection will be treated like tabular data, and the GeoJSON generated will have no geometry,

#### `definedCollectionsOnly`: boolean
This setting determines if the database/collection must appear in the `databases` parameter to be accessed. Defaults to `true`.


#### Setting with the "config" module
Koop allows providers to use the [`config` module](https://github.com/node-config/node-config). The settings above can be stored in a config JSON under the key `mongodb`:

```json
{
  "mongodb": {
      "connectString": "mongodb://localhost:27017",
      "databases": {
        "cdf-sample-data": {
          "fires": {
            "geometryField": "location",
            "idField": "_id",
            "cacheTtl": 0,
            "crs": 4326,
            "maxRecordCount": 2000
          }
        }
      }
  }
}
```

## Route parameters

#### `id`
Once registered with Koop, the provide will expose routes with an `id` parameter. For example:

```sh
/mongodb/rest/services/:id/FeatureServer
```

The `id` parameter should be filled with a `::` delimited string with the target `<database>::<collection>`.  For example, a request like:

```sh
/mongodb/rest/services/sample-db::fires/FeatureServer/0/query
```

would return records from the `fires` _collection_ in the `sample-db` _database_. 

## Demo

The repository includes a demonstration project.  To run the demo you will need Docker installed on your computer. Once installed you can following the steps below to create a local Elastic instance and load it with sample data:

```sh
> npm install

> cd demo

# use Docker to run Elastic/Kibana
> docker-compose up -d

# load sample data; this will create an MongoDB database called "sample-data' with a collection named "fires"
> node loader.js 

# start the Koop application
> node index.js
```