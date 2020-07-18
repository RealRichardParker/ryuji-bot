const assert = require('assert');
const db = require('../database.js');
const { Client } = require('pg');

describe('DBClient', () => {
    let client = new Client({
        user: 'ryuji',
        password: 'for_real_ryuji!',
        host: 'localhost',
        port: '5432',
        database: 'testdb'
    });
    let func = async () => await client.connect();
    func();
    describe('setup', ()=> {
        afterEach( async ()=> {
            await client.query("DROP owned by ryuji");
            let res = await client.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				ORDER BY table_name;
                `);
            assert.equal(0, res.rowCount);
        });
        it('should setup three tables on empty db', async () => {
            let DBClient = new db.dbClient();
            await DBClient.setup_db();
            let res = await client.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				ORDER BY table_name;
                `);
            assert.equal(3, res.rowCount);
            let table_strings = Object.values(db.table_names);
            res.rows.forEach(item => assert(table_strings.includes(item.table_name)));

            table_strings.forEach(async name => {
                let res = await client.query(`
                    SELECT COLUMN_NAME
                    FROM information_schema.COLUMNS
                    WHERE TABLE_NAME='${name}'
                `)
            });
        });
        it('should setup the stream_time, streamed_games tables', async () => {
            await client.query(`
                CREATE TABLE stream_sessions(
                    discord_id VARCHAR (16) PRIMARY KEY,
                    timestamp TIMESTAMP NOT NULL
                )
            `);
            let res = await client.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				ORDER BY table_name;
                `);
            assert.equal(1, res.rowCount);
            let table_strings = Object.values(db.table_names).filter(name => name === 'stream_sessions');
            res.rows.forEach(item => assert(table_strings.includes(item.table_name)));
            let DBClient = new db.dbClient();
            await DBClient.setup_db();
            res = await client.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				ORDER BY table_name;
                `);
            assert.equal(3, res.rowCount);
            table_strings = Object.values(db.table_names);
            res.rows.forEach(item => assert(table_strings.includes(item.table_name)));

            table_strings.forEach(async name => {
                let res = await client.query(`
                    SELECT COLUMN_NAME
                    FROM information_schema.COLUMNS
                    WHERE TABLE_NAME='${name}'
                `)
            });
        });
    });
    describe('addGame', () => {
        beforeEach(async () => {
            let DBClient = new db.dbClient();
        });
        it('should add a game', () => {
            
        });
    });
});
