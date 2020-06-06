'use strict';

var ApatiteSQLStatement = require('./apatite-sql-statement.js');

class ApatiteDeleteSQLStatement extends ApatiteSQLStatement {
    constructor(tableName, sqlString, bindings) {
        super(tableName, sqlString, bindings);
    }
}

module.exports = ApatiteDeleteSQLStatement;