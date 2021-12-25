const fs = require('fs');
const sh = require('shelljs');
const jsdom = require('jsdom');
const xmldom = require('xmldom');
const xmlFormatter = require('xml-formatter');

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
    logger.info(`[${timeString}]`, ...args);
  },
  info: function(...args){
    logger.log('[info]', ...args);
  }
}

const paths = sh.find('video');
for(path of paths){
  if(sh.test('-d', path)){
    logger.info('dir', path);
    sh.mkdir('-p', 'audio'+path.slice(5));
  }
  else if (path.endsWith('.mp4') && fs.statSync(path).size > 500000){
    logger.info('mp4', path);
    const apath = 'audio'+path.slice(5,path.length-4)+'.m4a';
    if(fs.existsSync(apath) && fs.statSync(apath).size > 500000){
      const command = `ffmpeg -i ${JSON.stringify(path)} -vn -af "pan=mono|c0=c1" ${JSON.stringify(apath)}`;
      logger.info(command);
      sh.exec(command);
    }
    logger.info(command);
    sh.exec(command);
  }
  else
    logger.info('dunno', path);
}
const churches = {
  Anderson: 'Faithful Word Baptist Church',
  Shelley: 'Stedfast Baptist Church'
}
sh.mkdir('-p', 'rss');
const parser = new xmldom.DOMParser();
const serializer = new xmldom.XMLSerializer();
for(const dir of sh.ls('audio/02preaching')){
  if(dir.startsWith('Sermons_Pastor_')){
    const pastor = dir.slice(15);
    logger.info(`rss for ${pastor}`);
    const rssPath = `rss/${pastor}.rss`;
    const rssBuf = fs.existsSync(rssPath) ? fs.readFileSync(rssPath, 'utf-8') : `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Sermons Pastor ${pastor}</title>
  <description>Sermons by Pastor ${pastor} of ${churches[pastor]}</description>
  </channel>
</rss>`;
    const xml = parser.parseFromString(rssBuf);
    const doc = xml.documentElement;
    // can't use document.getElementById with filenames without doing xml escapes
    const titles = new Set();
    const ttags = doc.getElementsByTagName('title');
    for(let i=0; i<ttags.length; i++ ){
      const ttag = ttags[i];
      titles.add(ttag.textContent.trim());
    }
    const channel = doc.getElementsByTagName('channel')[0];
    for(const filename of sh.ls(`audio/02preaching/${dir}`)){
      const filepath = `audio/02preaching/${dir}/${filename}`;
      const vidpath = 'video' + filepath.slice(5, filepath.length-3) + 'mp4';
      const title =filename.slice(0,filename.length-4).split('_').join(' ');
      if(titles.has(title)){
        continue;
      }
      const date = fs.statSync(vidpath).ctime.toString();
      const item = xml.createElement('item');
      channel.appendChild(item);
      const titleTag = xml.createElement('title');
      item.appendChild(titleTag);
      titleTag.textContent = title;
      const authorTag = xml.createElement('author');
      item.appendChild(authorTag);
      authorTag.textContent = 'Pastor ' + pastor;
      const enclosureTag = xml.createElement('enclosure');
      item.appendChild(enclosureTag);
      enclosureTag.setAttribute('url', 'https://www.kjv1611only.com/' + encodeURI(filepath));
      enclosureTag.setAttribute('type', 'audio/mp4');
      const dateTag = xml.createElement('date');
      item.appendChild(dateTag);
      dateTag.textContent = date;
    }
    fs.writeFileSync(rssPath, xmlFormatter(serializer.serializeToString(xml), {collapseContent:true}));
    logger.info(`rss for ${pastor} has ${doc.getElementsByTagName('item').length} items`);
  }
}