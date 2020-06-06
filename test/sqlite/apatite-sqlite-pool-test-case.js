var ApatiteDialectPoolTestCaseAbstract = require('../apatite-dialect-pool-test-case-abstract.js')
var ApatiteSqliteTestUtil = require('./apatite-sqlite-test-util')
var util = new ApatiteSqliteTestUtil()

class ApatiteSqlitePoolTestCase extends ApatiteDialectPoolTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteSqlitePoolTestCase