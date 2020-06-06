'use strict';

var ApatiteDialect = require('../apatite-dialect.js');
var ApatiteSqliteConnection = require('./apatite-sqlite-connection.js');
var ApatiteSqliteResultSet = require('./apatite-sqlite-result-set.js');

class ApatiteSqliteDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);
        this.ignoreDataTypeLength = true;
    }

    basicCreateConnectionPool(onPoolCreated) {
        this.connectionPool = ApatiteSqliteConnection.createNewPool(this.buildConnOptions());
        onPoolCreated(null);
    }

    closeConnectionPool(onConnectionClosed) {
        onConnectionClosed(null);
    }

    buildConnOptions() {
        var sqlite = require(this.constructor.getModuleName());
        var mode = this.connectionOptions.mode ? this.connectionOptions.mode : sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE;
        return {
            fileName: this.connectionOptions.userName ? this.connectionOptions.userName : this.connectionOptions.connectionInfo,
            mode: mode
        };
    }

    static getModuleName() {
        return ApatiteSqliteConnection.getModuleName();
    }

    buildReturningSerialIDStr(columnName) {
        return "";
    }

    newConnection() {
        return new ApatiteSqliteConnection(this);
    }

    getApatiteResultSet(dbCursor) {
        return new ApatiteSqliteResultSet(dbCursor);
    }

    buildColumnSerialTypeDefSQL(column) {
        return ''
    }

    buildColumnPKDefSQL(column) {
        return 'PRIMARY KEY AUTOINCREMENT'
    }

    newSerialType() {
        var dataType = super.newSerialType();
        dataType.setDialectDataType('INTEGER');
        return dataType;
    }

    newIntegerType(length) {
        var dataType = super.newIntegerType(length);
        dataType.setDialectDataType('INTEGER');
        return dataType;
    }

    newDateType() {
        var dataType = super.newDateType();
        dataType.setDialectDataType('INTEGER');
        return dataType;
    }

    newVarCharType(length) {
        var dataType = super.newVarCharType(length);
        dataType.setDialectDataType('TEXT');
        return dataType;
    }

    newDecimalType(length, precision) {
        var dataType = super.newDecimalType(length, precision);
        dataType.setDialectDataType('NUMERIC');
        return dataType;
    }
}


module.exports = ApatiteSqliteDialect;