const fs = require('fs');
const express = require('express');
const sh = require('shelljs');
const yargs = require('yargs');

const argv = yargs
  .option('baseDir', {
    type: "string",
    description: "the base directory where the video/ and audio/ directories are"
  })
  .argv;
if(argv.baseDir){
  sh.cd(argv.baseDir);
}

const logger = {
  log: function(...args){
    const time = new Date();
    const timeString = [
      time.getHours().toString().padStart(2,'0'),
      time.getMinutes().toString().padStart(2,'0'),
      time.getSeconds().toString().padStart(2,'0'),
      time.getMilliseconds().toString().padStart(3,'0')
    ].join(':');
    console.log(`[${timeString}]`, ...args);
  },
  info: function(...args){
    logger.log('[info]', ...args);
  }
}

const app = express();
// format json output for readability
app.set('json spaces', 2);
// turn post data with Content-Type: application/json into a body object in the req
app.use(express.json());

app.post('/api/title', (req, res)=>{
  const url = req.body.url;
  logger.info('getting title for', url);
  const command = `youtube-dl -e ${JSON.stringify(url)}`;
  const title = sh.exec(command).stdout.trim();
  logger.info('got title', title);
  res.send({title});
})

app.post('/api/get', (req, res)=>{
  logger.info('get request', req.body);
  // todo: conference vids are conference/year/preacher.mp4
  const {url, type, preacher, title} = req.body;
  logger.info(`get request for ${type} from ${preacher} named ${title}`);
  const saniTitle = title.split(' ').join('_');
  const dir = `video/02preaching/${type}_${preacher}/`;
  sh.mkdir('-p', dir);
  const command = `youtube-dl ${JSON.stringify(url)} -o ${dir}${saniTitle}.mp4`;
  if(sh.exec(command).code != 0){
    res.status(400).send('not ok');
    return;
  };
  res.send('ok');
})

app.get('/', (req, res)=>{
  const theFile = fs.readFileSync('archiver.html', 'utf-8')
  res.send(theFile);
  logger.info(`request for /, sent ${theFile.length} unicodes`);
});

app.listen(3000, ()=>{console.log('listening on 3000')});