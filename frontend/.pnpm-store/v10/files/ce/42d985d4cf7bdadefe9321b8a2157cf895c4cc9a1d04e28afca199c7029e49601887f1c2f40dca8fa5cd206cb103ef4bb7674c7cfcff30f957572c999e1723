'use strict';

var build = require('../cli/commands/build.cjs');
var dev = require('../cli/commands/dev.cjs');
var index = require('./index.cjs');

var modernjs = () => ({
  name: index.pluginName,
  setup(api) {
    api.onBeforeBuild(async () => {
      await build.build();
    });
    api.onBeforeDev(async () => {
      await dev.dev();
    });
  }
});

module.exports = modernjs;
//# sourceMappingURL=modernjs.cjs.map
