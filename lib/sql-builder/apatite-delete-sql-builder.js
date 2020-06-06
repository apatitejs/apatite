'use strict';

var ApatiteDMLSQLBuilder = require('./apatite-dml-sql-builder.js');
var ApatiteDeleteSQLStatement = require('../database-statement/apatite-delete-sql-statement.js');

class ApatiteDeleteSQLBuilder extends ApatiteDMLSQLBuilder {
    constructor(session, object) {
        super(session, object);
    }

    buildSQLStatement() {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);
        var attrExprs = this.buildAttrExprsForSQL(descriptor.getPrimaryKeyMappings());
        var sqlExprs = [];
        var bindings = [];
        var self = this;
        attrExprs.forEach(function (eachAttrExpr) {
            var bindVar = self.newBindVariable(eachAttrExpr.mappingColumn);
            sqlExprs.push(eachAttrExpr.mappingColumn.columnName + ' = ' + bindVar.getVariableName());
            bindVar.variableValue = eachAttrExpr.valueExpression.expressionValue;
            bindings.push(bindVar);
        });

        var tableName = descriptor.table.tableName;

        var sqlStr = 'DELETE FROM ' + tableName + ' WHERE ' + sqlExprs.join(' AND ');
        return new ApatiteDeleteSQLStatement(tableName, sqlStr, bindings);
    }
}

module.exports = ApatiteDeleteSQLBuilder;