'use strict';

var ApatiteSubclassResponsibilityError = require('../error/apatite-subclass-responsibility-error.js');
var ApatiteCursor = require('./apatite-cursor.js');
var ApatiteCursorStream = require('./apatite-cursor-stream.js');

class ApatiteConnection {
    constructor(dialect) {
        this.dialect = dialect;
        this.databaseConnection = null;
        this.isTransactionInProgress = false;
        this.queryInProgress = false;
        this.openedCursors = [];
    }

    basicConnect(onConnected) {
        throw new ApatiteSubclassResponsibilityError();
    }

    connect(onConnected) {
        this.basicConnect(onConnected);
    }

    basicDisconnect(onDisconnected) {
        throw new ApatiteSubclassResponsibilityError();
    }

    disconnect(onDisconnected) {
        var self = this;
        this.basicDisconnect(function (err) {
            self.databaseConnection = null;
            onDisconnected(err);
        });
    }

    buildBindVariableValues(bindVariables) {
        var variableValues = [];
        for(var i = 0; i < bindVariables.length; i++) {
            variableValues.push(bindVariables[i].variableValue);
        }
        return variableValues;
    }

    basicExecuteSQLString(sqlStr, bindings, onExecuted, options) {
        throw new ApatiteSubclassResponsibilityError();
    }

    getOptionsForStatment(sqlStatement) {
        if (sqlStatement.returnCursorStream)
            return {returnCursorStream: true};
        else
            return null;
    }

    setDBConnection(onConnectionFetched) {
        if (this.dialect.useConnectionPool) {
            this.connect(function (err) {
                onConnectionFetched(err);
            });
        }
        else
            onConnectionFetched(null);
    }

    onSQLExecuted(err, result, onExecuted, options) {
        if (options && options.returnCursorStream) {
            onExecuted(err, result);
            return;
        }
        this.closeConnectionIfRequired(function (connErr) {
            if (err)
                onExecuted(err, result);
            else
                onExecuted(connErr, result);
        });
    }

    closeConnectionIfRequired(onConnectionClosed) {
        if (this.dialect.useConnectionPool && !this.isTransactionInProgress && !this.queryInProgress) {
            var self = this;
            this.disconnect(function (connErr) {
                self.databaseConnection = null;
                onConnectionClosed(connErr);
            });
        }
        else
            onConnectionClosed(null);
    }

    logSql(sqlStr, bindings) {
        if (!this.dialect.apatite.loggingEnabled)
            return;

        console.log(`${new Date().toLocaleString()}: Executing SQL: ${sqlStr}, bindings: ${JSON.stringify(bindings)}.`);
    }

    /**
     * Executes the sql. The result is an object containing rows property in case of a select sql.
     * 
     * @param {String} sqlStr A string containing the sql.
     * @param {Array} bindings An array containing the bindings.
     * @param {function(Error, result)} onExecuted A function which would be called after the query execution is finished. This function would be passed two parameters. The first an error object in case of error else null, the second the query result.
     * @param {any} options { isApatiteDirectSql: true, resultSet: true }.
     * 
     */
    executeSQLString(sqlStr, bindings, onExecuted, options) {
        this.logSql(sqlStr, bindings);
        this.basicExecuteSQLString(sqlStr, bindings, onExecuted, options);
    }

    executeSQLStatement(sqlStatement, onExecuted) {
        var self = this;
        sqlStatement.buildSQLString()
        this.executeSQLString(sqlStatement.sqlString, sqlStatement.bindings, function (err, result) {
            self.setStatementResult(sqlStatement, result);
            onExecuted(err, result);
        }, this.getOptionsForStatment(sqlStatement));
    }

    setStatementResult(sqlStatement, result) {
        if (!sqlStatement.isSelect())
            sqlStatement.setSQLResult(result);
    }

    basicBeginTransaction(onTransactionBegan) {
        this.basicExecuteTransactionQuery('BEGIN', onTransactionBegan);
    }

    basicCommitTransaction(onTransactionCommitted) {
        this.basicExecuteTransactionQuery('COMMIT', onTransactionCommitted);
    }

    basicRollbackTransaction(onTransactionRollbacked) {
        this.basicExecuteTransactionQuery('ROLLBACK', onTransactionRollbacked);
    }

