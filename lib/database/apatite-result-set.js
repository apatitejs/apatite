'use strict';

var ApatiteSubclassResponsibilityError = require('../error/apatite-subclass-responsibility-error.js');

class ApatiteResultSet {
    constructor(dbCursor) {
        this.dbCursor = dbCursor;
        this.hasMoreRows = true;
    }

    fetchAllRows() {
        throw new ApatiteSubclassResponsibilityError();
    }

    fetchNextRows(noOfRowsToFetch, onRowsFetched) {
        throw new ApatiteSubclassResponsibilityError();
    }

    closeResultSet(onResultSetClosed) {
        throw new ApatiteSubclassResponsibilityError();
    }
}

module.exports = ApatiteResultSet;