'use strict';

const acorn = require('acorn');
const plugin = require('./dist');

const Parser = acorn.Parser.extend(plugin);
const code = `
import {} from './eval-rqstd-once_FIXTURE.js';
import './eval-rqstd-once_FIXTURE.js';
import * as ns1 from './eval-rqstd-once_FIXTURE.js';
import dflt1 from './eval-rqstd-once_FIXTURE.js';
export {} from './eval-rqstd-once_FIXTURE.js';
import dflt2, {} from './eval-rqstd-once_FIXTURE.js';
export * from './eval-rqstd-once_FIXTURE.js';
export * as ns2 from './eval-rqstd-once_FIXTURE.js';
export * as class from './eval-rqstd-once_FIXTURE.js';
import dflt3, * as ns3 from './eval-rqstd-once_FIXTURE.js';
export default null;
`;

const ast = Parser.parse(code, { sourceType: 'module' })
console.log(ast);
