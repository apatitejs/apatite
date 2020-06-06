'use strict';

var ApatiteResultSet = require('../apatite-result-set.js');

class ApatiteMysqlResultSet extends ApatiteResultSet {
    constructor(dbCursor) {
        super(dbCursor);
    }

    fetchAllRows(onRowsFetched) {
        onRowsFetched(null, this.dbCursor.rows);
    }
}

module.exports = ApatiteMysqlResultSet;