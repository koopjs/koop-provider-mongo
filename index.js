// the name of provider is used by koop to help build default routes for FeatureService and a preview
const pkg = require('./package.json')
const provider = {
  name: 'mongo',
  hosts: false,
  disableIdParam: true,
  Model: require('./mongo'),
  status: {
    version: pkg.version
  },
  type: 'provider'
}

module.exports = provider
