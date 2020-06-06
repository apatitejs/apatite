/*!
 * Apatite
 * Copyright(c) 2016 Madhu <pmadhur@gmail.com>
 * MIT Licensed
 */

'use strict';

var ApatiteConfigError = require('./error/apatite-config-error');
var ApatiteTable = require('./database/apatite-table');
var ApatiteModelDescriptor = require('./model/apatite-model-descriptor');
var ApatiteSession = require('./session/apatite-session');
var ApatiteQuery = require('./query/apatite-query.js');
var ApatiteTypeFilterQuery = require('./query/apatite-type-filter-query.js');
var ApatiteToManyOrderByQuery = require('./query/apatite-to-many-order-by-query.js');
var ApatitePostgresDialect = require('./database/postgres/apatite-postgres-dialect.js');
var ApatiteOracleDialect = require('./database/oracle/apatite-oracle-dialect.js');
var ApatiteMysqlDialect = require('./database/mysql/apatite-mysql-dialect.js');
var ApatiteMssqlDialect = require('./database/mssql/apatite-mssql-dialect.js');
var ApatiteSqliteDialect = require('./database/sqlite/apatite-sqlite-dialect.js');
var ApatiteUtil = require('./util.js');
var assert = require('assert');

class Apatite {
    constructor(dialect) {
        this.registeredDescriptors = {};
        this.allTables = {};
        this.sortedTableNames = [];
        this.dialect = dialect;
        dialect.apatite = this;
        this.defaultCacheSize = 0;
        this.loggingEnabled = false;
        this.isPrepared = false;
    }

    
    /**
     * Enables logging of sql's to the console.
     */
    enableLogging() {
        this.loggingEnabled = true;
    }
    /**
     * Disables logging of sql's to the console.
     */
    disableLogging() {
        this.loggingEnabled = false;
    }

    /**
     * Uses connection pool for executing sql's. When connection pooling is used,
     * every SQL sent to the database would use a new connection from the pool 
     * except during the save process. During the save process, the same connection
     * is used to execute statements in transaction. 
     */
    useConnectionPool() {
        this.dialect.useConnectionPool = true;
    }

    /**
     * Closes the connection pool. To end the connection when using pool you must call this method.
     * 
     * @param {function(Error)} onConnectionClosed A function which would be called when the connection is closed. An error object would be passed as parameter to the function in case of error else null.
     * 
     */
    closeConnectionPool(onConnectionClosed) {
        this.dialect.closeConnectionPool(onConnectionClosed);
    }

    /**
     * Logs into the database and creates a new session.
     * 
     * @param {function(Error, ApatiteSession)} onNewSessionCreated A function which would be called after a new session is created. This function would be called with two parameters. The first parameter is an error object in case of error else null. The second parameter is an instance of ApatiteSession when no error occurs.
     * 
     */
    newSession(onNewSessionCreated) {
        try {
            this.prepare();
        } catch(ex) {
            return onNewSessionCreated(ex);
        }
        
        var self = this;
        this.dialect.connect(function (err, connection) {
            if (err) {
                onNewSessionCreated(err);
                return;
            }
            var newSession = new ApatiteSession(self, connection);
            onNewSessionCreated(null, newSession);
        });
    }

    static for(dialectClass, connectionOptions) {
        var moduleName = dialectClass.getModuleName();
        if (!ApatiteUtil.existsModule(moduleName))
            throw new Error(`Module "${moduleName}" not found.`);

        return new Apatite(new dialectClass(connectionOptions));
    }

    /**
     * Creates an instance of Apatite for Postgres.
     * 
     * @static
     * @param {{}} connectionOptions An object with following properties of type string: userName, password, connectionInfo. connectionInfo is expected to be in the format: 'host/database'. The property values of connectionOptions are passed on to the connect method of Postgres.
     * @returns {Apatite} An instance of class Apatite.
     * 
     */
    static forPostgres(connectionOptions) {
        return this.for(ApatitePostgresDialect, connectionOptions);
    }

    /**
     * Creates an instance of Apatite for Oracle.
     * 
     * @static
     * @param {{}} connectionOptions An object with following properties of type string: userName, password, connectionInfo. connectionInfo is expected to be in the format: 'host/database'. The property values of connectionOptions are passed on to the getConnection method of Oracle.
     * @returns {Apatite} An instance of class Apatite.
     * 
     */
    static forOracle(connectionOptions) {
        return this.for(ApatiteOracleDialect, connectionOptions);
    }

