import { build } from '../cli/commands/build.js';
import { dev } from '../cli/commands/dev.js';
import { pluginName } from './index.js';

var modernjs = () => ({
  name: pluginName,
  setup(api) {
    api.onBeforeBuild(async () => {
      await build();
    });
    api.onBeforeDev(async () => {
      await dev();
    });
  }
});

export { modernjs as default };
//# sourceMappingURL=modernjs.js.map
