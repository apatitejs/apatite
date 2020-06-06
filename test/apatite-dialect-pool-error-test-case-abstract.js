var ApatiteDialectPoolTestCaseAbstract = require('./apatite-dialect-pool-test-case-abstract.js')

class ApatiteDialectPoolErrorTestCaseAbstract extends ApatiteDialectPoolTestCaseAbstract {
    constructor(util) {
        super(util)
    }

    static isAbstract() {
        return this.name === 'ApatiteDialectPoolErrorTestCaseAbstract'
    }

    setUp(onSetUpDone) {
        if (!this.existsDialectModule())
            return onSetUpDone()

        var self = this
        var util = this.apatiteUtil
        util.apatite.useConnectionPool()
        var connOptions = util.apatite.dialect.connectionOptions
        var oriUserName = connOptions.userName
        connOptions.userName = ':/foo_and_bar'
        util.createTestTablesForPool(function (err) {
            connOptions.userName = oriUserName
            self.assertNotNullOrUndefined(err)
            onSetUpDone()
        })
    }

    tearDown(onTearDownDone) {
        onTearDownDone()
    }

    doTestConnection(onTestPerformed) {
        onTestPerformed()
    }
}

module.exports = ApatiteDialectPoolErrorTestCaseAbstract