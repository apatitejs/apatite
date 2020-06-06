var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteDeleteSQLTest extends TestCase {
    constructor() {
        super()
    }

    testGeneratedSQL() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                var sqlBuilder = util.apatite.dialect.getDeleteSQLBuilder(session, allPets[0])
                self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'DELETE FROM PET WHERE OID = ?')
            })
        })
    }
}

module.exports = ApatiteDeleteSQLTest