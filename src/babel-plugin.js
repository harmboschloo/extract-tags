import fp from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

const initialOptions = {
  taggerModule: 'extract-tags',
  taggedPrefix: '',
  taggedSuffix: '',
  outputPath: fp.join(__dirname, '../output'),
  outputFileExtension: "txt",
  taggerMembers: {},
};

const fixOptions = ({taggerModule, taggerModules, ...options}) =>
  (taggerModule || taggerModules) ?
    {
      ...options,
      taggerModules: (taggerModules || []).concat(taggerModule || [])
    } :
    options
  ;

export const createPlugin = (createOptions = {}) => ({types : t}) => {

  let data = {};

  const getOptions = stateOptions => {
    const taggerMembers = {
      ...initialOptions.taggerMembers,
      ...createOptions.taggerMembers,
      ...stateOptions.taggerMembers
    };

    const defaultOptions = {
      ...fixOptions(initialOptions),
      ...fixOptions(createOptions),
      ...fixOptions(stateOptions),
      taggerMembers: null,
      taggerMember: null
    };

    const options = Object.keys(taggerMembers)
      .sort(a => a === '*' ? 1 : 0)
      .map(member => ({
        ...defaultOptions,
        ...fixOptions(taggerMembers[member]),
        taggerMember: member
      }))
      .concat(defaultOptions);

    return options.length ? options : [defaultOptions];
  }

  const isTaggerModule = source =>
    data.options.some(opts => opts.taggerModules.indexOf(source) !== -1);

  const findTagOptions = ({member = null}) =>
    data.options.find(
      opts => opts.taggerMember === member ||
      (member !== null && opts.taggerMember === '*')
    );

  const getTagProps = tag => {
    if (t.isIdentifier(tag)) {
      return {
        name: tag.name,
        member: null
      };
    } else if(t.isMemberExpression(tag)) {
      return {
        name: tag.object.name,
        member: tag.property.name
      };
    } else if (t.isCallExpression(tag)) {
      return getTagProps(tag.callee);
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

        data.options = getOptions(state.opts);
        data.file = fp.parse(path.hub.file.opts.filename);
        data.taggers = [];
        data.insertPath = null;

        // TODO validate options

      },
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (isTaggerModule(source)) {
          const importPath = path;

          path.traverse({
            ModuleSpecifier(path) {
              const tagger = {
                importPath,
                name: path.node.local.name
              }
              data.taggers = data.taggers.concat(tagger);

              if (!data.insertPath) {
                data.insertPath = importPath;
              }
            }
          });
        }
      },
      TaggedTemplateExpression(path) {
        const {tag} = path.node;
        const tagProps = getTagProps(tag);
        const options = findTagOptions(tagProps);
        const tagger = findTagger(tagProps.name);

        if (tagger && options) {
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
          const {file} = data;

          // construct output path
          const relativePath = fp.relative(options.outputPath, file.dir);
          const strippedPath = relativePath.replace(/\.\./g, '.');
          const outputPath = fp.join(options.outputPath, strippedPath);

          mkdirp.sync(outputPath);

          // replace tagged template expression with tagger function call
          const tagId = path.scope.generateUid('tag');
          path.replaceWith(
            t.callExpression(
              t.cloneDeep(tag),
              [t.identifier(tagId)]
            )
          );

          // write tagged string to output file
          const outputFilename = `${file.name}${tagId}.${options.outputFileExtension}`;
          const outputFilePath = fp.join(outputPath, outputFilename);
          const outputString = `${options.taggedPrefix}${taggedString}${options.taggedSuffix}`;
          fs.writeFileSync(outputFilePath, outputString);

          // add import of output file
          const relativeOutputFilePath = getRelativeOutputFilePath(outputFilePath);
          data.insertPath.insertBefore(
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
