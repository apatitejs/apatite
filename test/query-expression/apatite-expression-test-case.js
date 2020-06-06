var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteExpressionTestCase extends TestCase {
    constructor() {
        super()
    }

    testExists() {
        var self = this
        util.newSession(function (err, session) {
            util.apatite.defaultCacheSize = 50
            var query = util.newQueryForDepartment(session)
            var subQuery = util.newQueryForEmployee(session)
            subQuery.attr('department.oid').eq(query.attrJoin('oid'))
            query.exists(subQuery)
            //load all departments in the cache so that below all objects are returned from cache
            query.execute(function (err, departments) {
                self.assertEqual(departments.length, 3)
            })

            query = util.newQueryForDepartment(session)
            subQuery = util.newQueryForEmployee(session)
            subQuery.attr('department.oid').eq(query.attrJoin('oid'))
            query.attr('oid').in([1, 2, 3]).and
            query.exists(subQuery)
            query.execute(function (err, departments) {// all objects from cache
                self.assertEqual(departments.length, 3)
            })

            util.apatite.defaultCacheSize = 0
            session.clearCache()

            query = util.newQueryForDepartment(session)
            subQuery = util.newQueryForEmployee(session)
            subQuery.attr('department.oid').eq(query.attrJoin('oid')).and
            subQuery.attr('name').eq('Madhu')
            query.exists(subQuery)
            query.execute(function (err, departments) {
                self.assertEqual(departments.length, 1)
                self.assertEqual(departments[0].name, 'Development')
            })

            query = util.newQueryForPet(session)
            subQuery = util.newQueryForPerson(session)
            subQuery.attr('pet.oid').eq(query.attrJoin('oid'))
            query.exists(subQuery)
            query.execute(function (err, pets) {
                self.assertEqual(pets.length, 4)
            })

            query = util.newQueryForPet(session)
            subQuery = util.newQueryForPerson(session)
            subQuery.attr('pet.oid').eq(query.attrJoin('oid'))
            query.notExists(subQuery)
            query.execute(function (err, pets) {
                self.assertEqual(pets.length, 2)
            })
        })
    }

    testComparision() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForBook(session)
            session.execute(query, function (err, books) {
                query = util.newQueryForBook(session)
                query.attr('name').like('L%')
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), true)

                query = util.newQueryForBook(session)
                query.attr('name').like(null)
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('name').notLike('L%')
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), true)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').gt(120)
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').ge(120)
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), true)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').lt(120)
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), true)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').le(120)
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), true)
                self.assertEqual(query.matchesObject(books[2]), true)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').ne(120)
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), true)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').isNULL()
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').isNOTNULL()
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), true)
                self.assertEqual(query.matchesObject(books[2]), true)

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').in([120, 150])
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), true)

                query = util.newQueryForBook(session)
                query.attr('oid').in([1, 3])
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), true)

                query.execute(function (err, books) {
                    self.assertEqual(books.length, 2)
                    self.assertEqual(books[0].name, 'Learn Javascript in 30 Days')
                    self.assertEqual(books[1].name, 'Learning Node.js')
                })

                query = util.newQueryForBook(session)
                query.enclose.attr('oid').eq(1)
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('oid').eq(1).and.attr('oid').eq(3)
                self.assertEqual(query.matchesObject(books[0]), false)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), false)

                query = util.newQueryForBook(session)
                query.attr('oid').eq(1).or.attr('oid').eq(3)
                self.assertEqual(query.matchesObject(books[0]), true)
                self.assertEqual(query.matchesObject(books[1]), false)
                self.assertEqual(query.matchesObject(books[2]), true)


                query.execute(function (err, books) {
                    self.assertEqual(books.length, 2)
                    self.assertEqual(books[0].name, 'Learn Javascript in 30 Days')
                    self.assertEqual(books[1].name, 'Learning Node.js')
                });

                self.shouldThrow(() => {
                    query = util.newQueryForBook(session)
                    query.attr('numberOfPages').in(120)
                    query.matchesObject(books[0])
                }, Error, 'Instance of Array is expected for "in" operation.')

                query = util.newQueryForBook(session)
                query.attr('numberOfPages').newComparision('', 'SOME_INVALID_OPERATOR_')

                self.shouldThrow(() => {
                    query.matchesObject(books[0])
                }, Error, 'Not expected to reach here.')

                query = util.newQueryForBook(session)
                self.shouldThrow(() => {
                    query.addConditionalOperatorExpression('SOME_INVALID_OPERATOR_')
                    query.matchesObject(books[0])
                }, Error, 'Not expected to reach here.')
            })
        })
    }

    testLogicalComparision() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForBook(session)
            query.enclose.attr('name').eq('Apatite').or.attr('name').eq('Learning Node.js')
            query.and.enclose.attr('numberOfPages').eq(60).or.attr('numberOfPages').eq(70)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 1)
                self.assertEqual(booksFromDB[0].name, 'Apatite')

                query = util.newQueryForBook(session)
                query.enclose.attr('name').eq('Apatite').or.attr('name').eq('Learning Node.js')
                query.and.enclose.attr('numberOfPages').eq(60).or.attr('numberOfPages').eq(70)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 1)
                    self.assertEqual(booksFromCache[0].name, 'Apatite')
                })
            })

            session.clearCache()
            query = util.newQueryForBook(session)
            query.enclose.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60)
            query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 2)
                self.assertEqual(booksFromDB[0].name, 'Apatite')
                self.assertEqual(booksFromDB[1].name, 'Learning Node.js')

                query = util.newQueryForBook(session)
                query.enclose.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60)
                query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 2)
                    self.assertEqual(booksFromCache[0].name, 'Apatite')
                    self.assertEqual(booksFromCache[1].name, 'Learning Node.js')
                })
            })

            session.clearCache()
            query = util.newQueryForBook(session)
            query.enclose.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60)
            query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
            query.or.enclose.attr('name').eq('Learn Javascript in 30 Days').and.attr('numberOfPages').eq(150)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 3)
                self.assertEqual(booksFromDB[0].name, 'Learn Javascript in 30 Days')
                self.assertEqual(booksFromDB[1].name, 'Apatite')
                self.assertEqual(booksFromDB[2].name, 'Learning Node.js')

                query = util.newQueryForBook(session)
                query.enclose.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60)
                query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
                query.or.enclose.attr('name').eq('Learn Javascript in 30 Days').and.attr('numberOfPages').eq(150)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 3)
                    self.assertEqual(booksFromCache[0].name, 'Learn Javascript in 30 Days')
                    self.assertEqual(booksFromCache[1].name, 'Apatite')
                    self.assertEqual(booksFromCache[2].name, 'Learning Node.js')
                })
            })

            session.clearCache()
            query = util.newQueryForBook(session)
            query.enclose.attr('name').eq('Apatite X').and.attr('numberOfPages').eq(60)
            query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
            query.or.enclose.attr('name').eq('Learn Javascript X in 30 Days').and.attr('numberOfPages').eq(150)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 1)
                self.assertEqual(booksFromDB[0].name, 'Learning Node.js')

                query = util.newQueryForBook(session)
                query.enclose.attr('name').eq('Apatite X').and.attr('numberOfPages').eq(60)
                query.or.enclose.attr('name').eq('Learning Node.js').and.attr('numberOfPages').eq(120)
                query.or.enclose.attr('name').eq('Learn Javascript X in 30 Days').and.attr('numberOfPages').eq(150)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 1)
                    self.assertEqual(booksFromCache[0].name, 'Learning Node.js')
                })
            })

            session.clearCache()
            query = util.newQueryForBook(session)
            query.enclose.attr('name').eq('Apatite X').and.attr('numberOfPages').eq(60)
            query.or.enclose.attr('name').eq('Learning X Node.js').and.attr('numberOfPages').eq(120)
            query.or.enclose.attr('name').eq('Learn Javascript in 30 Days').and.attr('numberOfPages').eq(150)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 1)
                self.assertEqual(booksFromDB[0].name, 'Learn Javascript in 30 Days')

                query = util.newQueryForBook(session)
                query.enclose.attr('name').eq('Apatite X').and.attr('numberOfPages').eq(60)
                query.or.enclose.attr('name').eq('Learning X Node.js').and.attr('numberOfPages').eq(120)
                query.or.enclose.attr('name').eq('Learn Javascript in 30 Days').and.attr('numberOfPages').eq(150)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 1)
                    self.assertEqual(booksFromCache[0].name, 'Learn Javascript in 30 Days')
                });
            });

            session.clearCache()
            query = util.newQueryForBook(session)
            query.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60).and.attr('oid').eq(2)
            session.execute(query, function (err, booksFromDB) { // results only from database, cache is empty
                self.assertEqual(booksFromDB.length, 1)
                self.assertEqual(booksFromDB[0].name, 'Apatite')

                query = util.newQueryForBook(session)
                query.attr('name').eq('Apatite').and.attr('numberOfPages').eq(60).and.attr('oid').eq(2)
                session.execute(query, function (err, booksFromCache) { // results from cache and database, as cache contains the object because it was loaded with earlier execute.
                    self.assertEqual(booksFromCache.length, 1)
                    self.assertEqual(booksFromCache[0].name, 'Apatite')
                })
            })
        })
    }

    testOrderBy() {
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

        util.newSession(function (err, session) {

            var query = apatite.newQuery(User)
            query.setSession(session)
            query.orderBy('name')
            var sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            self.assertEqual(sqlBuilder.buildSQLStatement().sqlString, 'SELECT T1.OID AS "T1.OID", T1.ID AS "T1.ID", T1.NAME AS "T1.NAME" FROM USERS T1 ORDER BY T1.NAME')

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').eq('test').orderBy('name').asc()
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            var sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? ORDER BY T1.NAME')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')

            query = apatite.newQuery(User)
            query.setSession(session)
            query.attr('name').eq('test').orderBy('name').desc()
            sqlBuilder = apatite.dialect.getSelectSQLBuilder(query)
            query.fetchAttr('name')

            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.NAME AS "T1.NAME" FROM USERS T1 WHERE T1.NAME = ? ORDER BY T1.NAME DESC')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'test')
        })
    }
}

module.exports = ApatiteExpressionTestCase