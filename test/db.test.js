const assert = require('assert');
const db = require('../database.js');
const { Client } = require('pg');

const test_id_1 = '1234567890';
const test_id_2 = '0987654321';
const test_game_1 = 'Persona 5: Royale';
const test_game_2 = 'Dark Souls: Prepare to Die';
const start = new Date('May 15, 2004 04:04:00');
const end = new Date('May 15, 2004 06:00:00');


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
        let DBClient;
        beforeEach(async () => {
            DBClient = new db.dbClient();
            await DBClient.setup_db();
        });
        after(async () => {
            DBClient.cleanTables();
        });
        it('add a new entry', async () => {
            let interval = db.dateDiff(start, end);
            let result = await DBClient.updateTime(test_id_1, interval);
            
            let query_string = `SELECT * FROM ${db.table_names.time_table}
                                WHERE ${db.col_names.id}=$1`
            let res = await client.query(query_string, [test_id_1]);
            
            assert.equal(1, res.rowCount);
            let actual_interval = res.rows[0][db.col_names.time_streamed];
            
            assert.equal(56, actual_interval.minutes);
            assert.equal(1, actual_interval.hours);
        });
        it('update existing entry', async () => {
            let query_string = `INSERT INTO ${db.table_names.time_table}
                                VALUES ($1, $2)`;
            let interval = db.dateDiff(start, end);
            let result;
            await client.query(query_string, [test_id_1, interval]);

            await DBClient.updateTime(test_id_1, interval);

            query_string = `SELECT * FROM ${db.table_names.time_table}
                            WHERE ${db.col_names.id} = $1`;
            let res = await client.query(query_string, [test_id_1]);
            console.log('after update, see if selecct was succesful');
            
            assert.equal(1, res.rowCount);
            let actual_interval = res.rows[0][db.col_names.time_streamed];

            assert.equal(52, actual_interval.minutes);
            assert.equal(3, actual_interval.hours);
        });
    });
    describe('getStreamTime', () => {
        let DBClient;
        beforeEach(async () => {
            DBClient = new db.dbClient();
            await DBClient.setup_db();
        });
        it('throws an error when getting a nonexistent entry', () => {
            DBClient.getStreamTime(test_id_1).then( () => {
                assert(1 == 2, 'Did not throw error when should have!');
            }).catch(() => {
                //lmao what is good code
            });
        });
        it('gets an existing entry', async () => {
            let interval = db.dateDiff(start, end);
            await DBClient.updateTime(test_id_1, interval);
            
            let actual = await DBClient.getStreamTime(test_id_1);
            
            assert.equal(56, actual.minutes);
            assert.equal(1, actual.hours);
        });
    });
    describe('updateGame', () => {
        let DBClient;
        beforeEach(async () => {
            DBClient = new db.dbClient();
            await DBClient.setup_db();
        });
        it('add a new entry, then update it', async () => {
            let interval = db.dateDiff(start, end);
            await DBClient.updateGame(test_id_1, test_game_1, interval);
            
            let sql_text = `SELECT * 
                            FROM ${db.table_names.game_table}
                            WHERE ${db.col_names.id} = $1
                            AND ${db.col_names.game_name} = $2`;
            let res = await client.query(sql_text, [test_id_1, test_game_1]);
            assert.equal(1, res.rowCount);
            let res_obj = res.rows[0];

            assert.equal(test_id_1, res_obj.discord_id);
            assert.equal(test_game_1, res_obj.game_name);
            assert.equal(56, res_obj.time_streamed.minutes);
            assert.equal(1, res_obj.time_streamed.hours);

            await DBClient.updateGame(test_id_1,  test_game_1, interval);

            res = await client.query(sql_text, [test_id_1, test_game_1]);
            res_obj = res.rows[0];

            assert.equal(test_id_1, res_obj.discord_id);
            assert.equal(test_game_1, res_obj.game_name);
            assert.equal(52, res_obj.time_streamed.minutes);
            assert.equal(3, res_obj.time_streamed.hours);
            
        });
    });
    describe('getUserGames', () => {
        let DBClient;
        beforeEach(async () => {
            DBClient = new db.dbClient();
            await DBClient.setup_db();
        });
        it('should get game time', async () => {
            let interval = db.dateDiff(start, end);
            await DBClient.updateGame(test_id_1, test_game_1, interval);

            let res = await DBClient.getUserGames(test_id_1);

            assert.equal(test_id_1, res[0][db.col_names.id]);
            assert.equal(test_game_1, res[0][db.col_names.game_name]);
            let res_interval = res[0][db.col_names.time_streamed];
            assert.equal(1, res_interval.hours);
            assert.equal(56, res_interval.minutes);
        });
    });
});

describe('dateDiff', () => {
    it('should return 1 hour 56 min', () => {
        let sol = "0 01:56:00";
        assert.equal(sol, db.dateDiff(start, end));
    });

    it('should raise an error', () => {
        try {
            (db.dateDiff(end, start)) 
            assert(1 == 2, "Failed to throw an error!");
        } catch (err) {
        }
    });

    it('should return 2 days 5 hours 36 minutes 43 seconds', () => {
        let start_2 = new Date('May 15, 2004 15:32:12');
        let end_2 = new Date('May 17, 2004 21:8:55');
        let sol = "2 05:36:43";
        assert.equal(sol, db.dateDiff(start_2, end_2));
    });

});
