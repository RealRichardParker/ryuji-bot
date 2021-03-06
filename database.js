const { Pool, Client } = require('pg');
const {format} = require('util');

let col_names = {
    game_prim_key: "id",
    id: "discord_id",
    timestamp: "timestamp",
    game_name: "game_name",
    time_streamed: "time_streamed"
}

let table_names = {
    session_table: "stream_sessions",
    time_table: "stream_time",
    game_table: "streamed_games"
}

module.exports = {
    table_names: table_names,
    col_names: col_names,
    dbClient: function(database_url) {
        this.database_url = database_url;

        // check if tables already exist, if not, create tables
        this.setup_db = async () => {
            if (this.database_url) {
                this.pool = new Pool(database_url);
            } else {
                this.pool = new Pool();
            }
            let res = await this.pool.query(`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = 'public'
				ORDER BY table_name;
                `);
            let created_tables = res.rows.map(obj => obj.table_name);

            //console.log('created tables:', created_tables);
            for (key in table_names) {
                let table_name = table_names[key];
                if (!created_tables.includes(table_name)) {
                    let res = await createTable.call(this, table_name);
                }
            }
        };

        // create new stream session if session_id doesn't exist, if session_id does,
        // remove session from table and update total time played
        this.updateSession = async (discord_id, timestamp, game_name) => {
            let sql_text = `SELECT ${col_names.timestamp}
                            FROM ${table_names.session_table}
                            WHERE ${col_names.id}=$1`;
            let res = await this.pool.query(sql_text, [discord_id]);
            if (res.rowCount === 0) {
                sql_text = `INSERT INTO ${table_names.session_table}
                            VALUES ($1, $2, $3)`;
                await this.pool.query(sql_text, [discord_id, timestamp, game_name]);
            } else {
                //console.log(res.rows);
                let start_time = res.rows[0][col_names.timestamp];
                let delete_text = `DELETE FROM ${table_names.session_table}
                                   WHERE ${col_names.id}=$1`;
                await this.pool.query(delete_text, [discord_id]);
                let interval = module.exports.dateDiff(start_time, timestamp);
                await this.updateTime(discord_id, interval);
                await this.updateGame(discord_id,  game_name, interval);
            }
        };

        // Drops all tables owned by this bot
        this.cleanTables = async () => {
            try {
                Object.entries(table_names).forEach(async name => {
                    await this.pool.query(`DROP TABLE IF EXISTS ${name}`);
                });
            } catch (err) {
                throw err;
            }
            console.log('dropped all tables');
        }

        // Adds a game to the table for a user and the playtime
        this.updateGame = async (discord_id, game_name, interval) => {
            let select_text = `SELECT *
                               FROM ${table_names.game_table}
                               WHERE ${col_names.id}=$1 
                               AND ${col_names.game_name}=$2`;
            let select_res = await this.pool.query(select_text, [discord_id, game_name]);

            if (select_res.rowCount === 0) {
                // insert new item
                let insert_text = `INSERT INTO ${table_names.game_table}
                                   (${col_names.game_name}, ${col_names.time_streamed}, ${col_names.id})
                                   VALUES($1, $2, $3)`;
                return this.pool.query(insert_text, [game_name, interval, discord_id]);
                
            } else {
                let prim_key = select_res.rows[0].id;
                let update_text = `UPDATE ${table_names.game_table}
                                   SET ${col_names.time_streamed} = ${col_names.time_streamed}+$1
                                   WHERE ${col_names.game_prim_key} = $2`;
                return this.pool.query(update_text, [interval, prim_key]);
            }

            return this.pool.query(sql_text, [game_name, interval, discord_id]);
        };

        // updates the total time for a user
        this.updateTime = (discord_id, interval) => {
            let update_text = `INSERT INTO ${table_names.time_table}
                               VALUES ($1, $2)
                               ON CONFLICT (${col_names.id})
                               DO UPDATE
                               SET ${col_names.time_streamed} = EXCLUDED.${col_names.time_streamed} + $2`;
            return this.pool.query(update_text, [discord_id, interval]);
        }

        // list all games and their stream times for a user
        this.getUserGames = async (discord_id) => {
            let sql_text = `SELECT * FROM ${table_names.game_table}
                            WHERE ${col_names.id}=$1`;
            let res = await this.pool.query(sql_text, [discord_id]);
            return res.rows;
        };

        // Get total stream time for a user
        this.getStreamTime = async (discord_id) => {
            let sql_text = `SELECT * FROM ${table_names.time_table}
                            WHERE ${col_names.id}=$1`;
            try {
                let res = await this.pool.query(sql_text, [discord_id]);
                if( res.rowCount !== 0 ) {
                    return res.rows[0].time_streamed;
                } else {
                    console.log('got an error!');
                    throw new Error(`discord_id ${discord_id} does not exist in the db!`);
                }
            } catch (err) {
                //bad design but uhhhh
            }
        };

        // Get all the stream times for all users
        this.getAllStreamTime = async () => {
            let res = await this.pool.query(`SELECT * FROM ${table_names.stream_time}`);
            return res.rows;
        };

        //creates the various tables for this application based on input table name
        let createTable = async (table_name) => {
            //console.log('creating table', table_name);
            if (table_name === table_names.session_table) {
                return await this.pool.query(`
                    CREATE TABLE ${table_name}(
                        ${col_names.id} VARCHAR (16) PRIMARY KEY,
                        ${col_names.timestamp} TIMESTAMP NOT NULL,
                        ${col_names.game_name} VARCHAR (255)
                    )
                `);
            } else if (table_name === table_names.time_table) {
                return await this.pool.query(`
                    CREATE TABLE ${table_name}(
                        ${col_names.id} VARCHAR (16) PRIMARY KEY,
                        ${col_names.time_streamed} INTERVAL NOT NULL
                    )
                `)
            } else if (table_name === table_names.game_table) {
                return await this.pool.query(`
                    CREATE TABLE ${table_name}(
                        id SERIAL PRIMARY KEY,
                        ${col_names.game_name} VARCHAR (255) NOT NULL,
                        ${col_names.time_streamed} INTERVAL NOT NULL,
                        ${col_names.id} VARCHAR (16) NOT NULL
                    )
                `);
            } else {
                console.log('Unexpected table name recieved!');
                //crash? do something probably
            }
        }
    },

    // Converts the differences of two Date objects to the standard SQL INTERVAL
    // string, caps out at days
    dateDiff: (start_date, end_date) => {
        if (end_date < start_date) {
            throw new Error('Start date must be before end date!');
        }
        let date_diff = end_date - start_date;
        let seconds = Math.floor(date_diff / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        let days = Math.floor(hours / 24);
        hours = hours % 24;

        // why doesn't node.js have c string formatting >>:(
        hours = hours.toString().padStart(2, '0');
        minutes = minutes.toString().padStart(2, '0');
        seconds = seconds.toString().padStart(2, '0');

        return format('%d %s:%s:%s', days, hours, minutes, seconds);
    }
}

