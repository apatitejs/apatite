'use strict';

var ApatiteObjectBuilder = require('../model/apatite-object-builder.js');
var ApatiteQuery = require('../query/apatite-query.js');
var ApatiteChangeSet = require('./apatite-change-set.js');
var ApatiteCache = require('./apatite-cache.js');
var ApatiteError = require('../error/apatite-error.js');
var ApatiteAttributeListBuilder = require('../model/apatite-attribute-list-builder.js');
var ApatiteSQLScriptCreator = require('../sql-builder/apatite-sql-script-creator.js');

var assert = require('assert');

class ApatiteSession {
    constructor(apatite, connection) {
        this.apatite = apatite;
        this.connection = connection;
        this.changeSet = new ApatiteChangeSet(this);
        this.cache = {};
        this.trackingChanges = false;
        this.changesAndSaveQueue = [];
        this.sqlScriptCreator = null;
    }

    /**
     * Closes the underlying database connection and releases all resources.
     * 
     * @param {function(Error)} onSessionEnded A function which would be called after the session ended. The function would be passed an error object in case of error else null.
     * 
     */
    end(onSessionEnded) {
        this.connection.disconnect(onSessionEnded);
        this.connection = null;
        this.changeSet = null;
        this.apatite = null;
        this.cache = null;
    }

    getSQLScriptCreator() {
        if (this.sqlScriptCreator === null)
            this.sqlScriptCreator = ApatiteSQLScriptCreator.forApatite(this.apatite);

        return this.sqlScriptCreator;
    }

    /**
     * Executes the sql for creating the all tables of the registered models on the database. If the argument onCreated is not given, an instance of Promise is returned.
     * 
     * @param {function(Error, result)} onCreated Optional. A callback function which would be called after creation. The function would be called with two arguments, the first an error object or null, the second result of the execution.
     * @returns {Promise | undefined} Instance of Promise or undefined.
     * 
     */
    createDBTablesForAllModels(onCreated) {
        var stmts = this.getSQLScriptCreator().createStatementsForAllModels();
        return this.basicExecuteStatementsForCreateTable(stmts, onCreated);
    }

    /**
     * Executes the sql for creating the table of the model on the database. If the argument onCreated is not given, an instance of Promise is returned.
     * 
     * @param {String | class} modelOrModelName A string containing the model name or an instance of valid javascript class.
     * @param {function(Error, result)} onCreated Optional. A callback function which would be called after creation. The function would be called with two arguments, the first an error object or null, the second result of the execution.
     * @returns {Promise | undefined} Instance of Promise or undefined.
     * 
     */
    createDBTableForModel(modelOrModelName, onCreated) {
        var stmts = this.getSQLScriptCreator().createStatementsForModel(modelOrModelName);
        return this.basicExecuteStatementsForCreateTable(stmts, onCreated);
    }

    /**
     * Executes the sql for creating the column on the database. If the argument onCreated is not given, an instance of Promise is returned.
     * 
     * @param {String} modelOrModelName A string containing the model name or an instance of valid javascript class.
     * @param {String} attributeName A string containing the name of the attribute.
     * @param {function(Error, result)} onCreated Optional. A callback function which would be called after creation. The function would be called with two arguments, the first an error object or null, the second result of the execution.
     * @returns {Promise | undefined} Instance of Promise or undefined.
     * 
     */
    createDBColumnForAttribute(modelOrModelName, attributeName, onCreated) {
        var stmts = this.getSQLScriptCreator().createStatementsForModelAttribute(modelOrModelName, attributeName);
        return this.basicExecuteStatementsForCreateTable(stmts, onCreated);
    }

