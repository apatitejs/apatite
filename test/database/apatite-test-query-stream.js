'use strict';

var EventEmitter = require('events').EventEmitter;

class ApatiteTestQueryStream extends EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
        var self = this;
        if (connection.failCursor) {
            setTimeout(function () {
                self.emit('error', new Error('Cursor failure.'));
            }, 5);
        }
    }
}

module.exports = ApatiteTestQueryStream;