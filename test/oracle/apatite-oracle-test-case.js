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
                self.doConnResultSetFailTests(onTestPerformed)
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