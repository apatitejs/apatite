'use strict';

var ApatiteSQLStatement = require('./apatite-sql-statement.js');

class ApatiteSelectSQLStatement extends ApatiteSQLStatement {
    constructor(tableName, sqlString, bindings) {
        super(tableName, sqlString, bindings);
    }

    isSelect() {
        return true;
    }
}

module.exports = ApatiteSelectSQLStatement;