var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteOneToOneProxyTestCase extends TestCase {
    constructor() {
        super()
    }

    testRollbackOnError() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForEmployee(session)
            session.execute(query, function (err, employees) {
                var employee = employees[0]
                self.assertNotNull(employee.department)
                var changesToDo = function (changesDone) {
                    employee.department = null
                    changesDone('some error so rollback occurs and depart is not null again')
                }

                var onSaved = function (err) {
                    self.assertNotNull(employee.department)
                }

                session.doChangesAndSave(changesToDo, onSaved)
                self.assertEqual(employee.department.valueFetched, false)
                employee.department.getValue(function (err, dept) {
                    self.assertEqual(employee.department.valueFetched, true)
                    var changesToDo = function (changesDone) {
                        employee.department = null;
                        changesDone('some error so rollback occurs and depart is not null again')
                    }

                    var onSaved = function (err) {
                        self.assertNotNull(employee.department)
                        self.assertEqual(employee.department.valueFetched, true)
                    }
                    session.doChangesAndSave(changesToDo, onSaved)
                })
            })
        })
    }

    testFailedSQL() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForEmployee(session);
            session.execute(query, function (err, employees) {
                employees[2].department.getValue(function (err, dept) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })
            })
        })
    }

    testNonResolvedProxyToJSON(onTestPerformed) {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForEmployee(session)
            session.execute(query, function (err, employees) {
                var department = employees[0].department
                self.assertEqual(department.toJSON(), 'ApatiteOneToOneProxy: value not fetched yet.')
                employees[0].department.getValue(function (err, dept) {
                    self.assertNotEqual(department.toJSON(), 'ApatiteOneToOneProxy: value not fetched yet.')
                    onTestPerformed()
                })
            })
        })
    }

    testPromise(onTestPerformed) {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForEmployee(session)
            session.execute(query, function (err, employees) {
                var proxy = employees[0].department
                self.assertEqual(proxy.valueFetched, false)
                var promise = proxy.getValue()
                promise.then(function (department) {
                    self.assertEqual(proxy.valueFetched, true)
                    promise = proxy.getValue(); // a resolved promise should be returned
                    promise.then(function (dept){
                        self.assertEqual(proxy.valueFetched, true)
                        onTestPerformed()
                    })
                }, function (err) {
                    self.assertNullOrUndefined(err)
                })
            })
        })
    }

    testPromiseFailedSQL(onTestPerformed) {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForEmployee(session)
            session.execute(query, function (err, employees) {
                var proxy = employees[2].department
                self.assertEqual(proxy.valueFetched, false)
                var promise = proxy.getValue();
                promise.then(function (department) {
                    //should never reach here...
                    self.assertEqual(true, false)
                }, function (err) {
                    self.assertEqual(err.message, 'Select statement failed.')
                    onTestPerformed()
                })
            })
        })
    }
}

module.exports = ApatiteOneToOneProxyTestCase