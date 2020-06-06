var ApatiteDialectPoolTestCaseAbstract = require('../apatite-dialect-pool-test-case-abstract.js')
var ApatiteMssqlTestUtil = require('./apatite-mssql-test-util')
var util = new ApatiteMssqlTestUtil()

class ApatiteMssqlPoolTestCase extends ApatiteDialectPoolTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteMssqlPoolTestCase