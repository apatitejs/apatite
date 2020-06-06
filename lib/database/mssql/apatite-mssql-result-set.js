'use strict';

var ApatiteResultSet = require('../apatite-result-set.js');

class ApatiteMssqlResultSet extends ApatiteResultSet {
    constructor(dbCursor) {
        super(dbCursor);
    }

    fetchAllRows(onRowsFetched) {
        onRowsFetched(null, this.dbCursor.rows);
    }
}

module.exports = ApatiteMssqlResultSet;