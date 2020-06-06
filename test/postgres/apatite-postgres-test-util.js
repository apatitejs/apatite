'use strict';

var Apatite = require('../../lib/apatite');
var ApatiteTestUtil = require('../apatite-test-util.js');
var ApatitePostgresDialect = require('../../lib/database/postgres/apatite-postgres-dialect.js');
var ApatiteUtil = require('../../lib/util.js');
var ApatiteSQLStatement = require('../../lib/database-statement/apatite-sql-statement.js');

class ApatitePostgresTestUtil extends ApatiteTestUtil {
    constructor() {
        super();
    }

    getCreateTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS public.dept', []),
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS public.emp', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE IF EXISTS public.dept_oid_seq', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE IF EXISTS public.emp_oid_seq', []),
            new ApatiteSQLStatement(null, 'CREATE SEQUENCE public.dept_oid_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1', []),
            new ApatiteSQLStatement(null, 'ALTER TABLE public.dept_oid_seq OWNER TO apatite', []),
            new ApatiteSQLStatement(null, 'CREATE SEQUENCE public.emp_oid_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1', []),
            new ApatiteSQLStatement(null, 'ALTER TABLE public.emp_oid_seq OWNER TO apatite', []),
            new ApatiteSQLStatement(null, "CREATE TABLE public.dept(oid integer NOT NULL DEFAULT nextval('dept_oid_seq'::regclass), name character varying(50), CONSTRAINT pk_dept PRIMARY KEY (oid)) WITH (OIDS=FALSE)", []),
            new ApatiteSQLStatement(null, 'ALTER TABLE public.dept OWNER TO apatite', []),
            new ApatiteSQLStatement(null, "CREATE TABLE public.emp(oid integer NOT NULL DEFAULT nextval('emp_oid_seq'::regclass), name character varying(100), deptoid integer, CONSTRAINT pk_emp PRIMARY KEY (oid)) WITH (OIDS=FALSE)", []),
            new ApatiteSQLStatement(null, 'ALTER TABLE public.emp OWNER TO apatite', [])
        ];
    }

    getDropTableStatements() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE public.dept', []),
            new ApatiteSQLStatement(null, 'DROP TABLE public.emp', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE public.dept_oid_seq', []),
            new ApatiteSQLStatement(null, 'DROP SEQUENCE public.emp_oid_seq', [])
        ];
    }

    getCreateTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE IF EXISTS public.temppool', []),
            new ApatiteSQLStatement(null, 'CREATE TABLE public.temppool(oid integer) WITH (OIDS=FALSE)', [])
        ];
    }

    getDropTableStatementsForPool() {
        return [
            new ApatiteSQLStatement(null, 'DROP TABLE public.temppool', [])
        ];
    }

    newApatite() {
        try {
            return Apatite.forPostgres({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' });
        } catch (err) { //err when module is not installed
            return new Apatite(new ApatitePostgresDialect({ userName: 'apatite', password: 'Nodejs20090527!', connectionInfo: 'localhost/apatite' }));
        }
    }

    existsModule() {
        return ApatiteUtil.existsModule(ApatitePostgresDialect.getModuleName());
    }
}

module.exports = ApatitePostgresTestUtil;