'use strict';

var ApatiteConnection = require('../apatite-connection.js');
var ApatiteError = require('../../error/apatite-error');
var ApatiteSqliteQueryStream = require('./apatite-sqlite-query-stream.js');


var ApatiteUtil = require('../../util.js');
var sqliteModuleName = 'sqlite3';
var sqlite;

if (ApatiteUtil.existsModule(sqliteModuleName)) // must be checked otherwise would get test discovery error for mocha tests in VS
    sqlite = require(sqliteModuleName);

class ApatiteSqliteConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
    }

    static getModuleName() {
        return sqliteModuleName;
    }

    static createNewPool(connOpts) {
        return sqlite;
    }

    basicConnect(onConnected) {
        var connOpts = this.dialect.buildConnOptions();
        this.databaseConnection = new sqlite.Database(connOpts.fileName, connOpts.mode);
        this.databaseConnection.on('error', function(err) {
            onConnected(err);
        });
        this.databaseConnection.on('open', function() {
            onConnected(null);
        });
    }

    setStatementResult(sqlStatement, result) {
        if (result)
            sqlStatement.setSQLResult(result);
    }

    basicDisconnect(onDisconnected) {
        if (this.databaseConnection) {
            this.databaseConnection.close(function(err) {
                onDisconnected(err);
            });
        } else {
            onDisconnected(null);
        }
    }

    getOptionsForStatment(sqlStatement) {
        var options = super.getOptionsForStatment(sqlStatement)
        if (sqlStatement.isSelect()) {
            if (options)
                options.isSelect = true
            else
                options = {isSelect: true}
        }
        return options ? options : {};
    }

    basicExecuteTransactionQuery(transQueryStr, onExecuted) {
        var self = this;
        this.setDBConnection(function (connErr) {
            self.databaseConnection.run(transQueryStr, [], function (err) {
                onExecuted(err);
            });
        });
    }

    basicExecuteSQLString(sqlStr, bindVariables, onExecuted, options) {
        var self = this;
        this.setDBConnection(function(connErr) {
            if (connErr) {
                self.databaseConnection = null;
                self.onSQLExecuted(connErr, null, onExecuted, options);
                return;
            }
            var bindVars = self.buildBindVariableValues(bindVariables);
            if (options.returnCursorStream) {
                var stmtObj = self.databaseConnection.prepare(sqlStr, bindVars, function(err) {
                    var queryStream = new ApatiteSqliteQueryStream(stmtObj, err);
                    self.onSQLExecuted(null, queryStream, onExecuted, options);
                });
            } else if (options.isSelect || options.isApatiteDirectSql) {
                self.databaseConnection.all(sqlStr, bindVars, function (err, result) {
                    self.onSQLExecuted(err, {rows: result}, onExecuted, options);
                });
            } else {
                self.databaseConnection.run(sqlStr, bindVars, function (err) {
                    var result = this ? this.lastID : null;
                    if (result)
                        result = {insertId: result};
                    self.onSQLExecuted(err, result, onExecuted, options);
                });
            }
        });
    }
}

module.exports = ApatiteSqliteConnection;