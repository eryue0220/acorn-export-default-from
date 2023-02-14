'use strict';

const path = require('path');
const acorn = require('acorn');
const run = require('test262-parser-runner');

const Parser = acorn.Parser.extend(require('../dist'));

const implemented = ['export-default-from'];
const whitelist = [];

run(
  (content, options) =>
    Parser.parse(content, { sourceType: options.sourceType, ecmaVersion: 13 }),
  {
    testsDirectory: path.dirname(require.resolve("test262/package.json")),
    skip: (test) => {
      if (!test.attrs.features) return true;

      if (test.attrs.features[0].includes('export')) return false;

      return !implemented.some((f) => test.attrs.features.includes(f));
    },
    whitelist,
  }
);
