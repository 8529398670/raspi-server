const express = require( "express" );
const fs = require( "fs" );
const path = require( "path" );
const bodyParser = require( "body-parser" );
const cors = require( "cors" );
const PORT = require( "../../main.js" ).port;
const events = require( "../../main.js" ).events;

//const requestIp = require( "request-ip" );

let app = express();
app.use( express.static( path.join( __dirname , "client" ) ) );
app.use( cors( { origin: "http://localhost:" + PORT.toString() } ) );
// https://stackoverflow.com/questions/31967138/node-js-express-js-bodyparser-post-limit
app.use( bodyParser.json() );
//app.use( requestIp.mw() );
app.use( bodyParser.urlencoded( { extended: true } ) );

const GenericUtils = require( "../../utils/generic.js" );

const HTMLPath = path.join( __dirname , "../../client/views" , "index.html" );

app.get( "/" , function( req , res ) {
	res.sendFile( HTMLPath );
});

app.get( "/restart" , function( req , res ) {
	GenericUtils.restartPYProcess();
	const cur_state = GenericUtils.getState();
	res.json( { "state" : cur_state.state } );
});

app.get( "/turnon" , function( req , res ) {
	const cur_state = GenericUtils.getState();
	if ( cur_state.state ) {
		console.log( "restarting" );
		GenericUtils.restartPYProcess();
	}
	else {
		console.log( "starting" );
		GenericUtils.startPYProcess();
	}
	res.json( { "state" : cur_state.state } );
});

app.get( "/turnoff" , function( req , res ) {
	GenericUtils.killAllPYProcess();
	const cur_state = GenericUtils.getState();
	res.json( { "state" : cur_state.state } );
});

app.post( "/python-script" , ( req , res ) => {
	//events.emit( "log" , { message: `EXPRESS === POST /python-script` } );
	if ( !req.body ) { res.json( { result: false } ); }
	events.emit( "python-script-controller" , req.body );
	res.json( { result: true } );
});

const HTML_Live_Path = path.join( __dirname , "../../client/views/" , "live.html" );
app.get( "/live" , function( req , res ) {
	res.sendFile( HTML_Live_Path );
});

const FramePATH = path.join( __dirname , "../../client" , "frame.jpeg" );
app.get( "/live_image" , async function( req , res , next ) {
	fs.readFile( FramePATH , function( err , data ) {
		if ( err ) { res.json( { "error" : err } ); }
		else {
			res.writeHead( 200 , {'Content-Type': 'image/jpeg'} );
			res.write( data );
			res.end();
		}
	});
});

module.exports = app;