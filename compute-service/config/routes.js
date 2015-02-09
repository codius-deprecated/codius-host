module.exports = function(router, controllers) {

  router.post('/instances', controllers.instances.create)
  router.get('/instances', controllers.instances.index)
  router.get('/instances/:token', controllers.instances.show)
  router.delete('/instances/:token', controllers.instances.stop)

  // TODO: Add quotes controller
  // router.post('/quotes', controllers.quotes.create)
}