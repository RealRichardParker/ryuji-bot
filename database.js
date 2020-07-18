const { Pool, Client } = require('pg');

module.exports = {
    table_names: {
        session_table: "stream_sessions",
        time_table: "stream_time",
        game_table: "streamed_games"
    },
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
            for (key in module.exports.table_names) {
                let table_name = module.exports.table_names[key];
                if (!created_tables.includes(table_name)) {
                    let res = await createTable.call(this, table_name);
                }
            }
        };

        // create new stream session if session_id doesn't exist, if session_id does, 
        // remove session from table and update total time played
        this.updateSession = async (discord_id, timestamp) => {
            try {
                let res = await this.pool.query(`SELECT * FROM stream_sessions WHERE discord_id=${discord_id}`);
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
            let res = await this.pool.query(`SELECT * FROM streamed_games WHERE discord_id=${discord_id}`);
            return res.rows;
        };

        this.getStreamTime = async (discord_id) => {
            let res = await this.pool.query(`SELECT * FROM stream_time WHERE discord_id=${discord_id}`);
            return res.rows;
        };

        this.getAllStreamTime = async () => {
            let res = await this.pool.query("SELECT * FROM stream_time");
            return res.rows;
        };

        //creates the various tables for this application based on input table name
        let createTable = async function(table_name) {
            //console.log('creating table', table_name);
            if (table_name === module.exports.table_names.session_table) {
                return this.pool.query(`
                    CREATE TABLE stream_sessions(
                        discord_id VARCHAR (16) PRIMARY KEY,
                        timestamp TIMESTAMP NOT NULL
                    )
                `);
            } else if (table_name === module.exports.table_names.time_table) {
                return this.pool.query(`
                    CREATE TABLE stream_time(
                        discord_id VARCHAR (16) PRIMARY KEY,
                        time_streamed INTERVAL NOT NULL
                    )
                `)
            } else if (table_name === module.exports.table_names.game_table) {
                return this.pool.query(`
                    CREATE TABLE streamed_games(
                        id serial PRIMARY KEY,
                        game_name VARCHAR (255) NOT NULL,
                        time_streamed INTERVAL NOT NULL,
                        discord_id VARCHAR (16) NOT NULL
                    )
                `);
            } else {
                console.log('Unexpected table name recieved!');
                //crash? do something probably
            }
        }
    }
}

