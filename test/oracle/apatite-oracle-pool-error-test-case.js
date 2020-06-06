var ApatiteDialectPoolErrorTestCaseAbstract = require('../apatite-dialect-pool-error-test-case-abstract.js')
var ApatiteOracleTestUtil = require('./apatite-oracle-test-util')
var util = new ApatiteOracleTestUtil()

class ApatiteOraclePoolErrorTestCase extends ApatiteDialectPoolErrorTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteOraclePoolErrorTestCase