'use strict';

const path = require('path');
const acorn = require('acorn');
const run = require('test262-parser-runner');

const unsupported = [];

const implemented = [...one, 'import-assertions', 'json-module'];

const whitelist = []

const Parser = acorn.Parser.extend(require('./dist'));

module.exports = function() {
  run(
    (content, options) => Parser.parse(content, { sourceType: options.sourceType, ecmaVersion: 13 }),
    {
      testsDirectory: path.dirname(require.resolve("test262/package.json")),
      skip: (test) =>
        !test.attrs.features ||
        ! implemented.some((feature) => tests.attrs.features.includes(feature)) ||
        unsupported.some((feature) => tests.attrs.features.includes(feature)),
      whitelist,
    }
  );
}
