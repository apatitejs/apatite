'use strict';

var ApatiteAttributeExpression = require('./apatite-attribute-expression.js');

class ApatiteOrderByExpression extends ApatiteAttributeExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
        this.descending = false;
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var ascDescStr = this.descending ? ' DESC' : '';
        return this.expressionValue.buildExpressionForSQL(sqlBuilder, descriptor) + ascDescStr;
    }

    desc() {
        this.descending = true;
        return this.query;
    }

    asc() {
        this.descending = false;
        return this.query;
    }

}

module.exports = ApatiteOrderByExpression;