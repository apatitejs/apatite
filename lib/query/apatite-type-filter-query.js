'use strict';

var ApatiteAbstractQuery = require('./apatite-query-abstract.js');
var ApatiteError = require('../error/apatite-error.js');

class ApatiteTypeFilterQuery extends ApatiteAbstractQuery
{
    constructor(apatite) {
        super(apatite);
    }

    attribute(attributeName) {
        if (attributeName.indexOf('.') !== -1)
            throw new ApatiteError('Only simple attributes are supported at the moment for type filter queries.');

        return super.attribute(attributeName);
    }

    addOperatorExpression(expressionClass, operator) {
        throw new ApatiteError(operator + ' not allowed for type filter queries.');
    }
}

module.exports = ApatiteTypeFilterQuery;