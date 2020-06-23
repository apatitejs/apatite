'use strict';

var ApatiteDialect = require('../apatite-dialect.js');
var ApatitePostgresConnection = require('./apatite-postgres-connection.js');
var ApatitePostgresResultSet = require('./apatite-postgres-result-set.js');

class ApatitePostgresDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);
    }

    basicCreateConnectionPool(onPoolCreated) {
        this.connectionPool = ApatitePostgresConnection.createNewPool(this.buildConnOptions());
        onPoolCreated(null);
    }

    buildConnOptions() {
        var splitArr = this.connectionOptions.connectionInfo.split('/');
        return {
            user: this.connectionOptions.userName,
            password: this.connectionOptions.password,
            host: splitArr[0],
            database: splitArr[1],
            max: 10, // max number of clients in pool
            idleTimeoutMillis: 1000 // close & remove clients which have been idle > 1 second
        };
    }

    static getModuleName() {
        return ApatitePostgresConnection.getModuleName();
    }

    newBindVariable(column, sqlBuilder) {
        return this.basicNewBindVariable(column, sqlBuilder.getNextBindVariableId(), '$');
    }

    buildSQLForTableExistence(tableName, bindVariables) {
        const bindVar = this.basicNewBindVariable(null, 1, '$')
        bindVar.variableValue = tableName
        bindVariables.push(bindVar)
        return `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_NAME = $1`
    }

    buildSQLForTableColumnExistence(tableName, columnName, bindVariables) {
        const tableBindVar = this.basicNewBindVariable(null, 1, '$')
        tableBindVar.variableValue = tableName
        bindVariables.push(tableBindVar)
        const columnBindVar = this.basicNewBindVariable(null, 2, '$')
        columnBindVar.variableValue = columnName
        bindVariables.push(columnBindVar)
        return `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${tableBindVar.getVariableName()} AND COLUMN_NAME = ${columnBindVar.getVariableName()}`
    }

    newConnection() {
        return new ApatitePostgresConnection(this);
    }

    getApatiteResultSet(dbCursor) {
        return new ApatitePostgresResultSet(dbCursor);
    }

    buildColumnSerialTypeDefSQL(column) {
        return 'SERIAL'
    }

    newDecimalType(length, precision) {
        var dataType = super.newDecimalType(length, precision);
        dataType.setDialectDataType('NUMERIC');
        return dataType;
    }

    newSerialType() {
        var dataType = super.newSerialType();
        dataType.setDialectDataType('');
        return dataType;
    }

    newDateType() {
        var dataType = super.newDateType();
        dataType.setDialectDataType('TIMESTAMP');
        return dataType;
    }
}


module.exports = ApatitePostgresDialect;