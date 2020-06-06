'use strict';

var ApatiteConnection = require('../apatite-connection.js');
var ApatiteError = require('../../error/apatite-error');
var ApatiteCursor = require('../apatite-cursor.js');
var ApatiteUtil = require('../../util.js');
var oracleModuleName = 'oracledb';
var oracledb;

if (ApatiteUtil.existsModule(oracleModuleName)) {// must be checked otherwise would get test discovery error for mocha tests in VS
    oracledb = require(oracleModuleName);
    oracledb.outFormat = oracledb.OBJECT;
}

class ApatiteOracleConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
        this.testResultSet = null; //Only for test cases to verify if oracle resultSet fails, error is properly handled
    }

    static getModuleName() {
        return oracleModuleName;
    }

    static getOracleDb() {
        return oracledb;
    }

    basicConnect(onConnected) {
        if (this.dialect.useConnectionPool)
            this.basicNewConnect(this.dialect.connectionPool, null, onConnected);
        else
            this.basicNewConnect(oracledb, this.dialect.buildConnOptions(), onConnected);
    }

    basicNewConnect(oraDBOrPool, oraConnOpts, onConnected) {
        var self = this;
        var onConnectedFunc = function (err, conn) {
            if (err) {
                onConnected(err);
                return;
            }
            self.databaseConnection = conn;
            onConnected(null);
        }
        if (oraConnOpts)
            oraDBOrPool.getConnection(oraConnOpts, onConnectedFunc);
        else
            oraDBOrPool.getConnection(onConnectedFunc);
    }

    setStatementResult(sqlStatement, result) {
        if (result) {
            if (sqlStatement.isSelect()) {
                sqlStatement.setSQLResult(result.rows);
            }
            else {
                sqlStatement.setSQLResult(result.outBinds);
            }
        }
    }

    basicBeginTransaction(onTransactionBegan) {
        onTransactionBegan(null);
    }

    basicCommitTransaction(onTransactionCommitted) {
        this.databaseConnection.commit(function (err) {
            onTransactionCommitted(err);
        });
    }

    basicRollbackTransaction(onTransactionRollbacked) {
        this.databaseConnection.rollback(function (err) {
            onTransactionRollbacked(err);
        });
    }

    basicDisconnect(onDisconnected) {
        if (this.databaseConnection) {
            this.databaseConnection.release(function (err) {
                onDisconnected(err);
            });
        }
        else
            onDisconnected(null);
    }

    getOptionsForStatment(sqlStatement) {
        var options = super.getOptionsForStatment(sqlStatement)
        if (sqlStatement.isSelect()) {
            if (options)
                options.resultSet = true
            else
                options = {resultSet: true}
        }
        return options;
    }

    basicExecuteSQLString(sqlStr, bindVariables, onExecuted, options) {
        var self = this;
        var bindings = {};
        for (var i = 0; i < bindVariables.length; i++) {
            bindings[bindVariables[i].getVariableName().slice(1)] = bindVariables[i].variableValue;
        }
        this.setDBConnection(function(connErr) {
            if (connErr) {
                self.onSQLExecuted(connErr, null, onExecuted, options);
                return;
            }
            if (options) {
                if (options.returnCursorStream) {
                    var queryStream = self.databaseConnection.queryStream(sqlStr, bindings);
                    self.onSQLExecuted(null, queryStream, onExecuted, options);
                    return;
                }
                self.databaseConnection.execute(sqlStr, bindings, options, function (err, result) {
                    if (err) {
                        self.onSQLExecuted(err, result, onExecuted, options);
                        return;
                    }
                    if (options.isApatiteDirectSql)
                    {
                        var resultSet = self.testResultSet !== null ? self.testResultSet : self.dialect.getApatiteResultSet(result);
                        resultSet.fetchAllRows(function (resultSetErr, rows) {
                            if (resultSetErr)
                                self.onSQLExecuted(resultSetErr, result, onExecuted, options);
                            else
                                self.onSQLExecuted(null, {rows: rows}, onExecuted, options);
                        });
                    }
                    else
                        self.onSQLExecuted(err, result, onExecuted, options);
                });
            }
            else {
                self.databaseConnection.execute(sqlStr, bindings, function (err, result) {
                    self.onSQLExecuted(err, result, onExecuted, options);
                });
            }
        });
    }


}

module.exports = ApatiteOracleConnection;