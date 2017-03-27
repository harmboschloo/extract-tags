import {createPlugin} from './babel-plugin';

const options = {
  taggerModule: 'extract-tags/css',
  taggedPrefix: ':local(.className) {',
  taggedSuffix: '}',
  outputFileExtension: "css",
  taggerMembers: {
    global: {
      taggedPrefix: '',
      taggedSuffix: ''
    }
  }
};

export default createPlugin(options);
