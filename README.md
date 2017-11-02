# amazon-lex-twilio-integration
An AWS Lambda function that integrates Twilio Programmable SMS with Amazon Lex.

For detailed implementation instructions, please read this blogpost: 
first
https://aws.amazon.com/blogs/ai/integrate-your-amazon-lex-bot-with-any-messaging-service/
second (but)
https://www.twilio.com/blog/2015/09/build-your-own-ivr-with-aws-lambda-amazon-api-gateway-and-twilio.html


http://entrepreneursunited.io/app/OpenVBX/vbx/devices

aws-cli install

install python,<br>
C:\Python27\Scripts\pip.exe install awscli<br>
for detail<br>
https://github.com/aws/aws-cli

```json
Gramma(canot tested)
aws polly synthesize-speech ^
    --region us-east-1 ^
    --endpoint endpoint ^                        what is means?
    --output-format pcm ^
    --text "i would like to order flowers" ^
    --voice-id "Kendra" ^
    IntentSpeech.mpg

(text to audio file(mpg))
aws polly synthesize-speech ^
    --region us-east-1 ^
    --output-format pcm ^
    --text "Hi" ^
    --voice-id "Kendra" ^
    IntentSpeech.mpg

call aws lex function with audio(hi.wav) file       hi
aws lex-runtime post-content ^
    --region us-east-1 ^
    --bot-name Bookappointment ^
    --bot-alias "blue" ^
    --user-id wyumpkwy84e5ka8r79hymiqsyk5l2cqj ^
    --content-type "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false" ^
    --input-stream hi.wav ^
    IntentOutputSpeech.mpg

call aws lex function with audio(tom1.wav) file      tomorrow
aws lex-runtime post-content ^
    --region us-east-1 ^
    --bot-name Bookappointment ^
    --bot-alias "blue" ^
    --user-id wyumpkwy84e5ka8r79hymiqsyk5l2cqj ^
    --content-type "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false" ^
    --input-stream tom1.wav ^
    IntentOutputSpeech.mpg
```