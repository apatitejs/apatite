var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteUpdateSQLTestCase extends TestCase {
    constructor() {
        super()
    }

    testUpdateSQLGeneration() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                session.startTrackingChanges()
                allPets[0].name = 'Dog'
                var sqlStmt = session.changeSet.buildUpdateStatements()[0]
                sqlStmt.buildSQLString()
                self.assertEqual(sqlStmt.sqlString, 'UPDATE PET SET NAME = ? WHERE OID = ?')
                var bindings = sqlStmt.bindings
                self.assertEqual(bindings.length, 2)
                self.assertEqual(bindings[0].variableValue, 'Dog')
                self.assertEqual(bindings[1].variableValue, 1)
            })
        })
    }

    testRelativeColUpdate() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForProduct(session)
            session.execute(query, function (err, allProducts) {
                session.startTrackingChanges()
                allProducts[0].quantity = 20
                var sqlStmt = session.changeSet.buildUpdateStatements()[0]
                sqlStmt.buildSQLString()
                self.assertEqual(sqlStmt.sqlString, 'UPDATE PRODUCT SET QUANTITY = QUANTITY + ? WHERE OID = ?')
                var bindings = sqlStmt.bindings
                self.assertEqual(bindings.length, 2)
                self.assertEqual(bindings[0].variableValue, -80)
                self.assertEqual(bindings[1].variableValue, 1)
            })
        })
    }
}

module.exports = ApatiteUpdateSQLTestCase