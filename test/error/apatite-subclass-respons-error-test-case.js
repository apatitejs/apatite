var TestCase = require('njsunit').TestCase
var ApatiteDialect = require('../../lib/database/apatite-dialect.js')
var ApatiteConnection = require('../../lib/database/apatite-connection.js')
var ApatiteResultSet = require('../../lib/database/apatite-result-set.js')
var ApatiteExpression = require('../../lib/query-expression/apatite-expression.js')
var ApatiteSubclassResponsibilityError = require('../../lib/error/apatite-subclass-responsibility-error.js')
var errMsg = 'My subclass should have overridden this method.'

class ApatiteSubClassResponsibilityTestCase extends TestCase {
    constructor() {
        super()
    }

    testDialectSubClassResponsibility() {
        var dialect = new ApatiteDialect()
        this.shouldThrow(() => {
            dialect.basicCreateConnectionPool()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            dialect.newConnection()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            dialect.getApatiteResultSet()
        }, ApatiteSubclassResponsibilityError, errMsg)
    }

    testConnectionSubClassResponsibility() {
        var connection = new ApatiteConnection()
        this.shouldThrow(() => {
            connection.basicConnect()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            connection.basicDisconnect()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
           connection.basicExecuteSQLString()
        }, ApatiteSubclassResponsibilityError, errMsg)
    }

    testResultSetSubClassResponsibility() {
        var resultSet = new ApatiteResultSet()
        this.shouldThrow(() => {
            resultSet.fetchAllRows()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            resultSet.fetchNextRows()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            resultSet.closeResultSet()
        }, ApatiteSubclassResponsibilityError, errMsg)
    }

    testExpressionSubClassResponsibility() {
        var expr = new ApatiteExpression()
        this.shouldThrow(() => {
            expr.matchesRow()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            expr.matchesObject()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            expr.getAttributeNames()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.shouldThrow(() => {
            expr.getAttrNamesWithValues()
        }, ApatiteSubclassResponsibilityError, errMsg)

        this.assertEqual(expr.isAttributeExpression(), false)
    }
}

module.exports = ApatiteSubClassResponsibilityTestCase