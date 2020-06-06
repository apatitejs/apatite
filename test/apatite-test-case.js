var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('./apatite-test-util.js')
var util = new ApatiteTestUtil()
util.autoRegisterModels = false
var apatite = util.apatite

class ApatiteTestCase extends TestCase {
    constructor() {
        super()
    }

    testModelRegistration() {
        this.shouldThrow(() => {
            apatite.registerModel(null)
        }, Error, 'Model provided to register is invalid. Please provide a valid model.')

        this.shouldThrow(() => {
            apatite.registerModel({})
        }, Error, 'Model provided is not a valid ES6 class.')

        var UserModel = function () { };

        this.shouldThrow(() => {
            apatite.registerModel(UserModel)
        }, Error, 'Model provided is not a valid ES6 class.')

        class User {
        }

        this.shouldThrow(() => {
            apatite.registerModel(User)
        }, Error, 'getModelDescriptor not defined in model: User. Define a static function named getModelDescriptor to register model.')

        User.getModelDescriptor = function () {
            return apatite.newModelDescriptor(User, apatite.newTable('USERS'))
        }

        this.shouldThrow(() => {
            apatite.registerModel(User)
            apatite.registerModel(User)
        }, Error, 'Model User already registered.')

        this.assertEqual(apatite.registeredDescriptors['User'].model, User)
    }

    testDescriptorRegistration() {
        apatite = util.newApatite()
        this.shouldThrow(() => {
            apatite.registerModelDescriptor(null)
        }, Error, 'Model descriptor provided to register is invalid. Please provide a valid model descriptor.')

        apatite = util.newApatite()
        this.shouldThrow(() => {
            apatite.registerModelDescriptor(apatite.newModelDescriptor({}, apatite.newTable('USERS')))
        }, Error, 'Model provided is not a valid ES6 class.')

        var UserModel = function () { }

        apatite = util.newApatite()
        this.shouldThrow(() => {
            apatite.registerModelDescriptor(apatite.newModelDescriptor(UserModel, apatite.newTable('USERS')))
        }, Error, 'Model provided is not a valid ES6 class.')

        class User {
        }

        apatite = util.newApatite()
        this.shouldThrow(() => {
            apatite.registerModelDescriptor(apatite.newModelDescriptor(User, apatite.newTable('USERS')))
            apatite.registerModelDescriptor(apatite.newModelDescriptor(User, apatite.newTable('USERS')))
        }, Error, 'Model User already registered.')

        var descriptor = apatite.registeredDescriptors['User']
        this.assertEqual(descriptor.model, User)

        var column = descriptor.table.addNewColumn('OID', apatite.dialect.newIntegerType(10))
        column.bePrimaryKey()
        var mapping = descriptor.newSimpleMapping('oid', column)
        this.assertEqual(descriptor.getModelDescriptor(mapping), descriptor)
        mapping.column = null
        this.shouldThrow(() => {
            descriptor.findOwnColumnForAttribute('oid')
        }, Error, 'Could not find column for attribute: oid from model: User.')
    }

    testDialect() {
        var Apatite = require('../lib/apatite')
        var ApatiteDialect = require('../lib/database/apatite-dialect')
        apatite = new Apatite(new ApatiteDialect({}))
        this.shouldThrow(() => {
            apatite.dialect.newConnection()
        }, Error, 'My subclass should have overridden this method.')
        class SomeNonExistingDialectModule {
            static getModuleName() {
                return 'foomodulename'
            }
        }
        this.shouldThrow(() => {
            Apatite.for(SomeNonExistingDialectModule, {})
        }, Error, 'Module "foomodulename" not found.')
    }
}

module.exports = ApatiteTestCase