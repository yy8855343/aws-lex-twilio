# amazon-lex-twilio-integration
An AWS Lambda function that integrates Twilio Programmable SMS with Amazon Lex.

For detailed implementation instructions, please read this blogpost: 
first
https://aws.amazon.com/blogs/ai/integrate-your-amazon-lex-bot-with-any-messaging-service/
second (but)
https://www.twilio.com/blog/2015/09/build-your-own-ivr-with-aws-lambda-amazon-api-gateway-and-twilio.html


http://entrepreneursunited.io/app/OpenVBX/vbx/devices

Gramma
aws polly synthesize-speech ^
    --region us-east-1 ^
    --endpoint endpoint ^
    --output-format pcm ^
    --text "i would like to order flowers" ^
    --voice-id "Kendra" ^
    IntentSpeech.mpg

aws polly synthesize-speech ^
    --region us-east-1 ^
    --output-format pcm ^
    --text "Hi" ^
    --voice-id "Kendra" ^
    IntentSpeech.mpg

aws lex-runtime post-content ^
    --region us-east-1 ^
    --bot-name Bookappointment ^
    --bot-alias "blue" ^
    --user-id wyumpkwy84e5ka8r79hymiqsyk5l2cqj ^
    --content-type "audio/l16; rate=16000; channels=1" ^
    --input-stream hi.wav ^
    IntentOutputSpeech.mpg

aws lex-runtime post-content ^
    --region us-east-1 ^
    --bot-name Bookappointment ^
    --bot-alias "blue" ^
    --user-id wyumpkwy84e5ka8r79hymiqsyk5l2cqj ^
    --content-type "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false" ^
    --input-stream hi.wav ^
    IntentOutputSpeech.mpg


aws lex-runtime post-content ^
    --region us-east-1 ^
    --bot-name Bookappointment ^
    --bot-alias "blue" ^
    --user-id wyumpkwy84e5ka8r79hymiqsyk5l2cqj ^
    --content-type "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false" ^
    --input-stream tom1.wav ^
    IntentOutputSpeech.mpg
