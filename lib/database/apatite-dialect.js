'use strict';

var ApatiteIntegerDataType = require('../database-type/apatite-integer-data-type.js');
var ApatiteSerialDataType = require('../database-type/apatite-serial-data-type.js');
var ApatiteVarCharDataType = require('../database-type/apatite-var-char-data-type.js');
var ApatiteDateDataType = require('../database-type/apatite-date-data-type.js');
var ApatiteDecimalDataType = require('../database-type/apatite-decimal-data-type.js');
var ApatiteSelectSQLBuilder = require('../sql-builder/apatite-select-sql-builder.js');
var ApatiteDeleteSQLBuilder = require('../sql-builder/apatite-delete-sql-builder.js');
var ApatiteInsertSQLBuilder = require('../sql-builder/apatite-insert-sql-builder.js');
var ApatiteUpdateSQLBuilder = require('../sql-builder/apatite-update-sql-builder.js');
var ApatiteSubclassResponsibilityError = require('../error/apatite-subclass-responsibility-error.js');
var ApatiteBindVariable = require('./apatite-bind-variable.js')

class ApatiteDialect
{
    constructor(connectionOptions) {
        this.connectionOptions = connectionOptions;
        this.apatite = null;
        this.useConnectionPool = false;
        this.connectionPool = null;
        this.ignoreDataTypeLength = false;
    }

    buildColumnPKDefSQL(column) {
        return 'PRIMARY KEY'
    }

    buildColumnSerialTypeDefSQL(column) {
        return ''
    }

    buildAdditionalSQLsForCreateTable(table) {
        return []
    }

    basicCreateConnectionPool(onPoolCreated) {
        throw new ApatiteSubclassResponsibilityError();
    }

    createConnectionPool(onPoolCreated) {
        this.basicCreateConnectionPool(onPoolCreated);
    }

    closeConnectionPool(onConnectionClosed) {
        if (this.connectionPool.end) {
            this.connectionPool.end(function (err) {
                onConnectionClosed(err);
            });
            return;
        }
    }

    newConnection() {
        throw new ApatiteSubclassResponsibilityError();
    }

    getEventNameForQueryStreamRow() {
        return 'row';
    }

    getEventNameForQueryStreamEnd () {
        return 'end';
    }

    connect(onConnected) {
        var connection = this.newConnection();
        if (this.useConnectionPool) {
            this.createConnectionPool(function (err) {
                onConnected(err, connection);
            })            
        }
        else {
            connection.connect(function (err) {
                if (err)
                    onConnected(err);
                else
                    onConnected(null, connection);
            });
        }
    }

    basicNewBindVariable(column, variableId, variablePrefix = '') {
        return new ApatiteBindVariable(column, variableId, variablePrefix);
    }

    newBindVariable(column, sqlBuilder) {
        return this.basicNewBindVariable(column, '?');
    }

    buildBindingsForReturningID(bindings, columnName) {
        return bindings;
    }

    buildReturningSerialIDStr(columnName) {
        return ` RETURNING ${columnName} AS "${columnName}"`;
    }

    getSelectSQLBuilder(query) {
        return new ApatiteSelectSQLBuilder(query);
    }

    getDeleteSQLBuilder(session, object) {
        return new ApatiteDeleteSQLBuilder(session, object);
    }

    getInsertSQLBuilder(session, object) {
        return new ApatiteInsertSQLBuilder(session, object);
    }

    getUpdateSQLBuilder(session, object, objChangeSet) {
        return new ApatiteUpdateSQLBuilder(session, object, objChangeSet);
    }

    getApatiteResultSet(dbCursor) {
        throw new ApatiteSubclassResponsibilityError();
    }

    newIntegerType(length) {
        return new ApatiteIntegerDataType(length);
    }

    newSerialType() {
        return new ApatiteSerialDataType();
    }

    newVarCharType(length) {
        return new ApatiteVarCharDataType(length);
    }

    newDateType() {
        return new ApatiteDateDataType();
    }

    newDecimalType(length, precision) {
        return new ApatiteDecimalDataType(length, precision);
    }
}

module.exports = ApatiteDialect;