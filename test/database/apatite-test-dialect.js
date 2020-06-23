'use strict';

var ApatiteDialect = require('../../lib/database/apatite-dialect.js');
var ApatiteTestConnection = require('./apatite-test-connection.js');
var ApatiteTestResultSet = require('./apatite-test-result-set.js');

class ApatiteTestDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);

    }

    newConnection() {
        return new ApatiteTestConnection(this);
    }

    buildSQLForTableExistence(tableName, bindVariables) {
        return `SELECT * FROM USER_TABLES WHERE TABLE_NAME = ?`
    }

    buildSQLForTableColumnExistence(tableName, columnName, bindVariables) {
        return 'SELECT * FROM USER_TAB_COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?'
    }

    getApatiteResultSet(dbCursor) {
        return new ApatiteTestResultSet(dbCursor);
    }
}


module.exports = ApatiteTestDialect;