'use strict';

var ApatiteExpression = require('./apatite-expression.js');
var ApatiteAttributeJoinExpression = require('./apatite-attribute-join-expression.js');

class ApatiteValueExpression extends ApatiteExpression {
    constructor(expressionValue, owningAttrExpression, query) {
        super(expressionValue, query);
        this.owningAttrExpression = owningAttrExpression;
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        var bindVar;
        var rootSQLBuilder = sqlBuilder.getRootSQLBuilder();
        var column = descriptor.findLeafColumnForAttr(this.owningAttrExpression.expressionValue);
        if (this.expressionValue instanceof Array) {
            var exprForSQL = '(';
            var bindVars = [];
            this.expressionValue.forEach(function (eachVal) {
                bindVar = rootSQLBuilder.newBindVariable(column);
                bindVar.variableValue = column.convertValueForDB(eachVal);
                bindVars.push(bindVar.getVariableName());
            });
            exprForSQL += bindVars.join(',');
            exprForSQL += ')';
            return exprForSQL;
        } else if (this.expressionValue instanceof ApatiteAttributeJoinExpression) {
            return this.expressionValue.buildExpressionForSQL(sqlBuilder.parentSQLBuilder);
        } else {
            bindVar = rootSQLBuilder.newBindVariable(column);
            bindVar.variableValue = column.convertValueForDB(this.expressionValue);
            return bindVar.getVariableName();
        }
    }

    buildValueSQL(descriptor) {
        var column = descriptor.findLeafColumnForAttr(this.owningAttrExpression.expressionValue);
        return [column.convertValueForDB(this.expressionValue)]; // Only used in for insert and update statements values, for select buildExpressionForSQL is used
    }

}

module.exports = ApatiteValueExpression;