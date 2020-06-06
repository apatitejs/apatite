var ApatiteDialectPoolErrorTestCaseAbstract = require('../apatite-dialect-pool-error-test-case-abstract.js')
var ApatiteSqliteTestUtil = require('./apatite-sqlite-test-util')
var util = new ApatiteSqliteTestUtil()

class ApatiteSqlitePoolErrorTestCase extends ApatiteDialectPoolErrorTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteSqlitePoolErrorTestCase