import fp from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

const defaultOptions = {
  taggerModules: ['require-tags'],
  taggers: null,
  taggedOutputPath: fp.join(__dirname, '../../output'),
  taggedFileExtension: "txt"
}

export default () => {

  let data = {};

  return {
    visitor: {
      Program(path, state) {
        if (!path.hub.file.opts.filename) {
          throw path.buildCodeFrameError("Filename required");
        }

        data.options = Object.assign({}, defaultOptions, state.opts)
        data.file = fp.parse(path.hub.file.opts.filename);
        data.taggers = [];
        data.counter = 0;

        // TODO validate options

        // console.log('data', data);
      },
      ImportDeclaration(path) {
        const source = path.node.source.value;

        if (data.options.taggerModules.includes(source)) {
          path.traverse({
            ModuleSpecifier(path) {
              const name = path.node.local.name;
              data.taggers = data.taggers.concat(name);
              // console.log('taggers', data.taggers);
            }
          });
        }
      },
      TaggedTemplateExpression(path) {
        const taggerName = path.node.tag.name;
        if (data.taggers.includes(taggerName)) {
          // check if the tagger is from the import (root) scope
          // assuming we only need to check imports
          const binding = path.scope.getBinding(taggerName);
          if (binding.scope.parent !== null) {
            return;
          }

          // don't allow tag expressions
          const {expressions, quasis} = path.node.quasi;
          if (expressions.length !== 0 || quasis.length !== 1) {
            throw path.buildCodeFrameError("No expressions allowed");
          }

          const taggedString = quasis[0].value.cooked;
          const {taggedOutputPath, taggedFileExtension} = data.options;

          const relativePath = fp.relative(taggedOutputPath, data.file.dir);
          const strippedPath = relativePath.replace(/\.\./g, '.');
          const outputPath = fp.join(taggedOutputPath, strippedPath);

          mkdirp.sync(outputPath);

          const outputFilename = `${data.file.name}-tag${data.counter}.${taggedFileExtension}`;
          const outputFilePath = fp.join(outputPath, outputFilename);
          fs.writeFileSync(outputFilePath, taggedString);

          const relativeOutputFilePath = fp.relative(data.file.dir, outputFilePath);
          const fixedOutputFilePath = relativeOutputFilePath.replace(/\\/g, '/')
          path.replaceWithSourceString(`require('${fixedOutputFilePath}')`);

          data.counter += 1;
        }
      }
    }
  };
};
