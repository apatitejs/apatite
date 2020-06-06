var ApatiteDialectPoolTestCaseAbstract = require('../apatite-dialect-pool-test-case-abstract.js')
var ApatitePostgresTestUtil = require('./apatite-postgres-test-util')
var util = new ApatitePostgresTestUtil()

class ApatitePostgresPoolTestCase extends ApatiteDialectPoolTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatitePostgresPoolTestCase