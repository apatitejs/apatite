'use strict';

var ApatiteResultSet = require('../apatite-result-set.js');

class ApatitePostgresResultSet extends ApatiteResultSet {
    constructor(dbCursor) {
        super(dbCursor);
    }

    fetchAllRows(onRowsFetched) {
        onRowsFetched(null, this.dbCursor.rows);
    }
}

module.exports = ApatitePostgresResultSet;