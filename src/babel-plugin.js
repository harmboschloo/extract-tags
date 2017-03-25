import fp from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

const defaultOptions = {
  taggerModules: ['extract-tags'],
  taggers: null,
  taggedOutputPath: fp.join(__dirname, '../output'),
  taggedFileExtension: "txt"
}

export default ({types : t}) => {

  let data = {};

  const findTagger = name =>
    data.taggers.find(tagger => tagger.name === name);

  const getRelativeOutputFilePath = outputFilePath => {
    const path = fp.relative(data.file.dir, outputFilePath)
      .replace(/\\/g, '/');
    return path.startsWith('..') ? path : './' + path;
  }


  return {
    visitor: {
      Program(path, state) {
        if (!path.hub.file.opts.filename) {
          throw path.buildCodeFrameError("Filename required");
        }

        data.options = Object.assign({}, defaultOptions, state.opts)
        data.file = fp.parse(path.hub.file.opts.filename);
        data.lastTaggerImportPath = null;
        data.taggers = [];

        // TODO validate options

        // console.log('data', data);
      },
      ImportDeclaration(path) {
        const source = path.node.source.value;

        if (data.options.taggerModules.includes(source)) {
          const importPath = path;

          path.traverse({
            ModuleSpecifier(path) {
              const tagger = {
                importPath,
                name: path.node.local.name
              }
              data.taggers = data.taggers.concat(tagger);
              // console.log('taggers', data.taggers);
            }
          });
        }
      },
      TaggedTemplateExpression(path) {
        const tagger = findTagger(path.node.tag.name)
        if (tagger) {
          // check if the tagger is from the import (root) scope
          // assuming we only need to check imports
          const binding = path.scope.getBinding(tagger.name);
          if (binding.scope.uid !== tagger.importPath.scope.uid) {
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

          // replace tagged template expression with "tagger(tagId)" call
          const tagId = path.scope.generateUid('tag');
          path.replaceWith(
            t.callExpression(
              t.identifier(tagger.name),
              [t.identifier(tagId)]
            )
          );

          // write tagged string to output file
          const outputFilename = `${data.file.name}${tagId}.${taggedFileExtension}`;
          const outputFilePath = fp.join(outputPath, outputFilename);
          fs.writeFileSync(outputFilePath, taggedString);

          // add import of output file
          const relativeOutputFilePath = getRelativeOutputFilePath(outputFilePath);
          tagger.importPath.insertAfter(
            t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier(tagId))],
              t.stringLiteral(relativeOutputFilePath)
            )
          );
        }
      }
    }
  };
};
