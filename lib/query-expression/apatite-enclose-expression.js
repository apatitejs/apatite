'use strict';

var ApatiteOperatorExpression = require('./apatite-operator-expression.js');
var assert = require('assert');

class ApatiteEncloseExpression extends ApatiteOperatorExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var sqlStr = '( ';
        this.subQuery.whereExpressions.forEach(function (eachWhereExpr) {
            sqlStr += eachWhereExpr.buildExpressionForSQL(sqlBuilder, descriptor);
        });
        sqlStr += ' )';

        return sqlStr;
    }

    matchesObject(previousExprResult, object) {
        return this.subQuery.matchesObject(object);
    }

}

module.exports = ApatiteEncloseExpression;