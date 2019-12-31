import os , sys , time , json
from twilio.rest import Client

personal_file_path = os.path.abspath( os.path.join( os.path.expanduser( "~" ) , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" ) )
print( personal_file_path )
with open( personal_file_path , 'r' ) as f:
	Personal = json.load( f )
print( Personal )

TwilioClient = Client( Personal[ 'twilio' ][ 'twilio_sid' ] , Personal[ 'twilio' ][ 'twilio_auth_token' ] )

def call( number ):
	number = number or sys.argv[ 1 ]
	print( number )
	#new_call = TwilioClient.calls.create( url=Personal.twilio.twilio_response_server_url , to=number , from_=Personal.twilio.fromSMSNumber , method="POST" )

def message( number , message_string ):
	try:
		number = number or sys.argv[ 1 ]
		message_string = message_string or sys.argv[ 2 ]
		print( number , message_string )
		# message = TwilioClient.messages.create( number ,
		# 	body=message_string ,
		# 	from_=Personal.twilio.fromSMSNumber ,
		# )
	except Exception as e:
		print ( e )
		print ( "failed to send extra sms" )
		broadcast_error( "failed to send extra sms" )

if ( len( sys.argv ) < 3 ):
	sys.exit( 0 )

if ( sys.argv[ 1 ] == "call" ):
	call( sys.argv[ 2 ] )
elif ( sys.argv[ 1 ] == "message" ):
	message( sys.argv[ 2 ] , sys.argv[ 3 ] )