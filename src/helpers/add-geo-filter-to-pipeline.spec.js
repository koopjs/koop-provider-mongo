const { addGeoFilterToPipeline } = require('./add-geo-filter-to-pipeline');
const SQLParser = require('@synatic/noql');

describe('addGeoFilterToPipeline', () => {
  test('should add if no existing match phase', () => {
    const sql = `
    SELECT COUNT(*) AS cnt 
    FROM collection
    `;

    const { pipeline } = SQLParser.parseSQL(sql);

    const result = addGeoFilterToPipeline(pipeline, {
      geofield: 'operation',
    });

    expect(result[0]).toEqual({
      $match: {
        geofield: 'operation',
      },
    });
  });

  test('should add to existing simple match phase', () => {
    const sql = `
    SELECT COUNT(*) AS cnt 
    FROM collection
    WHERE foo='bar'
    `;

    const { pipeline } = SQLParser.parseSQL(sql);

    const result = addGeoFilterToPipeline(pipeline, {
      geofield: 'operation',
    });

    expect(result[0]).toEqual({
      $match: {
        $and: [
          { foo: { $eq: 'bar'} },
          { geofield: 'operation' }
        ]
      },
    });
  });

  test('should add to existing compound match phase', () => {
    const sql = `
    SELECT COUNT(*) AS cnt 
    FROM collection
    WHERE foo='bar' AND bah='boom'
    `;

    const { pipeline } = SQLParser.parseSQL(sql);

    const result = addGeoFilterToPipeline(pipeline, {
      geofield: 'operation',
    });

    expect(result[0]).toEqual({
      $match: {
        $and: [
          { foo: { $eq: 'bar'} },
          { bah: { $eq: 'boom'} },
          { geofield: 'operation' }
        ]
      },
    });
  });

  test('should add to existing OR match phase', () => {
    const sql = `
    SELECT COUNT(*) AS cnt 
    FROM collection
    WHERE foo='bar' OR bah='boom'
    `;

    const { pipeline } = SQLParser.parseSQL(sql);

    const result = addGeoFilterToPipeline(pipeline, {
      geofield: 'operation',
    });

    expect(result[0]).toEqual({
      $match: {
        $and: [
          { $or: [
            { foo: { $eq: 'bar'} },
            { bah: { $eq: 'boom'} }
          ] },
          { geofield: 'operation' }
        ]
      },
    });
  });
});
