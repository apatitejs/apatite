var ApatiteDialectPoolErrorTestCaseAbstract = require('../apatite-dialect-pool-error-test-case-abstract.js')
var ApatiteMssqlTestUtil = require('./apatite-mssql-test-util')
var util = new ApatiteMssqlTestUtil()

class ApatiteMssqlPoolErrorTestCase extends ApatiteDialectPoolErrorTestCaseAbstract {
    constructor() {
        super(util)
    }

    testConnection(onTestPerformed) {
        this.doTestConnection(onTestPerformed)
    }
}

module.exports = ApatiteMssqlPoolErrorTestCase