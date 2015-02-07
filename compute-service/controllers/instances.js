var Promise = require('bluebird')

module.exports = function(codius) {

  var compute = new codius.ComputeService();

  return {
    create: function(req, res, next) {
      return compute.startInstance(req.body.token,
                                   req.body.container_uri,
                                   req.body.type, 
                                   req.body.vars,
                                   req.body.port).then(function(instance) {
        res.send({
          success: true,
          instance: instance
        })
      })
      .error(next)
    },

    stop: function(req, res, next) {
      return compute.stopInstance(req.params.token).then(function(state) {
        res.send({
          success: true,
          instance: {
            state: state
          }
        })
      })
      .error(next)
    },

    index: function(req, res, next) {
      return compute.getInstances().then(function(instances) {
        res.status(200).send({
          success: true,
          instances: instances
        })
      })
      .error(next)
    },

    show: function(req, res, next) {
      return compute.getInstance(req.params.token).then(function(instance) {
        res.status(200).send({
          success: true,
          instances: instance
        })
      })
      .error(next)
    }
  }
}

