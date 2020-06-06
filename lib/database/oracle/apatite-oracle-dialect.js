'use strict';

var ApatiteDialect = require('../apatite-dialect.js');
var ApatiteOracleConnection = require('./apatite-oracle-connection.js');
var ApatiteOracleResultSet = require('./apatite-oracle-result-set.js');
var assert = require('assert');
const bindVariableId = 'V';

class ApatiteOracleDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);
    }

    basicCreateConnectionPool(onPoolCreated) {
        var self = this;
         ApatiteOracleConnection.getOracleDb().createPool(this.buildConnOptions(), function (err, pool) {
            assert(err === null);
            self.connectionPool = pool;
            onPoolCreated(null);
        });
    }

    closeConnectionPool(onConnectionClosed) {
        if (this.connectionPool) {
            this.connectionPool.close(function (err) {
                assert(!err);
            });
        }
        onConnectionClosed(null);
    }

    buildConnOptions() {
        var connOptions = this.connectionOptions;
        return { user: connOptions.userName, password: connOptions.password, connectString: connOptions.connectionInfo };
    }

    static getModuleName() {
        return ApatiteOracleConnection.getModuleName();
    }

    newBindVariable(column, sqlBuilder) {
        return this.basicNewBindVariable(column, sqlBuilder.getNextBindVariableId(), ':V');
    }

    buildBindingsForReturningID(bindVariables, columnName) {
        var bindVar = this.basicNewBindVariable(null, columnName, ':');
        bindVar.variableValue = { type: ApatiteOracleConnection.getOracleDb().NUMBER, dir: ApatiteOracleConnection.getOracleDb().BIND_OUT };
        bindVariables.push(bindVar);
        return bindVariables;
    }

    buildReturningSerialIDStr(columnName) {
        return ` RETURNING ${columnName} INTO :${columnName}`;
    }

    newConnection() {
        return new ApatiteOracleConnection(this);
    }

    getEventNameForQueryStreamRow() {
        return 'data';
    }

    getApatiteResultSet(dbCursor) {
        return new ApatiteOracleResultSet(dbCursor);
    }

    buildAdditionalSQLsForCreateTable(table) {
        var sqls = [];
        var tableName = table.tableName;
        table.getPrimaryKeyColumns().forEach(function(eachColumn) {
            if (eachColumn.dataType.isSerialType()) {
                var sequenceName = tableName + '_seq';
                sqls.push('CREATE SEQUENCE ' + sequenceName + ' START WITH 1');
                sqls.push('CREATE OR REPLACE TRIGGER ' + tableName + '_trg BEFORE INSERT ON ' + tableName + ' FOR EACH ROW BEGIN SELECT ' + sequenceName + '.NEXTVAL INTO :new.' + eachColumn.columnName + ' FROM dual; END;');
            }
        })
        return sqls;
    }

    newIntegerType(length) {
        var dataType = super.newIntegerType(length);
        dataType.setDialectDataType('NUMBER');
        return dataType;
    }

    newSerialType() {
        var dataType = super.newSerialType();
        dataType.setDialectDataType('NUMBER');
        return dataType;
    }

    newDecimalType(length, precision) {
        var dataType = super.newDecimalType(length, precision);
        dataType.setDialectDataType('NUMBER');
        return dataType;
    }

    newVarCharType(length) {
        var dataType = super.newVarCharType(length);
        dataType.setDialectDataType('VARCHAR2');
        return dataType;
    }
}


module.exports = ApatiteOracleDialect;