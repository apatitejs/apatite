'use strict';

var EventEmitter = require('events').EventEmitter;

class ApatiteCursorStream extends EventEmitter {
    constructor(query, queryStream) {
        super();
        this.query = query;
        this.queryStream = queryStream;
        this.setUpStreamEvents();
    }

    setUpStreamEvents() {
        var self = this;
        this.queryStream.on('error', function(err) {
            self.emit('error', err);
        });
        var dialect = this.query.session.connection.dialect;
        this.queryStream.on(dialect.getEventNameForQueryStreamRow(), function(result) {
            var tableRow = self.query.session.connection.processDatabaseResultRow(result);
            self.emit('result', self.buildResultForRow(tableRow));
        });
        this.queryStream.on(dialect.getEventNameForQueryStreamEnd(), function() {
            self.query.session.connection.onCursorClosed(self);
            self.emit('end');
        });
    }

    buildResultForRow(tableRow) {
        return this.query.buildResultForRow(tableRow);
    }

}

module.exports = ApatiteCursorStream;