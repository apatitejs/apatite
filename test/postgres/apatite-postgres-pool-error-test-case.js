var ApatiteDialectPoolErrorTestCaseAbstract = require('../apatite-dialect-pool-error-test-case-abstract.js')
var ApatitePostgresTestUtil = require('./apatite-postgres-test-util')
var util = new ApatitePostgresTestUtil()

class ApatitePostgresPoolErrorTestCase extends ApatiteDialectPoolErrorTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatitePostgresPoolErrorTestCase