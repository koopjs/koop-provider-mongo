const Koop = require('@koopjs/koop-core');
const provider = require('../src');
const koop = new Koop({ logLevel: 'info' });

koop.register(provider);

koop.server.listen(8080);
