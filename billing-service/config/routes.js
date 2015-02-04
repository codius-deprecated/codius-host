
module.exports = function(router, controllers) {

  router.get('/contracts/:token', controllers.balances.show)
  router.post('/contracts/:token/credits', controllers.credits.create)
  router.post('/contracts/:token/debits', controllers.debits.create)

  router.get('/contracts/:token/credits', controllers.credits.index)
  router.get('/contracts/:token/debits', controllers.debits.index)
}

