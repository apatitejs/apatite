'use strict';

var ApatiteDialect = require('../apatite-dialect.js');
var ApatiteMysqlConnection = require('./apatite-mysql-connection.js');
var ApatiteMysqlResultSet = require('./apatite-mysql-result-set.js');

class ApatiteMysqlDialect extends ApatiteDialect {
    constructor(connectionOptions) {
        super(connectionOptions);
    }

    basicCreateConnectionPool(onPoolCreated) {
        this.connectionPool = ApatiteMysqlConnection.createNewPool(this.buildConnOptions());
        onPoolCreated(null);
    }

    buildConnOptions() {
        var splitArr = this.connectionOptions.connectionInfo.split('/');
        return {
            host: splitArr[0],
            user: this.connectionOptions.userName,
            password: this.connectionOptions.password,
            database: splitArr[1]
        };
    }

    static getModuleName() {
        return ApatiteMysqlConnection.getModuleName();
    }

    buildReturningSerialIDStr(columnName) {
        return "";
    }

    buildSQLForTableExistence(tableName, bindVariables) {
        const bindVar = this.basicNewBindVariable(null, '', '?')
        bindVar.variableValue = tableName
        bindVariables.push(bindVar)
        return `SHOW TABLES LIKE ${bindVar.getVariableName()}`
    }

    buildSQLForTableColumnExistence(tableName, columnName, bindVariables) {
        const columnBindVar = this.basicNewBindVariable(null, '', '?')
        columnBindVar.variableValue = columnName
        bindVariables.push(columnBindVar)
        return `SHOW COLUMNS FROM ${tableName} WHERE Field = ${columnBindVar.getVariableName()}`
    }

    newConnection() {
        return new ApatiteMysqlConnection(this);
    }

    getApatiteResultSet(dbCursor) {
        return new ApatiteMysqlResultSet(dbCursor);
    }

    getEventNameForQueryStreamRow() {
        return 'result';
    }

    buildColumnSerialTypeDefSQL(column) {
        return ' AUTO_INCREMENT'
    }

    newDateType() {
        var dataType = super.newDateType();
        dataType.setDialectDataType('DATETIME');
        return dataType;
    }

}


module.exports = ApatiteMysqlDialect;