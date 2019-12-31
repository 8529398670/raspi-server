require( "shelljs/global" );
const path = require( "path" );
const ps = require( "ps-node" );
const spawn = require( "child_process" ).spawn;


function sleep( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }
module.exports.sleep = sleep;

function OS_COMMAND( wTask ) {
	return new Promise( ( resolve , reject )=> {
		try {
			let result = null;
			let x1 = exec( wTask , { silent: true , async: false } );
			if ( x1.stderr ) { result = x1.stderr }
			else { result = x1.stdout.trim() }
			resolve( result );
		}
		catch( error ) { console.log( error ); reject( error ); }
	});
}
module.exports.os_command = OS_COMMAND;


let arg1 = 1    // = Minimum Seconds of Continuous Motion
let arg2 = 4    // = Total Motion Events Acceptable Before Alert
let arg3 = 45   // = Minimum Time of Motion Before Alert
let arg4 = 90   // = Cooloff Period Duration
//const lCode1 = path.join( __dirname , "../py_scripts" , "motion_simple_rewrite.py" );
const lCode1 = path.join( __dirname , "../py_scripts" , "motion_simple_rewrite_fixed.py" );
console.log( lCode1 );
let wState = false;
let wChild = null;
let wFFMPEG_Child = null;
let wPIDResultSet = [];

const MonthNames = [ "JAN" , "FEB" , "MAR" , "APR" , "MAY" , "JUN" , "JUL" , "AUG" , "SEP" , "OCT" , "NOV" , "DEC" ];
function GET_NOW_TIME() {
	const today = new Date();
	let day = today.getDate();
	if ( parseInt( day ) < 10 ) { day = "0" + day; }
	const month = MonthNames[ today.getMonth() ];
	const year = today.getFullYear();
	let hours = today.getHours();
	if ( parseInt( hours ) < 10 ) { hours = "0" + hours; }
	let minutes = today.getMinutes();
	if ( parseInt( minutes ) < 10 ) { minutes = "0" + minutes; }
	let seconds = today.getSeconds();
	if ( parseInt( seconds ) < 10 ) { seconds = "0" + seconds; }
	let milliseconds = today.getMilliseconds();
	const mi = parseInt( milliseconds );
	if ( mi < 10 ) { milliseconds = "00" + milliseconds; }
	else if ( mi < 100 ) { milliseconds = "0" + milliseconds; }
	//return day + month + year + " @ " + hours + ":" + minutes + ":" + seconds + "." + milliseconds
	return day + month + year + " @ " + hours + ":" + minutes + ":" + seconds;
}
module.exports.time = GET_NOW_TIME;

function GET_EASTERN_TIME_KEY_SUFFIX() {
	const now = new Date( new Date().toLocaleString( "en-US" , { timeZone: "America/New_York" } ) );
	const now_hours = now.getHours();
	const now_minutes = now.getMinutes();
	const dd = String( now.getDate() ).padStart( 2 , '0' );
	const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
	const yyyy = now.getFullYear();
	const hours = String( now.getHours() ).padStart( 2 , '0' );
	const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
	const seconds = String( now.getSeconds() ).padStart( 2 , '0' );
	const key_suffix = `${ yyyy }.${ mm }.${ dd }`;
	return key_suffix;
}
module.exports.get_eastern_time_key_suffix = GET_EASTERN_TIME_KEY_SUFFIX;

function GET_TIME_KEY_SUFFIX( timezone="America/New_York" ) {
	const now = new Date( new Date().toLocaleString( "en-US" , { timeZone: tiimezone } ) );
	const now_hours = now.getHours();
	const now_minutes = now.getMinutes();
	const dd = String( now.getDate() ).padStart( 2 , '0' );
	const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
	const yyyy = now.getFullYear();
	const hours = String( now.getHours() ).padStart( 2 , '0' );
	const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
	const seconds = String( now.getSeconds() ).padStart( 2 , '0' );
	const key_suffix = `${ yyyy }.${ mm }.${ dd }`;
	return key_suffix;
}
module.exports.get_time_key_suffix = GET_EASTERN_TIME_KEY_SUFFIX;

function SET_ARGS( wArg1 , wArg2 , wArg3 , wArg4 ) {
	arg1 = wArg1 || arg1;
	arg2 = wArg2 || arg2;
	arg3 = wArg3 || arg3;
	arg4 = wArg4 || arg4;
}
module.exports.setArgs = SET_ARGS;

function GET_STATE() {
	return { state: wState , arg1: arg1 , arg2: arg2 , arg3: arg3 , arg4: arg4 };
}
module.exports.getState = GET_STATE;

