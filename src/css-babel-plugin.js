import {createPlugin} from './babel-plugin';

const options = {
  taggerModule: 'extract-tags/css',
  outputFileExtension: "css"
};

export default createPlugin(options);
