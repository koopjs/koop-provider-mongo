const { promisify } = require('util');
const Provider = require('./model');
const mongo = require('mongodb');

jest.mock('mongodb');
let mockInstance = {}

mockInstance.find = jest.fn(() => mockInstance);
mockInstance.sort = jest.fn(() => mockInstance);
mockInstance.skip = jest.fn(() => mockInstance);
mockInstance.limit = jest.fn(() => mockInstance);
mockInstance.project = jest.fn(() => mockInstance);
mockInstance.toArray = jest.fn(() => []);

const collectionMock = jest.fn(() => mockInstance );
const dbMock = jest.fn(() => {
  return {
    collection: () => collectionMock
  };
})

mongo.MongoClient.mockImplementation(function () {
  return {
    db: () => dbMock,
  };
});

const logger = {
  error: () => {},
};

describe('Provider class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('instantiate without options', () => {
      const provider = new Provider(
        { logger },
        { conn: { node: 'http://localhost' } },
      );
      expect(provider.getData).toBeInstanceOf(Function);
    });

    test('instantiate with options', () => {
      const provider = new Provider(
        { logger },
        {
          conn: { node: 'http://localhost' },
          idFieldMap: { 'my-index': 'id' },
          geometryFieldMap: { 'my-index': 'location' },
        },
      );
      expect(provider.getData).toBeInstanceOf(Function);
    });

    test('instantiate with invalid options', () => {
      try {
        new Provider(
          { logger },
          {
            conn: 'test',
          },
        );
        throw new Error('should have thrown');
      } catch (error) {
        expect(error.message).toBe(
          'invalid "conn", must be of type object',
        );
      }
    });
  });
});