    /**
     * Creates an instance of Apatite for Mysql.
     * 
     * @static
     * @param {{}} connectionOptions An object with following properties of type string: userName, password, connectionInfo. connectionInfo is expected to be in the format: 'host/database'. The property values of connectionOptions are passed on to the createConnection method of Mysql.
     * @returns {Apatite} An instance of class Apatite.
     * 
     */
    static forMysql(connectionOptions) {
        return this.for(ApatiteMysqlDialect, connectionOptions);
    }

    /**
     * Creates an instance of Apatite for MS Sql Server.
     * 
     * @static
     * @param {{}} connectionOptions An object with following properties of type string: userName, password, connectionInfo. connectionInfo is expected to be in the format: 'host/database'. The property values of connectionOptions are passed on to the constructor of TediousConnection of tedious.
     * @returns {Apatite} An instance of class Apatite.
     * 
     */
    static forMssql(connectionOptions) {
        return this.for(ApatiteMssqlDialect, connectionOptions);
    }

    /**
     * Creates an instance of Apatite for Sqlite.
     * 
     * @static
     * @param {{}} connectionOptions An object with following property of type string: connectionInfo. The property values of connectionOptions are passed on to the constructor of Database class of sqlite.
     * @returns {Apatite} An instance of class Apatite.
     * 
     */
    static forSqlite(connectionOptions) {
        return this.for(ApatiteSqliteDialect, connectionOptions);
    }

    /**
     * Gets the model descriptor for a model.
     * 
     * @param {String} modelOrModelName A string specifying the model name.
     * @returns {ApatiteModelDescriptor} An instance of class ApatiteModelDescriptor.
     * 
     */
    getModelDescriptor(modelOrModelName) {
        if (this.isClass(modelOrModelName))
            return this.registeredDescriptors[modelOrModelName.name];
        else
            return this.registeredDescriptors[modelOrModelName];
    }

    /**
     * Gets all registered descriptors of models.
     * 
     * @returns {[ApatiteModelDescriptor]} An array containing instances of ApatiteModelDescriptor.
     * 
     */
    getModelDescriptors() {
        var modelDescriptors = [];
        for (var eachModelName in this.registeredDescriptors)
            modelDescriptors.push(this.registeredDescriptors[eachModelName]);

        return modelDescriptors;
    }

    prepare() {
        if (this.isPrepared)
            return;

        var descr = this.getModelDescriptors();
        var self = this;
        this.getModelDescriptors().forEach(function (eachDescriptor) {
            eachDescriptor.validate();
            var currTableName = eachDescriptor.table.tableName;
            var currTableIdx = self.sortedTableNames.indexOf(currTableName);
            eachDescriptor.getOwnMappings().forEach(function (eachMapping) {
                if (eachMapping.isOneToOneMapping()) {
                    var oneToOneIdx = self.sortedTableNames.indexOf(eachMapping.toColumns[0].table.tableName);
                    if (currTableIdx < oneToOneIdx) {
                        var firstPart = self.sortedTableNames.slice(0, oneToOneIdx + 1);
                        var secondPart = self.sortedTableNames.slice(oneToOneIdx + 1);
                        firstPart.splice(currTableIdx, 1);
                        firstPart.push(currTableName);
                        self.sortedTableNames = firstPart.concat(secondPart);
                    }
                }
            });
        });
        this.isPrepared = true;
    }

    newQuery(model) {
        return new ApatiteQuery(this, model);
    }

    /**
     * Creates a new query object to specify order by for one to many mapping. This query needs to be passed to the method ApatiteOneToManyMapping#setOrderByQuery.
     * 
     * @returns {ApatiteToManyOrderByQuery} An instance of class ApatiteToManyOrderByQuery.
     * 
     */
    newToManyOrderQuery() {
        return new ApatiteToManyOrderByQuery(this);
    }

    /**
     * Creates a new query object to specify model inheritance. This query object needs to be passed as a parameter to the method ApatiteModelDescriptor#inheritFrom.
     * 
     * @returns {ApatiteTypeFilterQuery} An instance of class ApatiteTypeFilterQuery.
     * 
     */
    newTypeFilterQuery() {
        return new ApatiteTypeFilterQuery(this);
    }

