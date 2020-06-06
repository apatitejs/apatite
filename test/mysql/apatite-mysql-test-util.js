'use strict';

var Apatite = require('../../lib/apatite');
var ApatiteTestUtil = require('../apatite-test-util.js');
var ApatiteMysqlDialect = require('../../lib/database/mysql/apatite-mysql-dialect.js');
var ApatiteUtil = require('../../lib/util.js');
var ApatiteSQLStatement = require('../../lib/database-statement/apatite-sql-statement.js');

class ApatiteMysqlTestUtil extends ApatiteTestUtil {
    constructor() {
        super();
    }

    getCreateTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS DEPT', []),
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS EMP', []),
            new ApatiteSQLStatement(null, "CREATE TABLE DEPT (OID INT NOT NULL AUTO_INCREMENT, NAME VARCHAR(50) NULL, PRIMARY KEY (OID), UNIQUE INDEX `oid_UNIQUE` (OID ASC))", []),
            new ApatiteSQLStatement(null, "CREATE TABLE EMP (OID INT NOT NULL AUTO_INCREMENT,NAME VARCHAR(100) NULL, DEPTOID INT NULL, PRIMARY KEY (OID), UNIQUE INDEX `oid_UNIQUE` (OID ASC))", [])
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
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS `apatite`.`temppool`', []),
            new ApatiteSQLStatement(null, 'CREATE TABLE `apatite`.`temppool` (`oid` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (`oid`), UNIQUE INDEX `oid_UNIQUE` (`oid` ASC))', [])
        ];
    }

    getDropTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE `apatite`.`temppool`', [])
        ];
    }

    newApatite() {
        try {
            return Apatite.forMysql({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' });
        } catch (err) { //err when module is not installed
            return new Apatite(new ApatiteMysqlDialect({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' }));
        }
    }

    existsModule() {
        return ApatiteUtil.existsModule(ApatiteMysqlDialect.getModuleName());
    }
}

module.exports = ApatiteMysqlTestUtil;