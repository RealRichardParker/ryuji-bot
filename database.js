const { Pool, Client } = require('pg');

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

            this.updateSession('some_id', new Date(), 'test_name');

            this.updateSession('some_id', new Date(), 'test_name');
        };

        // create new stream session if session_id doesn't exist, if session_id does, 
        // remove session from table and update total time played
        this.updateSession = async (discord_id, timestamp, game_name) => {
            try {
                let sql_text = `SELECT * FROM ${table_names.session_table} WHERE ${column_names.id}=$1`;
                let res = await this.pool.query(sql_text, [discord_id]);
                if (res.rowCount === 0) {
                    sql_text = `INSERT INTO ${table_names.session_table}
                                VALUES ($1, $2, $3)`;
                    this.pool.query(sql_text, [discord_id, timestamp, game_name]);
                } else {
                    console.log(res.rows);
                    let finish_time = res.rows[0][column_names.timestamp];
                    sql_text = `DELETE FROM ${table_names.session_table}
                                WHERE ${column_names.id}=$1`;
                    this.pool.query(sql_text, [discord_id]);
                }
            } catch (err) {
                console.log(err);
            }
        };

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
                        ${column_names.timestamp} TIMESTAMPTZ NOT NULL,
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
    }
}

