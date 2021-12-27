const fs = require('fs');
const jsdom = require('jsdom');
const sh = require('shelljs');
const yargs = require('yargs');

const argv = yargs
  .option('baseDir', {
    type: "string",
    description: "the base directory where the video/ and audio/ directories are"
  })
  .argv;
if(argv.baseDir){
  console.log('setting base dir to', argv.baseDir)
  sh.cd(argv.baseDir);
}

let downloaded = 0;
let existed = 0;

sh.exec('curl -O http://kjv1611only.com/videoarchivepage.html');
console.log('loading vap');
const start = new Date();
const dom = new jsdom.JSDOM(fs.readFileSync('videoarchivepage.html'));
console.log('vap loaded in', new Date() - start);
const window = dom.window;
const document = window.document;

const prefix = 'video/02preaching/Sermons_';
const allAs = document.getElementsByTagName('a');
for(let i=0; i<allAs.length; i++){
  if(!(i&255))
    console.log(i);
  const href = allAs[i].href;
  if(!href.startsWith(prefix)){
    continue;
  }
  const preacher = href.slice(prefix.length).split('/')[0];
  const filename = href.slice(prefix.length + preacher.length + 1);
  const vidDir = 'video/02preaching/Sermons_'+preacher;
  const vidPath = vidDir + '/' + filename;
  const afilename = filename.slice(0,filename.length-3) + 'm4a';
  const audDir = 'audio' + vidDir.slice(5);
  const audPath = audDir + '/' + afilename;
  console.log(i,preacher, filename);
  if(fs.existsSync(audPath)){
    continue;
  }
  sh.mkdir('-p', vidDir);
  sh.exec(`curl http://kjv1611only.com/${href} -o ${vidPath}`);
  sh.mkdir('-p', audDir);
  const ffCmd = `ffmpeg -i ${JSON.stringify(vidPath)} -vn -af "pan=mono|c0=c1" ${JSON.stringify(audPath)}`;
  console.log(ffCmd);
  sh.exec(ffCmd);
  sh.rm(vidPath);
}