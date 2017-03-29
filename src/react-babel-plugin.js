import {createPlugin} from './babel-plugin';

const options = {
  taggerModule: 'extract-tags/react',
  outputFileExtension: "css",
  taggedPrefix: ':local(.className) {',
  taggedSuffix: '}',
  taggerMembers: {
    global: {
      taggedPrefix: '',
      taggedSuffix: '',
    },
    local: {},
    comp: {},
    '*': {}
  }
};

export default createPlugin(options);
