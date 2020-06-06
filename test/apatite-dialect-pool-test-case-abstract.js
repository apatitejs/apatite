var ApatiteDialectTestCaseAbstract = require('./apatite-dialect-test-case-abstract.js')

class ApatiteDialectPoolTestCaseAbstract extends ApatiteDialectTestCaseAbstract {
    constructor(util) {
        super(util)
    }

    static isAbstract() {
        return this.name === 'ApatiteDialectPoolTestCaseAbstract'
    }

    setUp(onSetUpDone) {
        if (!this.existsDialectModule())
            return onSetUpDone()

        var self = this
        var util = this.apatiteUtil
        util.apatite.useConnectionPool()
        util.createTestTablesForPool(function (createTablesErr) {
            self.assertNullOrUndefined(createTablesErr)
            util.newSession(function (sessErr, sess) {
                self.assertNullOrUndefined(sessErr)
                self.apatiteSession = sess
                onSetUpDone()
            })
        })
    }

    tearDown(onTearDownDone) {
        if (!this.existsDialectModule())
            return onTearDownDone()

        var self = this
        var util = this.apatiteUtil
        util.apatite.closeConnectionPool(function(connErr) {
            self.assertNullOrUndefined(connErr)
            util.deleteTestTablesForPool(function (err) {
                self.assertNullOrUndefined(err)
                onTearDownDone()
            })
        })
    }

    doTestConnection(onTestPerformed) {
        this.assertNullOrUndefined(this.apatiteSession.connection.databaseConnection) // should exist only when executing the sql
        onTestPerformed()
    }
}

module.exports = ApatiteDialectPoolTestCaseAbstract