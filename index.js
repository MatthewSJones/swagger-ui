'use strict';
var _ = require('lodash');
require('handlebars/runtime');
require('handlebars/runtime');
var pack = require('./package');
var path = require('path');

module.exports = {
    version: pack.version,
    dist: path.resolve(__dirname, 'dist')
};
