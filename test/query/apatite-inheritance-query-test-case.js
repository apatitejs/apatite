var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteInheritanceQueryTest extends TestCase {
    constructor() {
        super()
    }

    testTypeFilterQuery() {
        var typeFilterQuery = util.apatite.newTypeFilterQuery()
        this.shouldThrow(() => {
            typeFilterQuery.attr('foo.bar').eq('bar')
        }, Error, 'Only simple attributes are supported at the moment for type filter queries.')

        this.shouldThrow(() => {
            typeFilterQuery.attr('foo').eq('bar').and.attr('foo').eq('bazz')
        }, Error, 'AND not allowed for type filter queries.')
    }

    testSQLGeneration() {
        var self = this
        util.newSession(function (err, session) {
            var apatite = util.apatite
            var query = util.newQueryForShape(session)
            query.setSession(session)
            var sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE", T1.NOOFVERTICES AS "T1.NOOFVERTICES", T1.TESTATTR AS "T1.TESTATTR" FROM SHAPE T1')

            query = util.newQueryForCircle(session)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE", T1.TESTATTR AS "T1.TESTATTR" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )')

            query = util.newQueryForShapeWithVertex(session)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.NOOFVERTICES AS "T1.NOOFVERTICES", T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )')

            query = util.newQueryForSemiCircle(session)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.TESTATTR AS "T1.TESTATTR", T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )')
        })
    }
}

module.exports = ApatiteInheritanceQueryTest