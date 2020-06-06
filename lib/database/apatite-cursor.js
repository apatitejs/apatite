'use strict';

class ApatiteCursor {
    constructor(query, apatiteResultSet) {
        this.query = query;
        this.apatiteResultSet = apatiteResultSet;
    }

    getAllResults(onResultsFetched) {
        var self = this;
        this.apatiteResultSet.fetchAllRows(function (err, rows) {
            if (err) {
                onResultsFetched(err, null);
                return;
            }
            var results = [];
            rows.forEach(function (eachRow) {
                var result = self.buildResultForRow(eachRow);
                if (result !== null)
                    results.push(result);
            });
            onResultsFetched(null, results);
        });
    }

    buildResultForRow(tableRow) {
        return this.query.buildResultForRow(tableRow);
    }

}

module.exports = ApatiteCursor;