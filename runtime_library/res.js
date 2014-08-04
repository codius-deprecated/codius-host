(function(context){
  //'use strict';

  // Overwrite require for res module (because it does not request an external file)
  var old_require = context.require;
  context.require = function(module_identifier) {
    if (module_identifier === 'res') {
      return new Response();
    } else {
      return old_require(module_identifier);
    }
  };

  function Response() {

  }

  Response.prototype.write = function(data) {
    postMessage({
      api: 'res',
      method: 'write',
      data: {
        data: data
      }
    });
  };

  Response.prototype.end = function () {
    postMessage({
      api: 'res',
      method: 'end'
    });
  };
})(this);
