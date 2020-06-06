
'use strict';

var ApatiteAttributeExpression = require('../query-expression/apatite-attribute-expression.js');
var ApatiteOperatorExpression = require('../query-expression/apatite-operator-expression.js');
var ApatiteLogicalOperatorExpression = require('../query-expression/apatite-logical-operator-expression.js');
var ApatiteEncloseExpression = require('../query-expression/apatite-enclose-expression.js');
var ApatiteValueExpression = require('../query-expression/apatite-value-expression.js');
var ApatiteOrderByExpression = require('../query-expression/apatite-order-by-expression.js');
var ApatiteExistsExpression = require('../query-expression/apatite-exists-expression.js');
var ApatiteAttributeJoinExpression = require('../query-expression/apatite-attribute-join-expression.js');

var ApatiteError = require('../error/apatite-error.js');

class ApatiteQueryAbstract {
    constructor(apatite) {
        this.apatite = apatite;
        this.modelName = null;
        this.session = null;
        this.whereExpressions = [];
        this.attributesToFetch = [];
        this.orderByExpressions = [];
        this.hasOnlyPKExpressions = null;
        this.isSubQuery = false;
        this.isInternalQuery = false;
        this.returnCursorStream = false;
        this.defineConditionalProperties();
    }

    defineConditionalProperties() {
        var self = this;
        Object.defineProperty(this, 'or', {
            get: function () {
                return self.addOrExpression();
            }
        });
        Object.defineProperty(this, 'and', {
            get: function () {
                return self.addAndExpression();
            }
        });
        Object.defineProperty(this, 'enclose', {
            get: function () {
                return self.addEncloseExpression();
            }
        });
    }

    beInternalQuery() {
        this.isInternalQuery = true;
    }

    hasOnlyPrimaryKeyExpressions() {
        if (this.isInternalQuery)
            return false;

        if (this.hasOnlyPKExpressions !== null)
            return this.hasOnlyPKExpressions;

        this.setHasOnlyPKExpressions();    

        return this.hasOnlyPKExpressions;
    }

    /**
     * Creates a new order by expression. Call the method desc() on an ApatiteOrderByExpression instance to order in descending order.
     * 
     * @param {String} attributeName A string specifying the attribute name.
     * @returns {ApatiteOrderByExpression} An instance of class ApatiteOrderByExpression.
     * 
     */
    orderBy(attributeName) {
        var attrExpr = new ApatiteAttributeExpression(attributeName, this);
        var orderByExpr = new ApatiteOrderByExpression(attrExpr, this);
        this.orderByExpressions.push(orderByExpr);
        return orderByExpr;
    }

    setHasOnlyPKExpressions() {
        this.hasOnlyPKExpressions = this.whereExpressions.length === 0 ? false : this.basicHasOnlyPrimaryKeyExpressions();
    }

    basicHasOnlyPrimaryKeyExpressions() {
        var descriptor = this.getModelDescriptor();
        var allAttrNames = this.getAttributeNames();
        var pkAttrNames = descriptor.getPrimaryKeyAttributeNames();

        if (pkAttrNames.length !== allAttrNames.length)
            return false;

        if (this.whereExpressions.length > 1)
            return false

        if (!this.whereExpressions[0].operatorExpression)
            return false

        if (this.whereExpressions[0].operatorExpression.expressionValue !== '=')
            return false

        for (var i = 0; i < pkAttrNames.length; i++) {
            var idx = allAttrNames.indexOf(pkAttrNames[i]);
            if (idx === -1)
                return false;

            allAttrNames.splice(idx, 1);
        }

        return allAttrNames.length === 0;
    }

    getAttributeNames() { //cannot be used for anything else other than checking if query has only PK expressions
        var attrNames = [];
        for (var i = 0; i < this.whereExpressions.length; i++) {
            attrNames = attrNames.concat(this.whereExpressions[i].getAttributeNames());
        }
        attrNames = new Set(attrNames);
        attrNames = Array.from(attrNames);
        return attrNames;
    }

    setPropOnObjectForCacheKey(object) {
        for (var i = 0; i < this.whereExpressions.length; i++) {
            this.whereExpressions[i].setPropOnObjectForCacheKey(object)
        }
    }

    expandOneToOneExpressions() {
        var exprsToExpand = [];
        var exprsToReplace = [];
        this.whereExpressions.forEach(function (eachExpr) {
            if (eachExpr.subQuery && eachExpr.subQuery.isSubQuery)
                eachExpr.subQuery.expandOneToOneExpressions();
            else if (eachExpr.isAttributeExpression()) {
                var expandedExprs = eachExpr.getExpandedExpressions();
                if (expandedExprs) {
                    exprsToExpand.push(eachExpr);
                    exprsToReplace.push(expandedExprs);
                }
            }
        });
        for (var i = 0; i < exprsToExpand.length; i++) {
            var idxToReplace = this.whereExpressions.indexOf(exprsToExpand[i]);
            var subQuery = this.enclose; // enclose expression would be added at the end, remove it in next line
            var exprToInsert = this.whereExpressions.pop();
            var lastQuery = subQuery;
            exprsToReplace[i].forEach(function (eachAttrExpr) {
                var attrExpr = subQuery.attribute(eachAttrExpr.expressionValue);
                attrExpr.operatorExpression = eachAttrExpr.operatorExpression;
                attrExpr.valueExpression = eachAttrExpr.valueExpression;
                lastQuery = subQuery;
                subQuery = subQuery.and;
            });
            if (lastQuery.whereExpressions.length > 1)
                lastQuery.removeLastWhereExpression(); // remove the trailing and

            this.whereExpressions.splice(idxToReplace, 1, exprToInsert);
        }

    }

