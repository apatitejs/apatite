'use strict';

var ApatiteMapping = require('./apatite-mapping.js');
var ApatiteMappingError = require('../error/apatite-mapping-error.js');
var ApatiteOneToManyProxy = require('../model/apatite-one-to-many-proxy.js');

class ApatiteOneToManyMapping extends ApatiteMapping {
    constructor(attributeName, toModelName, toOneToOneAttrName) {
        super(attributeName);
        this.toModelName = toModelName;
        this.toOneToOneAttrName = toOneToOneAttrName;
        this.shouldCascadeOnDelete = false;
        this.orderByQuery = null;
    }

    /**
     * Specifies order by for one to many objects.
     * 
     * @param {ApatiteTypeFilterQuery} orderByQuery An instance of class ApatiteTypeFilterQuery.
     * 
     */
    setOrderByQuery(orderByQuery) {
        this.orderByQuery = orderByQuery;
    }

    isOneToManyMapping() {
        return true;
    }

    /**
     * Deletes the one to many objects when the parent (one to one) object is deleted.
     * 
     * 
     */
    cascadeOnDelete() {
        this.shouldCascadeOnDelete = true;
    }

    definePropertyInObject(object, objectBuilder) {
        var thisDescriptor = objectBuilder.descriptor;
        var oneToManyDescriptor = thisDescriptor.getModelDescriptor(this);

        var query = objectBuilder.session.newQuery(oneToManyDescriptor.model);
        query.setSession(objectBuilder.session);
        query.beInternalQuery();

        var subQuery = query;
        var self = this;
        var initFromObj = objectBuilder.shouldInitValuesFromObject();
        thisDescriptor.getPrimaryKeyAttributeNames().forEach(function (eachAttrName) {
            var attrValue;
            if (initFromObj) {
                attrValue = self.getAttrValueFromObject(object, eachAttrName);
            } else {
                var columnName = objectBuilder.query.attrColumnMapping[eachAttrName];
                attrValue = objectBuilder.tableRow[columnName];
            }
            subQuery = subQuery.attr(self.toOneToOneAttrName + '.' + eachAttrName).eq(attrValue).and;
        });
        query.removeLastWhereExpression();
        if (this.orderByQuery) {
            query.orderByExpressions = this.orderByQuery.orderByExpressions
        }

        var apatiteProxy = new ApatiteOneToManyProxy(query);
        if (initFromObj) {
            apatiteProxy.setValue(object[this.attributeName]);
        }

        this.definePropInObjectWithValue(object, apatiteProxy, objectBuilder.session);
    }


    validate(descriptor) {
        if (!this.toModelName)
            throw new ApatiteMappingError('Invalid one-to-many mapping. Model name not defined for attribute: ' + this.attributeName + '.');

        var toDescriptor = descriptor.getModelDescriptor(this);
        if (!toDescriptor)
            throw new ApatiteMappingError('Invalid one-to-many mapping attribute: ' + this.attributeName + '. Model: ' + this.toModelName + ' not registered.');

        var mappingInfoStr = 'Invalid one-to-many mapping attribute: ' + this.attributeName + ' in model: ' + descriptor.model.name + '. ';

        if (!this.toOneToOneAttrName)
            throw new ApatiteMappingError(mappingInfoStr + 'The to one-to-one attribute name is not defined.');

        try {
            toDescriptor.getMappingForAttribute(this.toOneToOneAttrName);
        }
        catch (err) {
            throw new ApatiteMappingError(mappingInfoStr + err.message);
        }


    }
}

module.exports = ApatiteOneToManyMapping;