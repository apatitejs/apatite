var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatitePostgresTestUtil = require('./apatite-postgres-test-util')
var util = new ApatitePostgresTestUtil()

class ApatitePostgresTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(onTestPerformed)
    }
}

module.exports = ApatitePostgresTestCase