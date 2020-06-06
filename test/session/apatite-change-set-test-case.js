var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()
util.apatite.defaultCacheSize = 50

class ApatiteChangeSetTestCase extends TestCase {
    constructor() {
        super()
    }

    testChangesBeingTracked() {
        var self = this
        util.newSession(function (err, session) {
            var allPets = session.getAllObjectsInCache('Pet')
            self.assertEqual(allPets.length, 0)

            var newPet = util.newPet()
            newPet.oid = 7
            newPet.name = 'Parrot'

            self.shouldThrow(() => {
                session.registerNew(newPet)
            }, Error, 'Cannot register object. Changes are not being tracked. Please use doChangesAndSave() to start tracking changes and save.')

            var changesToDo = function (changesDone) {
                session.registerNew(newPet)
                allPets = session.getAllObjectsInCache('Pet')
                self.assertEqual(allPets.length, 0)
                self.assertEqual(newPet.postSaveCalled, false)
                changesDone()
            }
            var onSaved = function (err) {
                allPets = session.getAllObjectsInCache('Pet')
                self.assertEqual(allPets.length, 1)
                self.assertEqual(newPet.postSaveCalled, true)
            }

            session.doChangesAndSave(changesToDo, onSaved)
        })
    }

    testChangesForNewObjects() {
        var self = this
        util.newSession(function (err, session) {
            var newPet = util.newPet()
            newPet.oid = 7
            newPet.name = 'Parrot'

            var newPerson = util.newPerson()
            newPerson.oid = 5
            newPerson.name = 'ParrotOwner'
            newPerson.pet = newPet

            var changesToDo = function (changesDone) {
                session.registerNew(newPerson)
                session.registerNew(newPet)

                var statements = session.changeSet.buildInsertStatements()
                self.assertEqual(statements.length, 2)
                self.assertEqual(statements[0].tableName, 'PET')
                self.assertEqual(statements[1].tableName, 'PERSON')
                changesDone()
            }
            var onSaved = function (err) {
                var allPets = session.getAllObjectsInCache('Pet')
                self.assertEqual(allPets.length, 1)

                var people = session.getAllObjectsInCache('Person')
                self.assertEqual(people.length, 1)
            }

            session.doChangesAndSave(changesToDo, onSaved)
        })
    }

    testChangesForDeletedObjects() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                self.assertEqual(allPets.length, 4)
                var petToDelete = allPets[0]
                self.assertEqual(petToDelete.postLoadCalled, true)

