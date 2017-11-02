var wavFileInfo = require('wav-file-info');

wavFileInfo.infoByFilename('./1.wav', function(err, info){
 if (err) throw err;
 console.log(info);
});