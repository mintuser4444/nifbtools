const fs = require('fs');
const jsdom = require('jsdom');

console.log('loading vap');
const start = new Date();
const dom = new jsdom.JSDOM(fs.readFileSync('videoarchivepage.html'));
console.log('vap loaded in', new Date() - start);
const window = dom.window;
const document = window.document;

const lis = [];
//<li><a target="_blank" href="video/02preaching/Sermons_Bro_Powell/Creation_Cults_And_The_Two_World_Religions_On_Evolution.mp4">Creation Cults And The Two World Religions On Evolution</a></li>
for(const video of ['How_Even_Unbelivers_Glorify_God.mp4', 'God_Is_Love_And_Love_Hates_Fornication.mp4']){
  const title = video.slice(0,video.length-4).split('_').join(' ');
  const newLi = document.createElement('li');
  lis.push(newLi);
  const theA = document.createElement('a');
  newLi.appendChild(theA);
  theA.setAttribute('target', '_blank');
  theA.setAttribute('href', encodeURI('video/02preaching/Sermons_Pastor_Anderson/'+video));
  theA.textContent = title;
}
const newLiCnt = lis.length;

const andersec = document.getElementById('fsanderson');
const uls = andersec.getElementsByTagName('ul');
// getElementsByTagName returns a HTMLCollection
// * this has a length and can be iterated with for(i=0; i<stuff.length; i++)
// * it can not be iterated through with for(x of stuff) or stuff.map()
// * it is an active object of the DOM and reacts to changes
for(let i=0; i<uls.length; i++){
  const theUl = uls[i];
  const innerLis = theUl.getElementsByTagName('li');
  while(innerLis.length){
   lis.push(innerLis[0]);
   theUl.removeChild(innerLis[0]); 
  }
  uls[i].textContent = '';
}
const oldLiCnt = lis.length - newLiCnt;

// js sort takes a function that returns 1, 0, or -1 depending on >,=, or <
// the text content of an element includes the entire text content of every element it contains
lis.sort((l,r)=>l.textContent < r.textContent?1:-1);

while(lis.length){
  for(i=0; i<uls.length; i++){
    if(lis.length == 0)
      continue;
    uls[i].appendChild(document.createTextNode('\n  '));
    uls[i].appendChild(lis.pop());
  }
}

fs.writeFileSync('vap.html', dom.serialize());
console.log(newLiCnt, 'new lis,', oldLiCnt, 'old lis');