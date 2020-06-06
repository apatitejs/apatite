'use strict';

var ApatiteConnection = require('../apatite-connection.js');
var ApatiteError = require('../../error/apatite-error');

var ApatiteUtil = require('../../util.js');
var pgModuleName = 'pg';
var pg;

if (ApatiteUtil.existsModule(pgModuleName)) // must be checked otherwise would get test discovery error for mocha tests in VS
    pg = require(pgModuleName);

class ApatitePostgresConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
        this.poolEndConnCallback = null;
    }

    static getModuleName() {
        return pgModuleName;
    }

    static createNewPool(configOpts) {
        return new pg.Pool(configOpts)
    }
    basicConnect(onConnected) {
        var connectionOptions = this.dialect.connectionOptions;
        var connStr = `postgres://${connectionOptions.userName}:${connectionOptions.password}@${connectionOptions.connectionInfo}`;
        var self = this;
        if (this.dialect.useConnectionPool) {
            self.dialect.connectionPool.connect(function(err, client, done) {
                self.databaseConnection = client;
                self.poolEndConnCallback = done;
                if (err) {
                    done(err);
                }
                onConnected(err);
            });
        } else {
            this.databaseConnection = new pg.Client(connStr);
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
            sqlStatement.setSQLResult(result.rows);
    }

    basicDisconnect(onDisconnected) {
        if (this.dialect.useConnectionPool) {
            if (this.poolEndConnCallback) {
                this.poolEndConnCallback();
                this.poolEndConnCallback = null;
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
                    self.onSQLExecuted(err, result, onExecuted, options);
                });
            }
        });
    }
}

module.exports = ApatitePostgresConnection;