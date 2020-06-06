var ApatiteDialectPoolErrorTestCaseAbstract = require('../apatite-dialect-pool-error-test-case-abstract.js')
var ApatiteMysqlTestUtil = require('./apatite-mysql-test-util')
var util = new ApatiteMysqlTestUtil()

class ApatiteMysqlPoolErrorTestCase extends ApatiteDialectPoolErrorTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteMysqlPoolErrorTestCase