var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()
util.autoRegisterModels = false
var apatite = util.apatite

class ApatiteModelDescriptorTestCase extends TestCase {
    constructor() {
        super()
    }

    testDescriptor() {
        var Department = require('../test-models/department.js')
        this.assertUndefined(apatite.getModelDescriptor(Department))
        var object = {
            table: 'DEPT',
            model: Department,
            mappings: [
                {attr: 'oid', col: 'OID', pk: true, type: 'serial'},
                {attr: 'name', col: 'NAME', type: 'varchar', length: 100},
                {attr: 'employees', toMany: {modelName: 'Employee', toOneName: 'department', cascadeOnDelete: true, orderBy: [{attr: 'name', desc: true}]}}
            ]
        }
        var descriptor = apatite.newDescriptorFromObject(object)
        this.assertNotUndefined(apatite.getModelDescriptor(Department))
        this.assertEqual(descriptor.table.tableName, object.table)
        this.assertEqual(descriptor.getMappings().length, 3)
        this.assertEqual(descriptor.getMappingForAttribute('oid').column.isPrimaryKey, true)
        this.assertEqual(descriptor.getMappingForAttribute('name').column.dataType.length, 100)

        var mapping = descriptor.getMappingForAttribute('employees')
        this.assertEqual(mapping.toModelName, 'Employee')
        this.assertEqual(mapping.toOneToOneAttrName, 'department')
        this.assertEqual(mapping.shouldCascadeOnDelete, true)
        this.assertEqual(mapping.orderByQuery.orderByExpressions[0].expressionValue.expressionValue, 'name')
        this.assertEqual(mapping.orderByQuery.orderByExpressions[0].descending, true)

        this.shouldThrow(() => {
            descriptor.createColumnFromObject({col: 'foo'})
        }, Error, 'Could not read data type of column: foo.')

        this.shouldThrow(() => {
            descriptor.createColumnFromObject({col: 'foo', type: 'fooinvalidtype'})
        }, Error, 'Could not read data type of column: foo.')

        apatite = util.newApatite()
        var Employee = require('../test-models/employee.js')
        this.assertUndefined(apatite.getModelDescriptor(Employee))
        var object = {
            table: 'EMP',
            model: Employee,
            mappings: [
                {attr: 'oid', col: 'OID', pk: true, type: 'serial'},
                {attr: 'name', col: 'NAME', type: 'varchar', length: 100},
                {attr: 'salary', col: 'SALARY', type: 'decimal', notNull: true, length: 12, precision: 2},
                {attr: 'joinedOn', col: 'JOINEDON', type: 'date'},
                {attr: 'department', toOne: {modelName: 'Department', isLeftOuterJoin: true, fromCols: [{col: 'DEPTOID', type: 'int', length: 10}], toCols: [{table: 'DEPT', col: 'OID', pk: true, type: 'serial'}]}}
            ]
        }
        descriptor = apatite.newDescriptorFromObject(object)
        this.assertNotUndefined(apatite.getModelDescriptor(Employee))
        mapping = descriptor.getMappingForAttribute('department')
        this.assertEqual(mapping.toModelName, 'Department')
        this.assertEqual(mapping.isLeftOuterJoin, true)
        this.assertEqual(mapping.columns.length, 1)
        this.assertEqual(mapping.columns[0].isOneToOneColumn, true)
        this.assertEqual(mapping.toColumns.length, 1)
        this.assertEqual(mapping.toColumns[0].table.tableName, 'DEPT')
        var column = descriptor.getMappingForAttribute('salary').column
        this.assertEqual(column.dataType.length, 12)
        this.assertEqual(column.dataType.precision, 2)
        this.assertEqual(descriptor.getMappingForAttribute('joinedOn').column.dataType.constructor.name, 'ApatiteDateDataType')
    }
}

module.exports = ApatiteModelDescriptorTestCase