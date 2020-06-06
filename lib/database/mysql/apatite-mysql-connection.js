'use strict';

var ApatiteConnection = require('../apatite-connection.js');
var ApatiteError = require('../../error/apatite-error');

var ApatiteUtil = require('../../util.js');
var mysqlModuleName = 'mysql';
var mysql;

if (ApatiteUtil.existsModule(mysqlModuleName)) // must be checked otherwise would get test discovery error for mocha tests in VS
    mysql = require(mysqlModuleName);

class ApatiteMysqlConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
    }

    static getModuleName() {
        return mysqlModuleName;
    }

    static createNewPool(connOpts) {
        return mysql.createPool(connOpts)
    }

    basicConnect(onConnected) {
        var self = this;

        if (this.dialect.useConnectionPool) {
            this.dialect.connectionPool.getConnection(function(err, conn) {
                self.databaseConnection = conn;
                onConnected(err);
            });
        } else {
            this.databaseConnection = mysql.createConnection(this.dialect.buildConnOptions());
            this.databaseConnection.connect(function (err) {
                if (err) {
                    self.disconnect(function (disconnErr) {
                        onConnected(err);
                    });
                } else
                    onConnected(err);
            });
        }
    }

    setStatementResult(sqlStatement, result) {
        if (result)
            sqlStatement.setSQLResult(result);
    }

    basicBeginTransaction(onTransactionBegan) {
        this.basicExecuteTransactionQuery('START TRANSACTION', onTransactionBegan);
    }

    basicDisconnect(onDisconnected) {
        if (this.dialect.useConnectionPool) {
            if (this.databaseConnection) {
                this.databaseConnection.release();
            }
        }
        else if (this.databaseConnection) {
            this.databaseConnection.end();
        }
        onDisconnected(null);
    }

    basicExecuteSQLString(sqlStr, bindVariables, onExecuted, options) {
        var self = this;
        this.setDBConnection(function(connErr) {
            if (connErr) {
                self.onSQLExecuted(connErr, null, onExecuted, options);
                return;
            }
            var bindVars = self.buildBindVariableValues(bindVariables);
            if (options && options.returnCursorStream) {
                var query = self.databaseConnection.query(sqlStr, bindVars);
                self.onSQLExecuted(null, query, onExecuted, options);
            } else {
                self.databaseConnection.query(sqlStr, bindVars, function (err, result) {
                    var resultObj = (result instanceof Array) ? {rows: result} : result;
                    self.onSQLExecuted(err, resultObj, onExecuted, options);
                });
            }
        });
    }
}

module.exports = ApatiteMysqlConnection;