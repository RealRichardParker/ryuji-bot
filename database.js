const { Pool, Client } = require('pg');
const {format} = require('util');

let column_names = {
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
    column_names: column_names,
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

            console.log('created tables:', created_tables);
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
            try {
                let sql_text = `SELECT ${column_names.timestamp} 
                                FROM ${table_names.session_table} 
                                WHERE ${column_names.id}=$1`;
                let res = await this.pool.query(sql_text, [discord_id]);
                if (res.rowCount === 0) {
                    sql_text = `INSERT INTO ${table_names.session_table}
                                VALUES ($1, $2, $3)`;
                    this.pool.query(sql_text, [discord_id, timestamp, game_name]);
                } else {
                    console.log(res.rows);
                    let start_time = res.rows[0][column_names.timestamp];
                    let time_streamed = timestamp - start_time;
                    sql_text = `DELETE FROM ${table_names.session_table}
                                WHERE ${column_names.id}=$1`;
                    await this.pool.query(sql_text, [discord_id]);
                }
            } catch (err) {
                console.log(err);
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
        this.addGame = (discord_id, game_name, interval) => {
        };

        // Adds a game to the table for a user and the playtime
        this.updateGame = (discord_id, game_name, interval) => {
        };

        this.getUserGames = async (discord_id) => {
            let sql_text = `SELECT * FROM ${table_names.game_table}
                            WHERE ${column_names.id}=$1`;
            let res = await this.pool.query(sql_text, [discord_id]);
            return res.rows;
        };

        this.getStreamTime = async (discord_id) => {
            let sql_text = `SELECT * FROM ${table_names.time_table}
                            WHERE ${column_names}=$1`;
            let res = await this.pool.query(sql_text, [discord_id]);
        };

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
                        ${column_names.discord_id} VARCHAR (16) PRIMARY KEY,
                        ${column_names.timestamp} TIMESTAMP NOT NULL,
                        ${column_names.game_name} VARCHAR (255)
                    )
                `);
            } else if (table_name === table_names.time_table) {
                return await this.pool.query(`
                    CREATE TABLE ${table_name}(
                        ${column_names.discord_id} VARCHAR (16) PRIMARY KEY,
                        ${column_names.time_streamed} INTERVAL NOT NULL
                    )
                `)
            } else if (table_name === table_names.game_table) {
                return await this.pool.query(`
                    CREATE TABLE ${table_name}(
                        id serial PRIMARY KEY,
                        ${column_names.game_name} VARCHAR (255) NOT NULL,
                        ${column_names.time_streamed} INTERVAL NOT NULL,
                        ${column_names.discord_id} VARCHAR (16) NOT NULL
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