    basicExecuteStatementsForCreateTable(stmts, onCreated) {
        var self = this;
        if (onCreated) {
            this.connection.executeStatements(stmts, onCreated);
            return;
        }
        return new Promise(function (resolve, reject) {
            self.connection.executeStatements(stmts, function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(null);
            });
        });
    }

    /**
     * Creates sql scripts for all tables of the registered models.
     * 
     * @returns {String} A string containing sql scripts.
     * 
     */
    createSQLScriptForAllModels() {
        return this.getSQLScriptCreator().createScriptForAllModels();
    }

    /**
     * Creates sql scripts for the specified model.
     * 
     * @param {String} modelOrModelName A string containing the model name or an instance of valid javascript class.
     * @returns {String} A string containing sql scripts.
     * 
     */
    createSQLScriptForModel(modelOrModelName) {
        return this.getSQLScriptCreator().createScriptForModel(modelOrModelName);
    }

    /**
     * Creates sql scripts for the column creation.
     * 
     * @param {String} modelOrModelName A string containing the model name or an instance of valid javascript class.
     * @param {String} attributeName A string containing the name of the attribute.
     * @returns {String} A string containing sql scripts.
     * 
     */
    createSQLScriptForAttribute(modelOrModelName, attributeName) {
        return this.getSQLScriptCreator().createScriptForAttribute(modelOrModelName, attributeName);
    }

    /**
     * Creates a new query.
     * 
     * @param {class} model A valid javascript class.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    newQuery(model) {
        var newQuery = this.apatite.newQuery(model);
        newQuery.setSession(this);
        return newQuery;
    }

    execute(query, onExecuted) {
        this.checkForSubQuery(query);
        query.setSession(this);
        try {
            query.validate();
        } catch (error) {
            if (onExecuted) {
                onExecuted(error);
                return this;
            } else {
                return Promise.reject(error);
            }
        }
        if (query.hasOnlyPrimaryKeyExpressions()) {
            var object = this.getObjectWithMatchingPKQuery(query);
            if (object !== null) {
                if (onExecuted) {
                    onExecuted(null, [object]);
                    return this;
                } else {
                    return Promise.resolve([object]);
                }
            }
        }
        if (onExecuted) {
            this.connection.executeQuery(query, onExecuted);
            return this;
        }
        var self = this;
        return new Promise(function (resolve, reject) {
            self.connection.executeQuery(query, function (err, value) {
                if (err)
                    reject(err);
                else
                    resolve(value);
            });
        });
    }

    getObjectWithMatchingPKQuery(query) {
        var descriptor = query.getModelDescriptor();
        var dummyObject = {};
        query.setPropOnObjectForCacheKey(dummyObject);
        var queryIsValid = true;
        for(var prop in dummyObject)
            if ((dummyObject[prop] === null) || (dummyObject[prop] === undefined))
                queryIsValid = false;

        if (queryIsValid) {
            var cacheKey = descriptor.buildCacheKeyFromObject(dummyObject);
            return this.findObjectInCache(descriptor.model.name, cacheKey);
        } else {
            return null
        }
    }

    checkForSubQuery(query) {
        if (query.isSubQuery)
            throw new ApatiteError('Trying to execute a sub query which is not allowed. Create and store the query in a variable and then do chaining of expressions. Example: query = session.newQuery(Person); attr("name").eq("test").or.attr("id").eq("tom");');
    }

    getAllObjectsInCache(modelName) {
        var modelCache = this.cache[modelName];
        if (!modelCache)
            return [];

        return modelCache.getAllObjects();
    }

    findObjectInCache(modelName, cacheKey) {
        var modelCache = this.cache[modelName];
        if (!modelCache)
            return null;

        return modelCache.getObjectAtKey(cacheKey);
    }

    /**
     * Clears the cache. All objects would be removed from the cache.
     * 
     * 
     */
    clearCache() {
        this.cache = {};
    }

    putObjectInCache(modelName, cacheKey, object) {
        if (this.apatite.defaultCacheSize === 0)
            return null;
        
        var modelCache = this.cache[modelName];
        if (!modelCache) {
            modelCache = new ApatiteCache(this.apatite.defaultCacheSize);
            this.cache[modelName] = modelCache;
        }

        modelCache.putObjectAtKey(object, cacheKey);
    }

    removeObjectsFromCache(objects) {
        var self = this;
        objects.forEach(function (eachObject) {
            var modelName = eachObject.constructor.name;
            var modelCache = self.cache[modelName];
            if (modelCache)
                modelCache.removeObject(eachObject);
        });
    }

    buildObjectForRow(tableRow, query) {
        return (new ApatiteObjectBuilder(this, tableRow, query)).buildObject();
    }

    buildAttrListForRow(tableRow, query) {
        return (new ApatiteAttributeListBuilder(this, tableRow, query)).buildAttrList();
    }

    ensureChangesBeingTracked() {
        if (!this.trackingChanges)
            throw new ApatiteError('Cannot register object. Changes are not being tracked. Please use doChangesAndSave() to start tracking changes and save.');
    }

    /**
     * Registers new object to save. This method can be called only from the function which is passed as a parameter in the method ApatiteSession#doChangesAndSave() else an error would be thrown.
     * 
     * @param {any} object An instance of valid javascript class.
     * 
     */
    registerNew(object) {
        this.ensureChangesBeingTracked();
        this.changeSet.registerNew(object);
    }

    /**
     * Registers object to delete. This method can be called only from the function which is passed as a parameter in the method ApatiteSession#doChangesAndSave() else an error would be thrown.
     * 
     * @param {any} object An instance of valid javascript class.
     * 
     */
    registerDelete(object) {
        this.ensureChangesBeingTracked();
        this.changeSet.registerDelete(object);
    }

    onAttrValueChanged(object, attrName, oldValue) {
        if (!this.trackingChanges)
            return;

        this.changeSet.registerAttrValueChange(object, attrName, oldValue);
    }

    startTrackingChanges() {
        this.trackingChanges = true;
    }

    /**
     * 
     * 
     * @param {function(changesDone)} changesToDo A function which would be called to do changes. This function would be passed a function (changesDone) as a parameter which must be called after changes are done. If you want to abort the save process, pass an error error object to the function changesDone.
     * @param {function(Error)} onChangesSaved A function which would be called after the changes are saved. This function would be passed a parameter with error object in case of error else null.
     * 
     */
    doChangesAndSave(changesToDo, onChangesSaved) {
        this.basicDoChangesAndSave(changesToDo, onChangesSaved);
        /*var self = this
        var promise = new Promise(function (resolve, reject) {
            self.basicDoChangesAndSave(changesToDo, function (saveErr) {
                if (saveErr)
                    reject(saveErr)
                else
                    resolve()
            })
        })
        if (arguments.length === 1)
            return promise;
        else {
            promise.then(function () {
                onChangesSaved(null)
            }, function (err) {
                onChangesSaved(err)
            })
        }*/
    }

    basicDoChangesAndSave(changesToDo, onChangesSaved) {
        this.changesAndSaveQueue.push({changesToDo: changesToDo, onChangesSaved: onChangesSaved});
        if (!this.trackingChanges)
            this.processChangesAndSaveQueue();
    }

    processChangesAndSaveQueue() {
        if (this.changesAndSaveQueue.length === 0)
            return;

        var queueInfo = this.changesAndSaveQueue.shift();
        assert(!this.trackingChanges);

        this.startTrackingChanges();
        var self = this;

        queueInfo.changesToDo(function (err) {
            if (err) {
                self.rollbackChanges();
                queueInfo.onChangesSaved(err);
            }
            else
                self.saveChanges(queueInfo.onChangesSaved);
        });
    }

    saveChanges(onChangesSaved) {
        var self = this;
        this.changeSet.save(function (err) {
            if (err) {
                self.rollbackChanges();
                onChangesSaved(err);
            }
            else {
                self.stopTrackingChanges();
                onChangesSaved(null);
            }
            self.processChangesAndSaveQueue();
        });
    }

    basicStopTrackingChanges() {
        this.trackingChanges = false;
    }

    initChangeSet() {
        this.changeSet = new ApatiteChangeSet(this);
    }

    stopTrackingChanges() {
        this.basicStopTrackingChanges();
        this.initChangeSet();
    }

    rollbackChanges() {
        this.basicStopTrackingChanges();
        this.changeSet.rollback(); // must be done after stopping to track changes because the rollback sets object properties
        this.initChangeSet();
    }
}

module.exports = ApatiteSession;