var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteOneToManyProxyTestCase extends TestCase {
    constructor() {
        super()
    }

    testAddAndRemove() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, departments) {
                departments[0].employees.getValue(function (err, employees) {
                    self.assertEqual(employees.length, 2)
                })
                departments[0].employees.getLength(function (err, numberOfEmps) {
                    self.assertEqual(numberOfEmps, 2)
                })
                departments[0].employees.getAtIndex(1, function (err, employee) {
                    self.assertEqual(employee.name, 'Scot')
                    departments[0].employees.indexOf(employee, function (err, empIdx) {
                        self.assertEqual(empIdx, 1)
                    })
                })
                departments[0].employees.remove(function (err) {
                    self.assertEqual(err.message, 'Object not found in apatite Array.')
                }, util.newDepartment())

                session.startTrackingChanges()
                departments[0].employees.removeAll(function (err) {
                    self.assertNull(err)
                })
            })
        })
    }

    testFailedSQL() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, departments) {
                departments[2].employees.getValue(function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })

                departments[2].employees.getLength(function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })

                departments[2].employees.indexOf(null, function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })

                departments[2].employees.getAtIndex(1, function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })

                departments[2].employees.add(function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                }, null)

                departments[2].employees.remove(function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                }, null)

                departments[2].employees.removeAll(function (err, employees) {
                    self.assertEqual(err.message, 'Select statement failed.')
                })
            })
        })
    }
}

module.exports = ApatiteOneToManyProxyTestCase