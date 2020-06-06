'use strict';

var ApatiteDMLSQLBuilder = require('./apatite-dml-sql-builder.js');
var ApatiteUpdateSQLStatement = require('../database-statement/apatite-update-sql-statement.js');

class ApatiteUpdateSQLBuilder extends ApatiteDMLSQLBuilder {
    constructor(session, object, changeSet) {
        super(session, object);
        this.changeSet = changeSet;
    }

    prepareSQLStatement() {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);
        var stmt = new ApatiteUpdateSQLStatement(descriptor.table.tableName, null, null);
        stmt.setBuilder(this)
        return stmt;
    }

    buildSQLStatement() {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);
        var sqlExprs = [];
        var bindings = [];

        var mappings = [];
        this.changeSet.getChangedAttrNames().forEach(function (eachAttrName) {
            mappings.push(descriptor.mappings[eachAttrName]);
        });

        var attrExprs = this.buildAttrExprsForSQL(mappings);
        var self = this;
        var bindVar;
        var bindVarName;
        attrExprs.forEach(function (eachAttrExpr) {
            var columnName = eachAttrExpr.mappingColumn.columnName;
            var bindingValue = eachAttrExpr.valueExpression.buildValueSQL(descriptor)[0];
            bindVar = self.newBindVariable(eachAttrExpr.mappingColumn);
            bindVarName = bindVar.getVariableName();
            if (eachAttrExpr.mappingColumn.hasRelativeUpdate) {
                var oldValue = self.changeSet.changedAttrs[eachAttrExpr.expressionValue].oldValue;
                bindingValue = bindingValue - oldValue;
                sqlExprs.push(columnName + ' = ' + columnName + ' + ' + bindVarName);
            }
            else
                sqlExprs.push(columnName + ' = ' + bindVarName);
            
            bindVar.variableValue = bindingValue;
            bindings.push(bindVar);
        });

        var tableName = descriptor.table.tableName;
        var sqlStr = 'UPDATE ' + tableName + ' SET ';
        sqlStr += sqlExprs.join(', ');
        sqlExprs = [];
        attrExprs = this.buildAttrExprsForSQL(descriptor.getPrimaryKeyMappings());
        attrExprs.forEach(function (eachAttrExpr) {
            bindVar = self.newBindVariable(eachAttrExpr.mappingColumn);
            sqlExprs.push(eachAttrExpr.mappingColumn.columnName + ' = ' + bindVar.getVariableName());
            bindVar.variableValue = eachAttrExpr.valueExpression.buildValueSQL(descriptor)[0];
            bindings.push(bindVar);
        });

        sqlStr = sqlStr + ' WHERE ' + sqlExprs.join(' AND ');

        return new ApatiteUpdateSQLStatement(tableName, sqlStr, bindings);
    }
}

module.exports = ApatiteUpdateSQLBuilder;