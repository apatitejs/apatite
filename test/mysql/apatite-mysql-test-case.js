var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatiteMysqlTestUtil = require('./apatite-mysql-test-util')
var util = new ApatiteMysqlTestUtil()

class ApatiteMysqlTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(onTestPerformed)
    }
}

module.exports = ApatiteMysqlTestCase