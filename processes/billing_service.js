
module.exports = function(codius) {

  if (codius.features.isEnabled('BILLING_SERVICE')) {
    require(__dirname+'/../billing-service/server')(codius)
  }
}
