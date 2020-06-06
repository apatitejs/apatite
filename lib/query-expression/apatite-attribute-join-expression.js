'use strict';

var ApatiteExpression = require('./apatite-expression.js');

class ApatiteAttributeJoinExpression extends ApatiteExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
    }

    buildExpressionForSQL(sqlBuilder) {
        return this.expressionValue.basicBuildExpressionForSQL(sqlBuilder, this.query.getModelDescriptor())[0]
    }

}

module.exports = ApatiteAttributeJoinExpression;