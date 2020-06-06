'use strict';

var ApatiteConnection = require('../apatite-connection.js');
var ApatiteError = require('../../error/apatite-error');

var ApatiteUtil = require('../../util.js');
var tediousModuleName = 'tedious';
var TediousConnection, TediousRequest, TediousTypes;

var tediousConnPoolModuleName = 'tedious-connection-pool';
var TediousConnPoolConnection;

if (ApatiteUtil.existsModule(tediousModuleName)) { // must be checked otherwise would get test discovery error for mocha tests in VS
    TediousConnection = require(tediousModuleName).Connection;
    TediousRequest = require(tediousModuleName).Request;
    TediousTypes = require(tediousModuleName).TYPES;
}

if (ApatiteUtil.existsModule(tediousConnPoolModuleName)) // must be checked otherwise would get test discovery error for mocha tests in VS
    TediousConnPoolConnection = require(tediousConnPoolModuleName);

class ApatiteMssqlConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
    }

    static getModuleName() {
        return tediousModuleName;
    }

    static getTediousTypes() {
        return TediousTypes;
    }

    static createNewPool(connOpts) {
        return new TediousConnPoolConnection({}, connOpts)
    }

    basicConnect(onConnected) {
        var self = this;

        if (this.dialect.useConnectionPool) {
            this.dialect.connectionPool.on('error', function(err) {
                self.dialect.connectionPool.drain()
                onConnected(err);
            });
            this.dialect.connectionPool.acquire(function(err, conn) {
                self.databaseConnection = conn;
                onConnected(err);
            });
        } else {
            this.databaseConnection = new TediousConnection(this.dialect.buildConnOptions());
            this.databaseConnection.on('connect', function (err) {
                if (err) {
                    self.disconnect(function (disconnErr) {
                        onConnected(err);
                    });
                } else
                    onConnected(err);
            });
        }
    }

    basicBeginTransaction(onTransactionBegan) {
        this.databaseConnection.beginTransaction(function (err) {
            onTransactionBegan(err);
        });
    }

    basicCommitTransaction(onTransactionCommitted) {
        this.databaseConnection.commitTransaction(function (err) {
            onTransactionCommitted(err);
        });
    }

    basicRollbackTransaction(onTransactionRollbacked) {
        this.databaseConnection.rollbackTransaction(function (err) {
            onTransactionRollbacked(err);
        });
    }

    basicDisconnect(onDisconnected) {
        if (this.dialect.useConnectionPool) {
            if (this.databaseConnection) {
                this.databaseConnection.release();
            }
        }
        else if (this.databaseConnection) {
            this.databaseConnection.close();
        }
        onDisconnected(null);
    }

    setStatementResult(sqlStatement, result) {
        if (result) {
            if (sqlStatement.isSelect()) {
                sqlStatement.setSQLResult(result);
            }
            else {
                sqlStatement.setSQLResult(result.rows);
            }
        }
    }

    processDatabaseResultRow(dbResultRow) {
        var row = {}
        for(var colName in dbResultRow) {
            row[colName] = dbResultRow[colName].value
        }
        return row;
    }

    basicExecuteSQLString(sqlStr, bindVariables, onExecuted, options) {
        var self = this;
        this.setDBConnection(function(connErr) {
            if (connErr) {
                self.onSQLExecuted(connErr, null, onExecuted, options);
                return;
            }
            var request = new TediousRequest(sqlStr, function (err, rowCount, result) {
                if (options && options.returnCursorStream) {
                    // Unfortunately tedious does not emit error and done events
                    if (err)
                        request.emit('error', err);
                    else
                        request.emit('done');
                    return;
                }
                var resultObj = result
                if (result instanceof Array) {
                    var rows = []
                    for(var i = 0; i < result.length; i++) {
                        var rowInfo = result[i]
                        var row = self.processDatabaseResultRow(rowInfo);
                        rows.push(row)
                    }
                    resultObj = {rows: rows}
                }
                self.onSQLExecuted(err, resultObj, onExecuted, options);
            });

            for (var i = 0; i < bindVariables.length; i++) {
                var bindVar = bindVariables[i];
                request.addParameter(bindVar.variableId, bindVar.column.dataType.internalDataType, bindVar.variableValue)
            }
            if (options && options.returnCursorStream) {
                self.onSQLExecuted(null, request, onExecuted, options);
            }
            self.databaseConnection.execSql(request);
        });
    }
}

module.exports = ApatiteMssqlConnection;