var TestCase = require('njsunit').TestCase
var Table = require('../../lib/database/apatite-table')
var Column = require('../../lib/database/apatite-column')
var ApatiteTestDialect = require('./apatite-test-dialect.js')
var testTable = new Table('TESTTABLE', new ApatiteTestDialect({ userName: 'apatite', password: 'test' }))

class ApatiteDataTypeTestCase extends TestCase {
    constructor() {
        super()
    }

    testDecimalDataType() {
        var ApatiteDecimalDataType = require('../../lib/database-type/apatite-decimal-data-type')
        var dataType = new ApatiteDecimalDataType(null)
        this.shouldThrow(() => {
            new Column('TESTDECCOLUMN', testTable, dataType)
        }, Error, 'Invalid length specified for column: TESTDECCOLUMN in table TESTTABLE.')

        dataType = new ApatiteDecimalDataType(0)
        this.shouldThrow(() => {
            new Column('TESTDECCOLUMN', testTable, dataType)
        }, Error, 'Invalid length specified for column: TESTDECCOLUMN in table TESTTABLE.')

        dataType = new ApatiteDecimalDataType(1, null)
        this.shouldThrow(() => {
            new Column('TESTDECCOLUMN', testTable, dataType)
        }, Error, 'Invalid precision specified for column: TESTDECCOLUMN in table TESTTABLE.')

        dataType = new ApatiteDecimalDataType(1, 0)
        this.shouldThrow(() => {
            new Column('TESTDECCOLUMN', testTable, dataType)
        }, Error, 'Invalid precision specified for column: TESTDECCOLUMN in table TESTTABLE.')
    }

    testStringDataType() {
        var StringDataType = require('../../lib/database-type/apatite-string-data-type')
        var dataType = new StringDataType(null)
        this.shouldThrow(() => {
            testColumn = new Column('TESTSTRINGCOLUMN', testTable, dataType)
        }, Error, 'Invalid length specified for column: TESTSTRINGCOLUMN in table TESTTABLE.')

        dataType = new StringDataType(0)
        this.shouldThrow(() => {
            new Column('TESTSTRINGCOLUMN', testTable, dataType)
        }, Error, 'Invalid length specified for column: TESTSTRINGCOLUMN in table TESTTABLE.')
    }

    testDateDataType() {
        var DateDataType = require('../../lib/database-type/apatite-date-data-type')
        var dataType = new DateDataType()
        this.shouldNotThrow(() => {
            new Column('TESTDATECOLUMN', testTable, dataType)
        }, Error)
    }
}

module.exports = ApatiteDataTypeTestCase