'use strict';

var ApatiteObjectChangeSet = require('./apatite-object-change-set.js');
var ApatiteObjectBuilder = require('../model/apatite-object-builder.js');
var ApatiteOneToManyProxy = require('../model/apatite-one-to-many-proxy.js');

class ApatiteChangeSet {
    constructor(session) {
        this.session = session;
        this.newObjects = new Set();
        this.changedObjects = new Set();
        this.deletedObjects = new Set();
        this.objectChangeSets = [];
    }

    compareStatements(firstStmt, secondStmt) {
        var sortedTableNames = this.session.apatite.sortedTableNames;
        var firstTableIdx = sortedTableNames.indexOf(firstStmt.tableName);
        var secondTableIdx = sortedTableNames.indexOf(secondStmt.tableName);

        return firstTableIdx - secondTableIdx;
    }

    buildDeleteStatements() {
        var statements = [];
        var dialect = this.session.apatite.dialect;
        var self = this;
        this.deletedObjects.forEach(function (eachObject) {
            var stmt = dialect.getDeleteSQLBuilder(self.session, eachObject).buildSQLStatement();
            stmt.object = eachObject;
            statements.push(stmt);
        });
        statements = statements.sort(function (firstStmt, secondStmt) {
            return self.compareStatements(firstStmt, secondStmt);
        });
        return statements;
    }

    buildUpdateStatements() {
        var statements = [];
        var dialect = this.session.apatite.dialect;
        for (var objIdx = 0; objIdx < this.objectChangeSets.length; objIdx++) {
            var objChangeSet = this.objectChangeSets[objIdx];
            var object = objChangeSet.object;
            var stmt = dialect.getUpdateSQLBuilder(this.session, object, objChangeSet).prepareSQLStatement();
            stmt.object = object;
            statements.push(stmt);

        }
        var self = this;
        statements = statements.sort(function (firstStmt, secondStmt) {
            return self.compareStatements(firstStmt, secondStmt);
        });
        return statements;
    }

    buildInsertStatements() {
        var statements = [];
        var dialect = this.session.apatite.dialect;
        var self = this;
        this.registerOneToManyMappingsOfNewObjects();
        this.newObjects.forEach(function (eachObject) {
            var stmt = dialect.getInsertSQLBuilder(self.session, eachObject).prepareSQLStatement();
            stmt.object = eachObject;
            statements.push(stmt);
        });
        statements = statements.sort(function (firstStmt, secondStmt) {
            return self.compareStatements(firstStmt, secondStmt);
        });
        return statements;
    }

    registerCascadeOfDeletedObjects(onRegistered) {
        var self = this;
        var objectsToProcess = [];
        this.deletedObjects.forEach(function (eachObject) {
            objectsToProcess.push(eachObject);
        });
        var objectsToCascade = new Set();
        this.collectObjectsToCascade(objectsToProcess, objectsToCascade, function (err) {
            if (err)
                return onRegistered(err)
            
            objectsToCascade.forEach(function (eachObject) {
                self.registerDelete(eachObject);
            })
            onRegistered(null)
        })
    }

    collectObjectsToCascade(objectsToProcess, objectsToCascade, onCollected) {
        if (objectsToProcess.length === 0)
            return onCollected(null)

        var object = objectsToProcess.shift();
        var proxiesToCascade = [];
        this.collectProxiesToCascade(object, proxiesToCascade);
        var self = this;
        this.resolveProxiesAndCollectCascades(proxiesToCascade, objectsToCascade, function (err) {
            if (err)
                return onCollected(err)

            self.collectObjectsToCascade(objectsToProcess, objectsToCascade, onCollected)
        });
    }

    resolveProxiesAndCollectCascades(proxies, objectsToCascade, onResolved) {
        if (proxies.length === 0)
            return onResolved(null);

        var self = this;
        var proxy = proxies.shift();
        proxy.getValue(function (err, childObjects) {
            if (err)
                return onResolved(err)

            childObjects.forEach(function (eachChildObject) {
                objectsToCascade.add(eachChildObject);
                self.collectProxiesToCascade(eachChildObject, proxies)
            });
            self.resolveProxiesAndCollectCascades(proxies, objectsToCascade, onResolved)
        })
    }

    collectProxiesToCascade(object, proxies) {
        var descriptor = this.session.apatite.getModelDescriptor(object.constructor.name);
        var mappings = descriptor.getOwnAndSuperClasMappings();
        mappings.forEach(function (eachMapping) {
            if (eachMapping.isOneToManyMapping() && eachMapping.shouldCascadeOnDelete) {
                var oneToOneProxy = object[eachMapping.attributeName];
                if (oneToOneProxy instanceof ApatiteOneToManyProxy) {
                    proxies.push(oneToOneProxy)
                }
            }
        });
    }

