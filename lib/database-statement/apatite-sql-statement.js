'use strict';

class ApatiteSQLStatement {
    constructor(tableName, sqlString, bindings) {
        this.tableName = tableName;
        this.sqlString = sqlString;
        this.bindings = bindings;
        this.sqlResult = null;
        this.object = null;
        this.sqlBuilder = null;
    }

    setBuilder(sqlBuilder) {
        this.sqlBuilder = sqlBuilder
    }

    isSelect() {
        return false;
    }

    buildSQLString() {
        if (this.sqlString !== null)
            return
        
        var stmt = this.sqlBuilder.buildSQLStatement()
        this.initFromStmt(stmt)
    }

    initFromStmt(stmt) {
        this.tableName = stmt.tableName;
        this.sqlString = stmt.sqlString;
        this.bindings = stmt.bindings;
    }

    setSQLResult(sqlResult) {
        this.sqlResult = sqlResult;
    }
}

module.exports = ApatiteSQLStatement;