    basicExecuteTransactionQuery(transQueryStr, onExecuted) {
        var self = this;
        this.setDBConnection(function (connErr) {
            self.databaseConnection.query(transQueryStr, function (err, result) {
                onExecuted(err);
            });
        });
    }

    beginTransaction(onTransactionBegan) {
        var self = this;
        this.logSql('BEGIN', []);
        this.basicBeginTransaction(function (err) {
            if (err)
                onTransactionBegan(err);
            else {
                self.isTransactionInProgress = true;
                onTransactionBegan(null);
            }
        });
    }

    commitTransaction(onTransactionCommitted) {
        this.logSql('COMMIT', []);
        var self = this;
        this.basicCommitTransaction(function (err) {
            self.isTransactionInProgress = false;
            self.closeConnectionIfRequired(function (connErr) {
                if (err)
                    onTransactionCommitted(err);
                else
                    onTransactionCommitted(connErr);
            });
        });
    }

    rollbackTransaction(onTransactionRollbacked) {
        var self = this;
        this.logSql('ROLLBACK', []);
        this.basicRollbackTransaction(function (err) {
            self.isTransactionInProgress = false;
            self.closeConnectionIfRequired(function (connErr) {
                if (err)
                    onTransactionRollbacked(err);
                else
                    onTransactionRollbacked(connErr);
            });
        });
    }

    executeStatements(statements, onExecuted) {
        if (statements.length === 0) {
            onExecuted(null);
            return;
        }
        var stmt = statements.shift();
        var self = this;
        this.executeSQLStatement(stmt, function (err) {
            if (err) {
                onExecuted(err);
                return;
            }
            self.executeStatements(statements, onExecuted);
        });
    }
    executeStmtsInTransaction(statements, onExecuted) {
        var self = this;
        this.beginTransaction(function (beginTransErr) {
            if (beginTransErr) {
                onExecuted(beginTransErr);
                return;
            }
            var stmtsToExecute = [].concat(statements);
            self.executeStatements(stmtsToExecute, function (executionErr) {
                if (executionErr) {
                    self.rollbackTransaction(function (rollbackErr) {
                        if (rollbackErr)
                            onExecuted(rollbackErr);
                        else
                            onExecuted(executionErr);
                    });
                    return;
                }
                self.commitTransaction(function (commitErr) {
                    if (commitErr) {
                        self.rollbackTransaction(function (rollbackErr) {
                            if (rollbackErr)
                                onExecuted(rollbackErr);
                            else
                                onExecuted(commitErr);
                        });
                        return;
                    }
                    onExecuted(null);
                });
            });
        });
    }

    onCursorClosed(apatiteCursor) {
        this.openedCursors = this.openedCursors.filter(function(eachCursor) {
            return eachCursor !== apatiteCursor
        });
        if (this.openedCursors.length === 0) {
            this.queryInProgress = false;
            this.closeConnectionIfRequired(function (connErr) {
            });
        }
    }

    processDatabaseResultRow(dbResultRow) {
        return dbResultRow;
    }

    executeQuery(query, onExecuted) {
        var sqlBuilder = this.dialect.getSelectSQLBuilder(query);
        var self = this;
        var stmt = null;
        try {
            stmt = sqlBuilder.buildSQLStatement();
        } catch (error) {
            onExecuted(error);
            return;
        }
        stmt.returnCursorStream = query.returnCursorStream;
        this.queryInProgress = true; // prevent the connection to be closed, becuase getAllResults call below needs it
        this.executeSQLStatement(stmt, function (err, result) {
            if (err) {
                self.queryInProgress = self.openedCursors.length !== 0;
                self.closeConnectionIfRequired(function (connErr) {
                    onExecuted(err, null);
                });
                return;
            }
            var cursor;
            if (query.returnCursorStream) {
                cursor = new ApatiteCursorStream(query, result);
                self.openedCursors.push(cursor);
                onExecuted(null, cursor);
            } else {
                cursor = new ApatiteCursor(query, self.dialect.getApatiteResultSet(result));
                cursor.getAllResults(function (cursorErr, results) {
                    self.queryInProgress = self.openedCursors.length !== 0;
                    self.closeConnectionIfRequired(function (connErr) {
                        if (cursorErr)
                            onExecuted(cursorErr, results);
                        else
                            onExecuted(connErr, results);
                    });
                });
            }
        });
    }
}


module.exports = ApatiteConnection;