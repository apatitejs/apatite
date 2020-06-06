'use strict';

var Apatite = require('../../lib/apatite');
var ApatiteTestUtil = require('../apatite-test-util.js');
var ApatiteMssqlDialect = require('../../lib/database/mssql/apatite-mssql-dialect.js');
var ApatiteUtil = require('../../lib/util.js');
var ApatiteSQLStatement = require('../../lib/database-statement/apatite-sql-statement.js');

class ApatiteMssqlTestUtil extends ApatiteTestUtil {
    constructor() {
        super();
    }

    getCreateTableStatements() {
        return [
            new ApatiteSQLStatement(null, "IF EXISTS (SELECT * FROM SYSOBJECTS WHERE NAME='DEPT' AND XTYPE='U') DROP TABLE DEPT", []),
            new ApatiteSQLStatement(null, "IF EXISTS (SELECT * FROM SYSOBJECTS WHERE NAME='EMP' AND XTYPE='U') DROP TABLE EMP", []),
            new ApatiteSQLStatement(null, "CREATE TABLE DEPT(OID int NOT NULL IDENTITY(1,1) PRIMARY KEY, NAME varchar(50) NULL)", []),
            new ApatiteSQLStatement(null, "CREATE TABLE EMP(OID int IDENTITY(1,1) PRIMARY KEY NOT NULL, NAME varchar(50) NULL, DEPTOID int NOT NULL)", [])
        ];
    }

    getDropTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE DEPT', []),
            new ApatiteSQLStatement(null, 'DROP TABLE EMP', [])
        ];
    }

    getCreateTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, "IF EXISTS (SELECT * FROM SYSOBJECTS WHERE NAME='TEMPPOOL' AND XTYPE='U') DROP TABLE TEMPPOOL", []),
            new ApatiteSQLStatement(null, "CREATE TABLE TEMPPOOL(OID int IDENTITY(1,1) PRIMARY KEY NOT NULL)", [])
        ];
    }

    getDropTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE TEMPPOOL', [])
        ];
    }

    newApatite() {
        try {
            return Apatite.forMssql({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' });
        } catch (err) { //err when module is not installed
            return new Apatite(new ApatiteMssqlDialect({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' }));
        }
    }

    existsModule() {
        return ApatiteUtil.existsModule(ApatiteMssqlDialect.getModuleName());
    }
}

module.exports = ApatiteMssqlTestUtil;