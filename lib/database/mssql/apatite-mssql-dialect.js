'use strict';

var ApatiteDialect = require('../apatite-dialect.js');
var ApatiteMssqlConnection = require('./apatite-mssql-connection.js');
var ApatiteMssqlResultSet = require('./apatite-mssql-result-set.js');

class ApatiteMssqlDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);
    }

    basicCreateConnectionPool(onPoolCreated) {
        this.connectionPool = ApatiteMssqlConnection.createNewPool(this.buildConnOptions());
        onPoolCreated(null);
    }

    buildConnOptions() {
        var splitArr = this.connectionOptions.connectionInfo.split('/');
        return {
            userName: this.connectionOptions.userName,
            password: this.connectionOptions.password,
            server: splitArr[0],
            options: {
                database: splitArr[1],
                rowCollectionOnRequestCompletion: true,
                useColumnNames: true
            }
        };
    }

    closeConnectionPool(onConnectionClosed) {
        if (this.connectionPool) {
            this.connectionPool.drain();
        }
        onConnectionClosed(null);
    }

    static getModuleName() {
        return ApatiteMssqlConnection.getModuleName();
    }

    buildReturningSerialIDStr(columnName) {
        return `; SELECT SCOPE_IDENTITY() AS [${columnName}];`;
    }

    buildSQLForTableExistence(tableName, bindVariables) {
        const bindVar = this.basicNewBindVariable(null, 1, '@')
        bindVar.variableValue = tableName
        bindVar.column = {dataType: this.newVarCharType()}
        bindVariables.push(bindVar)
        return `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_NAME = ${bindVar.getVariableName()}`
    }

    buildSQLForTableColumnExistence(tableName, columnName, bindVariables) {
        const tableBindVar = this.basicNewBindVariable(null, 1, '@')
        tableBindVar.variableValue = tableName
        tableBindVar.column = {dataType: this.newVarCharType()}
        bindVariables.push(tableBindVar)
        const columnBindVar = this.basicNewBindVariable(null, 2, '@')
        columnBindVar.variableValue = columnName
        columnBindVar.column = {dataType: this.newVarCharType()}
        bindVariables.push(columnBindVar)
        return `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${tableBindVar.getVariableName()} AND COLUMN_NAME = ${columnBindVar.getVariableName()}`
    }

    newBindVariable(column, sqlBuilder) {
        return this.basicNewBindVariable(column, sqlBuilder.getNextBindVariableId(), '@');
    }

    newConnection() {
        return new ApatiteMssqlConnection(this);
    }

    getApatiteResultSet(dbCursor) {
        return new ApatiteMssqlResultSet(dbCursor);
    }

    getEventNameForQueryStreamEnd () {
        return 'done';
    }

    buildColumnSerialTypeDefSQL(column) {
        return ' IDENTITY(1, 1)'
    }

    newIntegerType(length) {
        var dataType = super.newIntegerType(length);
        dataType.internalDataType = ApatiteMssqlConnection.getTediousTypes().Int;
        return dataType;
    }

    newSerialType() {
        var dataType = super.newSerialType();
        dataType.internalDataType = ApatiteMssqlConnection.getTediousTypes().Int;
        return dataType;
    }

    newVarCharType(length) {
        var dataType = super.newVarCharType(length);
        dataType.internalDataType = ApatiteMssqlConnection.getTediousTypes().VarChar;
        return dataType;
    }

    newDateType() {
        var dataType = super.newDateType();
        dataType.internalDataType = ApatiteMssqlConnection.getTediousTypes().DateTime;
        dataType.setDialectDataType('DATETIME');
        return dataType;
    }

    newDecimalType(length, precision) {
        var dataType = super.newDecimalType(length, precision);
        dataType.internalDataType = ApatiteMssqlConnection.getTediousTypes().Decimal;
        return dataType;
    }
}


module.exports = ApatiteMssqlDialect;