var ApatiteDialectTestCaseAbstract = require('../apatite-dialect-test-case-abstract.js')
var ApatiteOracleTestUtil = require('./apatite-oracle-test-util')
var util = new ApatiteOracleTestUtil()
var ApatiteOracleDialect = require('../../lib/database/oracle/apatite-oracle-dialect.js')

class ApatiteOracleTestCase extends ApatiteDialectTestCaseAbstract {
    constructor() {
        super(util)
    }

    testDMLExecution(onTestPerformed) {
        var self = this
        this.doDMLExecutionTests(() => {
            self.doFailedSQLTests(() => {
                self.doConnResultSetFailTests(() => {
                    self.apatiteSession.existsDBTable('DEPT', (existsErr, result) => {
                        self.assertNullOrUndefined(existsErr, null, 'Table Existence Check: No error should occur when checking for table existence.')
                        self.assertEqual(result.rows.length, 1, null, 'Table Existence Check: Since table DEPT exists, the result rows length should be 1.')
                        self.apatiteSession.existsDBTableColumn('DEPT', 'NAME', (colExistsErr, colResult) => {
                            self.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence Check: No error should occur when checking for table column existence.')
                            self.assertEqual(colResult.rows.length, 1, null, 'Table Column Existence Check: Since column NAME exists in table DEPT, the result rows length should be 1.')
                            onTestPerformed()
                        })
                    })
                })
            })
        })
    }

    doConnResultSetFailTests(onTestPerformed) {
        if (!this.existsDialectModule())
            return onTestPerformed()
        var self = this
        var session = this.apatiteSession
        var resultSet = new ApatiteOracleDialect().getApatiteResultSet({resultSet: {
            getRows: function(recSetSize, onFetched) {
                onFetched(new Error('Failed to get rows.'))
            },
            close: function(onClosed) {
                onClosed(null)
            }
        }})
        var sqlOptions = { isApatiteDirectSql: true, resultSet: true }
        var onExecuted = function(err, result) {
            self.assertEqual(err.message, 'Failed to get rows.')
            session.connection.testResultSet = null
            self.doResultSetTests(onTestPerformed)
        }
        session.connection.testResultSet = resultSet
        session.connection.executeSQLString('select * from DEPT', [], onExecuted, sqlOptions)
    }

    doResultSetTests(onTestPerformed) {
        var self = this
        var resultSet = new ApatiteOracleDialect().getApatiteResultSet({rows: []});
        resultSet.fetchRecords(function(err, rows) {
            self.assertNullOrUndefined(err)
            self.assertEqual(rows.length, 0);
            resultSet.closeResultSet(function(closeErr) {
                self.assertNullOrUndefined(closeErr)
                self.doResultSetFailTests(onTestPerformed)
            })
        })
    }

    doResultSetFailTests(onTestPerformed) {
        var self = this
        var resultSet = new ApatiteOracleDialect().getApatiteResultSet({resultSet: {
            getRows: function(recSetSize, onFetched) {
                onFetched(new Error('Failed to get rows.'))
            },
            close: function(onClosed) {
                onClosed(null)
            }
        }})
        resultSet.fetchAllRows(function(err, rows) {
            self.assertEqual(err.message, 'Failed to get rows.')
            self.doResultSetCloseFailTests(onTestPerformed)
        })
    }

    doResultSetCloseFailTests(onTestPerformed) {
        var self = this
        var resultSet = new ApatiteOracleDialect().getApatiteResultSet({resultSet: {
            getRows: function(recSetSize, onFetched) {
                onFetched(null, [])
            },
            close: function(onClosed) {
                onClosed(new Error('Failed to close result set.'))
            }
        }})
        resultSet.fetchAllRows(function(err, rows) {
            self.assertEqual(err.message, 'Failed to close result set.')
            onTestPerformed()
        })
    }
}

module.exports = ApatiteOracleTestCase