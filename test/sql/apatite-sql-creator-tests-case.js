var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteSQLScriptCreatorTestCase extends TestCase {
    constructor() {
        super()
    }

    testSQLiteSQLCreation(onTestPerformed) {
        var ApatiteSqliteTestUtil = require('../sqlite/apatite-sqlite-test-util')
        var sqliteUtil = new ApatiteSqliteTestUtil()
        if (sqliteUtil.existsModule()) {
            var self = this
            sqliteUtil.newSession(function (err, session) {
                var script = session.createSQLScriptForModel('Pet')
                self.assertEqual(script, 'CREATE TABLE PET (OID INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT);')

                script = session.createSQLScriptForModel('Order')
                self.assertEqual(script, 'CREATE TABLE ORDER (OID INTEGER PRIMARY KEY AUTOINCREMENT, ORDERDATE INTEGER);')

                script = session.createSQLScriptForModel('Product')
                self.assertEqual(script, 'CREATE TABLE PRODUCT (OID INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT, QUANTITY NUMERIC NOT NULL);')

                script = session.createSQLScriptForAttribute('Pet', 'name')
                self.assertEqual(script, 'ALTER TABLE PET ADD (NAME TEXT);')

                session.existsDBTable('FOOBAR', (existsErr, result) => {
                    self.assertNullOrUndefined(existsErr, null, 'Table Existence: No error should occur when checking for table existence.')
                    self.assertEqual(result.rows.length, 0, null, 'Table Existence: Since table FOOBAR does not exist, the result rows length should be 0.')
                    session.existsDBTableColumn('FOOBAR', 'XYZ', (colExistsErr, colResult) => {
                        self.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence: No error should occur when checking for table column existence.')
                        self.assertEqual(colResult.rows.length, 0, null, 'Table Column Existence: Since column XYZ does not exist, the result rows length should be 0.')
                        session.end(function (endErr) {
                            self.assertNullOrUndefined(endErr)
                            onTestPerformed()
                        })
                    })
                })
            })
        }
    }

    testPostgresSQLCreation(onTestPerformed) {
        var ApatitePostgresTestUtil = require('../postgres/apatite-postgres-test-util')
        var postgresUtil = new ApatitePostgresTestUtil()
        if (postgresUtil.existsModule()) {
            var self = this
            postgresUtil.newSession(function (err, session) {
                var script = session.createSQLScriptForModel('Pet')
                self.assertEqual(script, 'CREATE TABLE PET (OID SERIAL PRIMARY KEY, NAME VARCHAR (100));')

                script = session.createSQLScriptForModel('Order')
                self.assertEqual(script, 'CREATE TABLE ORDER (OID SERIAL PRIMARY KEY, ORDERDATE TIMESTAMP);')

                script = session.createSQLScriptForModel('Product')
                self.assertEqual(script, 'CREATE TABLE PRODUCT (OID SERIAL PRIMARY KEY, NAME VARCHAR (50), QUANTITY NUMERIC (11, 2) NOT NULL);')

                script = session.createSQLScriptForAttribute('Pet', 'name')
                self.assertEqual(script, 'ALTER TABLE PET ADD (NAME VARCHAR (100));')

                session.existsDBTable('FOOBAR', (existsErr, result) => {
                    self.assertNullOrUndefined(existsErr, null, 'Table Existence: No error should occur when checking for table existence.')
                    self.assertEqual(result.rows.length, 0, null, 'Table Existence: Since table FOOBAR does not exist, the result rows length should be 0.')
                    session.existsDBTableColumn('FOOBAR', 'XYZ', (colExistsErr, colResult) => {
                        self.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence: No error should occur when checking for table column existence.')
                        self.assertEqual(colResult.rows.length, 0, null, 'Table Column Existence: Since column XYZ does not exist, the result rows length should be 0.')
                        session.end(function (endErr) {
                            self.assertNullOrUndefined(endErr)
                            onTestPerformed()
                        })
                    })
                })
            })
        }
    }

    testMySqlSQLCreation(onTestPerformed) {
        var ApatiteMysqlTestUtil = require('../mysql/apatite-mysql-test-util')
        var mysqlUtil = new ApatiteMysqlTestUtil();
        if (mysqlUtil.existsModule()) {
            var self = this
            mysqlUtil.newSession(function (err, session) {
                var script = session.createSQLScriptForModel('Pet')
                self.assertEqual(script, 'CREATE TABLE PET (OID INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR (100));')

                script = session.createSQLScriptForModel('Order')
                self.assertEqual(script, 'CREATE TABLE ORDER (OID INT AUTO_INCREMENT PRIMARY KEY, ORDERDATE DATETIME);')

                script = session.createSQLScriptForModel('Product')
                self.assertEqual(script, 'CREATE TABLE PRODUCT (OID INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR (50), QUANTITY DECIMAL (11, 2) NOT NULL);')

                script = session.createSQLScriptForAttribute('Pet', 'name')
                self.assertEqual(script, 'ALTER TABLE PET ADD (NAME VARCHAR (100));')

                session.existsDBTable('FOOBAR', (existsErr, result) => {
                    self.assertNullOrUndefined(existsErr, null, 'Table Existence: No error should occur when checking for table existence.')
                    self.assertEqual(result.rows.length, 0, null, 'Table Existence: Since table FOOBAR does not exist, the result rows length should be 0.')
                    session.end(function (endErr) {
                        self.assertNullOrUndefined(endErr)
                        onTestPerformed()
                    })
                })
            })
        }
    }

    testMsSqlSQLCreation(onTestPerformed) {
        var ApatiteMssqlTestUtil = require('../mssql/apatite-mssql-test-util')
        var mssqlUtil = new ApatiteMssqlTestUtil()
        if (mssqlUtil.existsModule()) {
            var self = this
            mssqlUtil.newSession(function (err, session) {
                var script = session.createSQLScriptForModel('Pet')
                self.assertEqual(script, 'CREATE TABLE PET (OID INT IDENTITY(1, 1) PRIMARY KEY, NAME VARCHAR (100));')

                script = session.createSQLScriptForModel('Order')
                self.assertEqual(script, 'CREATE TABLE ORDER (OID INT IDENTITY(1, 1) PRIMARY KEY, ORDERDATE DATETIME);')

                script = session.createSQLScriptForModel('Product')
                self.assertEqual(script, 'CREATE TABLE PRODUCT (OID INT IDENTITY(1, 1) PRIMARY KEY, NAME VARCHAR (50), QUANTITY DECIMAL (11, 2) NOT NULL);')

                script = session.createSQLScriptForAttribute('Pet', 'name')
                self.assertEqual(script, 'ALTER TABLE PET ADD (NAME VARCHAR (100));')

                session.existsDBTable('FOOBAR', (existsErr, result) => {
                    self.assertNullOrUndefined(existsErr, null, 'Table Existence: No error should occur when checking for table existence.')
                    self.assertEqual(result.rows.length, 0, null, 'Table Existence: Since table FOOBAR does not exist, the result rows length should be 0.')
                    session.existsDBTableColumn('FOOBAR', 'XYZ', (colExistsErr, colResult) => {
                        self.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence: No error should occur when checking for table column existence.')
                        self.assertEqual(colResult.rows.length, 0, null, 'Table Column Existence: Since column XYZ does not exist, the result rows length should be 0.')
                        session.end(function (endErr) {
                            self.assertNullOrUndefined(endErr)
                            onTestPerformed()
                        })
                    })
                })
            })
        }
    }

    testOracleSQLCreation(onTestPerformed) {
        var ApatiteOracleTestUtil = require('../oracle/apatite-oracle-test-util')
        var oracleUtil = new ApatiteOracleTestUtil()
        if (oracleUtil.existsModule()) {
            var self = this
            oracleUtil.newSession(function (err, session) {
                var script = session.createSQLScriptForModel('Pet')
                var expectedScript = 'CREATE TABLE PET (OID NUMBER PRIMARY KEY, NAME VARCHAR2 (100));\r\n'
                expectedScript += 'CREATE SEQUENCE PET_seq START WITH 1;\r\n'
                expectedScript += 'CREATE OR REPLACE TRIGGER PET_trg BEFORE INSERT ON PET FOR EACH ROW BEGIN SELECT PET_seq.NEXTVAL INTO :new.OID FROM dual; END;'
                self.assertEqual(script, expectedScript)

                script = session.createSQLScriptForModel('Order')
                expectedScript = 'CREATE TABLE ORDER (OID NUMBER PRIMARY KEY, ORDERDATE DATE);\r\n'
                expectedScript += 'CREATE SEQUENCE ORDER_seq START WITH 1;\r\n'
                expectedScript += 'CREATE OR REPLACE TRIGGER ORDER_trg BEFORE INSERT ON ORDER FOR EACH ROW BEGIN SELECT ORDER_seq.NEXTVAL INTO :new.OID FROM dual; END;'
                self.assertEqual(script, expectedScript)

                script = session.createSQLScriptForModel('Product')
                expectedScript = 'CREATE TABLE PRODUCT (OID NUMBER PRIMARY KEY, NAME VARCHAR2 (50), QUANTITY NUMBER (11, 2) NOT NULL);\r\n'
                expectedScript += 'CREATE SEQUENCE PRODUCT_seq START WITH 1;\r\n'
                expectedScript += 'CREATE OR REPLACE TRIGGER PRODUCT_trg BEFORE INSERT ON PRODUCT FOR EACH ROW BEGIN SELECT PRODUCT_seq.NEXTVAL INTO :new.OID FROM dual; END;'

                script = session.createSQLScriptForAttribute('Pet', 'name')
                self.assertEqual(script, 'ALTER TABLE PET ADD (NAME VARCHAR2 (100));')

                let stmt = session.getSQLScriptCreator().createStatementForTableExistence('FOOBAR')
                self.assertEqual(stmt.sqlString, 'SELECT * FROM USER_TABLES WHERE TABLE_NAME = :V1', null, 'Table Existence: Formed sql should be as expected.')
                self.assertEqual(stmt.bindings.length, 1, null, 'Table Existence: Only one binding variable containing the table name should exist.')
                self.assertEqual(stmt.bindings[0].getVariableName(), ':V1', null, 'Table Existence: Bind variable name should be :V1.')
                self.assertEqual(stmt.bindings[0].variableValue, 'FOOBAR', null, 'Table Existence: Bind variable value should be FOOBAR.')

                stmt = session.getSQLScriptCreator().createStatementForTableColumnExistence('FOOBAR', 'XYZ')
                self.assertEqual(stmt.sqlString, 'SELECT * FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :V1 AND COLUMN_NAME = :V2', null, 'Table Column Existence: Formed sql should be as expected.')
                self.assertEqual(stmt.bindings.length, 2, null, 'Table Column Existence: Two binding variables containing the table and column name should exist.')
                self.assertEqual(stmt.bindings[0].getVariableName(), ':V1', null, 'Table Column Existence: First bind variable name should be :V1.')
                self.assertEqual(stmt.bindings[1].getVariableName(), ':V2', null, 'Table Column Existence: Second bind variable name should be :V2.')
                self.assertEqual(stmt.bindings[0].variableValue, 'FOOBAR', null, 'Table Column Existence: First bind variable value should be FOOBAR.')
                self.assertEqual(stmt.bindings[1].variableValue, 'XYZ', null, 'Table Column Existence: Second bind variable value should be XYZ.')

                session.existsDBTable('FOOBAR', (existsErr, result) => {
                    self.assertNullOrUndefined(existsErr, null, 'Table Existence: No error should occur when checking for table existence.')
                    self.assertEqual(result.rows.length, 0, null, 'Table Existence: Since table FOOBAR does not exist, the result rows length should be 0.')
                    session.existsDBTableColumn('FOOBAR', 'XYZ', (colExistsErr, colResult) => {
                        self.assertNullOrUndefined(colExistsErr, null, 'Table Column Existence: No error should occur when checking for table column existence.')
                        self.assertEqual(colResult.rows.length, 0, null, 'Table Column Existence: Since column XYZ does not exist, the result rows length should be 0.')
                        session.end(function (endErr) {
                            self.assertNullOrUndefined(endErr)
                            onTestPerformed()
                        })
                    })
                })
            })
        }
    }

    testTestDialectSQLCreation(onTestPerformed) {
        var ApatiteTestUtil = require('../apatite-test-util.js');
        var util = new ApatiteTestUtil();
        var self = this
        util.newSession(function (sessionErr, session) {
            self.shouldThrow(() => {
                session.createSQLScriptForModel('fooandbar')
            }, Error, 'Descriptor for model "fooandbar" not found.')
            self.shouldThrow(() => {
                session.createSQLScriptForModel(ApatiteTestUtil)
            }, Error, 'Descriptor for model "ApatiteTestUtil" not found.')
            self.shouldThrow(() => {
                session.createSQLScriptForAttribute('fooandbar', 'abc')
            }, Error, 'Descriptor for model "fooandbar" not found.')
            self.shouldThrow(() => {
                session.createSQLScriptForAttribute('Pet', 'abc')
            }, Error, 'Mapping for attribute: abc not found in model: Pet.')

            var script = session.createSQLScriptForModel('Pet')
            self.assertEqual(script, 'CREATE TABLE PET (OID INT PRIMARY KEY, NAME VARCHAR (100));')

            script = session.createSQLScriptForModel('Order')
            self.assertEqual(script, 'CREATE TABLE ORDER (OID INT PRIMARY KEY, ORDERDATE DATE);')

            script = session.createSQLScriptForModel('Product')
            self.assertEqual(script, 'CREATE TABLE PRODUCT (OID INT PRIMARY KEY, NAME VARCHAR (50), QUANTITY DECIMAL (11, 2) NOT NULL);')

            script = session.createSQLScriptForAttribute('Pet', 'name')
            self.assertEqual(script, 'ALTER TABLE PET ADD (NAME VARCHAR (100));')

            var expectedScript = 'CREATE TABLE EMP (OID INT PRIMARY KEY, NAME VARCHAR (100), DEPTOID INT (10));\r\n'
            expectedScript += 'CREATE TABLE DEPT (OID INT PRIMARY KEY, NAME VARCHAR (100));\r\n'
            expectedScript += 'CREATE TABLE PET (OID INT PRIMARY KEY, NAME VARCHAR (100));\r\n'
            expectedScript += 'CREATE TABLE PERSON (OID INT (10) PRIMARY KEY, NAME VARCHAR (100), PETOID INT (10));\r\n'
            expectedScript += 'CREATE TABLE SHAPE (OID INT (10) PRIMARY KEY, NAME VARCHAR (100), SHAPETYPE INT (1), NOOFVERTICES INT (2), TESTATTR VARCHAR (2));\r\n'
            expectedScript += 'CREATE TABLE SHAPE (OID INT (10) PRIMARY KEY, NAME VARCHAR (100), SHAPETYPE INT (1), NOOFVERTICES INT (2), TESTATTR VARCHAR (2));\r\n'
            expectedScript += 'CREATE TABLE SHAPE (OID INT (10) PRIMARY KEY, NAME VARCHAR (100), SHAPETYPE INT (1), NOOFVERTICES INT (2), TESTATTR VARCHAR (2));\r\n'
            expectedScript += 'CREATE TABLE SHAPE (OID INT (10) PRIMARY KEY, NAME VARCHAR (100), SHAPETYPE INT (1), NOOFVERTICES INT (2), TESTATTR VARCHAR (2));\r\n'
            expectedScript += 'CREATE TABLE PRODUCT (OID INT PRIMARY KEY, NAME VARCHAR (50), QUANTITY DECIMAL (11, 2) NOT NULL);\r\n'
            expectedScript += 'CREATE TABLE BOOK (OID INT PRIMARY KEY, NAME VARCHAR (100), NUMBEROFPAGES INT (4));\r\n'
            expectedScript += 'CREATE TABLE ORDER (OID INT PRIMARY KEY, ORDERDATE DATE);\r\n'
            expectedScript += 'CREATE TABLE NONEXISTENT (OID INT PRIMARY KEY);'

            script = session.createSQLScriptForAllModels()
            self.assertEqual(script, expectedScript)

            session.createDBTablesForAllModels(function(err, result) {
                self.assertNullOrUndefined(err)
            })
            session.createDBTableForModel('Pet', function(err, result) {
                self.assertNullOrUndefined(err)
            })
            session.createDBColumnForAttribute('Pet', 'name', function(err, result) {
                self.assertNullOrUndefined(err)
            })

            var promise

            promise = session.existsDBTable('FOOBAR')
            promise
            .then(function(result){self.assertEqual(0, result.rows.length)}, function(promiseErr){throw new Error('Not expected to reach here.')})

            session.connection.isDDLSqlPromiseTest = true
            promise = session.createDBTablesForAllModels()
            promise
            .then(function(result){return session.createDBTableForModel('Pet')}, function(promiseErr){self.assertNullOrUndefined(promiseErr)})
            .then(function(result){return session.createDBColumnForAttribute('Pet', 'oid')}, function(promiseErr){self.assertNullOrUndefined(promiseErr)})
            .then(function(result){return session.createDBColumnForAttribute('Pet', 'name')}, function(promiseErr){self.assertNullOrUndefined(promiseErr)})
            .then(function(result){throw new Error('Not expected to reach here.')}, function(promiseErr){self.assertEqual(promiseErr.message, 'SQL execution failed.')})

            promise = session.existsDBTableColumn('FOOBAR', 'XYZ')
            promise
            .then(function(result){throw new Error('Not expected to reach here.')}, function(promiseErr){self.assertEqual(promiseErr.message, 'SQL execution failed.')})

            promise = session.existsDBTable('FOOBAR')
            promise
            .then(function(result){throw new Error('Not expected to reach here.')}, function(promiseErr){self.assertEqual(promiseErr.message, 'SQL execution failed.'); onTestPerformed()})
        })
    }
}

module.exports = ApatiteSQLScriptCreatorTestCase