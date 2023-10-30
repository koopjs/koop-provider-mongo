const { promisify } = require('util');
const Provider = require('./model');
const mongo = require('mongodb');
const config = require('config');
delete process.env.NODE_ENV;
jest.mock('mongodb');

const mockMongoApi = {};

const logger = {
  error: () => {},
};

describe('Provider class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoApi.find = jest.fn(() => mockMongoApi);
    mockMongoApi.sort = jest.fn(() => mockMongoApi);
    mockMongoApi.skip = jest.fn(() => mockMongoApi);
    mockMongoApi.limit = jest.fn(() => mockMongoApi);
    mockMongoApi.project = jest.fn(() => mockMongoApi);
    mockMongoApi.aggregate = jest.fn(() => []);
    mockMongoApi.toArray = jest.fn(() => []);

    const collectionMock = jest.fn(() => mockMongoApi);
    const dbMock = jest.fn(() => {
      return {
        collection: () => collectionMock(),
      };
    });

    mongo.MongoClient.mockImplementation(function () {
      return {
        db: () => dbMock(),
      };
    });
    config.mongodb = undefined;
  });

  describe('constructor', () => {
    test('instantiate without registration options', () => {
      const provider = new Provider({ logger });
      expect(provider.getData).toBeInstanceOf(Function);
    });

    test('instantiate with registration options', () => {
      const provider = new Provider(
        { logger },
        {
          connectString: { node: 'http://localhost' },
          definedCollectionsOnly: true,
          databases: { foo: {} },
        },
      );
      expect(provider.getData).toBeInstanceOf(Function);
    });
  });

  describe('getData', () => {
    describe('collection configuration', () => {
      test('request for collection without configuration', async () => {
        mockMongoApi.toArray = jest.fn(() => [{ _id: 1, foo: 'bar' }]);

        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: {},
        };
        const results = await getData(req);
        expect(results).toEqual({
          crs: 4326,
          features: [
            {
              geometry: undefined,
              properties: { _id: 1, foo: 'bar' },
            },
          ],
          filtersApplied: {
            geometry: true,
            objectIds: true,
            resultOffset: true,
            resultRecordCount: true,
            where: true,
          },
          metadata: { idField: '_id', maxRecordCount: 2000 },
          ttl: 0,
          type: 'FeatureCollection',
        });
        expect(mockMongoApi.find.mock.calls[0]).toEqual([{}]);
      });

      test('request for collection without configuration, blocked', async () => {
        config.mongodb = { definedCollectionsOnly: true };

        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: {},
        };

        try {
          await getData(req);
        } catch (error) {
          expect(error.message).toBe('Not Found');
        }
      });

      test('request for collection with configuration', async () => {
        config.mongodb = {
          databases: {
            foo: {
              bar: {
                geometryField: 'location',
                idField: 'other',
                cacheTtl: 10,
                crs: 3857,
                maxRecordCount: 500,
              },
            },
          },
        };

        mockMongoApi.toArray = jest.fn(() => [
          { other: 1, location: { type: 'Point', coordinates: [1000, 2000] } },
        ]);

        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: {},
        };

        const results = await getData(req);
        expect(results).toEqual({
          crs: 3857,
          features: [
            {
              geometry: { type: 'Point', coordinates: [1000, 2000] },
              properties: { other: 1 },
            },
          ],
          filtersApplied: {
            geometry: true,
            objectIds: true,
            resultOffset: true,
            resultRecordCount: true,
            where: true,
          },
          metadata: { idField: 'other', maxRecordCount: 500 },
          ttl: 10,
          type: 'FeatureCollection',
        });
        expect(mockMongoApi.find.mock.calls[0]).toEqual([{}]);
      });
    });

    describe('pass-through operations', () => {
      test('request with geometry filter', async () => {
        config.mongodb = {
          databases: {
            foo: {
              bar: {
                geometryField: 'location',
              },
            },
          },
        };

        mockMongoApi.toArray = jest.fn(() => [
          { _id: 1, location: { type: 'Point', coordinates: [-122, 46] } },
        ]);

        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: { geometry: '-123,45,-119,49' },
        };

        const results = await getData(req);
        expect(results).toEqual({
          crs: 4326,
          features: [
            {
              geometry: { type: 'Point', coordinates: [-122, 46] },
              properties: { _id: 1 },
            },
          ],
          filtersApplied: {
            geometry: true,
            objectIds: true,
            resultOffset: true,
            resultRecordCount: true,
            where: true,
          },
          metadata: { idField: '_id', maxRecordCount: 2000 },
          ttl: 0,
          type: 'FeatureCollection',
        });
        expect(mockMongoApi.find.mock.calls[0]).toEqual([
          {
            location: {
              $geoIntersects: {
                $geometry: {
                  coordinates: [
                    [
                      [-123, 45],
                      [-119, 45],
                      [-119, 49],
                      [-123, 49],
                      [-123, 45],
                    ],
                  ],
                  type: 'Polygon',
                },
              },
            },
          },
        ]);
      });

      test('request with outFields', async () => {
        config.mongodb = {
          databases: {
            foo: {
              bar: {
                geometryField: 'location',
              },
            },
          },
        };
        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: { outFields: 'hello' },
        };

        const results = await getData(req);
        expect(results).toEqual({
          crs: 4326,
          features: [],
          filtersApplied: {
            geometry: true,
            objectIds: true,
            resultOffset: true,
            resultRecordCount: true,
            where: true,
          },
          metadata: { idField: '_id', maxRecordCount: 2000 },
          ttl: 0,
          type: 'FeatureCollection',
        });
        expect(mockMongoApi.find.mock.calls[0]).toEqual([{}]);
        expect(mockMongoApi.project.mock.calls[0]).toEqual([
          {
            _id: 0,
            hello: 1,
            location: 1
          },
        ]);
      });

      test('request with returnCountOnly', async () => {
        config.mongodb = {
          databases: {
            foo: {
              bar: {
                geometryField: 'location',
              },
            },
          },
        };

        mockMongoApi.aggregate = jest.fn(() => {
          return {
            toArray: jest.fn(() => {
              return [{ count: 999 }];
            }),
            close: jest.fn(),
          };
        });

        const provider = new Provider({ logger });
        const getData = promisify(provider.getData).bind(provider);

        const req = {
          params: { id: 'foo::bar' },
          query: { returnCountOnly: true },
        };

        const results = await getData(req);
        expect(results).toEqual({
          count: 999,
        });

        expect(mockMongoApi.aggregate.mock.calls[0]).toEqual([
          [
            {
              $group: {
                _id: {},
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                count: '$count',
              },
            },
          ],
        ]);
      });
    });

    test('handle failed query', async () => {
      mockMongoApi.toArray = jest.fn(() => {
        throw new Error('db-error');
      });

      const provider = new Provider({ logger });
      const getData = promisify(provider.getData).bind(provider);

      const req = {
        params: { id: 'foo::bar' },
        query: {},
      };

      try {
        await getData(req);
      } catch (error) {
        expect(error.message).toBe('db-error');
      }
    });
  });
});
