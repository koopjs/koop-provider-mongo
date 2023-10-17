const { MongoClient, ServerApiVersion } = require('mongodb');
const SQLParser = require('@synatic/noql');
const {
  standardizeGeometryFilter,
  combineObjectIdsAndWhere,
} = require('@koopjs/geoservice-utils');
const config = require('config');
const relationLookup = {
  esriSpatialRelIntersects: '$geoIntersects',
  esriSpatialRelWithin: '$geoWithin',
};

class Model {
  #client;
  #databaseLookup;
  #logger;

  constructor({ logger }, { conn, databaseLookup }) {
    this.#logger = logger;
    const databaseUri = conn || config.mongodb.connectString;
    this.#client = new MongoClient(databaseUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    this.#databaseLookup = databaseLookup || config.mongodb.databases;
  }

  async getData(req, callback) {
    // Parse the "id" parameter from route-path
    const [databaseName, collectionName] = req.params.id.split('::');

    // Get collection specific config data
    const {
      geometryField,
      idField,
      cacheTtl = 0,
      crs = 4326,
      maxRecordCount = 2000,
    } = this.#databaseLookup[databaseName]?.[collectionName] || {};

    try {
      // Access specific database collection
      const collection = this.#client.db(databaseName).collection(collectionName);

      // Get request query/body params
      const geoserviceParams = req.query;
      const { resultRecordCount = maxRecordCount } = geoserviceParams;
  
      // Convert Geoservice params to MongoDB equivalents
      const { query, limit, skip, sort } =
        convertGeoserviceParamsToMongoEquivalents({
          ...geoserviceParams,
          geometryField,
          idField,
          crs,
          resultRecordCount,
        });
  
      // Get data from MongoDB
      const results = await collection
        .find(query || {})
        .limit(limit || maxRecordCount)
        .skip(skip || 0)
        .sort(sort || {})
        .project(buildProjection(geoserviceParams.outFields, '_id', 'location'))
        .toArray();
  
      const features = results.map((record) => {
        const { [geometryField]: geometry, ...properties } = record;
        return { geometry, properties };
      });
  
      const geojson = {
        type: 'FeatureCollection',
        features,
        metadata: { idField, maxRecordCount },
        filtersApplied: {
          where: true,
          objectIds: true,
          geometry: true,
          resultRecordCount: true,
          resultOffset: true,
        },
        ttl: cacheTtl,
        crs,
      };
      callback(null, geojson);
    } catch (error) {
      this.#logger.error(`MongoDB Provider: ${JSON.stringify(error)}`);
      callback(error);
    }
  }
}

function convertGeoserviceParamsToMongoEquivalents(params) {
  const { geometry, geometryField } = params;

  // Convert geoservice where, objectIds, resultRecordCount, result offset to SQL equivalent
  const sql = buildSqlQuery(params);

  // Convert SQL to MongoDB "find" parameters
  const mongoFindParams = SQLParser.parseSQL(sql);

  const { query = {} } = mongoFindParams;

  // Add any geoservice geometry filter to the MongoDB "find" parameterization
  if (geometry) {
    const geometryFilter = standardizeGeometryFilter(params);
    query[geometryField] = {
      [relationLookup[geometryFilter.relation]]: {
        $geometry: geometryFilter.geometry,
      },
    };
  }

  return { ...mongoFindParams, query };
}

function buildSqlQuery(params) {
  const {
    where,
    orderByFields,
    objectIds,
    resultRecordCount,
    resultOffset,
    idField,
  } = params;

  // combine the "where" and "objectIds"
  const combinedWhere = combineObjectIdsAndWhere({ where, objectIds, idField });
  const whereClause = combinedWhere ? ` WHERE ${combinedWhere}` : '';

  const orderByClause = orderByFields ? ` ORDER BY ${orderByFields}` : '';

  const limitClause = resultRecordCount ? ` LIMIT ${resultRecordCount}` : '';

  const offsetClause = resultOffset ? ` OFFSET ${resultOffset}` : '';

  return `SELECT * FROM collection${whereClause}${orderByClause}${limitClause}${offsetClause}`;
}

function buildProjection(outFields = '*', idField, geometryField) {
  if (outFields === '*') {
    return {};
  }

  const fields = outFields.split(',');

  const projection = fields.reduce((acc, cur) => {
    acc[cur] = 1;
    return acc;
  }, {});

  if (geometryField) {
    projection[geometryField] = 1;
  }

  if (!fields.includes(idField)) {
    projection[idField] = 0;
  }

  return projection;
}

module.exports = Model;
