var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteOneToManyMappingTestCase extends TestCase {
    constructor() {
        super()
    }

    testOneToOneMapping() {
        this.createDeptAndEmpDescriptors()
        var apatite = util.apatite
        var deptDescriptor = apatite.getModelDescriptor('Department')
        deptDescriptor.newOneToManyMapping('employees', null, 'department')

        var self = this
        apatite.newSession(function (err, session) {
            self.assertEqual(err.message, 'Invalid one-to-many mapping. Model name not defined for attribute: employees.')
        })

        deptDescriptor.deleteMapping('employees')
        deptDescriptor.newOneToManyMapping('employees', 'Empl', 'department')
        apatite.newSession(function (err, session) {
            self.assertEqual(err.message, 'Invalid one-to-many mapping attribute: employees. Model: Empl not registered.')
        })

        deptDescriptor.deleteMapping('employees')
        deptDescriptor.newOneToManyMapping('employees', 'Employee')
        apatite.newSession(function (err, session) {
            self.assertEqual(err.message, 'Invalid one-to-many mapping attribute: employees in model: Department. The to one-to-one attribute name is not defined.')
        })

        deptDescriptor.deleteMapping('employees')
        deptDescriptor.newOneToManyMapping('employees', 'Employee', 'abc')
        apatite.newSession(function (err, session) {
            self.assertEqual(err.message, 'Invalid one-to-many mapping attribute: employees in model: Department. Mapping for attribute: abc not found in model: Employee.')
        })
    }

    createDeptAndEmpDescriptors() {
        class Department {
            constructor() {
                this.oid = 0
                this.employees = []
            }

            static getModelDescriptor(apatite) {
                var table = apatite.newTable('DEPT')
                var modelDescriptor = apatite.newModelDescriptor(Department, table)
                var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
                column.bePrimaryKey()
                modelDescriptor.newSimpleMapping('oid', column)
                return modelDescriptor
            }
        }

        class Employee {
            constructor() {
                this.oid = 0
                this.department = null
            }

            static getModelDescriptor(apatite) {
                var table = apatite.newTable('EMP')
                var modelDescriptor = apatite.newModelDescriptor(Employee, table)
                var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
                column.bePrimaryKey()
                modelDescriptor.newSimpleMapping('oid', column)
                var deptTable = apatite.getOrCreateTable('DEPT')
                var deptOIDColumn = deptTable.getColumn('OID')
                modelDescriptor.newOneToOneMapping('department', null, [column], [deptOIDColumn])
                return modelDescriptor
            }
        }

        util.apatite.registerModel(Department)
        util.apatite.registerModel(Employee)
    }
}

module.exports = ApatiteOneToManyMappingTestCase