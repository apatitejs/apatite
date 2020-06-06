'use strict';

var ApatiteOperatorExpression = require('./apatite-operator-expression.js');
var assert = require('assert');

class ApatiteExistsExpression extends ApatiteOperatorExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var sqlStr = this.expressionValue + ' ( ';
        var subQuerySQLBuilder = this.subQuery.session.connection.dialect.getSelectSQLBuilder(this.subQuery);
        subQuerySQLBuilder.parentSQLBuilder = sqlBuilder;
        var stmt = subQuerySQLBuilder.buildSQLStatement();
        stmt.buildSQLString();
        sqlStr += stmt.sqlString;
        sqlStr += ' )';

        return sqlStr;
    }

    matchesObject(previousExprResult, object) {
        return true;
    }

}

module.exports = ApatiteExistsExpression;