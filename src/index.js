const packageInfo = require('../package.json');

const provider = {
  type: 'provider',
  version: packageInfo.version,
  name: 'mongodb',
  Model: require('./model'),
};

module.exports = provider;
