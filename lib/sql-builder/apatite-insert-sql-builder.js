'use strict';

var ApatiteDMLSQLBuilder = require('./apatite-dml-sql-builder.js');
var ApatiteInsertSQLStatement = require('../database-statement/apatite-insert-sql-statement.js');

class ApatiteInsertSQLBuilder extends ApatiteDMLSQLBuilder {
    constructor(session, object) {
        super(session, object);
        this.serialPKAttrExpr = null;
    }

    prepareSQLStatement() {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);
        var stmt = new ApatiteInsertSQLStatement(descriptor.table.tableName, null, null, null);
        stmt.setBuilder(this)
        return stmt;
    }

    buildSQLStatement() {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);
        var sqlExprs = [];
        var bindings = [];
        var bindVarNames = [];
        var mappings = descriptor.getOwnAndSuperClasMappings();
        var attrExprs = this.buildAttrExprsForSQL(mappings);
        var self = this;
        attrExprs.forEach(function (eachAttrExpr) {
            var column = eachAttrExpr.mappingColumn;
            if (column.dataType.isSerialType() && column.isPrimaryKey)
                self.serialPKAttrExpr = eachAttrExpr;
            else {
                var bindVar = self.newBindVariable(eachAttrExpr.mappingColumn);
                sqlExprs.push(eachAttrExpr.mappingColumn.columnName);
                bindVar.variableValue = eachAttrExpr.valueExpression.buildValueSQL(descriptor)[0];
                bindings.push(bindVar);
                bindVarNames.push(bindVar.getVariableName());
            }
        });
        
        var tableName = descriptor.table.tableName;

        var sqlStr = 'INSERT INTO ' + tableName + ' (';
        sqlStr += sqlExprs.join(', ');
        sqlStr += ') VALUES (';
        sqlStr += bindVarNames.join(', ');
        sqlStr += ')';
        
        if (this.serialPKAttrExpr) {
            var columnName = this.serialPKAttrExpr.mappingColumn.columnName;
            sqlStr += this.session.apatite.dialect.buildReturningSerialIDStr(columnName);
            bindings = this.session.apatite.dialect.buildBindingsForReturningID(bindings, columnName);
        }

        return new ApatiteInsertSQLStatement(tableName, sqlStr, bindings, this.serialPKAttrExpr);
    }

}

module.exports = ApatiteInsertSQLBuilder;