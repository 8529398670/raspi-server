const schedule = require( "node-schedule" );

let startTime = new schedule.RecurrenceRule();
startTime.dayOfWeek = [ new schedule.Range( 0 , 6 ) ];
// # testing
// startTime.hour = 22;
// startTime.minute = 30;
startTime.hour = 11;
startTime.minute = 30;
let stopTime = new schedule.RecurrenceRule();
stopTime.dayOfWeek = [ new schedule.Range( 0 , 6 ) ];
stopTime.hour = 9;
stopTime.minute = 0;

function load_schedules() {
	try {

		const events = require( "../main.js" ).events;

		const schedules = [];

		// Setup Scheduled Tasks
		let RESTART = false;
		const now = new Date();
		const hours = now.getHours();
		if( hours >= startTime.hour  ) { RESTART = true; }
		else if ( hours <= stopTime.hour ) {
			RESTART = true;
			if ( hours === stopTime.hour ) {
				if ( now.getMinutes() >= stopTime.minute ) {
					RESTART = false;
					//events.emit( "command_stop_pyprocess" );
				}
			}
		}
		if ( RESTART ) {
			console.log( "motion_simple.py needs launched , starting" );
			events.emit( "command_restart_pyprocess" );
		}

		const startEvent = schedule.scheduleJob( startTime , ()=> {
			events.emit( "scheduled_start" );
		});

		const stopEvent = schedule.scheduleJob( stopTime , ()=> {
			events.emit( "scheduled_stop" );
		});


		schedules.push( startEvent );
		schedules.push( stopEvent );

		return schedules;
	}
	catch( error ) { console.log( error ); return error; }
}
module.exports.load_schedules = load_schedules;