var TestCase = require('njsunit').TestCase
var Table = require('../../lib/database/apatite-table')
var Column = require('../../lib/database/apatite-column')
var IntegerDataType = require('../../lib/database-type/apatite-integer-data-type')
var dataType = new IntegerDataType(10)

class ApatiteTableTestCase extends TestCase {
    constructor() {
        super()
    }

    testTableValidity() {
        var testTable = new Table(null)
        this.shouldThrow(() => {
            testTable.validate()
        }, Error, 'Invalid table name.')

        testTable = new Table('TESTTABLE')
        this.shouldThrow(() => {
            testTable.validate()
        }, Error, 'No columns defined for table: TESTTABLE.')

        var testColumn = new Column('TESTCOLUMN', testTable, dataType)
        this.shouldThrow(() => {
            testTable.validate()
        }, Error, 'No primary key columns defined for table: TESTTABLE.')

        testColumn.bePrimaryKey()
        this.shouldThrow(() => {
            testColumn.bePrimaryKey()
        }, Error, 'Column: TESTCOLUMN already defined as primary key in table: TESTTABLE.')

        this.shouldThrow(() => {
            new Column('TESTCOLUMN', testTable, dataType)
        }, Error, 'Column: TESTCOLUMN already exists in table: TESTTABLE.')

        var ApatiteTestUtil = require('../apatite-test-util.js')
        var util = new ApatiteTestUtil()
        var apatite = util.newApatite()
        this.shouldThrow(() => {
            apatite.getOrCreateTable('foo')
            apatite.newTable('foo')
        }, Error, 'Table: foo already exists.')
    }

    testColumnValidity() {
        var testTable = new Table('TESTTABLE')

        this.shouldThrow(() => {
            new Column('', testTable, dataType)
        }, Error, 'Column name invalid.')

        this.shouldThrow(() => {
            new Column(null, testTable, dataType)
        }, Error, 'Column name invalid.')

        this.shouldThrow(() => {
            new Column('TESTCOLUMN2', testTable, null)
        }, Error, 'Column: TESTCOLUMN2 data type invalid.')
    }
}

module.exports = ApatiteTableTestCase