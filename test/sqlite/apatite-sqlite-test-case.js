var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatiteSqliteTestUtil = require('./apatite-sqlite-test-util')
var util = new ApatiteSqliteTestUtil()

class ApatiteSqliteTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(onTestPerformed)
    }
}

module.exports = ApatiteSqliteTestCase