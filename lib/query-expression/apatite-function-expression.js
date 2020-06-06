'use strict';

var ApatiteAttributeExpression = require('./apatite-attribute-expression.js');

class ApatiteFunctionExpression extends ApatiteAttributeExpression {
    constructor(expressionValue, query, functionName, aliasName) {
        super(expressionValue, query);
        this.functionName = functionName;
        this.aliasName = aliasName;
    }

    isFunctionExpression() {
        return true;
    }

    getAliasNameForSQLExpr(columnName) {
        return this.aliasName;
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var sqlExpr = '';
        if (this.expressionValue)
            sqlExpr += this.functionName + '(' + super.buildExpressionForSQL(sqlBuilder, descriptor) + ')'
        else
            sqlExpr += this.functionName

        return sqlExpr;
    }

}

module.exports = ApatiteFunctionExpression;