    registerOneToManyMappingsOfNewObjects() {
        var self = this;
        var objectsToProcess = [];
        this.newObjects.forEach(function (eachObject) {
            objectsToProcess.push(eachObject);
        });
        objectsToProcess.forEach(function (eachObject) {
            self.registerOneToManyMappingsOfNewObject(eachObject);
        });
    }

    registerOneToManyMappingsOfNewObject(object) {
        var self = this;
        var descriptor = self.session.apatite.getModelDescriptor(object.constructor.name);
        var mappings = descriptor.getOwnAndSuperClasMappings();
        mappings.forEach(function (eachMapping) {
            if (eachMapping.isOneToManyMapping()) {
                var arr = object[eachMapping.attributeName];
                if (arr) {
                    for (var i = 0; i < arr.length; i++) {
                        self.session.registerNew(arr[i]);
                        self.registerOneToManyMappingsOfNewObject(arr[i]);
                    }
                }
            }
        });
    }

    save(onSaved) {
        var self = this;
        this.registerCascadeOfDeletedObjects(function (cascadeErr) {
            if (cascadeErr) {
                onSaved(cascadeErr);
                return
            }
            var dialect = self.session.apatite.dialect;
            var allStatements = self.buildDeleteStatements();
            allStatements = allStatements.concat(self.buildInsertStatements());
            allStatements = allStatements.concat(self.buildUpdateStatements());

            self.session.connection.executeStmtsInTransaction(allStatements, function (err) {
                if (err) {
                    onSaved(err);
                    return
                }
                self.deletedObjects.forEach(function(eachDeletedObj) {
                    if (typeof eachDeletedObj.apatitePostDelete === 'function') {
                        eachDeletedObj.apatitePostDelete()
                    }
                });
                self.changedObjects.forEach(function(eachChangedObj) {
                    if (typeof eachChangedObj.apatitePostSave === 'function') {
                        eachChangedObj.apatitePostSave()
                    }
                });
                self.session.removeObjectsFromCache(self.deletedObjects);
                self.definePropertiesForNewObjects();
                self.resetVariables();
                onSaved(null);
            }); 
        });
    }

    definePropertiesForNewObjects() {
        var apatite = this.session.apatite;
        var session = this.session;
        this.newObjects.forEach(function (eachObject) {
            var descriptor = apatite.getModelDescriptor(eachObject.constructor.name);
            var objBuilder = new ApatiteObjectBuilder(session, null, null);
            objBuilder.setDescriptor(descriptor);
            objBuilder.initNewObject(eachObject, null);
            if (typeof eachObject.apatitePostSave === 'function') {
                eachObject.apatitePostSave()
            }
        });
    }

    rollback() {
        var self = this;
        this.objectChangeSets.forEach(function (eachObjChangeSet) {
            eachObjChangeSet.rollback(self.session);
        });
        var allObjects = [];
        this.newObjects.forEach(function (eachObject) { allObjects.push(eachObject); });
        this.changedObjects.forEach(function (eachObject) { allObjects.push(eachObject); });
        this.deletedObjects.forEach(function (eachObject) { allObjects.push(eachObject); });
        allObjects.forEach(function (eachObject) {
            if (typeof eachObject.apatitePostRollback === 'function') {
                eachObject.apatitePostRollback()
            }
        });
        this.resetVariables();
    }

    resetVariables() {
        this.newObjects = new Set();
        this.changedObjects = new Set();
        this.deletedObjects = new Set();
        this.objectChangeSets = [];
    }

    getOrCreateObjectChangeSet(object) {
        var objChangeSet = null;
        for (var i = 0; i < this.objectChangeSets.length; i++) {
            if (this.objectChangeSets[i].object === object) {
                objChangeSet = this.objectChangeSets[i];
                break;
            }
        }
        if (objChangeSet === null) {
            objChangeSet = new ApatiteObjectChangeSet(object);
            this.objectChangeSets.push(objChangeSet);
        }

        return objChangeSet;
    }

    registerAttrValueChange(object, attrName, oldValue, isInstantiated) {
        this.changedObjects.add(object);
        this.getOrCreateObjectChangeSet(object).registerAttrValueChange(attrName, oldValue, isInstantiated);
    }

    registerDelete(object) {
        this.deletedObjects.add(object);
    }

    registerNew(object) {
        this.newObjects.add(object);
    }
}

module.exports = ApatiteChangeSet;