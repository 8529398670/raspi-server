require( "shelljs/global" );
const fs = require( "fs" );
const path = require( "path" );
const still_path = path.join( __dirname , ".." , "client" , "frame.jpeg" );
const thresh_path = path.join( __dirname , ".." , "client" , "frameThresh.jpeg" );
const delta_path = path.join( __dirname , ".." , "client" , "frameDelta.jpeg" );
const Eris = require( "eris" );

const GenericUtils = require( "../utils/generic.js" );

// Fuck Discord Convert to Unilink 1

class DiscordWrapper {
	constructor( personal ) {
		this.personal = personal;
		this.bot = false;
	}
	connect() {
		return new Promise( function( resolve , reject ) {
			try {
				this.bot = new Eris.CommandClient( discordCreds.token , {} , {
					description: "333",
					owner: discordCreds.bot_id ,
					prefix: "!"
				});
				const stillCommand = this.bot.registerCommand( "still" , ( msg , args ) => {
					if( args.length === 0 ) {
						POST_STILL();
					}
					return;
				}, {
					description: "Posts Still",
					fullDescription: "Posts Still",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.registerCommandAlias( "s" , "still" );
				this.bot.registerCommandAlias( "f" , "still" );
				this.bot.registerCommandAlias( "frame" , "still" );

				const threshCommand = this.bot.registerCommand( "thresh" , ( msg , args ) => {
					if( args.length === 0 ) {
						POST_THRESH();
					}
					return;
				}, {
					description: "Posts Latest Event Threshold",
					fullDescription: "Posts Latest Event Threshold",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.registerCommandAlias( "t" , "thresh" );

				const deltaCommand = this.bot.registerCommand( "delta" , ( msg , args ) => {
					if( args.length === 0 ) {
						POST_DELTA();
					}
					return;
				}, {
					description: "Posts Latest Event Delta",
					fullDescription: "Posts Latest Event Delta",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.registerCommandAlias( "d" , "delta" );


				const smsCommand = this.bot.registerCommand( "sms" , ( msg , args ) => {
					if( args.length === 0 ) {
						GenericUtil.os_command( "/usr/local/bin/sendMotionSMS" );
					}
					return;
				}, {
					description: "Sends Extra Motion SMS",
					fullDescription: "Sends Extra Motion SMS",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.registerCommandAlias( "notify" , "sms" );
				this.bot.registerCommandAlias( "alert" , "sms" );

				const callCommand = this.bot.registerCommand( "call" , ( msg , args ) => {
					if( args.length === 0 ) {
						GenericUtil.os_command( "/usr/local/bin/callDad" );
						return;
					}
					if ( args[ 0 ] === "house" ) {
						GenericUtil.os_command( "/usr/local/bin/callHouse" );
						return;
					}

					if ( args[ 0 ] === "mom" ) {
						GenericUtil.os_command( "/usr/local/bin/callMom" );
						return;
					}
					if ( args[ 0 ] === "me" || args[ 0 ] === "test" ) {
						GenericUtil.os_command( "/usr/local/bin/callMe" );
						return;
					}
					if ( args[ 0 ] === "dad" ) {
						GenericUtil.os_command( "/usr/local/bin/callDad" );
						return;
					}
				}, {
					description: "Makes Voice Call to Number",
					fullDescription: "Makes Voice Call to Number",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});

				const stopCommand = this.bot.registerCommand( "stop" , ( msg , args ) => {
					if( args.length === 0 ) {
						GenericUtils.killAllPYProcess();
						return;
					}
				}, {
					description: "Stops PY Process",
					fullDescription: "Stops PY Process",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});

				const restartCommand = this.bot.registerCommand( "restart" , ( msg , args ) => {
					if( args.length === 0 ) {
						GenericUtils.restartPYProcess();
						return;
					}
				}, {
					description: "Restarts PY Process",
					fullDescription: "Restarts PY Process",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.registerCommandAlias( "start" , "restart" );

				const getStateCommand = this.bot.registerCommand( "state" , ( msg , args ) => {
					if( args.length === 0 ) {
						const cur_state = require( "./utils/generic.js" ).getState();
						return "Py Process Active = " + cur_state.state;
					}
				}, {
					description: "Get PY Process State",
					fullDescription: "Get PY Process State",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});

				const fpyCommand = this.bot.registerCommand( "fpy" , ( msg , args ) => {
					if( args.length === 0 ) {
						const active_py_procs = require( "./utils/generic.js" ).childPIDLookup();
						return "Active PY PID's = " + active_py_procs.join( " , " );
					}
				}, {
					description: "Returns Running PY Processes",
					fullDescription: "Returns Running PY Processes",
					usage: "<text>" ,
					reactionButtonTimeout: 0
				});
				this.bot.on( "ready", () => { // When the bot is ready
					console.log("Eris Bot Ready!"); // Log "Ready!"
					resolve();
					return;
				});
				this.bot.connect();
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postError() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postEvent() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postReecord() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postStill() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postThresh() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
	postDelta() {
		return new Promise( function( resolve , reject ) {
			try {
				resolve();
				return;
			}
			catch( error ) { console.log( error ); reject( error ); return; }
		}.bind( this ) );
	}
};
module.exports = DiscordWrapper;