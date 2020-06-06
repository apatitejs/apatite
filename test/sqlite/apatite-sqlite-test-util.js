'use strict';

var Apatite = require('../../lib/apatite');
var ApatiteTestUtil = require('../apatite-test-util.js');
var ApatiteSqliteDialect = require('../../lib/database/sqlite/apatite-sqlite-dialect.js');
var ApatiteUtil = require('../../lib/util.js');
var ApatiteSQLStatement = require('../../lib/database-statement/apatite-sql-statement.js');

class ApatiteSqliteTestUtil extends ApatiteTestUtil {
    constructor() {
        super();
    }

    getCreateTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS DEPT', []),
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS EMP', []),
            new ApatiteSQLStatement(null, "CREATE TABLE DEPT (OID INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT)", []),
            new ApatiteSQLStatement(null, "CREATE TABLE EMP (OID INTEGER PRIMARY KEY AUTOINCREMENT,NAME TEXT, DEPTOID INTEGER)", [])
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
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS TEMPPOOL', []),
            new ApatiteSQLStatement(null, 'CREATE TABLE TEMPPOOL (OID INTEGER PRIMARY KEY AUTOINCREMENT)', [])
        ];
    }

    getDropTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE TEMPPOOL', [])
        ];
    }

    newApatite() {
        var os = require('os');
        var path = require('path');
        var fileName = os.tmpdir() + path.sep + 'apatite.db';

        try {
            return Apatite.forSqlite({ connectionInfo: fileName });
        } catch (err) { //err when module is not installed
            return new Apatite(new ApatiteSqliteDialect({ connectionInfo: fileName }));
        }
    }

    existsModule() {
        return ApatiteUtil.existsModule(ApatiteSqliteDialect.getModuleName());
    }
}

module.exports = ApatiteSqliteTestUtil;