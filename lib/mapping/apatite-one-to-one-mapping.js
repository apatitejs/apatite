'use strict';

var ApatiteMapping = require('./apatite-mapping.js');
var ApatiteMappingError = require('../error/apatite-mapping-error');
var ApatiteAttributeExpression = require('../query-expression/apatite-attribute-expression.js');
var ApatiteQuery = require('../query/apatite-query.js');
var ApatiteOneToOneProxy = require('../model/apatite-one-to-one-proxy.js');
var ApatiteColumn = require('../database/apatite-column.js');
var ApatiteUtil = require('../util.js');
var assert = require('assert');

class ApatiteOneToOneMapping extends ApatiteMapping {
    constructor(attributeName, toModelName, columns, toColumns) {
        super(attributeName);
        this.toModelName = toModelName;
        this.columns = columns;
        this.toColumns = toColumns;
        this.isLeftOuterJoin = false;
        if (columns instanceof Array) {
            columns.forEach(function (eachColumn) {
                if (eachColumn instanceof ApatiteColumn)
                    eachColumn.isOneToOneColumn = true;
            });
        }
    }

    /**
     * Forces the mapping to issue sql with left outer join.
     * 
     * 
     */
    beLeftOuterJoin() {
        this.isLeftOuterJoin = true;
    }

    getMappedColumns() {
        return this.columns;
    }

    definePropertyInObject(object, objectBuilder) {
        var descriptor = objectBuilder.descriptor.getModelDescriptor(this);
        var query = new ApatiteQuery(objectBuilder.session.apatite, descriptor.model);
        query.setSession(objectBuilder.session);

        var initFromObj = objectBuilder.shouldInitValuesFromObject();

        var attrName = this.attributeName;
        var subQuery = query;
        var self = this;
        descriptor.getPrimaryKeyAttributeNames().forEach(function (eachAttrName) {
            var attrValue;
            if (initFromObj) {
                attrValue = self.getAttrValueFromObject(object, eachAttrName);
            } else {
                var columnName = objectBuilder.query.attrColumnMapping[attrName + '.' + eachAttrName];
                attrValue = objectBuilder.tableRow[columnName];
            }
            
            subQuery = subQuery.attr(eachAttrName).eq(attrValue).and;
        });
        query.removeLastWhereExpression();

        var apatiteProxy = new ApatiteOneToOneProxy(query);
        if (initFromObj) {
            apatiteProxy.setValue(object[this.attributeName]);
        }

        this.definePropInObjectWithValue(object, apatiteProxy, objectBuilder.session);
    }

    buildAttrExpressions(descriptor) {
        var attrExprs = [];
        var attrName = this.attributeName;
        var oneToOneDescriptor = descriptor.getModelDescriptor(this);

        oneToOneDescriptor.getPrimaryKeyMappings().forEach(function (eachMapping) {
            attrExprs.push(new ApatiteAttributeExpression(attrName + '.' + eachMapping.attributeName));
        });
        return attrExprs;
    }


    buildAttrExprsForSQL(object, descriptor) {
        var attrExprs = [];
        var self = this;
        this.buildAttrExpressions(descriptor).forEach(function (eachAttrExpr) {
            var objValue = null;
            if (object) {
                objValue = self.getAttrValueFromObject(object, eachAttrExpr.expressionValue);
            }
            eachAttrExpr.equals(objValue);
            attrExprs.push(eachAttrExpr);
        });
        return attrExprs;
    }

    buildExpandedAttrExpressions(oneToOneObj, descriptor) {
        var attrExprs = [];
        var oneToOneDescriptor = descriptor.getModelDescriptor(this);
        var attrName = this.attributeName;
        oneToOneDescriptor.getPrimaryKeyMappings().forEach(function (eachMapping) {
            assert(eachMapping.isSimpleMapping(), 'Only simple mappings can be part of primary key.');
            var attrExpr = new ApatiteAttributeExpression(attrName + '.' + eachMapping.attributeName);
            var objValue = null;
            if (oneToOneObj)
                objValue = oneToOneObj[eachMapping.attributeName];
            attrExpr.equals(objValue);
            attrExprs.push(attrExpr);
        });
        return attrExprs;
    }

    isOneToOneMapping() {
        return true;
    }

    validate(descriptor) {
        if (!this.toModelName)
            throw new ApatiteMappingError('Invalid one-to-one mapping. Model name not defined for attribute: ' + this.attributeName + '.');

        var toDescriptor = descriptor.getModelDescriptor(this);
        if (!toDescriptor)
            throw new ApatiteMappingError('Invalid one-to-one mapping attribute: ' + this.attributeName + '. Model: ' + this.toModelName + ' not registered.');

        var mappingInfoStr = 'Invalid one-to-one mapping attribute: ' + this.attributeName + ' in model: ' + descriptor.model.name + '. ';
        if (!(this.columns instanceof Array))
            throw new ApatiteMappingError(mappingInfoStr + 'Source columns is expected to be an array of columns.');

        if (!(this.toColumns instanceof Array))
            throw new ApatiteMappingError(mappingInfoStr + 'Target columns is expected to be an array of columns.');

        if (this.columns.length !== this.toColumns.length)
            throw new ApatiteMappingError(mappingInfoStr + 'Source columns size must be same as target columns size.');

        if (ApatiteUtil.selectUniqueObjects(this.columns).length !== this.columns.length)
            throw new ApatiteMappingError(mappingInfoStr + 'Source columns have duplicates.');

        if (ApatiteUtil.selectUniqueObjects(this.toColumns).length !== this.toColumns.length)
            throw new ApatiteMappingError(mappingInfoStr + 'Target columns have duplicates.');

        var table = descriptor.table;
        this.columns.forEach(function (eachColumn) {
            if (table.getColumn(eachColumn.columnName) !== eachColumn)
                throw new ApatiteMappingError(mappingInfoStr + 'The source column: ' + eachColumn.columnName + ' does not belong to table: ' + table.tableName + '.');
        });

        table = toDescriptor.table;
        this.toColumns.forEach(function (eachColumn) {
            if (table.getColumn(eachColumn.columnName) !== eachColumn)
                throw new ApatiteMappingError(mappingInfoStr + 'The target column: ' + eachColumn.columnName + ' does not belong to table: ' + table.tableName + '.');
        });
    }
}

module.exports = ApatiteOneToOneMapping;