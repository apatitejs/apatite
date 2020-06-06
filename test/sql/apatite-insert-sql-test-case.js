var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteXXTestCase extends TestCase {
    constructor() {
        super()
    }

    testSQLGeneration() {
        var self = this
        util.newSession(function (err, session) {
            var newPet = util.newPet()
            newPet.name = 'Dog'
            var sqlBuilder = util.apatite.dialect.getInsertSQLBuilder(session, newPet)
            var sqlStmt = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStmt.sqlString, 'INSERT INTO PET (NAME) VALUES (?) RETURNING OID AS "OID"')

            var newPerson = util.newPerson()
            newPerson.oid = 10
            newPerson.name = 'Sudan'
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                sqlBuilder = util.apatite.dialect.getInsertSQLBuilder(session, newPerson)
                sqlStmt = sqlBuilder.buildSQLStatement()
                self.assertEqual(sqlStmt.sqlString, 'INSERT INTO PERSON (OID, NAME, PETOID) VALUES (?, ?, ?)')
                var bindings = sqlStmt.bindings
                self.assertEqual(bindings.length, 3)
                self.assertEqual(bindings[0].variableValue, 10)
                self.assertEqual(bindings[1].variableValue, 'Sudan')
                self.assertEqual(bindings[2].variableValue, null)

                newPerson.pet = allPets[0]
                sqlBuilder = util.apatite.dialect.getInsertSQLBuilder(session, newPerson)
                sqlStmt = sqlBuilder.buildSQLStatement()
                self.assertEqual(sqlStmt.sqlString, 'INSERT INTO PERSON (OID, NAME, PETOID) VALUES (?, ?, ?)')
                var bindings = sqlStmt.bindings
                self.assertEqual(bindings.length, 3)
                self.assertEqual(bindings[0].variableValue, 10)
                self.assertEqual(bindings[1].variableValue, 'Sudan')
                self.assertEqual(bindings[2].variableValue, 1)
            })
        })
    }
}

module.exports = ApatiteXXTestCase