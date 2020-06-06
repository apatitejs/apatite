'use strict';

var Apatite = require('../lib/apatite');
var ApatiteTestDialect = require('./database/apatite-test-dialect.js');

var Department = require('./test-models/department.js');
var Employee = require('./test-models/employee.js');

var Pet = require('./test-models/pet.js');
var Person = require('./test-models/person.js');

var Shape = require('./test-models/shape.js');
var ShapeWithVertex = require('./test-models/shape-with-vertex.js');
var Circle = require('./test-models/circle.js');
var SemiCircle = require('./test-models/semi-circle.js');

var Product = require('./test-models/product.js');

var Book = require('./test-models/book.js');

var Order = require('./test-models/order.js');

var NonExistentTable = require('./test-models/non-existent-table.js');

class ApatiteTestUtil {
    constructor() {
        this.apatite = this.newApatite();
        this.autoRegisterModels = true;
        this.modelsRegistered = false;
    }

    newApatite() {
        return new Apatite(new ApatiteTestDialect({ userName: 'apatite', password: 'test' }));
    }

    createNewApaite() {
        this.apatite = this.newApatite();
    }

    registerTestModels() {
        if (!this.autoRegisterModels)
            return;

        if (this.modelsRegistered)
            return;

        this.apatite.registerModel(Employee);
        this.apatite.registerModel(Department);
        this.apatite.registerModel(Pet);
        this.apatite.registerModel(Person);

        this.apatite.registerModel(Shape);
        this.apatite.registerModel(ShapeWithVertex);
        this.apatite.registerModel(Circle);
        this.apatite.registerModel(SemiCircle);

        this.apatite.registerModel(Product);

        this.apatite.registerModel(Book);
        this.apatite.registerModel(Order);

        this.apatite.registerModel(NonExistentTable);
        this.modelsRegistered = true;
    }

    newPet() {
        return new Pet();
    }

    newPerson() {
        return new Person();
    }

    newEmployee() {
        return new Employee();
    }

    newDepartment() {
        return new Department();
    }

    newQueryForDepartment(session) {
        return session.newQuery(Department);
    }

    newQueryForEmployee(session) {
        return session.newQuery(Employee);
    }

    newQueryForPet(session) {
        return session.newQuery(Pet);
    }

    newQueryForPerson(session) {
        return session.newQuery(Person);
    }

    newQueryForShape(session) {
        return session.newQuery(Shape);
    }

    newQueryForShapeWithVertex(session) {
        return session.newQuery(ShapeWithVertex);
    }

    newQueryForCircle(session) {
        return session.newQuery(Circle);
    }

    newQueryForSemiCircle(session) {
        return session.newQuery(SemiCircle);
    }

    newQueryForProduct(session) {
        return session.newQuery(Product);
    }

    newQueryForBook(session) {
        return session.newQuery(Book);
    }

    newQueryForNonExistentTable(session) {
        return session.newQuery(NonExistentTable);
    }

    newSession(onSessionCreated) {
        this.registerTestModels();
        var self = this;
        this.apatite.newSession(function (err, session) {
            onSessionCreated(err, session);
            self.autoRegisterModels = false;
        });
    }


    createTestTablesForPool(onTablesCreated) {
        this.basicCreateTestTables(onTablesCreated, this.getCreateTableStatementsForPool());
    }

    deleteTestTablesForPool(onTablesCreated) {
        this.basicDeleteTestTables(onTablesCreated, this.getDropTableStatementsForPool());
    }

    createTestTables(onTablesCreated) {
        this.basicCreateTestTables(onTablesCreated, this.getCreateTableStatements());
    }

    deleteTestTables(onTablesCreated) {
        this.basicDeleteTestTables(onTablesCreated, this.getDropTableStatements());
    }

    basicCreateTestTables(onTablesCreated, statements) {
        var self = this
        this.newSession(function (sessionErr, session) {
            if (sessionErr) {
                onTablesCreated(sessionErr);
                return;
            }
            session.connection.executeStatements(statements, function (connErr, result) {
                if (connErr) {
                    onTablesCreated(connErr);
                    return;
                }
                if (self.apatite.dialect.useConnectionPool) {
                    self.apatite.closeConnectionPool(function(poolErr) {
                        onTablesCreated(poolErr);
                    })
                } else {
                    session.end(function (endErr) {
                        onTablesCreated(endErr);
                    });
                }
            });
        });
    }



    basicDeleteTestTables(onTablesDropped, statements) {
        var self = this
        this.newSession(function (err, session) {
            session.connection.executeStatements(statements, function (err, result) {
                if (err) {
                    onTablesDropped(err);
                    return;
                }
                if (self.apatite.dialect.useConnectionPool) {
                    self.apatite.closeConnectionPool(function(poolErr) {
                        onTablesDropped(poolErr);
                    })
                } else {
                    session.end(function (endErr) {
                        onTablesDropped(endErr);
                    });
                }
            });
        });
    }

}

module.exports = ApatiteTestUtil;