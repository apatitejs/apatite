var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()
var apatite = util.apatite

class ApatiteInheritanceMappingTest extends TestCase {
    constructor() {
        super()
    }

    testInheritanceMapping() {
        class Shape {
            constructor() {
                this.oid = 0
                this.name = ''
                this.shapeType = 0
            }
        }
        class Circle extends Shape {
            constructor() {
                super()
                this.shapeType = 1
            }
        }
        var table = apatite.newTable('SHAPE')
        var shapeDescriptor = apatite.newModelDescriptor(Shape, table)

        var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
        column.bePrimaryKey()
        shapeDescriptor.newSimpleMapping('oid', column)

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100))
        shapeDescriptor.newSimpleMapping('name', column)

        column = table.addNewColumn('SHAPETYPE', apatite.dialect.newIntegerType(1))
        shapeDescriptor.newSimpleMapping('shapeType', column)
        var circleDescriptor = apatite.newModelDescriptor(Circle, table)

        this.shouldThrow(() => {
            circleDescriptor.inheritFrom(circleDescriptor, apatite.newTypeFilterQuery().attr('shapeType').eq(1))
        }, Error, 'Invalid inheritance mapping for model: Circle. Recursive inheritance detected.')

        this.shouldThrow(() => {
            circleDescriptor.inheritFrom(shapeDescriptor, null)
        }, Error, 'Invalid inheritance mapping for model: Circle. Type filter query is required.')

        this.shouldThrow(() => {
            circleDescriptor.inheritFrom(shapeDescriptor, apatite.newTypeFilterQuery().attr('parent.shapeType').eq(1))
        }, Error, 'Only simple attributes are supported at the moment for type filter queries.')

        circleDescriptor.inheritFrom(shapeDescriptor, apatite.newTypeFilterQuery().attr('shapeType').eq(1))
        this.shouldThrow(() => {
            shapeDescriptor.inheritFrom(circleDescriptor, apatite.newTypeFilterQuery().attr('shapeType').eq(1))
        }, Error, 'Invalid inheritance mapping for model: Shape. Recursive inheritance detected.')
    }
}

module.exports = ApatiteInheritanceMappingTest