import websocket
import json

try:
    import thread
except ImportError:
    import _thread as thread
import time

from datetime import datetime , timedelta
import time
from time import localtime, strftime , sleep
from pytz import timezone
eastern_tz = timezone( "US/Eastern" )


# ws = websocket.WebSocket()
# ws.connect( "ws://127.0.0.1:10080" ) # websocket server
# ws.send( json.dumps( { "type": "get_frames" , "count": 1 , "list_key": "sleep.images.frames.2019.10.25" } ) )

def on_open(ws):
	print( "websocket connected" )
	ws.send( json.dumps( { "type": "get_frames" , "count": 1 , "list_key": "sleep.images.frames.2019.10.25" } ) )


def on_message(ws, message):
	print(message)

def on_error(ws, error):
	print(error)

def on_close(ws):
	print("### closed ###")

ws = websocket.WebSocketApp( "ws://127.0.0.1:10080" , on_message = on_message , on_error = on_error , on_close = on_close )
ws.on_open = on_open
ws.run_forever()

# from websocket import create_connection
# ws = create_connection( "ws://127.0.0.1:10080" )
# ws.send( json.dumps( { "type": "get_frames" , "count": 1 , "list_key": "sleep.images.frames.2019.10.25" } ) )
# print("Sent")
# print("Receiving...")
# result =  ws.recv()
# print("Received '%s'" % result)
# ws.close()

#ws.send( json.dumps( { "type": "get_frames" , "count": 1 , "list_key": "sleep.errors.2019.10.13" } ) )
#ws.send( json.dumps( { "type": "get_frames" , "count": 1 , "list_key": "sleep.images.thresholds.2019.10.13" } ) )

# ws.connect( "ws://127.0.0.1:6161" ) # actual redis connection
# ws.send( json.dumps( { "type": "python-new-error" , "message": "this is a test error message" } ) )


#ws.send( json.dumps( { "type": "python-new-error" , "message": "this is a test error message" } ) )
# ws.send( json.dumps( { "type": "python-new-record" , "message": "MIN_MOTION_FRAMES >= 1" } ) )
# ws.send( json.dumps( { "type": "python-new-record" , "message": "MIN_MOTION_FRAMES >= 2" } ) )
# ws.send( json.dumps( { "type": "python-new-record" , "message": "MIN_MOTION_FRAMES >= 3" } ) )
# ws.send( json.dumps( { "type": "python-new-record" , "message": "MIN_MOTION_FRAMES >= 4" } ) )
# ws.send( json.dumps( { "type": "python-new-record" , "message": "MIN_MOTION_FRAMES >= 5" } ) )