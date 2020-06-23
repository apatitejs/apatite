﻿var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatitePostgresTestUtil = require('./apatite-postgres-test-util')
var util = new ApatitePostgresTestUtil()

class ApatitePostgresTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        this.doDMLExecutionTests(() => {
            this.apatiteSession.existsDBTable('dept', (existsErr, result) => {
                this.assertNullOrUndefined(existsErr, null, 'Table Existence Check: No error should occur when checking for table existence.')
                this.assertEqual(result.rows.length, 1, null, 'Table Existence Check: Since table dept exists, the result rows length should be 1.')
                this.apatiteSession.existsDBTableColumn('dept', 'name', (colExistsErr, colResult) => {
                    this.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence Check: No error should occur when checking for table column existence.')
                    this.assertEqual(colResult.rows.length, 1, null, 'Table Column Existence Check: Since column name exists in table dept, the result rows length should be 1.')
                    onTestPerformed()
                })
            })
        })
    }
}

module.exports = ApatitePostgresTestCase