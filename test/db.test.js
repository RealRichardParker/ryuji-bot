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
                Object.entries(db.table_names).forEach(async name => {
                    await client.query(`DROP TABLE IF EXISTS ${name}`);
                });
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
                    ${db.column_names.id} VARCHAR (16) PRIMARY KEY,
                    timestamp TIMESTAMP NOT NULL,
                    game_name VARCHAR (255)
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

describe('dateDiff', () => {
    it('should return 1 hour 56 min', () => {
        let start = new Date('May 15, 2004 04:04:00');
        let end = new Date('May 15, 2004 06:00:00');
        let sol = "0 01:56:00";
        assert.equal(sol, db.dateDiff(start, end));
    });

    it('should raise an error', () => {
        let start = new Date('May 15, 2004 04:04:00');
        let end = new Date('May 15, 2004 06:00:00');
        try {
            (db.dateDiff(end, start)) 
            assert(1 == 2, "Failed to throw an error!");
        } catch (err) {
        }
    });

    it('should return 2 days 5 hours 36 minutes 43 seconds', () => {
        let start = new Date('May 15, 2004 15:32:12');
        let end = new Date('May 17, 2004 21:8:55');
        let sol = "2 05:36:43";
        assert.equal(sol, db.dateDiff(start, end));
    });

});
