var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatiteMysqlTestUtil = require('./apatite-mysql-test-util')
var util = new ApatiteMysqlTestUtil()

class ApatiteMysqlTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(() => {
            this.apatiteSession.existsDBTable('DEPT', (existsErr, result) => {
                this.assertNullOrUndefined(existsErr, null, 'Table Existence Check: No error should occur when checking for table existence.')
                this.assertEqual(result.rows.length, 1, null, 'Table Existence Check: Since table DEPT exists, the result rows length should be 1.')
                this.apatiteSession.existsDBTableColumn('DEPT', 'NAME', (colExistsErr, colResult) => {
                    this.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence Check: No error should occur when checking for table column existence.')
                    this.assertEqual(colResult.rows.length, 1, null, 'Table Column Existence Check: Since column NAME exists in table DEPT, the result rows length should be 1.')
                    onTestPerformed()
                })
            })
        })
    }
}

module.exports = ApatiteMysqlTestCase