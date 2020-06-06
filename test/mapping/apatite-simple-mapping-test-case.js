var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()
var ApatiteOneToOneProxy = require('../../lib/model/apatite-one-to-one-proxy.js')

class ApatiteSimpleMappingTestCase extends TestCase {
    constructor() {
        super()
    }

    testSimpleMapping() {
        var apatite = util.apatite
        class User
        {
            constructor() {
                this.oid = 0
                this.id = ''
                this.name = ''
            }
        }

        var table = apatite.newTable('USERS')
        var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
        var modelDescriptor = apatite.newModelDescriptor(User, table)

        modelDescriptor.newSimpleMapping('oid', column)
        this.shouldThrow(() => {
            modelDescriptor.newSimpleMapping('oid', column)
        }, Error, 'Mapping for attribute: oid already exists.')

        column = table.addNewColumn('ID', apatite.dialect.newVarCharType(15))
        modelDescriptor.newSimpleMapping('id', column)
        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100))
        var mapping = modelDescriptor.newSimpleMapping('name', column)
        var value = mapping.getAttrValueFromObject(undefined, 'foo')

        this.assertEqual(value, null)
        var proxy = new ApatiteOneToOneProxy(null)
        value = mapping.getAttrValueFromObject({'foo': proxy}, 'foo')
        this.assertEqual(value, null)
        proxy.setValue('test')
        value = mapping.getAttrValueFromObject({'foo': proxy}, 'foo')
        this.assertEqual(value, 'test')
        column = table.addNewColumn('FOO', apatite.dialect.newVarCharType(100))
        this.shouldThrow(() => {
            modelDescriptor.newSimpleMapping(null, column)
        }, Error, 'Invalid attribute name.')
    }
}

module.exports = ApatiteSimpleMappingTestCase