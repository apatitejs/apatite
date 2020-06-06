'use strict';

var ApatiteOperatorExpression = require('./apatite-operator-expression.js');

class ApatiteLogicalOperatorExpression extends ApatiteOperatorExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var sqlStr = ' ' + this.expressionValue;
        this.subQuery.whereExpressions.forEach(function (eachWhereExpr) {
            var sqlExpr = eachWhereExpr.buildExpressionForSQL(sqlBuilder, descriptor);
            sqlStr += ((sqlExpr.length && (sqlExpr[0] === ' ')) ? sqlExpr : ' ' + sqlExpr);
        });
        return sqlStr;
    }

    matchesObject(previousExprResult, object) {
        if (this.expressionValue === 'OR') {
            if (previousExprResult === true)
                return true;

            return this.subQuery.matchesObject(object);
        }
        else if (this.expressionValue === 'AND') {
            if (previousExprResult === false)
                return false;

            return this.subQuery.matchesObject(object);
        }
        else
            throw new Error('Not expected to reach here.');
    }
}

module.exports = ApatiteLogicalOperatorExpression;