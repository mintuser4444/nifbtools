const fs = require('fs');
const cliProgress = require('cli-progress');
const jsdom = require('jsdom');

console.log('loading vap');
const start = new Date();
const dom = new jsdom.JSDOM(fs.readFileSync('videoarchivepage.html'));
console.log('vap loaded in', new Date() - start);
const window = dom.window;
const document = window.document;

const andersec = document.getElementById('fsanderson');
const sections = document.getElementsByTagName('section');

for(let i=0; i<sections.length; i++){
  const section = sections[i];
  if(!section.id.startsWith('fs')){
    continue;
  }
  console.log('in section', section.id);
  const lis = [];
  const uls = section.getElementsByTagName('ul');
  for(let i=0; i<uls.length; i++){
    const theUl = uls[i];
    const innerLis = theUl.getElementsByTagName('li');
    while(innerLis.length){
     lis.push(innerLis[0]);
     theUl.removeChild(innerLis[0]); 
    }
    uls[i].textContent = '';
  }
  lis.sort((l,r)=>l.textContent > r.textContent?1:-1);
  const newLis = [];
  const bar = new cliProgress.SingleBar();
  bar.start(lis.length, 0);
  for(let i=0; i<lis.length; i++){
    const li = lis[i];
    const href = li.getElementsByTagName('a')[0].href;
    const title = href.split('/')[3].split('_').join(' ');
    const newLi = document.createElement('li');
    const theA = document.createElement('a');
    newLi.appendChild(theA);
    theA.setAttribute('target', '_blank');
    theA.setAttribute('href', href);
    theA.textContent = title;
    newLi.appendChild(document.createTextNode(' '));
    const a2 = document.createElement('a');
    newLi.appendChild(a2);
    a2.setAttribute('_target', 'blank');
    a2.setAttribute('href', 'audio' + href.slice(5,href.length-3) + 'm4a');
    a2.textContent = '(audio)';
    let ul = uls[Math.floor(i/lis.length*uls.length)];
    ul.appendChild(document.createTextNode('\n  '));
    ul.appendChild(newLi);
    bar.update(i);
  }
  bar.update(lis.length);
  bar.stop();
  console.log(`processed ${lis.length} lis for section ${section.id}`);
}

fs.writeFileSync('vap.html', dom.serialize());