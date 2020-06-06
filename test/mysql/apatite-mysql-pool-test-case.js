var ApatiteDialectPoolTestCaseAbstract = require('../apatite-dialect-pool-test-case-abstract.js')
var ApatiteMysqlTestUtil = require('./apatite-mysql-test-util')
var util = new ApatiteMysqlTestUtil()

class ApatiteMysqlPoolTestCase extends ApatiteDialectPoolTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteMysqlPoolTestCase