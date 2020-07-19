const assert = require('assert');
const db = require('../database.js');
const { Client } = require('pg');

const test_id_1 = '1234567890'
const test_id_2 = '0987654321'

let PostgresInterval = function(days, hours, minutes) {
    if (hours) this.hours = hours;
    if (days) this.days = days;
    if (minutes) this.minutes = minutes;
}

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
    describe('setup', ()=> {
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
                    ${db.col_names.id} VARCHAR (16) PRIMARY KEY,
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
    describe('updateTime', () => {
        let DBClient
        beforeEach(async () => {
            DBClient = new db.dbClient();
            await DBClient.setup_db();
        });
        it('add a new entry', async () => {
            let start = new Date('May 15, 2004 04:04:00');
            let end = new Date('May 15, 2004 06:00:00');
            let result = await DBClient.updateTime(test_id_1, start, end);
            
            let query_string = `SELECT * FROM ${db.table_names.time_table}
                                WHERE ${db.col_names.id}=$1`
            let res = await client.query(query_string, [test_id_1]);
            
            assert.equal(1, res.rowCount);
            let interval = res.rows[0][db.col_names.time_streamed];
            
            assert.equal(56, interval.minutes);
            assert.equal(1, interval.hours);
        });
        it('update existing entry', async () => {
            let query_string = `INSERT INTO ${db.table_names.time_table}
                                VALUES ($1, $2)`;
            let start = new Date('May 15, 2004 04:04:00');
            let end = new Date('May 15, 2004 06:00:00');
            await client.query(query_string, [test_id_1, db.dateDiff(start, end)]);

            await DBClient.updateTime(test_id_1, start, end);

            query_string = `SELECT * FROM ${db.table_names.time_table}
                                WHERE ${db.col_names.id}=$1`
            let res = await client.query(query_string, [test_id_1]);
            
            assert.equal(1, res.rowCount);
            let interval = res.rows[0][db.col_names.time_streamed];

            assert.equal(52, interval.minutes);
            assert.equal(3, interval.hours);
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
