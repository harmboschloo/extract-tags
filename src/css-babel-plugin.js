import {createPlugin} from './babel-plugin';

const options = {
  taggerModule: 'extract-tags/css',
  outputFileExtension: "css",
  taggerMembers: {
    global: {
    },
    local: {
      taggedPrefix: ':local(.className) {',
      taggedSuffix: '}',
    }
  }
};

export default createPlugin(options);