                session.doChangesAndSave(function (changesDone) {
                    session.registerDelete(petToDelete)
                    self.assertEqual(petToDelete.postDeleteCalled, false)
                    changesDone()
                }, function (err) {
                    allPets = session.getAllObjectsInCache('Pet')
                    self.assertEqual(allPets.length, 3)
                    self.assertEqual(petToDelete.postDeleteCalled, true)
                    session.doChangesAndSave(function (changesDone) {
                        var pet = util.newPet()
                        pet.name = 'Dog'
                        session.registerNew(pet)
                        changesDone()
                    }, function (err) {
                        allPets = session.getAllObjectsInCache('Pet')
                        self.assertEqual(allPets.length, 4)
                    })
                })

            })
        })
    }

    testChangesRollbackOnFailedUpdate() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                var dog = allPets[0]
                self.assertEqual(dog.name, 'Dog')

                var cat = allPets[1]
                self.assertEqual(cat.name, 'Cat')

                var newPet = util.newPet()
                newPet.oid = 7
                newPet.name = 'Parrot'

                var changesToDo = function (changesDone) {
                    dog.name = 'DogXXXXXXXXXXXXXXX'
                    session.registerNew(newPet)
                    session.registerDelete(cat)
                    self.assertEqual(newPet.postRollbackCalled, false)
                    self.assertEqual(cat.postRollbackCalled, false)
                    self.assertEqual(dog.postRollbackCalled, false)
                    changesDone(null)
                }

                var onSaved = function (err) {
                    self.assertEqual(dog.postRollbackCalled, true)
                    self.assertEqual(newPet.postRollbackCalled, true)
                    self.assertEqual(cat.postRollbackCalled, true)
                    self.assertEqual(err.message, 'Update statement failed.')
                    self.assertEqual(dog.name, 'Dog') // all changes must be rolled back
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testChangesRollbackForFailedBeginTrans() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.connection.failBeginTrans = true
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                var dog = allPets[0]
                self.assertEqual(dog.name, 'Dog')

                var changesToDo = function (changesDone) {
                    dog.name = 'test'
                    changesDone(null)
                }

                var onSaved = function (err) {
                    session.connection.failBeginTrans = false
                    self.assertEqual(err.message, 'Could not begin transaction.')
                    self.assertEqual(dog.name, 'Dog') // all changes must be rolled back
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testChangesRollbackForFailedCommitTrans() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.connection.failCommitTrans = true
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                var dog = allPets[0]
                self.assertEqual(dog.name, 'Dog')

                var changesToDo = function (changesDone) {
                    dog.name = 'test'
                    changesDone(null)
                }

                var onSaved = function (err) {
                    session.connection.failCommitTrans = false
                    self.assertEqual(err.message, 'Could not commit transaction.')
                    self.assertEqual(dog.name, 'Dog') // all changes must be rolled back
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testChangesForFailedRollbackTrans() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.connection.failRollbackTrans = true
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                var dog = allPets[0]
                self.assertEqual(dog.name, 'Dog')

                var changesToDo = function (changesDone) {
                    dog.name = 'DogXXXXXXXXXXXXXXX'
                    changesDone(null)
                }

                var onSaved = function (err) {
                    session.connection.failRollbackTrans = false;
                    self.assertEqual(err.message, 'Could not rollback transaction.')
                    self.assertEqual(dog.name, 'Dog') // all changes must be rolled back
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.connection.failRollbackTrans = true
            session.connection.failCommitTrans = true
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                var dog = allPets[0]
                self.assertEqual(dog.name, 'Dog')

                var changesToDo = function (changesDone) {
                    dog.name = 'test'
                    changesDone(null)
                }

                var onSaved = function (err) {
                    session.connection.failRollbackTrans = false
                    session.connection.failCommitTrans = false
                    self.assertEqual(err.message, 'Could not rollback transaction.')
                    self.assertEqual(dog.name, 'Dog') // all changes must be rolled back
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testChangesForFailedCascadeDelete() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session);
            session.execute(query, function (err, departments) {

                var changesToDo = function (changesDone) {
                    session.registerDelete(departments[2])
                    changesDone(null)
                };

                var onSaved = function (err) {
                    self.assertEqual(err.message, 'Select statement failed.') // error while cascading the children
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testChangesForUpdatedObjects() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, pets) {
                var allPets = session.getAllObjectsInCache('Pet')
                self.assertEqual(allPets.length, 4)

                var people = session.getAllObjectsInCache('Person')
                self.assertEqual(people.length, 0)

                var newPerson = util.newPerson()
                newPerson.oid = 5
                newPerson.name = 'PetOwner'
                newPerson.pet = allPets[0]

                var changesToDo = function (changesDone) {
                    session.registerNew(newPerson)
                    changesDone()
                }
                var onSaved = function (err) {
                    people = session.getAllObjectsInCache('Person')
                    self.assertEqual(people.length, 1)

                    session.startTrackingChanges()
                    people[0].name = 'Owner'
                    people[0].name = 'Owner2' // Setting attribute more than once should always take the current value
                    allPets[0].name = 'PetX'

                    var statements = session.changeSet.buildUpdateStatements()
                    self.assertEqual(statements.length, 2)
                    statements[0].buildSQLString()
                    self.assertEqual(statements[0].sqlString, 'UPDATE PET SET NAME = ? WHERE OID = ?') // even though the attribute of person has been first set, the update is issued for pet first becuase of the table sort order
                    self.assertEqual(statements[0].bindings[0].variableValue, 'PetX')
                    statements[1].buildSQLString()
                    self.assertEqual(statements[1].sqlString, 'UPDATE PERSON SET NAME = ? WHERE OID = ?')
                    self.assertEqual(statements[1].bindings[0].variableValue, 'Owner2')

                }
                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testOneToNChangesForUpdatedObjects() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, allDepartments) {
                self.assertEqual(allDepartments.length, 3)
                var allEmployees = session.getAllObjectsInCache('Employee')
                self.assertEqual(allEmployees.length, 0)

                var newEmployee = util.newEmployee()
                newEmployee.oid = 6
                newEmployee.name = 'SomeEmp'
                newEmployee.department = allDepartments[0]

                var changesToDo = function (changesDone) {
                    session.registerNew(newEmployee)
                    changesDone()
                }
                var onSaved = function (err) {
                    allEmployees = session.getAllObjectsInCache('Employee')
                    self.assertEqual(allEmployees.length, 1)

                    session.startTrackingChanges()
                    allEmployees[0].department = allDepartments[1]

                    var statements = session.changeSet.buildUpdateStatements()
                    self.assertEqual(statements.length, 1)
                    statements[0].buildSQLString()
                    self.assertEqual(statements[0].sqlString, 'UPDATE EMP SET DEPTOID = ? WHERE OID = ?')
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })

        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, allDepartments) {
                var dept = allDepartments[0]
                var changesToDo = function (changesDone) {
                    dept.name = ''
                    delete dept.name
                    var statements = session.changeSet.buildUpdateStatements()
                    self.assertEqual(statements.length, 1)
                    statements[0].buildSQLString()
                    self.assertEqual(statements[0].sqlString, 'UPDATE DEPT SET NAME = ? WHERE OID = ?')
                    self.assertEqual(statements[0].bindings[0].variableValue, null)
                    self.assertEqual(statements[0].bindings[1].variableValue, 1)
                    self.assertEqual(dept.postSaveCalled, false)
                    changesDone()
                }
                var onSaved = function (err) {
                    self.assertEqual(dept.postSaveCalled, true)
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testOneToNChangesForNewAndDelObjects() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, allDepartments) {
                self.assertEqual(allDepartments.length, 3)

                var department = allDepartments[0]
                var newEmployee = util.newEmployee()
                newEmployee.oid = 6
                newEmployee.name = 'SomeEmp'
                newEmployee.department = allDepartments[0]

                var changesToDo = function (changesDone) {
                    department.employees.add(function () {

                        var statements = session.changeSet.buildUpdateStatements()
                        self.assertEqual(statements.length, 0)

                        statements = session.changeSet.buildInsertStatements()
                        self.assertEqual(statements.length, 1)
                        statements[0].buildSQLString()
                        self.assertEqual(statements[0].sqlString, 'INSERT INTO EMP (NAME, DEPTOID) VALUES (?, ?) RETURNING OID AS "OID"')
                        changesDone()
                    }, newEmployee)
                }

                var onSaved = function (err) {
                    session.startTrackingChanges()

                    department.employees.remove(function () {
                        var statements = session.changeSet.buildUpdateStatements()
                        self.assertEqual(statements.length, 0)

                        statements = session.changeSet.buildInsertStatements()
                        self.assertEqual(statements.length, 0)

                        statements = session.changeSet.buildDeleteStatements()
                        self.assertEqual(statements.length, 1)
                        self.assertEqual(statements[0].sqlString, 'DELETE FROM EMP WHERE OID = ?')

                    }, newEmployee)
                }

                session.doChangesAndSave(changesToDo, onSaved)
            })
        })
    }

    testOneToNChangesForDeletedObjects() {
        var self = this
        util.newSession(function (err, session) {
            var department = util.newDepartment()
            department.oid = 6
            department.name = 'SomeDept'

            var newEmployee = util.newEmployee()
            newEmployee.oid = 6
            newEmployee.name = 'SomeEmp'
            newEmployee.department = department

            var changesToDo = function (changesDone) {
                department.employees.push(newEmployee)

                session.registerNew(department)

                var statements = session.changeSet.buildUpdateStatements()
                self.assertEqual(statements.length, 0)

                statements = session.changeSet.buildInsertStatements()
                self.assertEqual(statements.length, 2)

                statements = session.changeSet.buildDeleteStatements()
                self.assertEqual(statements.length, 0)
                changesDone()
            }
            var onSaved = function (err) {
                session.startTrackingChanges()
                department.employees.remove(function (err) {
                    var statements = session.changeSet.buildUpdateStatements()
                    self.assertEqual(statements.length, 0)

                    statements = session.changeSet.buildInsertStatements()
                    self.assertEqual(statements.length, 0)

                    statements = session.changeSet.buildDeleteStatements()
                    self.assertEqual(statements.length, 1)
                    self.assertEqual(statements[0].sqlString, 'DELETE FROM EMP WHERE OID = ?')
                }, newEmployee)
            }

            session.doChangesAndSave(changesToDo, onSaved)
        })

        util.newSession(function (err, session) {
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, allDepartments) {
                self.assertEqual(allDepartments.length, 3)

                var department = allDepartments[0]
                department.employees.getValue(function (empLoadErr, employees) {
                    self.assertEqual(employees.length, 2)
                    var allEmployees = session.getAllObjectsInCache('Employee')
                    self.assertEqual(allEmployees.length, 2)
                    var changesToDo = function (changesDone) {
                        session.registerDelete(department) // employees should be deleted as well because of the cascade on delete option
                        changesDone()
                    }

                    var onSaved = function (err) {
                        self.assertEqual(session.getAllObjectsInCache('Department').length, 2)
                        self.assertEqual(session.getAllObjectsInCache('Employee').length, 0)
                    }

                    session.doChangesAndSave(changesToDo, onSaved)
                })

            })
        })
    }
}

module.exports = ApatiteChangeSetTestCase