const TestCase = require('njsunit').TestCase
const ApatiteTestUtil = require('../apatite-test-util.js')
const util = new ApatiteTestUtil()
const ApatiteError = require('../../lib/error/apatite-error');
class User {
    constructor() {
        this.oid = 0
        this.id = ''
        this.name = ''
    }
}

class ApatiteQueryBuilderTestCase extends TestCase {
    constructor() {
        super()
        this.createTestModelDescr()
    }

    createTestModelDescr() {
        const apatite = util.apatite
        if (apatite.getTable('USERS')) {
            return
        }
        const table = apatite.newTable('USERS')
        const modelDescriptor = apatite.newModelDescriptor(User, table)
        let column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
        column.bePrimaryKey()
        modelDescriptor.newSimpleMapping('oid', column)
        column = table.addNewColumn('ID', apatite.dialect.newVarCharType(15))
        modelDescriptor.newSimpleMapping('id', column)
        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100))
        modelDescriptor.newSimpleMapping('name', column)
    }

    testGeneration() {
        const apatite = util.apatite
        util.newSession((err, session) => {
            let query = session.newQueryFromArray(User, [])
            let sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            let sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1')

            query = session.newQueryFromArray(User, [['name', '=', 'tom']])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')

            query = session.newQueryFromArray(User, [['name', '=', null]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME IS NULL')

            query = session.newQueryFromArray(User, [['name', '!=', null]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME IS NOT NULL')

            query = session.newQueryFromArray(User, [['name', '!=', 'tom']])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME <> ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')

            query = session.newQueryFromArray(User, [['name', '~', 'tom']])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME LIKE ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')

            query = session.newQueryFromArray(User, [['name', '!~', 'tom']])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME NOT LIKE ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')

            query = session.newQueryFromArray(User, [['oid', '>', 20]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID > ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 20)

            query = session.newQueryFromArray(User, [['oid', '>=', 20]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID >= ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 20)

            query = session.newQueryFromArray(User, [['oid', '<', 20]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID < ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 20)

            query = session.newQueryFromArray(User, [['oid', '<=', 20]])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID <= ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 20)

            query = session.newQueryFromArray(User, ['(', ['name', '=', 'tom'], ')'])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE ( T1.NAME = ? )')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')

            query = session.newQueryFromArray(User, [['name', '=', 'tom'], '&', ['id', '=', 'tm']])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? AND T1.ID = ?')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')
            this.assertEqual(sqlStatement.bindings[1].variableValue, 'tm')

            query = session.newQueryFromArray(User, ['(', ['name', '=', 'tom'], '|', ['name', '=', 'jerry'], ')', '&', '(', ['id', '=', 'x'], '|', ['id', '=', 'y'], ')'])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE ( T1.NAME = ? OR T1.NAME = ? ) AND ( T1.ID = ? OR T1.ID = ? )')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')
            this.assertEqual(sqlStatement.bindings[1].variableValue, 'jerry')
            this.assertEqual(sqlStatement.bindings[2].variableValue, 'x')
            this.assertEqual(sqlStatement.bindings[3].variableValue, 'y')

            query = session.newQueryFromArray(User, [['oid', '=', 0], '|', '(', '(', ['name', '=', 'tom'], '|', ['name', '=', 'jerry'], ')', '&', '(', ['id', '=', 'x'], '|', ['id', '=', 'y'], ')', ')'])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID = ? OR ( ( T1.NAME = ? OR T1.NAME = ? ) AND ( T1.ID = ? OR T1.ID = ? ) )')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 0)
            this.assertEqual(sqlStatement.bindings[1].variableValue, 'tom')
            this.assertEqual(sqlStatement.bindings[2].variableValue, 'jerry')
            this.assertEqual(sqlStatement.bindings[3].variableValue, 'x')
            this.assertEqual(sqlStatement.bindings[4].variableValue, 'y')

            query = session.newQueryFromArray(User, [['oid', '=', 0], '|', '(', '(', ['name', '=', 'tom'], '|', ['name', '=', 'jerry'], '|', '(', ['name', '=', 'tom1'], '&', ['name', '=', 'jerry1'], ')', , ')', '&', '(', ['id', '=', 'x'], '|', ['id', '=', 'y'], ')', ')'])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            this.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.OID = ? OR ( ( T1.NAME = ? OR T1.NAME = ? OR ( T1.NAME = ? AND T1.NAME = ? ) ) AND ( T1.ID = ? OR T1.ID = ? ) )')
            this.assertEqual(sqlStatement.bindings[0].variableValue, 0)
            this.assertEqual(sqlStatement.bindings[1].variableValue, 'tom')
            this.assertEqual(sqlStatement.bindings[2].variableValue, 'jerry')
            this.assertEqual(sqlStatement.bindings[3].variableValue, 'tom1')
            this.assertEqual(sqlStatement.bindings[4].variableValue, 'jerry1')
            this.assertEqual(sqlStatement.bindings[5].variableValue, 'x')
            this.assertEqual(sqlStatement.bindings[6].variableValue, 'y')
        })
    }

    testInvalidExpressions() {
        const invalidExprErrStr = 'Invalid expression array provided. Expression array must be an array.'
        const invalidElsErrStr = 'Array expression must contain 3 elements.'
        util.newSession((err, session) => {
            this.shouldThrow(() => {
                session.newQueryFromArray(User)
            }, ApatiteError, invalidExprErrStr)

            this.shouldThrow(() => {
                session.newQueryFromArray(User, null)
            }, ApatiteError, invalidExprErrStr)

            this.shouldThrow(() => {
                session.newQueryFromArray(User, 23)
            }, ApatiteError, invalidExprErrStr)

            this.shouldThrow(() => {
                session.newQueryFromArray(User, new Date())
            }, ApatiteError, invalidExprErrStr)

            this.shouldThrow(() => {
                session.newQueryFromArray(User, [['name', '>', '=', 'tom']])
            }, ApatiteError, invalidElsErrStr)

            this.shouldThrow(() => {
                session.newQueryFromArray(User, [[]])
            }, ApatiteError, invalidElsErrStr)
        })
    }
}

module.exports = ApatiteQueryBuilderTestCase