const { convertGeoserviceParamsToDbParams } = require('./');

describe('convertGeoserviceParamsToDbParams', () => {
  test('convert simple geoservice where', () => {
    const result = convertGeoserviceParamsToDbParams({
      where: "foo='bar'",
      resultRecordCount: 1000,
    });
    expect(result).toEqual({
      collection: 'collection',
      limit: 1000,
      query: {
        foo: {
          $eq: 'bar',
        },
      },
      type: 'query',
    });
  });

  test('convert simple geoservice where with geometryFilter', () => {
    const result = convertGeoserviceParamsToDbParams({
      where: "foo='bar'",
      resultRecordCount: 1000,
      geometry: '-123,45,-119,49',
      geometryField: 'location',
    });

    expect(result).toEqual({
      collection: 'collection',
      limit: 1000,
      query: {
        $and: [
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
          {
            foo: {
              $eq: 'bar',
            },
          },
        ],
      },
      type: 'query',
    });
  });

  test('convert returnCountOnly param with geometryFilter', () => {
    const result = convertGeoserviceParamsToDbParams({
      where: "foo='bar'",
      resultRecordCount: 1000,
      returnCountOnly: true,
      geometryField: 'location',
      geometry: '-123,45,-119,49',
      idField: '_id',
    });

    expect(result).toEqual({
      collections: ['collection'],
      type: 'aggregate',
      pipeline: [
        {
          $match: {
            $and: [
              {
                foo: {
                  $eq: 'bar',
                },
              },
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
            ],
          },
        },
        {
          $group: {
            _id: {},
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            count: '$count',
            _id: 0,
          },
        },
      ],
      query: undefined,
    });
  });

  test('convert returnExtentOnly param', () => {
    const result = convertGeoserviceParamsToDbParams({
      where: "foo='bar'",
      resultRecordCount: 1000,
      returnExtentOnly: true,
      geometryField: 'location',
      idField: '_id',
    });
    expect(result).toEqual({
      collections: ['collection'],
      type: 'aggregate',
      pipeline: [
        {
          $match: {
            foo: {
              $eq: 'bar',
            },
          },
        },
        {
          $group: {
            _id: null,
            result: {
              $accumulator: {
                accumulate: `function (state, coordinates) {
          const getMax = (max, current) => {
            return max? Math.max(max, current) : current;
          };
          const getMin = (min, current) => {
            return min? Math.min(min, current) : current;
          };
          const reduceCoordsToExtent = (extent, coords) => {
            const {xmin, xmax, ymin, ymax } = extent;
            if (!Array.isArray(coords[0])) {
              extent.xmin = getMin(xmin, coords[0]);
              extent.ymin = getMin(ymin, coords[1]);
              extent.xmax = getMax(xmax, coords[0]);
              extent.ymax = getMax(ymax, coords[1]);
              return extent;
            }

            return coords.reduce(reduceCoordsToExtent, extent);
          };

          state.count = state.count + 1;
          state.extent = reduceCoordsToExtent(state.extent, coordinates);
          return state;
        }`,
                accumulateArgs: ['$location.coordinates'],
                init: `function () {
          return {
            extent: { xmin: null, xmax: null, ymin: null, ymax: null },
            count: 0,
          };
        }`,
                lang: 'js',
                merge: `function () {}`,
              },
            },
          },
        },
        {
          $project: {
            count: '$result.count',
            extent: '$result.extent',
            _id: 0,
          },
        },
      ],
    });
  });

  test('convert pagination params', () => {
    const result = convertGeoserviceParamsToDbParams({
      resultOffset: 500,
      resultRecordCount: 100,
    });
    expect(result).toEqual({
      collection: 'collection',
      limit: 100,
      skip: 500,
      type: 'query',
    });
  });

  test('convert order by params', () => {
    const result = convertGeoserviceParamsToDbParams({
      orderByFields: 'hello',
      resultRecordCount: 100,
    });
    expect(result).toEqual({
      collection: 'collection',
      limit: 100,
      sort: { hello: 1 },
      type: 'query',
    });
  });
});
