import fp from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

const defaultOptions = {
  taggerModule: 'extract-tags',
  outputPath: fp.join(__dirname, '../output'),
  outputFileExtension: "txt"
};

export const createPlugin = (createOptions = {}) => ({types : t}) => {

  let data = {};

  const getTagProps = tag => {
    if (t.isIdentifier(tag)) {
      return {
        name: tag.name,
        callee: t.identifier(tag.name)
      };
    } else if(t.isMemberExpression(tag)) {
      return {
        name: tag.object.name,
        callee: t.memberExpression(
          t.identifier(tag.object.name),
          t.identifier(tag.property.name)
        )
      }
    }
    return {};
  };

  const findTagger = name =>
    data.taggers.find(tagger => tagger.name === name);

  const getRelativeOutputFilePath = outputFilePath => {
    const path = fp.relative(data.file.dir, outputFilePath)
      .replace(/\\/g, '/');
    return path.charAt(0) !== '.' ? './' + path : path;
  }


  return {
    visitor: {
      Program(path, state) {
        if (!path.hub.file.opts.filename) {
          throw path.buildCodeFrameError("Filename required");
        }

        data.options = Object.assign({}, defaultOptions, createOptions, state.opts);
        data.file = fp.parse(path.hub.file.opts.filename);
        data.taggers = [];

        // TODO validate options
      },
      ImportDeclaration(path) {
        const source = path.node.source.value;

        if (data.options.taggerModule === source) {
          const importPath = path;

          path.traverse({
            ModuleSpecifier(path) {
              const tagger = {
                importPath,
                name: path.node.local.name
              }
              data.taggers = data.taggers.concat(tagger);
            }
          });
        }
      },
      TaggedTemplateExpression(path) {
        const tagProps = getTagProps(path.node.tag);
        const tagger = findTagger(tagProps.name)
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
          const {file, options} = data;

          // construct output path
          const relativePath = fp.relative(options.outputPath, file.dir);
          const strippedPath = relativePath.replace(/\.\./g, '.');
          const outputPath = fp.join(options.outputPath, strippedPath);

          mkdirp.sync(outputPath);

          // replace tagged template expression with tagger function call
          const tagId = path.scope.generateUid('tag');
          path.replaceWith(
            t.callExpression(
              tagProps.callee,
              [t.identifier(tagId)]
            )
          );

          // write tagged string to output file
          const outputFilename = `${file.name}${tagId}.${options.outputFileExtension}`;
          const outputFilePath = fp.join(outputPath, outputFilename);
          fs.writeFileSync(outputFilePath, taggedString);

          // add import of output file
          const relativeOutputFilePath = getRelativeOutputFilePath(outputFilePath);
          tagger.importPath.insertBefore(
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

export default createPlugin();