    addOrExpression() {
        return this.addConditionalOperatorExpression('OR');
    }

    addAndExpression() {
        return this.addConditionalOperatorExpression('AND');
    }

    addConditionalOperatorExpression(operator) {
        return this.addOperatorExpression(ApatiteLogicalOperatorExpression, operator);
    }

    basicExists(keyword, subQuery) {
        subQuery.isSubQuery = true;
        subQuery.setSession(this.session);
        this.whereExpressions.push(new ApatiteExistsExpression(keyword, subQuery));
        return this;
    }

    exists(subQuery) {
        return this.basicExists('EXISTS', subQuery);
    }

    notExists(subQuery) {
        return this.basicExists('NOT EXISTS', subQuery);
    }

    attrJoin(attrName) {
        var attrExpr = new ApatiteAttributeExpression(attrName, this);
        return new ApatiteAttributeJoinExpression(attrExpr, this);
    }

    addOperatorExpression(expressionClass, operator) {
        var subQuery = this.apatite.newQuery(this.modelName);
        subQuery.isSubQuery = true;
        subQuery.setSession(this.session);
        this.whereExpressions.push(new expressionClass(operator, subQuery));
        return subQuery;
    }

    addEncloseExpression() {
        return this.addOperatorExpression(ApatiteEncloseExpression, '');
    }

    removeLastWhereExpression() {
        this.whereExpressions.pop();

    }

    matchesRow(objectBuilder) {
        var matches = true;
        for (var i = 0; i < this.whereExpressions.length; i++) {
            matches = this.whereExpressions[i].matchesRow(matches, objectBuilder);
        }

        return matches;
    }

    matchesObject(object) {
        var matches = true;
        if (!this.whereExpressions.length)
            return matches;

        for (var i = 0; i < this.whereExpressions.length; i++) {
            matches = this.whereExpressions[i].matchesObject(matches, object);
        }

        return matches;
    }

    fetchesObjects() {
        return this.attributesToFetch.length === 0;
    }

    buildResultForRow(tableRow) {
        if (this.fetchesObjects())
            return this.session.buildObjectForRow(tableRow, this);
        else
            return this.session.buildAttrListForRow(tableRow, this);
    }

    setModelName(modelName) {
        this.modelName = modelName;
    }

    setSession(session) {
        this.session = session;
        this.whereExpressions.forEach(function (eachExpr) {
            eachExpr.setSubQuerySession(session);
        });
    }

    addTypeFilterQueryExpressions() {
        var descriptor = this.getModelDescriptor();
        if (!descriptor.typeFilterQuery)
            return;

        this.setHasOnlyPKExpressions();

        var subQuery = this.enclose;
        descriptor.typeFilterQuery.whereExpressions.forEach(function (eachExpr) {
            eachExpr.query = subQuery;
            subQuery.whereExpressions.push(eachExpr);
        });
    }

    getModelDescriptor() {
        return this.session.apatite.getModelDescriptor(this.modelName);
    }

    /**
     * Creates a new apatite attribute expression.
     * 
     * @param {String} attributeName A string specifying the attribute name.
     * @returns {ApatiteAttributeExpression} An instance of class ApatiteAttributeExpression.
     * 
     */
    attr(attributeName) {
        return this.attribute(attributeName);
    }

    /**
     * Creates a new apatite attribute expression.
     * 
     * @param {String} attributeName A string specifying the attribute name.
     * @returns {ApatiteAttributeExpression} An instance of class ApatiteAttributeExpression.
     * 
     */
    attribute(attributeName) {
        var attrExpr = new ApatiteAttributeExpression(attributeName, this);
        this.whereExpressions.push(attrExpr);
        return attrExpr;
    }

    /**
     * Executes the query. If the parameter onExecuted is defined, the function passed as parameter would be called else an instance of Promise would be returned.
     * 
     * @param {function(Error, result)} onExecuted null/undefined or A function which would be called after the query execution is finished. This function would be passed two parameters. The first an error object in case of error else null, the second the query result.
     * @returns {Promise} undefined or an instance of Promise.
     * 
     */
    execute(onExecuted) {
        if (!this.session) {
            var err = new ApatiteError('There is no session associated with the query. Use execute on session.');
            if (onExecuted)
                return onExecuted(err);
            else {
                return Promise.reject(err);
            }
        }

        if (onExecuted) {
            this.session.execute(this, onExecuted);
            return this;
        }
        var self = this;
        return new Promise(function (resolve, reject) {
            self.session.execute(self, function (err, value) {
                if (err)
                    reject(err);
                else
                    resolve(value);
            });
        });
    }

    validate() {
        if (!this.getModelDescriptor())
            throw new ApatiteError('Descriptor for model: ' + this.modelName + ' not found.');
    }
}

module.exports = ApatiteQueryAbstract;