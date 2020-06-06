'use strict';

var EventEmitter = require('events').EventEmitter;

class ApatiteSqliteQueryStream extends EventEmitter {
    constructor(sqliteStmtObj, err) {
        super();
        this.sqliteStmtObj = sqliteStmtObj;
        if (err) {
            var self = this;
            setTimeout(function() {
                self.emit('error', err);
            }, 1);
        } else {
            this.setUpStreamEvents();
        }
    }

    setUpStreamEvents() {
        var self = this;
        this.sqliteStmtObj.each([], function(err, row) {
            self.emit('row', row);
        }, function() {
            self.emit('end');
            self.sqliteStmtObj.finalize();
        })
    }
}

module.exports = ApatiteSqliteQueryStream;