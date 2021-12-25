const sh = require('shelljs');

let rss = 0;
let download = 0;
let rssBuf = [`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">

<channel>
  <title>Faithful Word Baptist</title>
  <link>http://faithfulwordbaptist.org</link>
  <description>Sermons</description>`];
let rssFooter = `
  </channel>
</rss>`;



console.log('argv is', process.argv);
if(process.argv[2] == 'rss'){
  rss = 1;
}
if(process.argv[2] == 'download'){
  download = 1;
}
console.log(`rss is ${rss} download is ${download}`);
let downloaded = 0;
let existed = 0;

const tabletojson = require('tabletojson').Tabletojson;
let table;
const tjp = tabletojson.convertUrl(
  'http://www.faithfulwordbaptist.org/page5.html',
  { stripHtmlFromCells: false },
  function(tablesAsJson) {
    //Print out the 1st row from the 2nd table on the above webpage as JSON
    //console.log(tablesAsJson);
    table = tablesAsJson[0];
  }
);
tjp.then(function(){
    const dater = /http:\/\/www.faithfulwordbaptist.org\/(?<date>[^.]+).mp3/;
    const dater3 = /\/(?<date>[0-9]{6}[ap])./;
    const hrefer = /href="(?<url>[^"]+)"/;
    table.forEach((line, i)=>{
      if(Object.keys(line).length == 1 && line['Date & Time']){
        return;
      }
      if(line.Links == ''){
        console.log(i,'no links');
        return;
      }
      if(!line.Links){
        console.log(i,'malformed line', line);
        return;
      }
      let match = line.Links.match(dater3);
      let date;
      let url;
      if(match){
        date = match.groups.date;
      }
      match = line.Links.match(hrefer);
      if(match){
        const myUrl = new URL(match.groups.url);
        if(myUrl.pathname.endsWith('.mp3')){
          url = match.groups.url;
        } else {
          console.log(i,'malformed line, no link', line, url);
          return;
        }
      }
      const title = line['Sermon Title'];
      const saniTitle = title.replace(/[:/]/g,'-')
        .replace(/['"]/,"").replace('?','¿');
      const speaker = line.Speaker;
      let isoDate;
      if(date)
        isoDate = date[4]+date[5]+'-'+date[0]+date[1]+'-'+date[2]+date[3]+date[6];
      const filename = `${date ? isoDate + ' - ' : ''}${saniTitle} - ${speaker}.mp3`;
      console.log(i, url, filename);
      const prettyDate = line['Date & Time'];
      rssBuf.push(`  <item>
    <title>${title} - ${speaker}</title>
    <embedding url='${url}' type='audio/mpeg'/>
    <description>${title} by ${speaker} on ${prettyDate}</description>
  </item>`);
      if(download){
        if(!sh.test('-f',filename)){
          sh.exec(`curl '${url}' -o '${filename}'`);
          downloaded++;
          console.log(`${filename} downloaded (${downloaded})`);
        } else {
          existed++;
          console.log(`${filename} existed (${existed})`);
        }
      }
    });
    if(rss){
      rssBuf.push(rssFooter);
      require('fs').writeFileSync('rss.xml', rssBuf.join('\n'));
    }
  }
);