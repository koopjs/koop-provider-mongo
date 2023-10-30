const { extentCalculatorStage } = require('./extent-calculator-stage');

describe('extentCalculatorStage', () => {
  test('should build extent calculator stage of aggregation pipeline', () => {
    const result = extentCalculatorStage('location');
    expect(result).toEqual({
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
    });
  });
});
