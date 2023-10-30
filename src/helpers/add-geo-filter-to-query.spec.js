const { addGeoFilterToQuery } = require('./add-geo-filter-to-query');
const SQLParser = require('@synatic/noql');

describe('addGeoFilterToQuery', () => {
  test('should add if no existing query', () => {
    const sql = `
    SELECT foo 
    FROM collection
    `;

    const params = SQLParser.parseSQL(sql);

    const result = addGeoFilterToQuery(params.query, {
      geofield: 'operation',
    });

    expect(result).toEqual({
      geofield: 'operation',
    });
  });

  test('should add if simple query', () => {
    const sql = `
    SELECT foo 
    FROM collection
    WHERE foo = 'bar'
    `;

    const params = SQLParser.parseSQL(sql);

    const result = addGeoFilterToQuery(params.query, {
      geofield: 'operation',
    });

    expect(result).toEqual({
      $and: [{ geofield: 'operation' }, { foo: { $eq: 'bar' } }],
    });
  });

  test('should add if compound query', () => {
    const sql = `
    SELECT foo 
    FROM collection
    WHERE foo = 'bar' AND bah = 'boom'
    `;

    const params = SQLParser.parseSQL(sql);

    const result = addGeoFilterToQuery(params.query, {
      geofield: 'operation',
    });

    expect(result).toEqual({
      $and: [
        { foo: { $eq: 'bar' } },
        { bah: { $eq: 'boom' } },
        { geofield: 'operation' },
      ],
    });
  });

  test('should add if compound query', () => {
    const sql = `
    SELECT foo 
    FROM collection
    WHERE foo = 'bar' OR bah = 'boom'
    `;

    const params = SQLParser.parseSQL(sql);

    const result = addGeoFilterToQuery(params.query, {
      geofield: 'operation',
    });

    expect(result).toEqual({
      $and: [
        { geofield: 'operation' },
        { $or: [{ foo: { $eq: 'bar' } }, { bah: { $eq: 'boom' } }] },
      ],
    });
  });
});
