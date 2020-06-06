'use strict';

var ApatiteAbstractQuery = require('./apatite-query-abstract.js');
var ApatiteError = require('../error/apatite-error.js');

class ApatiteToManyOrderByQuery extends ApatiteAbstractQuery
{
    constructor(apatite) {
        super(apatite);
    }

}

module.exports = ApatiteToManyOrderByQuery;