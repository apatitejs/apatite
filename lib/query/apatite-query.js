'use strict';

var ApatiteAttributeExpression = require('../query-expression/apatite-attribute-expression.js');
var ApatiteOperatorExpression = require('../query-expression/apatite-operator-expression.js');
var ApatiteValueExpression = require('../query-expression/apatite-value-expression.js');
var ApatiteOrderByExpression = require('../query-expression/apatite-order-by-expression.js');
var ApatiteQueryAbstract = require('./apatite-query-abstract.js');
var ApatiteError = require('../error/apatite-error.js');
var ApatiteFunctionExpression = require('../query-expression/apatite-function-expression.js');

class ApatiteQuery extends ApatiteQueryAbstract
{
    constructor(apatite, modelOrModelName) {
        super(apatite);
        if (!modelOrModelName)
            throw new ApatiteError('A valid model is required for query.');

        this.setModelName(typeof modelOrModelName === 'string' ? modelOrModelName : modelOrModelName.name);
        this.attrColumnMapping = {};
    }

    buildColumnNamesToFetch(sqlBuilder) {
        var descriptor = this.getModelDescriptor();
        var columnNames = [];
        var attrExpressions;
        if (this.attributesToFetch.length)
            attrExpressions = this.attributesToFetch;
        else {
            attrExpressions = []
            descriptor.getMappings().forEach(function (eachMapping) {
                eachMapping.buildAttrExpressions(descriptor).forEach(function (eachAttrExpr) {
                    attrExpressions.push(eachAttrExpr);
                });
            });
        }
        var self = this;
        var dialect = this.apatite.dialect;
        attrExpressions.forEach(function (eachAttrExpr) {
            var columnName = eachAttrExpr.buildExpressionForSQL(sqlBuilder, descriptor);
            var aliasName = eachAttrExpr.getAliasNameForSQLExpr(columnName);
            self.attrColumnMapping[eachAttrExpr.expressionValue] = aliasName;
            columnNames.push(`${columnName} AS "${aliasName}"`);
        });

        return columnNames;
    }

    /**
     * Fetches the attribute value.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchAttr(attributeName) {
        return this.fetchAttribute(attributeName);
    }

    /**
     * Fetches the attributes value.
     * 
     * @param {Array} attributeNames An array containing strings specifying the attribute name to fetch.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchAttrs(attributeNames) {
        return this.fetchAttributes(attributeNames);
    }

    /**
     * Fetches the attribute value.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchAttribute(attributeName) {
        return this.addToAttrsToFetch(new ApatiteAttributeExpression(attributeName));
    }

    /**
     * Fetches the attributes value.
     * 
     * @param {Array} attributeNames An array containing strings specifying the attribute name to fetch.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchAttributes(attributeNames) {
        var self = this;
        attributeNames.forEach(function (eachAttrName) {
            self.fetchAttribute(eachAttrName);
        });
        return this;
    }

    addToAttrsToFetch(attrExpr) {
        this.attributesToFetch.push(attrExpr);
        return this;
    }

    /**
     * Fetches the count.
     * 
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchCountAs(aliasName) {
        return this.addToAttrsToFetch(new ApatiteFunctionExpression(null, this, 'COUNT(*)', aliasName));
    }

    /**
     * Fetches the sum of the attribute.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchSumAs(attributeName, aliasName) {
        return this.fetchFunctionAs('SUM', attributeName, aliasName);
    }

    /**
     * Fetches the max value of the attribute.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchMaxAs(attributeName, aliasName) {
        return this.fetchFunctionAs('MAX', attributeName, aliasName);
    }

    /**
     * Fetches the min value of the attribute.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchMinAs(attributeName, aliasName) {
        return this.fetchFunctionAs('MIN', attributeName, aliasName);
    }

    /**
     * Fetches the average value of the attribute.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchAvgAs(attributeName, aliasName) {
        return this.fetchFunctionAs('AVG', attributeName, aliasName);
    }

    /**
     * Fetches the distinct values of the attribute.
     * 
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchDistinctAs(attributeName, aliasName) {
        return this.fetchFunctionAs('DISTINCT', attributeName, aliasName);
    }

    /**
     * Fetches the value of the function of the attribute.
     * 
     * @param {String} functionName A string specifying a sql function name.
     * @param {String} attributeName A string specifying the attribute name to fetch.
     * @param {String} aliasName A string specifying the name of the alias.
     * @returns {ApatiteQuery} An instance of class ApatiteQuery.
     * 
     */
    fetchFunctionAs(functionName, attributeName, aliasName) {
        return this.addToAttrsToFetch(new ApatiteFunctionExpression(attributeName, this, functionName, aliasName));
    }
}

module.exports = ApatiteQuery;