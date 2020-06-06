'use strict';

var ApatiteMapping = require('./apatite-mapping.js');
var ApatiteAttributeExpression = require('../query-expression/apatite-attribute-expression.js');

class ApatiteSimpleMapping extends ApatiteMapping {
    constructor(attributeName, column) {
        super(attributeName);
        this.column = column;
    }

    getAttrValueFromBuilder(objectBuilder) {
        var attrColumnMapping = objectBuilder.query.attrColumnMapping;
        var columnName = attrColumnMapping[this.attributeName];
        return objectBuilder.tableRow[columnName];
    }

    buildCacheKeyFromBuilder(objectBuilder) {
        var attrValue = this.getAttrValueFromBuilder(objectBuilder);
        return attrValue.toString();
    }

    buildCacheKeyFromObject(object, descriptor) {
        var attrValue = object[this.attributeName];
        return attrValue.toString();
    }

    definePropertyInObject(object, objectBuilder) {
        var attrValue;
        if (objectBuilder.shouldInitValuesFromObject())
            attrValue = this.getAttrValueFromObject(object, this.attributeName);
        else {
            attrValue = this.getAttrValueFromBuilder(objectBuilder);
            attrValue = this.column.convertValueForObject(attrValue);
        }

        this.definePropInObjectWithValue(object, attrValue, objectBuilder.session);
    }

    isSimpleMapping() {
        return true;
    }

    buildAttrExpressions(descriptor) {
        return [new ApatiteAttributeExpression(this.attributeName)];
    }

    buildAttrExprsForSQL(object, descriptor) {
        var attrExpr = new ApatiteAttributeExpression(this.attributeName);
        var objValue = object[this.attributeName];
        if (typeof objValue === 'undefined')
            objValue = null;

        attrExpr.equals(objValue);
        return [attrExpr];
    }

    getMappedColumns() {
        return [this.column];
    }
}

module.exports = ApatiteSimpleMapping;