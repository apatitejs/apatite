var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteSimpleQueryTestCase extends TestCase {
    constructor() {
        super()
    }

    testGeneration(onTestPerformed) {
        var self = this
        var apatite = util.apatite
        class User {
            constructor() {
                this.oid = 0
                this.id = ''
                this.name = ''
            }
        }

        var table = apatite.newTable('USERS')
        var modelDescriptor = apatite.newModelDescriptor(User, table)

        var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
        column.bePrimaryKey()
        modelDescriptor.newSimpleMapping('oid', column)

        column = table.addNewColumn('ID', apatite.dialect.newVarCharType(15))
        modelDescriptor.newSimpleMapping('id', column)

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100))
        modelDescriptor.newSimpleMapping('name', column)

        class InvalidModel {
        }

        util.newSession(function (err, session) {
            var qry = apatite.newQuery(InvalidModel)
            session.execute(qry, function (err) {
                self.assertEqual(err.message, 'Descriptor for model: InvalidModel not found.');
            })

            var promisesHandled = {invalidModel: false, invalidSession: false}
            // test with promise
            qry = apatite.newQuery(InvalidModel)
            var promise = session.execute(qry)
            promise.catch(function (err) {
                self.assertEqual(err.message, 'Descriptor for model: InvalidModel not found.')
                promisesHandled.invalidModel = true
                if (promisesHandled.invalidSession)
                    onTestPerformed()
            })

            self.shouldThrow(() => {
                apatite.newQuery()
            }, Error, 'A valid model is required for query.')

            var query = apatite.newQuery(User)
            query.setSession(null)
            query.execute(function (err, result) {
                self.assertEqual(err.message, 'There is no session associated with the query. Use execute on session.')
            })

            // test with promise
            query = apatite.newQuery(User)
            query.setSession(null)
            promise = query.execute()
            promise.catch(function (err) {
                self.assertEqual(err.message, 'There is no session associated with the query. Use execute on session.')
                promisesHandled.invalidSession = true
                if (promisesHandled.invalidModel)
                    onTestPerformed()
            })

            query = apatite.newQuery(User)
            query.setSession(session)
            var sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1')

            query = apatite.newQuery(User).attr('name').eq('test')
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            var sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')


            query = apatite.newQuery(User)
            query.attr('name').eq('test').and.attr('id').eq('tom')
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? AND T1.ID = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')
            self.assertEqual(sqlStatement.bindings[1].variableValue, 'tom')


            query = apatite.newQuery(User)
            query.attr('name').eq('test').or.attr('id').eq('tom')
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? OR T1.ID = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')
            self.assertEqual(sqlStatement.bindings[1].variableValue, 'tom')

            query = apatite.newQuery(User)
            query.enclose.attr('name').eq('tom').or.attr('name').eq('jerry')
            query.and.enclose.attr('id').eq('x').or.attr('id').eq('y')

            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 WHERE ( T1.NAME = ? OR T1.NAME = ? ) AND ( T1.ID = ? OR T1.ID = ? )')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'tom')
            self.assertEqual(sqlStatement.bindings[1].variableValue, 'jerry')
            self.assertEqual(sqlStatement.bindings[2].variableValue, 'x')
            self.assertEqual(sqlStatement.bindings[3].variableValue, 'y')

            query = apatite.newQuery(User)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('names')

            self.shouldThrow(() => {
                sqlBuilder.buildSQLStatement()
            }, Error, 'Mapping for attribute: names not found in model: User.')

            query = apatite.newQuery(User)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1')

            query = apatite.newQuery(User)
            query.setSession(session)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttrs(['id', 'name'])

            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1')

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').eq('test').and.attr('oid').eq(1)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? AND T1.OID = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')
            self.assertEqual(sqlStatement.bindings[1].variableValue, 1)

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').isNULL()
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME IS NULL')
            self.assertEqual(sqlStatement.bindings.length, 0)

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').isNOTNULL()
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            sqlStatement = sqlBuilder.buildSQLStatement();
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME IS NOT NULL')
            self.assertEqual(sqlStatement.bindings.length, 0)

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').eq('test').and.attr('oid').in([25, 102])
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? AND T1.OID IN (?,?)')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')
            self.assertEqual(sqlStatement.bindings[1].variableValue, 25)
            self.assertEqual(sqlStatement.bindings[2].variableValue, 102)

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('oid').eq(25).or.attr('oid').eq(102)
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('oid')

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID" FROM USERS T1 WHERE T1.OID = ? OR T1.OID = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 25)
            self.assertEqual(sqlStatement.bindings[1].variableValue, 102)
        })
    }

    testFunctionQuery() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchCountAs('countOfPets')
            query.execute(function (err, petsCount) {
                self.assertEqual(petsCount[0].countOfPets, 4)
            })

            query = util.newQueryForBook(session)
            query.fetchSumAs('numberOfPages', 'sumOfPages')
            query.execute(function (err, result) {
                self.assertEqual(result[0].sumOfPages, 330)
            })

            query = util.newQueryForBook(session)
            query.fetchMaxAs('numberOfPages', 'maxOfPages')
            query.execute(function (err, result) {
                self.assertEqual(result[0].maxOfPages, 150)
            })

            query = util.newQueryForBook(session)
            query.fetchMinAs('numberOfPages', 'minOfPages')
            query.execute(function (err, result) {
                self.assertEqual(result[0].minOfPages, 60)
            })

            query = util.newQueryForBook(session)
            query.fetchAvgAs('numberOfPages', 'avgOfPages')
            query.execute(function (err, result) {
                self.assertEqual(result[0].avgOfPages, 110)
            })

            query = util.newQueryForBook(session)
            query.fetchDistinctAs('numberOfPages', 'distinctPages')
            query.execute(function (err, result) {
                self.assertEqual(result[0].distinctPages, 150)
            })
        })
    }

    testFunctionQueryWithPromiseExeOnQuery(onTestPerformed) {
        var self = this
        // tests with promise for direct query execution
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchCountAs('countOfPets')
            var promise = query.execute() // execute on query -> direct query execution...
            promise.then(function (petsCount) {
                self.assertEqual(petsCount[0].countOfPets, 4)
                query = util.newQueryForEmployee(session)
                query.attr('department.oid').eq(3)
                query.orderBy('name')
                promise = query.execute()
                promise.catch(function (sqlErr) {
                    self.assertEqual(sqlErr.message, 'Select statement failed.')
                    onTestPerformed()
                })
            })
        })
    }

    testFunctionQueryWithPromiseExeOnSession(onTestPerformed) {
        var self = this
        // tests with promise for query execution over session
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchCountAs('countOfPets')
            var promise = session.execute(query) // execute on session -> execution over session...
            promise.then(function (petsCount) {
                self.assertEqual(petsCount[0].countOfPets, 4)
                query = util.newQueryForEmployee(session)
                query.attr('department.oid').eq(3)
                query.orderBy('name')
                promise = session.execute(query)
                promise.catch(function (sqlErr) {
                    self.assertEqual(sqlErr.message, 'Select statement failed.')
                    onTestPerformed()
                })
            })
        })
    }
}

module.exports = ApatiteSimpleQueryTestCase