'use strict';

var Apatite = require('../../lib/apatite');
var ApatiteTestUtil = require('../apatite-test-util.js');
var ApatiteOracleDialect = require('../../lib/database/oracle/apatite-oracle-dialect.js');
var ApatiteUtil = require('../../lib/util.js');
var ApatiteSQLStatement = require('../../lib/database-statement/apatite-sql-statement.js');

class ApatiteOracleTestUtil extends ApatiteTestUtil {
    constructor() {
        super();
    }

    getCreateTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'CREATE TABLE DEPT (OID NUMBER (10), NAME VARCHAR2(50))', []),
            new ApatiteSQLStatement(null, 'ALTER TABLE DEPT ADD (CONSTRAINT PK_DEPT PRIMARY KEY (OID))', []),
            new ApatiteSQLStatement(null, 'CREATE TABLE EMP (OID NUMBER (10), NAME VARCHAR2(100), DEPTOID NUMBER (10))', []),
            new ApatiteSQLStatement(null, 'ALTER TABLE EMP ADD (CONSTRAINT PK_EMP PRIMARY KEY (OID))', []),
            new ApatiteSQLStatement(null, 'CREATE SEQUENCE DEPT_OID_SEQ MINVALUE 1 START WITH 1 INCREMENT BY 1 CACHE 20', []),
            new ApatiteSQLStatement(null, 'CREATE SEQUENCE EMP_OID_SEQ MINVALUE 1 START WITH 1 INCREMENT BY 1 CACHE 20', []),
            new ApatiteSQLStatement(null, 'CREATE OR REPLACE TRIGGER DEPT_OID_TR BEFORE INSERT ON DEPT FOR EACH ROW BEGIN SELECT DEPT_OID_SEQ.NEXTVAL INTO :new.OID FROM dual; END;', []),
            new ApatiteSQLStatement(null, 'CREATE OR REPLACE TRIGGER EMP_OID_TR BEFORE INSERT ON EMP FOR EACH ROW BEGIN SELECT EMP_OID_SEQ.NEXTVAL INTO :new.OID FROM dual; END;', [])
        ];
    }

    getDropTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TRIGGER DEPT_OID_TR', []),
            new ApatiteSQLStatement(null, 'DROP TRIGGER EMP_OID_TR', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE DEPT_OID_SEQ', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE EMP_OID_SEQ', []),
            new ApatiteSQLStatement(null, 'DROP TABLE DEPT CASCADE CONSTRAINTS', []),
            new ApatiteSQLStatement(null, 'DROP TABLE EMP CASCADE CONSTRAINTS', [])
        ];
    }

    getCreateTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'CREATE TABLE TEMPPOOL (OID NUMBER (10))', [])
        ];
    }

    getDropTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE TEMPPOOL CASCADE CONSTRAINTS', [])
        ];
    }

    newApatite() {
        try {
            return Apatite.forOracle({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/xe' });
        } catch (err) { //err when module is not installed
            return new Apatite(new ApatiteOracleDialect({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/xe' }));
        }
    }

    existsModule() {
        return ApatiteUtil.existsModule(ApatiteOracleDialect.getModuleName());
    }
}

module.exports = ApatiteOracleTestUtil;