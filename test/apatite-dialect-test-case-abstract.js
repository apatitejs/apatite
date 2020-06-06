var TestCase = require('njsunit').TestCase

class ApatiteDialectTestCaseAbstract extends TestCase {
    constructor(util) {
        super()
        this.apatiteUtil = util
        this.apatiteSession = null
        if (!this.existsDialectModule()) {
            console.log('No tests would be for module: ' + util.constructor.name)
        }
    }

    static testCaseTimeout() {
        return 300000
    }

    static isAbstract() {
        return this.name === 'ApatiteDialectTestCaseAbstract'
    }

    existsDialectModule() {
        return this.apatiteUtil.existsModule()
    }

    setUp(onSetUpDone) {
        if (!this.existsDialectModule())
            return onSetUpDone()

        var util = this.apatiteUtil
        var connOptions = util.apatite.dialect.connectionOptions
        var oriUserName = connOptions.userName
        connOptions.userName = ':/foo_and_bar'
        var self = this
        util.newSession(function (invalidSessionErr, invalidSession) {
            self.assertNotNullOrUndefined(invalidSessionErr)
            connOptions.userName = oriUserName
            util.createTestTables(function (err) {
                self.assertNullOrUndefined(err)
                util.newSession(function (sessErr, sess) {
                    self.assertNullOrUndefined(sessErr)
                    self.apatiteSession = sess
                    onSetUpDone()
                })
            })
        })
    }

    tearDown(onTearDownDone) {
        if (!this.existsDialectModule())
            return onTearDownDone()
        var self = this
        this.apatiteUtil.deleteTestTables(function (err) {
            self.assertNullOrUndefined(err)
            self.apatiteSession.end(function (endErr) {
                self.assertNullOrUndefined(endErr)
                onTearDownDone()
            })
        })
    }

    doFailedSQLTests(onTestPerformed) {
        if (!this.existsDialectModule())
            return onTestPerformed()
        var self = this
        var sqlOptions = { isApatiteDirectSql: true, resultSet: true }
        var onExecuted = function (err, result) {
            self.assertNotNullOrUndefined(err)
            onTestPerformed()
        }
        this.apatiteSession.connection.executeSQLString('select invalid sql statement from DEPT', [], onExecuted, sqlOptions)
    }

    doCursorStreamTests(onTestPerformed) {
        if (!this.existsDialectModule())
            return onTestPerformed()
        var self = this
        var query = this.apatiteUtil.newQueryForNonExistentTable(this.apatiteSession)
        query.returnCursorStream = true
        query.execute(function (execErr, cursorStream) {
            cursorStream.on('error', function (cursorErr) {
                self.assertNotNullOrUndefined(cursorErr)
                onTestPerformed()
            })
        })
    }

    doDMLExecutionTests(onTestPerformed) {
        if (!this.existsDialectModule())
            return onTestPerformed()
        var self = this
        var session = this.apatiteSession
        var util = this.apatiteUtil
        var query = util.newQueryForDepartment(session)
        var sqlOptions = { isApatiteDirectSql: true, resultSet: true }
        session.execute(query, function (err, departments) {
            self.assertEqual(departments.length, 0)

            var newDepartment = util.newDepartment()
            newDepartment.name = 'SomeDept'

            var newEmployee = util.newEmployee()
            newEmployee.name = 'SomeEmp'
            newEmployee.department = newDepartment

            var onEmpRemovalSaved = function (saveErr) {
                self.assertNullOrUndefined(saveErr)
                session.connection.executeSQLString('select oid as "oid", name as "name" from EMP', [], function (sqlErr, result) {
                    self.assertNullOrUndefined(sqlErr)
                    self.assertEqual(result.rows.length, 0)

                    session.doChangesAndSave(function (changesDone) {
                        newDepartment = util.newDepartment()
                        newDepartment.name = '12345678901234567890123456789012345678901234567890123456789012345678901234567890' // > 50
                        session.registerNew(newDepartment)
                        changesDone()
                    }, function (err) {
                        if (!util.apatite.dialect.ignoreDataTypeLength)
                            self.assertNotNullOrUndefined(err)
                        self.doCursorStreamTests(onTestPerformed)
                    })
                }, sqlOptions)
            }

            var changesToDo = function (changesDone) {
                newDepartment.employees.remove(function (err) { changesDone(); }, newEmployee)
            }

            var onEmpSelectFetched = function (err, result) {
                self.assertNullOrUndefined(err)
                self.assertEqual(result.rows.length, 1)
                self.assertEqual(result.rows[0].name, 'SomeEmp')

                var query2 = util.newQueryForEmployee(session)
                query2.returnCursorStream = true
                query2.execute(function (execErr, cursorStream) {
                    cursorStream.on('error', function (cursorErr) {
                        self.assertNullOrUndefined(cursorErr)
                    })
                    cursorStream.on('result', function (emp) {
                        self.assertEqual(emp.name, 'SomeEmp')
                    })
                    cursorStream.on('end', function () {
                        session.doChangesAndSave(changesToDo, onEmpRemovalSaved)
                    })
                })
            }

            var onDeptSelectFetched = function (err, deptResult) {
                self.assertNullOrUndefined(err)
                self.assertEqual(deptResult.rows.length, 1)
                self.assertEqual(deptResult.rows[0].name, 'XDept')

                session.connection.executeSQLString('select oid as "oid", name as "name" from EMP', [], onEmpSelectFetched, sqlOptions)
            }

            var onFirstDeptSelectFetched = function (err, result) {
                self.assertNullOrUndefined(err)
                self.assertEqual(result.rows.length, 1)
                self.assertEqual(result.rows[0].name, 'SomeDept')

                session.doChangesAndSave(function (changesDone) {
                    newDepartment.name = 'XDept'
                    changesDone()
                }, function (saveErr) {
                    self.assertNullOrUndefined(saveErr)
                    session.connection.executeSQLString('select oid as "oid", name as "name" from DEPT', [], onDeptSelectFetched, sqlOptions)
                })
            }

            session.doChangesAndSave(function (changesDone) {
                newDepartment.employees.push(newEmployee)
                session.registerNew(newDepartment)
                changesDone()
            }, function (saveErr) {
                self.assertNullOrUndefined(saveErr)
                self.assertEqual(newDepartment.oid, 1)
                self.assertEqual(newEmployee.oid, 1)
                session.connection.executeSQLString('select oid as "oid", name as "name" from DEPT', [], onFirstDeptSelectFetched, sqlOptions)
            })

        })
    }
}

module.exports = ApatiteDialectTestCaseAbstract