function CHILD_PID_LOOKUP() {
	wPIDResultSet = [];
	return ps.lookup( { command: "python" } ,
		function( err , resultList ) {
			if ( err ) { throw new Error( err ); }
			resultList.forEach( ( process )=> {
				if ( process ) {
					if ( process.arguments ) {
						if ( process.arguments.length > 0 ) {
							process.arguments.forEach( ( item )=> {
								if ( item === lCode1 ) {
									wPIDResultSet.push( process.pid );
									console.log( "python PID = " + process.pid.toString() );
								}
							});
						}
					}
				}
			});
			return wPIDResultSet;
		}
	);
	//return wPIDResultSet;
};
module.exports.childPIDLookup = CHILD_PID_LOOKUP;

// https://pypi.python.org/pypi/python-crontab/
// https://stackoverflow.com/questions/12871740/how-to-detach-a-spawned-child-process-in-a-node-js-script
// https://stackoverflow.com/questions/696839/how-do-i-write-a-bash-script-to-restart-a-process-if-it-dies
function START_PY_PROCESS() {
	const events = require( "../main.js" ).events;
	wChild = null;
	wChild = spawn( "python" , [ lCode1 , arg1 , arg2 , arg3 , arg4 ] , { detached: true, stdio: [ 'ignore' , 'ignore' , 'ignore' ] } );
	console.log( "launched pyscript" );
	CHILD_PID_LOOKUP();

	wState = true;
	wChild.on( "error" , ( error )=> {
		events.emit( "python-new-error" , { message: "Error === " + error.toString() } );
		console.log( error );
	});
	wChild.on( "exit" , ( code )=> {
		events.emit( "python-new-error" , { message: "Exit Code === " + code.toString() } );
		console.log( code );
	});
	setTimeout( ()=> {
		wChild.unref();
	} , 3000 );
}
module.exports.startPYProcess = START_PY_PROCESS;

function KILL_ALL_PY_PROCESS() {
	exec( "sudo pkill -9 python" , { silent: true ,  async: false } );
	wPIDResultSet.forEach( ( item , index )=> {
		try {
			ps.kill( item , ( err )=> {
				if (err) { console.log( err ); }
				else {
					wState = false;
					console.log( "killed PID: " + item.toString() );
					wPIDResultSet.splice( index , 1 );
				}
			});
		}
		catch(err){
			exec( "sudo pkill -9 python" , { silent: true ,  async: false } );
			events.emit( "python-new-error" , { message: "Either No Python Processes were Found or something Went Wrong Trying to end Python Processes , using sudo pkill -9 now" } );
		}
	});
}
module.exports.stopPYProcess = KILL_ALL_PY_PROCESS;

function RESTART_PY_PROCESS() {
	console.log("restarting")
	KILL_ALL_PY_PROCESS();
	wState = false;
	setTimeout( ()=> {
		START_PY_PROCESS();
	}, 3000 );
}
module.exports.restartPYProcess = RESTART_PY_PROCESS;

function GRACEFUL_EXIT() {
	console.log("restarting")
	KILL_ALL_PY_PROCESS();
	wState = false;
	setTimeout(function(){
		START_PY_PROCESS();
	}, 5000 );
}
module.exports.gracefulExit = GRACEFUL_EXIT;


const twilio_helper_path = path.join( __dirname , "../py_scripts" , "twilio_helper.py" );
function MAKE_TWILIO_PYTHON_CALL( options ) {
	const events = require( "../main.js" ).events;
	let twilio_child = null;
	twilio_child = spawn( "python" , [ twilio_helper_path , options.command , options.number , options.message ] , { detached: true, stdio: [ 'ignore' , 'ignore' , 'ignore' ] } );
	console.log( "launched twilio pyscript" );
	twilio_child.on( "error" , ( error )=> {
		events.emit( "python-new-error" , { message: "Twilio via Python === Error === " + error.toString() } );
		console.log( error );
	});
	twilio_child.on( "exit" , ( code )=> {
		if ( code === 0 ) {
			events.emit( "message_generic" , { message: `Twilio ${ options.command } to ${ options.number } via Python Succeded }` } );
		}
		else {
			console.log( code );
			events.emit( "python-new-error" , { message: `Twilio ${ options.command } to ${ options.number } via Python } === Exit Code === ${ code.toString() }` } );
		}
	});
	setTimeout( ()=> {
		twilio_child.unref();
	} , 3000 );
}
module.exports.makeTwilioPythonCall = MAKE_TWILIO_PYTHON_CALL;

