'use strict';

var ApatiteExpression = require('./apatite-expression.js');
var ApatiteError = require('../error/apatite-error.js');
var ApatiteOperatorExpression = require('./apatite-operator-expression.js');
var ApatiteComparisionOperatorExpression = require('./apatite-comparision-operator-expression.js');
var ApatiteValueExpression = require('./apatite-value-expression.js');
var ApatiteAttributeJoinExpression = require('./apatite-attribute-join-expression.js');
var ApatiteOneToOneProxy = require('../model/apatite-one-to-one-proxy.js');
var assert = require('assert');

class ApatiteAttributeExpression extends ApatiteExpression {
    constructor(expressionValue, query) {
        super(expressionValue, query);
        this.operatorExpression = null;
        this.valueExpression = null;
        this.mappingColumn = null;
    }

    setMappingColumn(mappingColumn) {
        this.mappingColumn = mappingColumn;
    }

    getAttributeNames() {
        return [this.expressionValue];
    }

    setPropOnObjectForCacheKey(object) {
        object[this.expressionValue] = null;

        assert(this.valueExpression !== null);
        assert(this.valueExpression !== undefined);
        assert(this.operatorExpression.expressionValue === '=');

        object[this.expressionValue] = this.valueExpression.expressionValue;
    }

    matchesRow(previousExprResult, objectBuilder) {
        var attrColumnMapping = objectBuilder.query.attrColumnMapping;
        var columnName = attrColumnMapping[this.expressionValue];
        var rowValue = objectBuilder.tableRow[columnName];

        return this.operatorExpression.operateOn(rowValue, this.valueExpression.expressionValue);
    }

    matchesObject(previousExprResult, object) {
        var objValue = object;
        var splitArr = this.expressionValue.split('.');

        for (var i = 0; i < splitArr.length; i++) {
            if (objValue === null)
                break;

            objValue = objValue[splitArr[i]];
            if (objValue instanceof ApatiteOneToOneProxy)
                if (objValue.valueFetched)
                    objValue = objValue.basicGetValue();
                else
                    return true; // proxy value not fetched, we don't need to check further because the database already filtered the result

        }
        var exprVal = this.valueExpression ? this.valueExpression.expressionValue : null;
        return this.operatorExpression.operateOn(objValue, exprVal);
    }

    isAttributeExpression() {
        return true;
    }

    eq(attributeValue) {
        return this.equals(attributeValue);
    }

    gt(attributeValue) {
        return this.greaterThan(attributeValue);
    }

    ge(attributeValue) {
        return this.greaterOrEquals(attributeValue);
    }

    lt(attributeValue) {
        return this.lessThan(attributeValue);
    }

    le(attributeValue) {
        return this.lessOrEquals(attributeValue);
    }

    ne(attributeValue) {
        return this.notEquals(attributeValue);
    }

    greaterThan(attributeValue) {
        return this.newComparision(attributeValue, '>');
    }

    greaterOrEquals(attributeValue) {
        return this.newComparision(attributeValue, '>=');
    }

    lessThan(attributeValue) {
        return this.newComparision(attributeValue, '<');
    }

    lessOrEquals(attributeValue) {
        return this.newComparision(attributeValue, '<=');
    }

    notEquals(attributeValue) {
        return this.newComparision(attributeValue, '<>');
    }

    like(attributeValue) {
        return this.newComparision(attributeValue, 'LIKE');
    }

    notLike(attributeValue) {
        return this.newComparision(attributeValue, 'NOT LIKE');
    }

    isNULL() {
        this.operatorExpression = new ApatiteComparisionOperatorExpression('IS NULL');
        return this.query;
    }

    isNOTNULL() {
        this.operatorExpression = new ApatiteComparisionOperatorExpression('IS NOT NULL');
        return this.query;
    }

    in(attributeValue) {
        return this.newComparision(attributeValue, 'IN');
    }

    equals(attributeValue) {
        return this.newComparision(attributeValue, '=');
    }

    newComparision(attributeValue, operator) {
        this.operatorExpression = new ApatiteComparisionOperatorExpression(operator);
        this.valueExpression = new ApatiteValueExpression(attributeValue, this, this.query);
        return this.query;
    }

    getExpandedExpressions() {
        var descriptor = this.query.getModelDescriptor();
        var mapping = descriptor.getMappingForAttribute(this.expressionValue);
        if (!mapping.isOneToOneMapping())
            return null;

        var exprVal = this.valueExpression ? this.valueExpression.expressionValue : null;
        var splitArr = this.expressionValue.split('.');
        splitArr.pop();
        var attrName = splitArr.join('.');
        
        var expandedExprs = mapping.buildExpandedAttrExpressions(exprVal, descriptor);
        expandedExprs.forEach(function (eachAttrExpr) {
            if (attrName)
                eachAttrExpr.expressionValue = attrName + '.' + eachAttrExpr.expressionValue;
            eachAttrExpr.operatorExpression = this.operatorExpression;
        }, this);
        return expandedExprs;
    }

    getAliasNameForSQLExpr(columnName) {
        return columnName;
    }

    basicBuildExpressionForSQL(sqlBuilder, descriptor) {
        var mapping = descriptor.getMappingForAttribute(this.expressionValue);
        var attrName = this.expressionValue;
        var columnName = null;
        assert(mapping.isSimpleMapping());

        columnName = mapping.column.columnName;
        var splitArr = attrName.split('.');
        var leafAttrName = splitArr.pop();
        attrName = splitArr.join('.');
        if (attrName) {
            var oneToOneMapping = descriptor.getMappingForAttribute(attrName);
            var oneToOneDescriptor = descriptor.getModelDescriptor(oneToOneMapping);
            if (oneToOneDescriptor.getPrimaryKeyAttributeNames().indexOf(leafAttrName) !== -1) {
                mapping = oneToOneDescriptor.getMappingForAttribute(leafAttrName);
                columnName = oneToOneMapping.columns[oneToOneMapping.toColumns.indexOf(mapping.column)].columnName;
                splitArr = attrName.split('.');
                splitArr.pop();
                attrName = splitArr.join('.');
            }
        }

        var sqlExprs = [];
        sqlExprs.push(sqlBuilder.getOrCreateTableAliasName(attrName) + '.' + columnName);
        if (this.operatorExpression)
            sqlExprs.push(this.operatorExpression.buildExpressionForSQL(sqlBuilder, descriptor));

        if (this.valueExpression)
            sqlExprs.push(this.valueExpression.buildExpressionForSQL(sqlBuilder, descriptor));

        return sqlExprs;
    }

    buildExpressionForSQL(sqlBuilder, descriptor) {
        return this.basicBuildExpressionForSQL(sqlBuilder, descriptor).join(' ');
    }
}

module.exports = ApatiteAttributeExpression;