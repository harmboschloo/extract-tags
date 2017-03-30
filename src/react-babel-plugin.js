import {createPlugin} from './babel-plugin';

const options = {
  taggerModule: 'extract-tags/react',
  outputFileExtension: "css",
  taggerMembers: {
    global: {},
    '*': {
      taggedPrefix: ':local(.className) {',
      taggedSuffix: '}',
    }
  }
};

export default createPlugin(options);
