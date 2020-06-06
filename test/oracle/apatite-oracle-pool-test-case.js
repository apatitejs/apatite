var ApatiteDialectPoolTestCaseAbstract = require('../apatite-dialect-pool-test-case-abstract.js')
var ApatiteOracleTestUtil = require('./apatite-oracle-test-util')
var util = new ApatiteOracleTestUtil()

class ApatiteOraclePoolTestCase extends ApatiteDialectPoolTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteOraclePoolTestCase