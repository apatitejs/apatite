var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteQueryResultTestCase extends TestCase {
    constructor() {
        super()
    }

    testQueryResult() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets.length, 4)
                self.assertEqual(allPets[0].oid, 1)
                self.assertEqual(allPets[0].name, 'Dog')
                self.assertEqual(allPets[1].oid, 2)
                self.assertEqual(allPets[1].name, 'Cat')
                self.assertEqual(allPets[2].oid, 3)
                self.assertEqual(allPets[2].name, 'Mouse')
            })

            query = util.newQueryForPerson(session)
            session.execute(query, function (err, people) {
                self.assertEqual(people.length, 3)
                self.assertEqual(people[0].oid, 1)
                self.assertEqual(people[0].name, 'Madhu')
                people[0].pet.getValue(function (err, pet) {
                    self.assertEqual(pet, null)
                })

                self.assertEqual(people[1].oid, 2)
                self.assertEqual(people[1].name, 'Sam')
                people[1].pet.getValue(function (err, pet) {
                    self.assertEqual(pet.oid, 1)
                    self.assertEqual(pet.name, 'Dog')
                })

                self.assertEqual(people[2].oid, 3)
                self.assertEqual(people[2].name, 'Peter')
                people[2].pet.getValue(function (err, pet) {
                    self.assertEqual(pet.oid, 2)
                    self.assertEqual(pet.name, 'Cat')
                })
            })

            query = util.newQueryForPerson(session).attr('name').eq('test').or.attr('id').eq('tom');
            self.shouldThrow(() => {
                session.execute(query, function (err, people) {
                })
            }, Error, 'Trying to execute a sub query which is not allowed. Create and store the query in a variable and then do chaining of expressions. Example: query = session.newQuery(Person); attr("name").eq("test").or.attr("id").eq("tom");')
        })
    }

    testEnableLogging(onTestPerformed) {
        var expectedOutput = 'Executing SQL: SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.OID = ?, bindings: [{"name":"?","value":1}]'
        function captureStdOutput(callback) {
            var old_write = process.stdout.write
        
            process.stdout.write = (function(write) {
                return function(string, encoding, fd) {
                    //write.apply(process.stdout, arguments)
                    callback(string, encoding, fd)
                }
            })(process.stdout.write)
        
            return function() {
                process.stdout.write = old_write
            }
        }

        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.attr('oid').eq(1)
            util.apatite.enableLogging()
            var releaseStdOutput = captureStdOutput(function(string, encoding, fd) {
                if (string.indexOf(expectedOutput) !== -1) {// this is the test case! if the expectedOutput is not in the output, test case would fail with timeout
                    onTestPerformed()
                }
            })
            session.execute(query, function (err, petNames) {
                util.apatite.disableLogging()
                releaseStdOutput()
            })
        })
    }

    testFetchAttrsResult() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchAttr('name')
            session.execute(query, function (err, petNames) {
                self.assertEqual(petNames.length, 4)
                self.assertEqual(petNames[0].name, 'Dog')
                self.assertEqual(petNames[1].name, 'Cat')
                self.assertEqual(petNames[2].name, 'Mouse')
            })

            query = util.newQueryForPet(session)
            query.fetchAttr('nameXEE')
            session.execute(query, function (err, petNames) {
                self.assertEqual(err.message, 'Mapping for attribute: nameXEE not found in model: Pet.')
            })

            query = util.newQueryForPet(session)
            query.fetchAttr('name')
            session.connection.failCursor = true
            session.execute(query, function (err, petNames) {
                session.connection.failCursor = false
                self.assertEqual(err.message, 'Cursor failure.')
            })
        })
    }

    testCursorStreamResult(onTestPerformed) {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchAttr('name')
            query.returnCursorStream = true
            session.connection.failCursor = true
            session.execute(query, function (err, cursorStream) {
                session.connection.failCursor = false
                cursorStream.on('error', function(cursorErr) {
                    self.assertEqual(cursorErr.message, 'Cursor failure.')
                    onTestPerformed()
                })
            })
        })
    }

    testColConverterResult() {
        var self = this
        var column = util.apatite.getTable('PET').getColumn('NAME')
        column.setConverters(function (value) {
            return value === 'Lion' ? 'Cat' : value
        }, function (value) {
            return value === 'Cat' ? 'Lion' : value
        })
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            query.fetchAttr('name')
            session.execute(query, function (err, petNames) {
                self.assertEqual(petNames[0].name, 'Dog')
                self.assertEqual(petNames[1].name, 'Lion')
                self.assertEqual(petNames[2].name, 'Mouse')
            })

            query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets[1].oid, 2)
                self.assertEqual(allPets[1].name, 'Lion')
            })

            query = util.newQueryForPet(session)
            query.attr('name').eq('Lion')
            var sqlBuilder = util.apatite.dialect.getSelectSQLBuilder(query)
            var sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.NAME = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'Cat')

            query = util.newQueryForPerson(session)
            query.fetchAttrs(['name', 'pet.name'])
            session.execute(query, function (err, peoplePetNames) {
                self.assertEqual(peoplePetNames[2].name, 'Peter')
                self.assertEqual(peoplePetNames[2]['pet.name'], 'Lion')
            })

            query = util.newQueryForPerson(session)
            query.attr('pet.name').eq('Lion')
            sqlBuilder = util.apatite.dialect.getSelectSQLBuilder(query)
            sqlStatement = sqlBuilder.buildSQLStatement()
            self.assertEqual(sqlStatement.sqlString, 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.PETOID AS "T1.PETOID" FROM PERSON T1, PET T2 WHERE T1.PETOID = T2.OID AND T2.NAME = ?')
            self.assertEqual(sqlStatement.bindings[0].variableValue, 'Cat')
        })
    }
}

module.exports = ApatiteQueryResultTestCase