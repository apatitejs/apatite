'use strict';

var ApatiteOneToOneProxy = require('./apatite-one-to-one-proxy');

class ApatiteOneToManyProxy extends ApatiteOneToOneProxy {
    constructor(query) {
        super(query);
    }

    getInitValueForObject() {
        return [];
    }

    setValueFromQueryResult(result) {
        this.setValue(result);
    }

    /**
     * Gets the number of one to many objects.
     * 
     * @param {function(Error, Number)} onLengthFetched A function which would be called after the one to many objects are loaded. This function would be passed two parameters. The first an error object in case of error else null, the second an integer specifying the length.
     * 
     */
    getLength(onLengthFetched) {
        this.getValue(function (err, result) {
            if (err)
                onLengthFetched(err);
            else
                onLengthFetched(null, result.length);
        });
    }

    /**
     * Gets the object at the specfied index.
     * 
     * @param {Number} idx An integer specifying the index.
     * @param {function(Error, object)} onValueFetched A function which would be called after the one to many objects are loaded. This function would be passed two parameters. The first an error object in case of error else null, the second the requested object.
     * 
     */
    getAtIndex(idx, onValueFetched) {
        this.getValue(function (err, result) {
            if (err)
                onValueFetched(err);
            else
                onValueFetched(null, result[idx]);
        });
    }

    /**
     * Gets the index of an object.
     * 
     * @param {any} object An instance of valid javascript class.
     * @param {function(Error, Number)} onIndexFetched A function which would be called after the one to many objects are loaded. This function would be passed two parameters. The first an error object in case of error else null, the second an integer specifying the index of object.
     * 
     */
    indexOf(object, onIndexFetched) {
        this.getValue(function (err, result) {
            if (err)
                onIndexFetched(err);
            else
                onIndexFetched(null, result.indexOf(object));
        });
    }

    /**
     * Adds objects to the one to many collection.
     * 
     * @param {function(Error)} onObjectsAdded A function which would be called after the objects are added. This function would be passed an error object in case of error else null.
     * @param {any} objectsToAdd Instances of valid javascript class.
     * 
     */
    add(onObjectsAdded, ...objectsToAdd) {
        var self = this;
        this.getValue(function (err, result) {
            if (err)
                onObjectsAdded(err);
            else {
                result.push(...objectsToAdd);
                for (var i = 0; i < objectsToAdd.length; i++) {
                    self.query.session.registerNew(objectsToAdd[i]);
                }
                onObjectsAdded(null);

            }
        });
    }

    /**
     * Removes objects from the one to many collection.
     * 
     * @param {function(Error)} onObjectsRemoved A function which would be called after the objects are removed. This function would be passed an error object in case of error else null.
     * @param {any} objectsToRemove Instances of valid javascript class.
     * 
     */
    remove(onObjectsRemoved, ...objectsToRemove) {
        var self = this;
        this.getValue(function (err, result) {
            if (err)
                onObjectsRemoved(err);
            else {
                for (var i = 0; i < objectsToRemove.length; i++) {
                    var objToRemove = objectsToRemove[i];
                    var objIdx = result.indexOf(objToRemove);
                    if (objIdx === -1)
                        return onObjectsRemoved(new Error('Object not found in apatite Array.'));

                    result.splice(objIdx, 1);

                    self.query.session.registerDelete(objToRemove);
                }
                onObjectsRemoved(null);
            }
        });
    }

    /**
     * Removes all objects from the one to many collection.
     * 
     * @param {function(Error)} onAllRemoved A function which would be called after the objects are removed. This function would be passed an error object in case of error else null.
     * 
     */
    removeAll(onAllRemoved) {
        var self = this;
        this.getValue(function (err, result) {
            if (err)
                onAllRemoved(err);
            else {
                while (result.length !== 0) {
                    self.remove(function (removeErr) {
                        return onAllRemoved(removeErr);
                    }, result[0]);
                };
                onAllRemoved(null);
            }
        });
    }

}

module.exports = ApatiteOneToManyProxy;