    /**
     * Gets an apatite table if it exists else creates one with the specfied table name.
     * 
     * @param {String} tableName A string specifying the table name.
     * @returns {ApatiteTable} An instance of class ApatiteTable.
     * 
     */
    getOrCreateTable(tableName) {
        if (this.allTables[tableName])
            return this.allTables[tableName];
        else
            return this.newTable(tableName);
    }

    /**
     * Gets an apatite table.
     * 
     * @param {String} tableName A string specifying the table name.
     * @returns {ApatiteTable} An instance of class ApatiteTable.
     * 
     */
    getTable(tableName) {
        return this.allTables[tableName];
    }

    /**
     * Creates new apatite table. If the table already exists, an error would be thrown.
     * 
     * @param {String} tableName A string specifying the table name.
     * @returns {ApatiteTable} An instance of class ApatiteTable.
     * 
     */
    newTable(tableName) {
        if (this.allTables[tableName])
            throw new ApatiteConfigError('Table: ' + tableName + ' already exists.');

        var newTable = new ApatiteTable(tableName, this.dialect);
        this.allTables[tableName] = newTable;
        this.sortedTableNames.push(tableName);

        return newTable;
    }

    /**
     * Creates a new model descriptor to describe the model.
     * 
     * @param {class} model A valid javascript class.
     * @param {ApatiteTable} table An instance of class ApatiteTable.
     * @returns {ApatiteModelDescriptor} An instance of class ApatiteModelDescriptor.
     * 
     */
    newModelDescriptor(model, table) {
        var descriptor = new ApatiteModelDescriptor(model, table);
        this.registerModelDescriptor(descriptor);
        return descriptor;
    }

    /**
     * Creates a new model descriptor to describe the model from a javascript object.
     * 
     * @param {{}} object An object specifying the descriptor/mapping details. See public API docs for valid property names.
     * @returns {ApatiteModelDescriptor} An instance of class ApatiteModelDescriptor.
     * 
     */
    newDescriptorFromObject(object) {
        var table = this.getOrCreateTable(object.table)
        var descriptor = this.newModelDescriptor(object.model, table);
        descriptor.createMappingsFromObject(object)
        return descriptor;
    }

    /**
     * Registers the model by calling the static method getModelDescriptor(apatite) of the model. Throws an error if the static method getModelDescriptor(apatite) does not exist.
     * 
     * @param {class} model A valid javascript class.
     * 
     */
    registerModel(model) {
        this.validateModel(model);

        if (typeof model.getModelDescriptor !== 'function')
            throw new ApatiteConfigError('getModelDescriptor not defined in model: ' + model.name + '. Define a static function named getModelDescriptor to register model.');

        var modelDescriptor = model.getModelDescriptor(this);
        this.basicRegisterModelDescriptor(modelDescriptor);
    }

    /**
     * Registers the model descriptor. Throws error if invalid parameter passed.
     * 
     * @param {ApatiteModelDescriptor} modelDescriptor
     * 
     */
    registerModelDescriptor(modelDescriptor) {
        if ((!modelDescriptor) || (modelDescriptor.constructor.name !== 'ApatiteModelDescriptor'))
            throw new ApatiteConfigError('Model descriptor provided to register is invalid. Please provide a valid model descriptor.');

        this.validateModel(modelDescriptor.model);
        this.basicRegisterModelDescriptor(modelDescriptor);
    }

    basicRegisterModelDescriptor(modelDescriptor) {
        modelDescriptor.apatite = this;
        this.registeredDescriptors[modelDescriptor.model.name] = modelDescriptor;
    }

    isClass(func) {
        return typeof func === 'function'
            && /^class\s/.test(Function.prototype.toString.call(func));
    }

    validateModel(model) {
        if (!model)
            throw new ApatiteConfigError('Model provided to register is invalid. Please provide a valid model.');

        if (!this.isClass(model))
            throw new ApatiteConfigError('Model provided is not a valid ES6 class.');

        var modelName = model.name;

        if (this.registeredDescriptors[modelName])
            throw new ApatiteConfigError('Model ' + modelName + ' already registered.');

    }
}

module.exports = Apatite;