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

    getApatiteResultSet(dbCursor) {
        return new ApatiteTestResultSet(dbCursor);
    }
}


module.exports = ApatiteTestDialect;