module.exports = {
  'get /mongo/collections': 'list',
  'get /mongo/collections/:id': 'get',
  'get /mongo/collections/:id/FeatureServer/:layer/:method': 'featureserver',
  'get /mongo/collections/:id/FeatureServer/:layer': 'featureserver',
  'get /mongo/collections/:id/FeatureServer': 'featureserver',
  'post /mongo/collections/:id/FeatureServer/:layer/:method': 'featureserver',
  'post /mongo/collections/:id/FeatureServer/:layer': 'featureserver',
  'post /mongo/collections/:id/FeatureServer': 'featureserver',
  'get /mongo/collections/:id/preview': 'preview'
}
