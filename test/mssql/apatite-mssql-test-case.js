var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatiteMssqlTestUtil = require('./apatite-mssql-test-util')
var util = new ApatiteMssqlTestUtil()

class ApatiteMssqlTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(onTestPerformed)
    }
}

module.exports = ApatiteMssqlTestCase