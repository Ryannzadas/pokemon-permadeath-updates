
'use strict';
const SAVE_KEY = 'umavida-save-v1';
const META_KEY = 'umavida-meta-v1';
// Sprites embutidos (PokeAPI) em base64: funcionam offline, sem depender de internet.

const SPRITE = (dex, back) => (SPRITES[dex] && SPRITES[dex][back?'b':'f']) || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${back?'back/':''}${dex}.png`;
const GYM_EVERY = 5;

const TYPES = {
  normal:['Normal','#c9c5a8'], fire:['Fogo','#f2a15a'], water:['Água','#8fb6f2'],
  grass:['Planta','#9bd36f'], electric:['Elétrico','#f5de5a'], ice:['Gelo','#a9e3e8'],
  fighting:['Lutador','#d9806f'], poison:['Veneno','#c392d3'], ground:['Terra','#d9bf7a'],
  flying:['Voador','#b5b9f2'], psychic:['Psíquico','#f294b8'], rock:['Pedra','#c2b36f'],
  ghost:['Fantasma','#9a86bf'], bug:['Inseto','#c6d45a'], dragon:['Dragão','#8a6ad4'],
  dark:['Sombrio','#9c8678'], steel:['Aço','#b6c3d1'], fairy:['Fada','#e9a7cc']
};
const CH = {
  normal:{r:['rock','steel'],i:['ghost']},
  fire:{s:['grass','ice','bug','steel'],r:['fire','water','rock','dragon']},
  water:{s:['fire','ground','rock'],r:['water','grass','dragon']},
  grass:{s:['water','ground','rock'],r:['fire','grass','poison','flying','bug','dragon','steel']},
  electric:{s:['water','flying'],r:['electric','grass','dragon'],i:['ground']},
  ice:{s:['grass','ground','flying','dragon'],r:['fire','water','ice','steel']},
  fighting:{s:['normal','ice','rock','dark','steel'],r:['poison','flying','psychic','bug','fairy'],i:['ghost']},
  poison:{s:['grass','fairy'],r:['poison','ground','rock','ghost'],i:['steel']},
  ground:{s:['fire','electric','poison','rock','steel'],r:['grass','bug'],i:['flying']},
  flying:{s:['grass','fighting','bug'],r:['electric','rock','steel']},
  psychic:{s:['fighting','poison'],r:['psychic','steel'],i:['dark']},
  rock:{s:['fire','ice','flying','bug'],r:['fighting','ground','steel']},
  ghost:{s:['ghost','psychic'],r:['dark'],i:['normal']},
  bug:{s:['grass','psychic','dark'],r:['fire','fighting','poison','flying','ghost','steel','fairy']},
  dragon:{s:['dragon'],r:['steel'],i:['fairy']},
  dark:{s:['ghost','psychic'],r:['fighting','dark','fairy']},
  steel:{s:['ice','rock','fairy'],r:['fire','water','electric','steel']},
  fairy:{s:['fighting','dragon','dark'],r:['fire','poison','steel']}
};
function eff(mt, defTypes){
  let m = 1; const c = CH[mt] || {};
  for(const d of defTypes){
    if((c.i||[]).includes(d)) m *= 0;
    else if((c.s||[]).includes(d)) m *= 2;
    else if((c.r||[]).includes(d)) m *= .5;
  }
  return m;
}
const M = {
  tackle:{n:'Investida',t:'normal',p:40,a:100}, scratch:{n:'Arranhão',t:'normal',p:40,a:100},
  quick:{n:'Ataque Rápido',t:'normal',p:40,a:100,pri:1}, bite:{n:'Mordida',t:'normal',p:60,a:100},
  slam:{n:'Pancada',t:'normal',p:85,a:90},
  ember:{n:'Brasa',t:'fire',p:40,a:100}, flame:{n:'Lança-Chamas',t:'fire',p:90,a:100},
  watergun:{n:'Jato d\'Água',t:'water',p:40,a:100}, surf:{n:'Surf',t:'water',p:90,a:100},
  vine:{n:'Chicote de Vinha',t:'grass',p:45,a:100}, razor:{n:'Folha Navalha',t:'grass',p:55,a:95},
  solar:{n:'Raio Solar',t:'grass',p:110,a:90},
  shock:{n:'Choque do Trovão',t:'electric',p:40,a:100}, bolt:{n:'Trovão',t:'electric',p:90,a:100},
  gust:{n:'Rajada',t:'flying',p:40,a:100}, wing:{n:'Ataque de Asa',t:'flying',p:60,a:100},
  rock:{n:'Lançar Pedra',t:'rock',p:50,a:90}, slide:{n:'Deslize de Pedras',t:'rock',p:75,a:90},
  mud:{n:'Tiro de Lama',t:'ground',p:55,a:95}, quake:{n:'Terremoto',t:'ground',p:100,a:100},
  chop:{n:'Golpe Caratê',t:'fighting',p:50,a:100}, cross:{n:'Soco Dinâmico',t:'fighting',p:100,a:80},
  conf:{n:'Confusão',t:'psychic',p:50,a:100}, psychic:{n:'Psíquico',t:'psychic',p:90,a:100},
  lick:{n:'Lambida',t:'ghost',p:30,a:100}, shadow:{n:'Bola Sombria',t:'ghost',p:80,a:100},
  sting:{n:'Ferrão Venenoso',t:'poison',p:35,a:100}, sludge:{n:'Lodo',t:'poison',p:65,a:100},
  icebeam:{n:'Raio de Gelo',t:'ice',p:90,a:100}, bug:{n:'Picada',t:'bug',p:60,a:100},
  dragon:{n:'Garra de Dragão',t:'dragon',p:80,a:100},
  flamewheel:{n:'Roda de Fogo',t:'fire',p:60,a:100},
  bubblebeam:{n:'Raio de Bolhas',t:'water',p:65,a:100},
  energyball:{n:'Bola de Energia',t:'grass',p:80,a:100},
  spark:{n:'Faísca',t:'electric',p:65,a:100},
  icywind:{n:'Vento Gelado',t:'ice',p:55,a:95},
  icepunch:{n:'Soco de Gelo',t:'ice',p:75,a:100},
  brickbreak:{n:'Quebra-Telha',t:'fighting',p:75,a:100},
  sludgebomb:{n:'Bomba de Lodo',t:'poison',p:90,a:100},
  dig:{n:'Escavar',t:'ground',p:80,a:100},
  airslash:{n:'Cortador de Ar',t:'flying',p:75,a:95},
  psybeam:{n:'Raio Psíquico',t:'psychic',p:65,a:100},
  powergem:{n:'Gema de Poder',t:'rock',p:80,a:100},
  shadowclaw:{n:'Garra Sombria',t:'ghost',p:70,a:100},
  infest:{n:'Infestação',t:'bug',p:40,a:100},
  xscissor:{n:'Tesoura X',t:'bug',p:80,a:100},
  dbreath:{n:'Sopro do Dragão',t:'dragon',p:60,a:100},
  dpulse:{n:'Pulso do Dragão',t:'dragon',p:85,a:100},
  pursuit:{n:'Perseguição',t:'dark',p:40,a:100},
  crunch:{n:'Mastigada',t:'dark',p:70,a:100},
  darkpulse:{n:'Pulso Sombrio',t:'dark',p:85,a:100},
  metalclaw:{n:'Garra de Metal',t:'steel',p:50,a:95},
  ironhead:{n:'Cabeça de Ferro',t:'steel',p:75,a:100},
  flashcannon:{n:'Canhão de Luz',t:'steel',p:85,a:100}
};
const SP = {};
function sp(id,n,dex,t,b,c,w,mv,evo){ SP[id] = {id,n,dex,t,b,c,w,mv,evo}; }
sp('bulbasaur','Bulbasaur',1,['grass','poison'],[45,52,49,45],.55,0,[[1,'tackle'],[1,'vine'],[1,'quick'],[8,'sting'],[15,'razor']],[16,'ivysaur']);
sp('ivysaur','Ivysaur',2,['grass','poison'],[60,63,63,60],.4,1,[[1,'vine'],[1,'razor'],[1,'sting'],[18,'sludge'],[26,'slam'],[32,'solar']],[32,'venusaur']);
sp('venusaur','Venusaur',3,['grass','poison'],[80,82,83,80],.25,2,[[1,'razor'],[1,'sludge'],[1,'slam'],[1,'solar']]);
sp('charmander','Charmander',4,['fire'],[39,56,43,65],.55,0,[[1,'scratch'],[1,'quick'],[1,'ember'],[8,'bite'],[16,'slam'],[22,'flame']],[16,'charmeleon']);
sp('charmeleon','Charmeleon',5,['fire'],[58,72,58,80],.4,1,[[1,'ember'],[1,'quick'],[1,'bite'],[16,'slam'],[22,'flame']],[36,'charizard']);
sp('charizard','Charizard',6,['fire','flying'],[78,92,80,100],.2,2,[[1,'slam'],[1,'ember'],[1,'wing'],[1,'flame'],[40,'dragon']]);
sp('squirtle','Squirtle',7,['water'],[44,49,65,43],.55,0,[[1,'tackle'],[1,'watergun'],[1,'quick'],[8,'bite'],[16,'slam'],[22,'surf']],[16,'wartortle']);
sp('wartortle','Wartortle',8,['water'],[59,63,80,58],.4,1,[[1,'watergun'],[1,'bite'],[1,'quick'],[16,'slam'],[22,'surf'],[32,'icebeam']],[36,'blastoise']);
sp('blastoise','Blastoise',9,['water'],[79,83,100,78],.2,2,[[1,'slam'],[1,'watergun'],[1,'surf'],[1,'icebeam']]);
sp('caterpie','Caterpie',10,['bug'],[45,30,35,45],.9,0,[[1,'tackle'],[1,'bug'],[1,'sting']],[7,'metapod']);
sp('metapod','Metapod',11,['bug'],[50,20,55,30],.6,0,[[1,'tackle'],[1,'bug']],[10,'butterfree']);
sp('butterfree','Butterfree',12,['bug','flying'],[60,45,50,70],.4,1,[[1,'gust'],[1,'bug'],[1,'conf'],[1,'wing']]);
sp('pikachu','Pikachu',25,['electric'],[35,55,40,90],.45,0,[[1,'quick'],[1,'shock'],[1,'tackle'],[14,'slam'],[22,'bolt']],[18,'raichu']);
sp('raichu','Raichu',26,['electric'],[60,90,55,110],.3,1,[[1,'shock'],[1,'quick'],[1,'slam'],[1,'bolt']]);
sp('eevee','Eevee',133,['normal'],[55,55,50,55],.5,0,[[1,'tackle'],[1,'quick'],[1,'bite'],[14,'slam']]);
sp('pidgey','Pidgey',16,['normal','flying'],[40,45,40,56],.9,0,[[1,'tackle'],[1,'gust'],[1,'quick'],[15,'wing']],[18,'pidgeotto']);
sp('pidgeotto','Pidgeotto',17,['normal','flying'],[63,60,55,71],.5,1,[[1,'gust'],[1,'wing'],[1,'quick'],[1,'slam']],[36,'pidgeot']);
sp('pidgeot','Pidgeot',18,['normal','flying'],[83,80,75,101],.3,2,[[1,'wing'],[1,'quick'],[1,'slam'],[1,'gust']]);
sp('rattata','Rattata',19,['normal'],[30,56,35,72],.9,0,[[1,'tackle'],[1,'quick'],[7,'bite'],[16,'slam']],[20,'raticate']);
sp('raticate','Raticate',20,['normal'],[55,81,60,97],.5,1,[[1,'bite'],[1,'quick'],[1,'slam'],[1,'tackle']]);
sp('geodude','Geodude',74,['rock','ground'],[40,80,100,20],.7,0,[[1,'tackle'],[1,'rock'],[10,'mud'],[18,'slide']],[25,'graveler']);
sp('graveler','Graveler',75,['rock','ground'],[55,95,115,35],.45,1,[[1,'rock'],[1,'mud'],[1,'slide'],[1,'slam']],[36,'golem']);
sp('golem','Golem',76,['rock','ground'],[80,120,130,45],.25,2,[[1,'rock'],[1,'mud'],[1,'slide'],[1,'quake']]);
sp('machop','Machop',66,['fighting'],[70,80,50,35],.7,0,[[1,'scratch'],[1,'chop'],[1,'quick'],[12,'slam'],[22,'cross']],[28,'machoke']);
sp('machoke','Machoke',67,['fighting'],[80,100,70,45],.45,1,[[1,'chop'],[1,'slam'],[1,'rock'],[20,'cross']],[36,'machamp']);
sp('machamp','Machamp',68,['fighting'],[90,130,80,55],.25,2,[[1,'chop'],[1,'cross'],[1,'slam'],[1,'rock']]);
sp('abra','Abra',63,['psychic'],[25,50,25,90],.55,0,[[1,'conf'],[1,'quick'],[1,'tackle'],[16,'psychic']],[16,'kadabra']);
sp('kadabra','Kadabra',64,['psychic'],[40,75,40,105],.35,1,[[1,'conf'],[1,'quick'],[1,'psychic'],[1,'shadow']],[36,'alakazam']);
sp('alakazam','Alakazam',65,['psychic'],[55,105,55,120],.2,2,[[1,'psychic'],[1,'shadow'],[1,'conf'],[1,'icebeam']]);
sp('gastly','Gastly',92,['ghost','poison'],[30,55,30,80],.6,0,[[1,'lick'],[1,'sting'],[1,'quick'],[14,'shadow']],[25,'haunter']);
sp('haunter','Haunter',93,['ghost','poison'],[45,70,45,95],.4,1,[[1,'lick'],[1,'shadow'],[1,'sting'],[1,'sludge']],[36,'gengar']);
sp('gengar','Gengar',94,['ghost','poison'],[60,95,60,110],.25,2,[[1,'shadow'],[1,'sludge'],[1,'psychic'],[1,'lick']]);
sp('zubat','Zubat',41,['poison','flying'],[40,45,35,55],.9,0,[[1,'gust'],[1,'sting'],[1,'bite'],[16,'wing']],[22,'golbat']);
sp('golbat','Golbat',42,['poison','flying'],[75,80,70,90],.45,1,[[1,'wing'],[1,'bite'],[1,'sludge'],[1,'gust']]);
sp('vulpix','Vulpix',37,['fire'],[38,50,40,65],.5,0,[[1,'ember'],[1,'quick'],[1,'tackle'],[20,'flame']]);
sp('psyduck','Psyduck',54,['water'],[50,60,48,55],.6,0,[[1,'watergun'],[1,'scratch'],[1,'conf'],[20,'surf']],[33,'golduck']);
sp('golduck','Golduck',55,['water'],[80,85,65,85],.35,1,[[1,'surf'],[1,'conf'],[1,'watergun'],[1,'icebeam']]);
sp('oddish','Oddish',43,['grass','poison'],[45,60,55,30],.7,0,[[1,'vine'],[1,'sting'],[1,'tackle'],[14,'razor']]);
sp('sandshrew','Sandshrew',27,['ground'],[50,75,85,40],.7,0,[[1,'scratch'],[1,'mud'],[1,'quick'],[18,'slide'],[26,'quake']],[22,'sandslash']);
sp('sandslash','Sandslash',28,['ground'],[75,100,110,65],.4,1,[[1,'mud'],[1,'slide'],[1,'slam'],[1,'quake']]);
sp('magnemite','Magnemite',81,['electric'],[25,70,70,45],.6,0,[[1,'shock'],[1,'tackle'],[1,'quick'],[20,'bolt']],[30,'magneton']);
sp('magneton','Magneton',82,['electric'],[50,95,95,70],.35,1,[[1,'shock'],[1,'bolt'],[1,'slam'],[1,'rock']]);
sp('growlithe','Growlithe',58,['fire'],[55,70,45,60],.5,0,[[1,'bite'],[1,'ember'],[1,'quick'],[20,'flame']],[36,'arcanine']);
sp('arcanine','Arcanine',59,['fire'],[90,110,80,95],.25,1,[[1,'flame'],[1,'bite'],[1,'slam'],[1,'quick']]);
sp('lapras','Lapras',131,['water','ice'],[130,85,80,60],.2,2,[[1,'watergun'],[1,'icebeam'],[1,'surf'],[1,'slam']]);
sp('snorlax','Snorlax',143,['normal'],[160,110,65,30],.2,2,[[1,'slam'],[1,'tackle'],[1,'quake'],[1,'bite']]);
sp('onix','Onix',95,['rock','ground'],[35,45,160,70],0,9,[[1,'slide'],[1,'mud'],[1,'rock'],[1,'slam']]);
sp('starmie','Starmie',121,['water','psychic'],[60,75,85,115],0,9,[[1,'surf'],[1,'psychic'],[1,'watergun'],[1,'icebeam']]);
sp('gyarados','Gyarados',130,['water','flying'],[95,125,79,81],.15,3,[[1,'bite'],[1,'surf'],[1,'dragon'],[1,'slam']]);
sp('scyther','Scyther',123,['bug','flying'],[70,110,80,105],.25,2,[[1,'wing'],[1,'bug'],[1,'quick'],[1,'slam']]);
sp('dratini','Dratini',147,['dragon'],[41,64,45,50],.35,1,[[1,'slam'],[1,'quick'],[1,'dragon'],[20,'surf']],[30,'dragonair']);
sp('dragonair','Dragonair',148,['dragon'],[61,84,65,70],.2,3,[[1,'dragon'],[1,'slam'],[1,'surf'],[1,'bolt']],[55,'dragonite']);
sp('dragonite','Dragonite',149,['dragon','flying'],[91,134,95,80],.1,9,[[1,'dragon'],[1,'wing'],[1,'slam'],[1,'flame']]);
// ── Gerações 2 a 5 (+ lacunas da 1ª) ──
sp('vaporeon','Vaporeon',134,['water'],[130,90,79,65],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'sludge'],[1,'quake']]);
sp('jolteon','Jolteon',135,['electric'],[65,90,79,130],.3,2,[[1,'spark'],[1,'bolt'],[1,'quake'],[1,'icebeam']]);
sp('flareon','Flareon',136,['fire'],[65,114,88,65],.3,2,[[1,'flamewheel'],[1,'flame'],[1,'icebeam'],[1,'bolt']]);
sp('espeon','Espeon',196,['psychic'],[65,101,79,110],.3,2,[[1,'psybeam'],[1,'psychic'],[1,'slide'],[1,'sludge']]);
sp('umbreon','Umbreon',197,['dark'],[95,63,121,65],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'cross'],[1,'slide']]);
sp('leafeon','Leafeon',470,['grass'],[65,88,101,95],.3,2,[[1,'razor'],[1,'energyball'],[1,'quake'],[1,'icebeam']]);
sp('glaceon','Glaceon',471,['ice'],[65,98,103,65],.3,2,[[1,'icepunch'],[1,'icebeam'],[1,'flame'],[1,'surf']]);
sp('horsea','Horsea',116,['water'],[30,56,50,60],.75,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[32,'seadra']);
sp('seadra','Seadra',117,['water'],[55,82,72,85],.45,1,[[1,'watergun'],[1,'quick'],[1,'bubblebeam'],[1,'bite'],[22,'icebeam'],[30,'surf']],[40,'kingdra']);
sp('kingdra','Kingdra',230,['water','dragon'],[75,95,95,85],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'dragon'],[1,'dpulse']]);
sp('chansey','Chansey',113,['normal'],[250,22,60,50],.45,1,[[1,'quick'],[1,'tackle'],[1,'bite'],[1,'psychic'],[22,'flame'],[30,'slam']],[30,'blissey']);
sp('blissey','Blissey',242,['normal'],[255,46,79,55],.3,2,[[1,'bite'],[1,'slam'],[1,'bolt'],[1,'psychic']]);
sp('tauros','Tauros',128,['normal'],[75,73,84,110],.4,1,[[1,'quick'],[1,'tackle'],[1,'bite'],[1,'slide'],[22,'sludge'],[30,'slam']]);
sp('jynx','Jynx',124,['ice','psychic'],[65,86,68,95],.4,1,[[1,'icywind'],[1,'conf'],[1,'icepunch'],[1,'bite'],[22,'psybeam'],[30,'icebeam']]);
sp('electabuzz','Electabuzz',125,['electric'],[65,90,72,105],.45,1,[[1,'shock'],[1,'quick'],[1,'spark'],[1,'bite'],[22,'quake'],[30,'bolt']],[38,'electivire']);
sp('electivire','Electivire',466,['electric'],[75,110,77,95],.3,2,[[1,'spark'],[1,'bolt'],[1,'slide'],[1,'sludge']]);
sp('magmar','Magmar',126,['fire'],[65,98,72,93],.45,1,[[1,'ember'],[1,'quick'],[1,'flamewheel'],[1,'bite'],[22,'icebeam'],[30,'flame']],[38,'magmortar']);
sp('magmortar','Magmortar',467,['fire'],[75,112,82,83],.3,2,[[1,'flamewheel'],[1,'flame'],[1,'sludge'],[1,'quake']]);
sp('pinsir','Pinsir',127,['bug'],[65,94,86,85],.4,1,[[1,'infest'],[1,'quick'],[1,'bug'],[1,'bite'],[22,'slide'],[30,'xscissor']]);
sp('aerodactyl','Aerodactyl',142,['rock','flying'],[80,85,70,130],.25,2,[[1,'slide'],[1,'powergem'],[1,'wing'],[1,'airslash']]);
sp('rhyhorn','Rhyhorn',111,['ground','rock'],[80,60,66,25],.75,0,[[1,'tackle'],[1,'mud'],[1,'rock'],[12,'dig'],[24,'slide'],[30,'quake']],[40,'rhydon']);
sp('rhydon','Rhydon',112,['ground','rock'],[105,92,86,40],.45,1,[[1,'mud'],[1,'rock'],[1,'dig'],[1,'bite'],[22,'slide'],[30,'quake']],[48,'rhyperior']);
sp('rhyperior','Rhyperior',464,['ground','rock'],[115,102,96,40],.3,2,[[1,'dig'],[1,'quake'],[1,'slide'],[1,'powergem']]);
sp('slowpoke','Slowpoke',79,['water','psychic'],[90,54,54,15],.75,0,[[1,'tackle'],[1,'watergun'],[1,'conf'],[12,'bubblebeam'],[24,'psybeam'],[30,'surf']],[36,'slowbro']);
sp('slowbro','Slowbro',80,['water','psychic'],[95,89,96,30],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'psybeam'],[1,'psychic']]);
sp('mankey','Mankey',56,['fighting'],[40,60,40,70],.75,0,[[1,'tackle'],[1,'chop'],[1,'scratch'],[12,'brickbreak'],[24,'bite'],[30,'cross']],[28,'primeape']);
sp('primeape','Primeape',57,['fighting'],[65,85,66,95],.3,2,[[1,'brickbreak'],[1,'cross'],[1,'psychic'],[1,'flame']]);
sp('exeggcute','Exeggcute',102,['grass','psychic'],[60,51,64,40],.75,0,[[1,'tackle'],[1,'vine'],[1,'conf'],[12,'razor'],[24,'psybeam'],[30,'energyball']],[30,'exeggutor']);
sp('exeggutor','Exeggutor',103,['grass','psychic'],[95,112,80,55],.3,2,[[1,'razor'],[1,'energyball'],[1,'psybeam'],[1,'psychic']]);
sp('poliwag','Poliwag',60,['water'],[40,46,40,90],.75,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[24,'poliwhirl']);
sp('poliwhirl','Poliwhirl',61,['water'],[65,58,58,90],.45,1,[[1,'watergun'],[1,'quick'],[1,'bubblebeam'],[1,'bite'],[22,'sludge'],[30,'surf']],[38,'poliwrath']);
sp('poliwrath','Poliwrath',62,['water','fighting'],[90,84,93,70],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'brickbreak'],[1,'cross']]);
sp('chikorita','Chikorita',152,['grass'],[45,49,65,45],.55,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[16,'bayleef']);
sp('bayleef','Bayleef',153,['grass'],[60,63,80,60],.4,1,[[1,'vine'],[1,'quick'],[1,'razor'],[1,'bite'],[22,'flame'],[30,'energyball']],[32,'meganium']);
sp('meganium','Meganium',154,['grass'],[80,83,100,80],.2,2,[[1,'razor'],[1,'energyball'],[1,'flame'],[1,'surf']]);
sp('cyndaquil','Cyndaquil',155,['fire'],[39,56,47,65],.55,0,[[1,'tackle'],[1,'ember'],[1,'scratch'],[12,'flamewheel'],[24,'bite'],[30,'flame']],[14,'quilava']);
sp('quilava','Quilava',156,['fire'],[58,73,62,80],.4,1,[[1,'ember'],[1,'quick'],[1,'flamewheel'],[1,'bite'],[22,'surf'],[30,'flame']],[36,'typhlosion']);
sp('typhlosion','Typhlosion',157,['fire'],[78,98,82,100],.2,2,[[1,'flamewheel'],[1,'flame'],[1,'surf'],[1,'shadow']]);
sp('totodile','Totodile',158,['water'],[50,56,57,43],.55,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[18,'croconaw']);
sp('croconaw','Croconaw',159,['water'],[65,71,72,58],.4,1,[[1,'watergun'],[1,'quick'],[1,'bubblebeam'],[1,'bite'],[22,'slide'],[30,'surf']],[30,'feraligatr']);
sp('feraligatr','Feraligatr',160,['water'],[85,93,92,78],.2,2,[[1,'bubblebeam'],[1,'surf'],[1,'slide'],[1,'sludge']]);
sp('hoothoot','Hoothoot',163,['normal','flying'],[60,33,44,50],.75,0,[[1,'tackle'],[1,'quick'],[1,'gust'],[12,'bite'],[24,'wing'],[30,'slam']],[20,'noctowl']);
sp('noctowl','Noctowl',164,['normal','flying'],[100,70,75,70],.3,2,[[1,'bite'],[1,'slam'],[1,'wing'],[1,'airslash']]);
sp('crobat','Crobat',169,['poison','flying'],[85,81,80,130],.3,2,[[1,'sludge'],[1,'sludgebomb'],[1,'wing'],[1,'airslash']]);
sp('chinchou','Chinchou',170,['water','electric'],[75,48,48,67],.75,0,[[1,'tackle'],[1,'watergun'],[1,'shock'],[12,'bubblebeam'],[24,'spark'],[30,'surf']],[27,'lanturn']);
sp('lanturn','Lanturn',171,['water','electric'],[125,68,68,67],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'spark'],[1,'bolt']]);
sp('natu','Natu',177,['psychic','flying'],[40,61,45,70],.75,0,[[1,'tackle'],[1,'conf'],[1,'gust'],[12,'psybeam'],[24,'wing'],[30,'psychic']],[25,'xatu']);
sp('xatu','Xatu',178,['psychic','flying'],[65,86,70,95],.3,2,[[1,'psybeam'],[1,'psychic'],[1,'wing'],[1,'airslash']]);
sp('mareep','Mareep',179,['electric'],[55,54,43,35],.75,0,[[1,'tackle'],[1,'shock'],[1,'scratch'],[12,'spark'],[24,'bite'],[30,'bolt']],[15,'flaaffy']);
sp('flaaffy','Flaaffy',180,['electric'],[70,69,58,45],.45,1,[[1,'shock'],[1,'quick'],[1,'spark'],[1,'bite'],[22,'icebeam'],[30,'bolt']],[30,'ampharos']);
sp('ampharos','Ampharos',181,['electric'],[90,97,88,55],.3,2,[[1,'spark'],[1,'bolt'],[1,'icebeam'],[1,'psychic']]);
sp('marill','Marill',183,['water'],[70,20,50,40],.75,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[18,'azumarill']);
sp('azumarill','Azumarill',184,['water'],[100,56,80,50],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'flame'],[1,'shadow']]);
sp('sudowoodo','Sudowoodo',185,['rock'],[70,68,92,30],.4,1,[[1,'rock'],[1,'quick'],[1,'slide'],[1,'bite'],[22,'shadow'],[30,'powergem']]);
sp('murkrow','Murkrow',198,['dark','flying'],[60,85,42,91],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'gust'],[12,'crunch'],[24,'wing'],[30,'darkpulse']],[36,'honchkrow']);
sp('honchkrow','Honchkrow',430,['dark','flying'],[100,116,52,71],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'wing'],[1,'airslash']]);
sp('steelix','Steelix',208,['steel','ground'],[75,72,139,30],.25,2,[[1,'ironhead'],[1,'flashcannon'],[1,'dig'],[1,'quake']]);
sp('scizor','Scizor',212,['bug','steel'],[70,96,91,65],.3,2,[[1,'bug'],[1,'xscissor'],[1,'ironhead'],[1,'flashcannon']]);
sp('heracross','Heracross',214,['bug','fighting'],[80,87,86,85],.25,2,[[1,'bug'],[1,'xscissor'],[1,'brickbreak'],[1,'cross']]);
sp('sneasel','Sneasel',215,['dark','ice'],[55,68,66,115],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'icywind'],[12,'crunch'],[24,'icepunch'],[30,'darkpulse']],[36,'weavile']);
sp('weavile','Weavile',461,['dark','ice'],[70,86,76,125],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'icepunch'],[1,'icebeam']]);
sp('teddiursa','Teddiursa',216,['normal'],[60,66,50,40],.75,0,[[1,'tackle'],[1,'quick'],[1,'scratch'],[12,'bite'],[24,'bite'],[30,'slam']],[30,'ursaring']);
sp('ursaring','Ursaring',217,['normal'],[90,105,75,55],.3,2,[[1,'bite'],[1,'slam'],[1,'cross'],[1,'slide']]);
sp('swinub','Swinub',220,['ice','ground'],[50,41,36,50],.75,0,[[1,'tackle'],[1,'icywind'],[1,'mud'],[12,'icepunch'],[24,'dig'],[30,'icebeam']],[33,'piloswine']);
sp('piloswine','Piloswine',221,['ice','ground'],[100,82,71,50],.45,1,[[1,'icywind'],[1,'mud'],[1,'icepunch'],[1,'bite'],[22,'dig'],[30,'icebeam']],[44,'mamoswine']);
sp('mamoswine','Mamoswine',473,['ice','ground'],[110,103,71,80],.3,2,[[1,'icepunch'],[1,'icebeam'],[1,'dig'],[1,'quake']]);
sp('gligar','Gligar',207,['ground','flying'],[65,57,87,85],.75,0,[[1,'tackle'],[1,'mud'],[1,'gust'],[12,'dig'],[24,'wing'],[30,'quake']],[36,'gliscor']);
sp('gliscor','Gliscor',472,['ground','flying'],[75,72,102,95],.3,2,[[1,'dig'],[1,'quake'],[1,'wing'],[1,'airslash']]);
sp('houndour','Houndour',228,['dark','fire'],[45,71,41,65],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'ember'],[12,'crunch'],[24,'flamewheel'],[30,'darkpulse']],[24,'houndoom']);
sp('houndoom','Houndoom',229,['dark','fire'],[75,101,66,95],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'flamewheel'],[1,'flame']]);
sp('phanpy','Phanpy',231,['ground'],[90,51,51,40],.75,0,[[1,'tackle'],[1,'mud'],[1,'scratch'],[12,'dig'],[24,'bite'],[30,'quake']],[25,'donphan']);
sp('donphan','Donphan',232,['ground'],[90,93,93,50],.3,2,[[1,'dig'],[1,'quake'],[1,'slide'],[1,'sludge']]);
sp('skarmory','Skarmory',227,['steel','flying'],[65,62,108,70],.25,2,[[1,'ironhead'],[1,'flashcannon'],[1,'wing'],[1,'airslash']]);
sp('larvitar','Larvitar',246,['rock','ground'],[50,55,50,41],.75,0,[[1,'tackle'],[1,'rock'],[1,'mud'],[12,'slide'],[24,'dig'],[30,'powergem']],[28,'pupitar']);
sp('pupitar','Pupitar',247,['rock','ground'],[70,75,70,51],.45,1,[[1,'rock'],[1,'mud'],[1,'slide'],[1,'bite'],[22,'dig'],[30,'powergem']],[44,'tyranitar']);
sp('tyranitar','Tyranitar',248,['rock','dark'],[100,116,106,61],.12,3,[[1,'slide'],[1,'powergem'],[1,'crunch'],[1,'darkpulse']]);
sp('treecko','Treecko',252,['grass'],[40,56,46,70],.55,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[16,'grovyle']);
sp('grovyle','Grovyle',253,['grass'],[50,76,56,95],.4,1,[[1,'vine'],[1,'quick'],[1,'razor'],[1,'bite'],[22,'flame'],[30,'energyball']],[36,'sceptile']);
sp('sceptile','Sceptile',254,['grass'],[70,96,76,120],.2,2,[[1,'razor'],[1,'energyball'],[1,'flame'],[1,'surf']]);
sp('torchic','Torchic',255,['fire'],[45,66,46,45],.55,0,[[1,'tackle'],[1,'ember'],[1,'scratch'],[12,'flamewheel'],[24,'bite'],[30,'flame']],[16,'combusken']);
sp('combusken','Combusken',256,['fire','fighting'],[60,85,60,55],.4,1,[[1,'ember'],[1,'chop'],[1,'flamewheel'],[1,'bite'],[22,'brickbreak'],[30,'flame']],[36,'blaziken']);
sp('blaziken','Blaziken',257,['fire','fighting'],[80,116,70,80],.2,2,[[1,'flamewheel'],[1,'flame'],[1,'brickbreak'],[1,'cross']]);
sp('mudkip','Mudkip',258,['water'],[50,61,50,40],.55,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[16,'marshtomp']);
sp('marshtomp','Marshtomp',259,['water','ground'],[70,74,70,50],.4,1,[[1,'watergun'],[1,'mud'],[1,'bubblebeam'],[1,'bite'],[22,'dig'],[30,'surf']],[36,'swampert']);
sp('swampert','Swampert',260,['water','ground'],[100,99,90,60],.2,2,[[1,'bubblebeam'],[1,'surf'],[1,'dig'],[1,'quake']]);
sp('poochyena','Poochyena',261,['dark'],[35,44,33,35],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'scratch'],[12,'crunch'],[24,'bite'],[30,'darkpulse']],[18,'mightyena']);
sp('mightyena','Mightyena',262,['dark'],[70,76,66,70],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'bolt'],[1,'psychic']]);
sp('taillow','Taillow',276,['normal','flying'],[40,44,30,85],.75,0,[[1,'tackle'],[1,'quick'],[1,'gust'],[12,'bite'],[24,'wing'],[30,'slam']],[22,'swellow']);
sp('swellow','Swellow',277,['normal','flying'],[60,80,56,125],.3,2,[[1,'bite'],[1,'slam'],[1,'wing'],[1,'airslash']]);
sp('ralts','Ralts',280,['psychic'],[28,36,30,40],.75,0,[[1,'tackle'],[1,'conf'],[1,'scratch'],[12,'psybeam'],[24,'bite'],[30,'psychic']],[20,'kirlia']);
sp('kirlia','Kirlia',281,['psychic'],[38,52,46,50],.45,1,[[1,'conf'],[1,'quick'],[1,'psybeam'],[1,'bite'],[22,'flame'],[30,'psychic']],[30,'gardevoir']);
sp('gardevoir','Gardevoir',282,['psychic'],[68,98,92,80],.3,2,[[1,'psybeam'],[1,'psychic'],[1,'flame'],[1,'surf']]);
sp('shroomish','Shroomish',285,['grass'],[60,40,60,35],.75,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[23,'breloom']);
sp('breloom','Breloom',286,['grass','fighting'],[60,98,71,70],.3,2,[[1,'razor'],[1,'energyball'],[1,'brickbreak'],[1,'cross']]);
sp('makuhita','Makuhita',296,['fighting'],[72,42,30,25],.75,0,[[1,'tackle'],[1,'chop'],[1,'scratch'],[12,'brickbreak'],[24,'bite'],[30,'cross']],[24,'hariyama']);
sp('hariyama','Hariyama',297,['fighting'],[144,84,60,50],.3,2,[[1,'brickbreak'],[1,'cross'],[1,'quake'],[1,'icebeam']]);
sp('aron','Aron',304,['steel','rock'],[50,56,73,30],.75,0,[[1,'tackle'],[1,'metalclaw'],[1,'rock'],[12,'ironhead'],[24,'slide'],[30,'flashcannon']],[32,'lairon']);
sp('lairon','Lairon',305,['steel','rock'],[60,72,100,40],.45,1,[[1,'metalclaw'],[1,'rock'],[1,'ironhead'],[1,'bite'],[22,'slide'],[30,'flashcannon']],[42,'aggron']);
sp('aggron','Aggron',306,['steel','rock'],[70,88,126,50],.3,2,[[1,'ironhead'],[1,'flashcannon'],[1,'slide'],[1,'powergem']]);
sp('electrike','Electrike',309,['electric'],[40,56,40,65],.75,0,[[1,'tackle'],[1,'shock'],[1,'scratch'],[12,'spark'],[24,'bite'],[30,'bolt']],[26,'manectric']);
sp('manectric','Manectric',310,['electric'],[70,92,60,105],.3,2,[[1,'spark'],[1,'bolt'],[1,'surf'],[1,'shadow']]);
sp('numel','Numel',322,['fire','ground'],[60,63,43,35],.75,0,[[1,'tackle'],[1,'ember'],[1,'mud'],[12,'flamewheel'],[24,'dig'],[30,'flame']],[33,'camerupt']);
sp('camerupt','Camerupt',323,['fire','ground'],[70,103,73,40],.3,2,[[1,'flamewheel'],[1,'flame'],[1,'dig'],[1,'quake']]);
sp('trapinch','Trapinch',328,['ground'],[45,75,45,10],.75,0,[[1,'tackle'],[1,'mud'],[1,'scratch'],[12,'dig'],[24,'bite'],[30,'quake']],[35,'vibrava']);
sp('vibrava','Vibrava',329,['ground','dragon'],[50,61,50,70],.45,1,[[1,'mud'],[1,'dbreath'],[1,'dig'],[1,'bite'],[22,'dragon'],[30,'quake']],[45,'flygon']);
sp('flygon','Flygon',330,['ground','dragon'],[80,91,80,100],.3,2,[[1,'dig'],[1,'quake'],[1,'dragon'],[1,'dpulse']]);
sp('cacnea','Cacnea',331,['grass'],[50,85,40,35],.75,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[32,'cacturne']);
sp('cacturne','Cacturne',332,['grass','dark'],[70,115,60,55],.3,2,[[1,'razor'],[1,'energyball'],[1,'crunch'],[1,'darkpulse']]);
sp('swablu','Swablu',333,['normal','flying'],[45,40,68,50],.75,0,[[1,'tackle'],[1,'quick'],[1,'gust'],[12,'bite'],[24,'wing'],[30,'slam']],[35,'altaria']);
sp('altaria','Altaria',334,['dragon','flying'],[75,70,98,80],.3,2,[[1,'dragon'],[1,'dpulse'],[1,'wing'],[1,'airslash']]);
sp('feebas','Feebas',349,['water'],[20,13,39,80],.75,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[30,'milotic']);
sp('milotic','Milotic',350,['water'],[95,82,104,81],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'sludge'],[1,'quake']]);
sp('shuppet','Shuppet',353,['ghost'],[44,70,34,45],.75,0,[[1,'tackle'],[1,'lick'],[1,'scratch'],[12,'shadowclaw'],[24,'bite'],[30,'shadow']],[37,'banette']);
sp('banette','Banette',354,['ghost'],[64,101,64,65],.3,2,[[1,'shadowclaw'],[1,'shadow'],[1,'psychic'],[1,'flame']]);
sp('corphish','Corphish',341,['water'],[43,66,52,35],.75,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[30,'crawdaunt']);
sp('crawdaunt','Crawdaunt',342,['water','dark'],[63,106,72,55],.3,2,[[1,'bubblebeam'],[1,'surf'],[1,'crunch'],[1,'darkpulse']]);
sp('absol','Absol',359,['dark'],[65,105,60,75],.25,2,[[1,'crunch'],[1,'darkpulse'],[1,'sludge'],[1,'quake']]);
sp('sableye','Sableye',302,['dark','ghost'],[50,70,70,50],.4,1,[[1,'pursuit'],[1,'lick'],[1,'crunch'],[1,'bite'],[22,'shadowclaw'],[30,'darkpulse']]);
sp('bagon','Bagon',371,['dragon'],[45,59,46,50],.75,0,[[1,'tackle'],[1,'dbreath'],[1,'scratch'],[12,'dragon'],[24,'bite'],[30,'dpulse']],[30,'shelgon']);
sp('shelgon','Shelgon',372,['dragon'],[65,79,78,50],.45,1,[[1,'dbreath'],[1,'quick'],[1,'dragon'],[1,'bite'],[22,'psychic'],[30,'dpulse']],[40,'salamence']);
sp('salamence','Salamence',373,['dragon','flying'],[95,124,80,100],.12,3,[[1,'dragon'],[1,'dpulse'],[1,'wing'],[1,'airslash']]);
sp('beldum','Beldum',374,['steel','psychic'],[40,46,71,30],.75,0,[[1,'tackle'],[1,'metalclaw'],[1,'conf'],[12,'ironhead'],[24,'psybeam'],[30,'flashcannon']],[20,'metang']);
sp('metang','Metang',375,['steel','psychic'],[60,66,91,50],.45,1,[[1,'metalclaw'],[1,'conf'],[1,'ironhead'],[1,'bite'],[22,'psybeam'],[30,'flashcannon']],[40,'metagross']);
sp('metagross','Metagross',376,['steel','psychic'],[80,117,112,70],.12,3,[[1,'ironhead'],[1,'flashcannon'],[1,'psybeam'],[1,'psychic']]);
sp('turtwig','Turtwig',387,['grass'],[55,58,60,31],.55,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[18,'grotle']);
sp('grotle','Grotle',388,['grass'],[75,74,76,36],.4,1,[[1,'vine'],[1,'quick'],[1,'razor'],[1,'bite'],[22,'sludge'],[30,'energyball']],[32,'torterra']);
sp('torterra','Torterra',389,['grass','ground'],[95,94,96,56],.2,2,[[1,'razor'],[1,'energyball'],[1,'dig'],[1,'quake']]);
sp('chimchar','Chimchar',390,['fire'],[44,58,44,61],.55,0,[[1,'tackle'],[1,'ember'],[1,'scratch'],[12,'flamewheel'],[24,'bite'],[30,'flame']],[14,'monferno']);
sp('monferno','Monferno',391,['fire','fighting'],[64,78,52,81],.4,1,[[1,'ember'],[1,'chop'],[1,'flamewheel'],[1,'bite'],[22,'brickbreak'],[30,'flame']],[36,'infernape']);
sp('infernape','Infernape',392,['fire','fighting'],[76,104,71,108],.2,2,[[1,'flamewheel'],[1,'flame'],[1,'brickbreak'],[1,'cross']]);
sp('piplup','Piplup',393,['water'],[53,56,55,40],.55,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[16,'prinplup']);
sp('prinplup','Prinplup',394,['water'],[64,74,72,50],.4,1,[[1,'watergun'],[1,'quick'],[1,'bubblebeam'],[1,'bite'],[22,'sludge'],[30,'surf']],[36,'empoleon']);
sp('empoleon','Empoleon',395,['water','steel'],[84,100,95,60],.2,2,[[1,'bubblebeam'],[1,'surf'],[1,'ironhead'],[1,'flashcannon']]);
sp('shinx','Shinx',403,['electric'],[45,54,34,45],.75,0,[[1,'tackle'],[1,'shock'],[1,'scratch'],[12,'spark'],[24,'bite'],[30,'bolt']],[15,'luxio']);
sp('luxio','Luxio',404,['electric'],[60,74,49,60],.45,1,[[1,'shock'],[1,'quick'],[1,'spark'],[1,'bite'],[22,'quake'],[30,'bolt']],[30,'luxray']);
sp('luxray','Luxray',405,['electric'],[80,109,79,70],.3,2,[[1,'spark'],[1,'bolt'],[1,'quake'],[1,'icebeam']]);
sp('gible','Gible',443,['dragon','ground'],[58,56,45,42],.75,0,[[1,'tackle'],[1,'dbreath'],[1,'mud'],[12,'dragon'],[24,'dig'],[30,'dpulse']],[24,'gabite']);
sp('gabite','Gabite',444,['dragon','ground'],[68,72,60,82],.45,1,[[1,'dbreath'],[1,'mud'],[1,'dragon'],[1,'bite'],[22,'dig'],[30,'dpulse']],[40,'garchomp']);
sp('garchomp','Garchomp',445,['dragon','ground'],[108,108,90,102],.12,3,[[1,'dragon'],[1,'dpulse'],[1,'dig'],[1,'quake']]);
sp('riolu','Riolu',447,['fighting'],[40,54,40,60],.75,0,[[1,'tackle'],[1,'chop'],[1,'scratch'],[12,'brickbreak'],[24,'bite'],[30,'cross']],[28,'lucario']);
sp('lucario','Lucario',448,['fighting','steel'],[70,113,70,90],.3,2,[[1,'brickbreak'],[1,'cross'],[1,'ironhead'],[1,'flashcannon']]);
sp('croagunk','Croagunk',453,['poison','fighting'],[48,61,40,50],.75,0,[[1,'tackle'],[1,'sting'],[1,'chop'],[12,'sludge'],[24,'brickbreak'],[30,'sludgebomb']],[37,'toxicroak']);
sp('toxicroak','Toxicroak',454,['poison','fighting'],[83,97,65,85],.3,2,[[1,'sludge'],[1,'sludgebomb'],[1,'brickbreak'],[1,'cross']]);
sp('hippopotas','Hippopotas',449,['ground'],[68,57,62,32],.75,0,[[1,'tackle'],[1,'mud'],[1,'scratch'],[12,'dig'],[24,'bite'],[30,'quake']],[34,'hippowdon']);
sp('hippowdon','Hippowdon',450,['ground'],[108,92,97,47],.3,2,[[1,'dig'],[1,'quake'],[1,'icebeam'],[1,'bolt']]);
sp('yanma','Yanma',193,['bug','flying'],[65,70,45,95],.75,0,[[1,'tackle'],[1,'infest'],[1,'gust'],[12,'bug'],[24,'wing'],[30,'xscissor']],[33,'yanmega']);
sp('yanmega','Yanmega',469,['bug','flying'],[86,98,72,95],.3,2,[[1,'bug'],[1,'xscissor'],[1,'wing'],[1,'airslash']]);
sp('spiritomb','Spiritomb',442,['ghost','dark'],[50,92,108,35],.25,2,[[1,'shadowclaw'],[1,'shadow'],[1,'crunch'],[1,'darkpulse']]);
sp('magnezone','Magnezone',462,['electric','steel'],[70,103,104,60],.3,2,[[1,'spark'],[1,'bolt'],[1,'ironhead'],[1,'flashcannon']]);
sp('snivy','Snivy',495,['grass'],[45,45,55,63],.55,0,[[1,'tackle'],[1,'vine'],[1,'scratch'],[12,'razor'],[24,'bite'],[30,'energyball']],[17,'servine']);
sp('servine','Servine',496,['grass'],[60,60,75,83],.4,1,[[1,'vine'],[1,'quick'],[1,'razor'],[1,'bite'],[22,'cross'],[30,'energyball']],[36,'serperior']);
sp('serperior','Serperior',497,['grass'],[75,75,95,113],.2,2,[[1,'razor'],[1,'energyball'],[1,'cross'],[1,'slide']]);
sp('tepig','Tepig',498,['fire'],[65,55,45,45],.55,0,[[1,'tackle'],[1,'ember'],[1,'scratch'],[12,'flamewheel'],[24,'bite'],[30,'flame']],[17,'pignite']);
sp('pignite','Pignite',499,['fire','fighting'],[90,83,55,55],.4,1,[[1,'ember'],[1,'chop'],[1,'flamewheel'],[1,'bite'],[22,'brickbreak'],[30,'flame']],[36,'emboar']);
sp('emboar','Emboar',500,['fire','fighting'],[110,113,65,65],.2,2,[[1,'flamewheel'],[1,'flame'],[1,'brickbreak'],[1,'cross']]);
sp('oshawott','Oshawott',501,['water'],[55,59,45,45],.55,0,[[1,'tackle'],[1,'watergun'],[1,'scratch'],[12,'bubblebeam'],[24,'bite'],[30,'surf']],[17,'dewott']);
sp('dewott','Dewott',502,['water'],[75,79,60,60],.4,1,[[1,'watergun'],[1,'quick'],[1,'bubblebeam'],[1,'bite'],[22,'sludge'],[30,'surf']],[36,'samurott']);
sp('samurott','Samurott',503,['water'],[95,104,78,70],.2,2,[[1,'bubblebeam'],[1,'surf'],[1,'sludge'],[1,'quake']]);
sp('drilbur','Drilbur',529,['ground'],[60,60,43,68],.75,0,[[1,'tackle'],[1,'mud'],[1,'scratch'],[12,'dig'],[24,'bite'],[30,'quake']],[31,'excadrill']);
sp('excadrill','Excadrill',530,['ground','steel'],[110,97,63,88],.3,2,[[1,'dig'],[1,'quake'],[1,'ironhead'],[1,'flashcannon']]);
sp('zorua','Zorua',570,['dark'],[40,73,40,65],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'scratch'],[12,'crunch'],[24,'bite'],[30,'darkpulse']],[30,'zoroark']);
sp('zoroark','Zoroark',571,['dark'],[60,113,60,105],.3,2,[[1,'crunch'],[1,'darkpulse'],[1,'icebeam'],[1,'bolt']]);
sp('axew','Axew',610,['dragon'],[46,61,51,57],.75,0,[[1,'tackle'],[1,'dbreath'],[1,'scratch'],[12,'dragon'],[24,'bite'],[30,'dpulse']],[30,'fraxure']);
sp('fraxure','Fraxure',611,['dragon'],[66,82,61,67],.45,1,[[1,'dbreath'],[1,'quick'],[1,'dragon'],[1,'bite'],[22,'bolt'],[30,'dpulse']],[44,'haxorus']);
sp('haxorus','Haxorus',612,['dragon'],[76,108,81,97],.12,3,[[1,'dragon'],[1,'dpulse'],[1,'bolt'],[1,'psychic']]);
sp('deino','Deino',633,['dark','dragon'],[52,56,50,38],.75,0,[[1,'tackle'],[1,'pursuit'],[1,'dbreath'],[12,'crunch'],[24,'dragon'],[30,'darkpulse']],[34,'zweilous']);
sp('zweilous','Zweilous',634,['dark','dragon'],[72,76,70,58],.45,1,[[1,'pursuit'],[1,'dbreath'],[1,'crunch'],[1,'bite'],[22,'dragon'],[30,'darkpulse']],[48,'hydreigon']);
sp('hydreigon','Hydreigon',635,['dark','dragon'],[92,116,90,98],.12,3,[[1,'crunch'],[1,'darkpulse'],[1,'dragon'],[1,'dpulse']]);
sp('litwick','Litwick',607,['ghost','fire'],[50,49,55,20],.75,0,[[1,'tackle'],[1,'lick'],[1,'ember'],[12,'shadowclaw'],[24,'flamewheel'],[30,'shadow']],[30,'lampent']);
sp('lampent','Lampent',608,['ghost','fire'],[60,70,60,55],.45,1,[[1,'lick'],[1,'ember'],[1,'shadowclaw'],[1,'bite'],[22,'flamewheel'],[30,'shadow']],[41,'chandelure']);
sp('chandelure','Chandelure',609,['ghost','fire'],[60,104,90,80],.3,2,[[1,'shadowclaw'],[1,'shadow'],[1,'flamewheel'],[1,'flame']]);
sp('timburr','Timburr',532,['fighting'],[75,55,46,35],.75,0,[[1,'tackle'],[1,'chop'],[1,'scratch'],[12,'brickbreak'],[24,'bite'],[30,'cross']],[25,'gurdurr']);
sp('gurdurr','Gurdurr',533,['fighting'],[85,76,69,40],.45,1,[[1,'chop'],[1,'quick'],[1,'brickbreak'],[1,'bite'],[22,'psychic'],[30,'cross']],[40,'conkeldurr']);
sp('conkeldurr','Conkeldurr',534,['fighting'],[105,102,82,45],.3,2,[[1,'brickbreak'],[1,'cross'],[1,'psychic'],[1,'flame']]);
SP.golbat.evo = [34,'crobat'];
SP.scyther.evo = [30,'scizor'];
SP.magneton.evo = [40,'magnezone'];
SP.eevee.evo = [[20,'vaporeon'],[20,'jolteon'],[20,'flareon'],[20,'espeon'],[20,'umbreon'],[20,'leafeon'],[20,'glaceon']]; // várias opções: você escolhe

const BOSSES = [
  {id:'onix',title:'Ginásio da Rocha'},
  {id:'starmie',title:'Ginásio da Água'},
  {id:'raichu',title:'Ginásio Elétrico'},
  {id:'venusaur',title:'Ginásio da Planta'},
  {id:'alakazam',title:'Ginásio Psíquico'},
  {id:'gengar',title:'Ginásio Fantasma'},
  {id:'machamp',title:'Ginásio Lutador'},
  {id:'blastoise',title:'Ginásio Final'},
  {id:'dragonite',title:'Campeão'}
];
const ITEMS = {
  potion:{n:'Poção',d:'Cura 30 HP',price:30,ico:'🧪'},
  super:{n:'Super Poção',d:'Cura 80 HP',price:80,ico:'💊'},
  revive:{n:'Reviver',d:'Acorda um desmaiado com 50% do HP',price:180,ico:'✨'},
  candy:{n:'Doce Raro',d:'+2 níveis para um Pokémon',price:220,ico:'🍬'},
  ball:{n:'Pokébola',d:'Captura básica',price:20,ico:'🔴'},
  great:{n:'Grande Bola',d:'Captura 60% melhor',price:55,ico:'🔵'}
};
const RELICS = {
  claw:{n:'Garra Afiada',d:'+8% de dano por unidade',ico:'🗡️',max:4},
  shell:{n:'Casca Resistente',d:'Reduz dano dividindo por 1 + 0,08 por unidade',ico:'🛡️',max:3},
  feather:{n:'Pena Veloz',d:'+25% de velocidade (acumula)',ico:'🪶',max:3},
  leftovers:{n:'Sobras',d:'Cura 6% do HP máx. do ativo ao fim de cada turno (acumula)',ico:'🍎',max:3},
  amulet:{n:'Moeda Amuleto',d:'+25% de dinheiro por unidade',ico:'🪙',max:3},
  lens:{n:'Lente da Sorte',d:'+4 pontos percentuais de crítico por unidade',ico:'🍀',max:3},
  bait:{n:'Isca',d:'+25% de chance de captura (acumula)',ico:'🍖',max:3},
  sash:{n:'Faixa de Foco',d:'1x por batalha, sobrevive a um golpe fatal com 1 HP',ico:'🎗️',max:1},
  band:{n:'Faixa de Tipo',d:'O bônus de tipo (STAB) sobe de 1,5x para 1,65x',ico:'🎯',max:1},
  fang:{n:'Presa Vital',d:'Cura 10% do dano que você causa',ico:'🩸',max:1}
};
const STARTER_CATEGORIES = [
  {id:'kanto',n:'Kanto · 1ª geração'},
  {id:'johto',n:'Johto · 2ª geração'},
  {id:'hoenn',n:'Hoenn · 3ª geração'},
  {id:'sinnoh',n:'Sinnoh · 4ª geração'},
  {id:'unova',n:'Unova · 5ª geração'},
  {id:'extras',n:'Extras'}
];
const STARTERS = [
  ...['bulbasaur','charmander','squirtle'].map(id=>({id,category:'kanto'})),
  ...['chikorita','cyndaquil','totodile'].map(id=>({id,category:'johto'})),
  ...['treecko','torchic','mudkip'].map(id=>({id,category:'hoenn'})),
  ...['turtwig','chimchar','piplup'].map(id=>({id,category:'sinnoh'})),
  ...['snivy','tepig','oshawott'].map(id=>({id,category:'unova'})),
  {id:'pikachu',category:'extras',need:5},
  {id:'eevee',category:'extras',need:10},
  {id:'gastly',category:'extras',need:15}
];

// Ícones de itens (PokeAPI) embutidos em base64; se faltar algum, cai no emoji.

const iconHTML = (key, fb) => ITEM_SPR[key] ? `<img class="iico" src="${ITEM_SPR[key]}" alt="">` : fb;
Object.keys(ITEMS).forEach(k => { ITEMS[k].ico = iconHTML(k, ITEMS[k].ico); });
Object.keys(RELICS).forEach(k => { RELICS[k].ico = iconHTML(k, RELICS[k].ico); });
const MONEY_ICO = iconHTML('money', '💰');

const SAVE_STORAGE = ModeSaveStore.wrap(window.desktopAPI?.storage || localStorage);
const $app = document.getElementById('app');
const rnd = n => Math.floor(Math.random()*n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms / (CFG.speed||1)));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function loadMeta(){
  let j={};try{j=JSON.parse(SAVE_STORAGE.getItem(META_KEY)||'{}')||{};}catch{}
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(id=>SP[id]))]:[];
  const caught=ids(j.caught),seen=[...new Set([...ids(j.seen),...caught])];
  return {best:Math.max(0,j.best|0),runs:Math.max(0,j.runs|0),champ:!!j.champ,seen,caught,classicRuns:Array.isArray(j.classicRuns)?j.classicRuns:[],memorial:Array.isArray(j.memorial)?j.memorial:[],daily:j.daily||{},dailyRewards:Array.isArray(j.dailyRewards)?j.dailyRewards:[],teamBuilder:Array.isArray(j.teamBuilder)?j.teamBuilder:[],socialProfile:j.socialProfile||null,journeyRewards:Array.isArray(j.journeyRewards)?j.journeyRewards.filter(id=>typeof id==='string').slice(0,20):[],
    postgameRecords:Array.isArray(j.postgameRecords)?j.postgameRecords.filter(h=>h&&typeof h.id==='string'&&Array.isArray(h.team)).slice(0,100):[],completedPostgames:{classic:Math.max(0,Number(j.completedPostgames?.classic)||0),permadeath:Math.max(0,Number(j.completedPostgames?.permadeath)||0)},peak:Math.max(j.best|0,j.peak|0,0),championTeams:Array.isArray(j.championTeams)?j.championTeams.filter(t=>t&&typeof t.id==='string'&&Array.isArray(t.team)):[],history:Array.isArray(j.history)?j.history.filter(h=>h&&typeof h.id==='string'&&Array.isArray(h.team)).slice(0,100):[]};
}
function saveMeta(){ try{ SAVE_STORAGE.setItem(META_KEY, JSON.stringify(META)); }catch(e){} }
function loadCfg(){
  try{ return Object.assign({speed:1,sound:true,music:true,soundtrack:'hgss',shuffle:true}, JSON.parse(SAVE_STORAGE.getItem('umavida-cfg')||'{}'), {soundtrack:'hgss'}); }
  catch(e){ return {speed:1,sound:true,music:true,soundtrack:'hgss',shuffle:true}; }
}
function saveCfg(){ try{ SAVE_STORAGE.setItem('umavida-cfg', JSON.stringify(CFG)); }catch(e){} }

const META = loadMeta();
const CFG = loadCfg();
try{if(JSON.parse(SAVE_STORAGE.getItem('umavida-cfg')||'{}').soundtrack==='gb')saveCfg();}catch(e){}
let S = {screen:'title', msg:'', shop:false, sel:null};
let R = null, B = null, V = null;
let audioCtx = null;

const BASE_AVATARS=[1,4,7,25,133,152,155,158,252,255,258,387,390,393,495,498,501];
const ACHIEVEMENTS=[
 {id:'partner',name:'Primeiro parceiro',goal:'Registre seu primeiro Pokémon obtido.',title:'Companheiro',avatar:143,progress:()=>META.caught.length,target:1},
 {id:'explorer',name:'Olhar de explorador',goal:'Veja 25 espécies diferentes.',title:'Explorador',avatar:94,progress:()=>META.seen.length,target:25},
 {id:'collector',name:'Coleção em crescimento',goal:'Obtenha 10 espécies diferentes.',title:'Colecionador',avatar:448,progress:()=>META.caught.length,target:10},
 {id:'fighter',name:'Dez vitórias',goal:'Vença 10 batalhas em uma jornada (treinos não contam).',title:'Veterano',avatar:6,progress:()=>META.peak,target:10},
 {id:'champion',name:'Campeão da Liga',goal:'Conclua uma jornada como campeão.',title:'Campeão da Liga',avatar:149,progress:()=>META.champ?1:0,target:1}
];
const earnedAchievements=()=>ACHIEVEMENTS.filter(a=>a.progress()>=a.target);
const profileAvatars=()=>[...BASE_AVATARS,...earnedAchievements().map(a=>a.avatar)];
function dexRecord(id,owned=false){if(!SP[id])return;let changed=false;for(const list of owned?[META.seen,META.caught]:[META.seen])if(!list.includes(id)){list.push(id);changed=true;}if(changed)saveMeta();}
function recordTeam(){if(!R)return;R.team.forEach(m=>dexRecord(m.sp,true));if(R.pending)dexRecord(R.pending.sp,true);META.peak=Math.max(META.peak,R.won||0);saveMeta();}
function ensureRunId(){if(R&&!R.id)R.id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);}
function archiveRun(outcome,cause){
 if(!R)return;ensureRunId();if(META.history.some(h=>h.id===R.id))return;
 recordTeam();META.best=Math.max(META.best,R.won||0);META.runs++;if(outcome==='champion')META.champ=true;
 META.history.unshift({id:R.id,ended:new Date().toISOString(),started:R.started||null,outcome,cause,
 wins:R.won||0,captures:R.caught||0,team:R.team.map(m=>({sp:m.sp,lvl:m.lvl,hp:m.hp}))});META.history=META.history.slice(0,100);saveMeta();
}
function rJournal(){
 const tab=S.journal||'dex';
 let body='';
 if(tab==='dex'){
  const filter=S.dexFilter||'all';const entries=Object.values(SP).sort((a,b)=>a.dex-b.dex).filter(p=>filter==='caught'?META.caught.includes(p.id):filter==='seen'?META.seen.includes(p.id):true);
  body=`<p>${META.seen.length} vistos · ${META.caught.length} obtidos · ${Object.keys(SP).length} espécies disponíveis.</p><p class="tiny">Iniciais, capturas e evoluções contam como obtidos. Os registros permanecem após uma derrota.</p><div class="settings">${[['all','Todos'],['seen','Vistos'],['caught','Obtidos']].map(([v,n])=>`<button class="btn ${filter===v?'':'alt'}" data-act="dexFilter" data-v="${v}" aria-pressed="${filter===v}">${n}</button>`).join('')}</div><div class="journal-grid">${entries.map(p=>{const seen=META.seen.includes(p.id),caught=META.caught.includes(p.id);return `<article class="journal-card"><span>#${String(p.dex).padStart(3,'0')}</span>${seen?`<img src="${SPRITE(p.dex)}" alt="${esc(p.n)}"><strong>${esc(p.n)}</strong>${types({types:p.t})}`:'<div class="unknown-mon">?</div><strong>Não visto</strong>'}<small>${caught?'● Obtido':seen?'◉ Visto':'—'}</small></article>`}).join('')||'<p>Nenhum registro nesse filtro ainda.</p>'}</div>`;
 }else if(tab==='history'){
  body=`<p>Últimas 100 jornadas encerradas. Total de jornadas: ${META.runs}.</p><p class="tiny">Detalhes são registrados a partir desta atualização. Jornadas antigas permanecem apenas no contador.</p>${META.history.map(h=>`<article class="journal-entry"><h3>${h.outcome==='champion'?'★ Campeão':h.outcome==='abandoned'?'Jornada abandonada':'Fim da jornada'}</h3><p>${esc(new Date(h.ended).toLocaleString('pt-BR'))} · ${Number(h.wins)||0} vitórias · ${Number(h.captures)||0} capturas · ${h.mode==='classic'?'Clássico':'Permadeath'}</p><p>${esc(h.cause||'Motivo não registrado')}</p><div class="journal-team">${h.team.filter(m=>SP[m.sp]).map(m=>`<div><img src="${SPRITE(SP[m.sp].dex)}" alt=""><span>${esc(SP[m.sp].n)} · Nv. ${Number(m.lvl)||1}${m.hp<=0?' · Desmaiado':''}</span></div>`).join('')}</div></article>`).join('')||'<p>Ainda não há jornadas registradas. Continue sua aventura!</p>'}`;
 }else{
  body=`<p>Avatares e títulos desbloqueados podem ser escolhidos no perfil.</p><div class="journal-grid">${ACHIEVEMENTS.map(a=>{const earned=a.progress()>=a.target;return `<article class="journal-card ${earned?'earned':''}"><img src="${SPRITE(a.avatar)}" alt="Avatar ${a.name}"><strong>${esc(a.name)}</strong><p>${esc(a.goal)}</p><progress value="${Math.min(a.target,a.progress())}" max="${a.target}" aria-label="${esc(a.name)}"></progress><small>${earned?'✓ Desbloqueada':Math.min(a.target,a.progress())+' / '+a.target}</small><p class="tiny">Título: ${esc(a.title)}<br>Avatar: ${esc(Object.values(SP).find(p=>p.dex===a.avatar)?.n||'Pokémon')}</p></article>`}).join('')}</div>`;
 }
 return `<section class="panel"><div class="journal-heading"><h2>Diário do treinador</h2><button class="btn alt" data-act="journalBack">Voltar</button></div><nav class="settings" aria-label="Diário">${[['dex','Pokédex'],['history','Histórico'],['achievements','Conquistas']].map(([v,n])=>`<button class="btn ${tab===v?'':'alt'}" data-act="journal" data-v="${v}" aria-pressed="${tab===v}">${n}</button>`).join('')}</nav>${body}</section>`;
}

const relic = id => R?.mode==='classic'?0:(R?.relics?.[id]||0);
const active = () => R.team[R.active];
const nm = m => SP[m.sp].n;
const gymIndex = () => R ? Math.floor(R.battle / GYM_EVERY) : 0;
function nextIsBoss(){ return (R.battle+1) % GYM_EVERY === 0; }
function nextBoss(){ return BOSSES[Math.min(gymIndex(), BOSSES.length-1)]; }


let master = null, noiseB = null;
function ac(){
  const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
  audioCtx = audioCtx || new AC();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function bus(){ if(!master){ master = audioCtx.createGain(); master.gain.value = .9; master.connect(audioCtx.destination); } return master; }
const PULSE = {};
function setWave(a, o, type){
  const duty = {p12:.125, p25:.25, p50:.5}[type];
  if(!duty){ o.type = type; return; }          // ondas de pulso, como no Game Boy
  if(!PULSE[type]){
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for(let n=1;n<N;n++){ re[n] = Math.sin(2*Math.PI*n*duty)/(n*Math.PI); im[n] = (1-Math.cos(2*Math.PI*n*duty))/(n*Math.PI); }
    PULSE[type] = a.createPeriodicWave(re, im);
  }
  o.setPeriodicWave(PULSE[type]);
}
function tone(f, dur, type, t, vol, slide){
  const a = audioCtx, o = a.createOscillator(), g = a.createGain();
  setWave(a, o, type);
  o.frequency.setValueAtTime(f, t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t+dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t+.008);
  g.gain.exponentialRampToValueAtTime(.0001, t+dur);
  o.connect(g); g.connect(bus()); o.start(t); o.stop(t+dur+.02);
}
function nz(dur, t, vol, ftype, f0, f1){
  const a = audioCtx;
  if(!noiseB){ noiseB = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseB.getChannelData(0); for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1; }
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseB; fl.type = ftype;
  fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t+dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
  s.connect(fl); fl.connect(g); g.connect(bus()); s.start(t); s.stop(t+dur+.02);
}
// ['t', freq, ms, atraso, onda, vol, slide] = nota   |   ['n', ms, atraso, vol, filtro, f0, f1] = ruído
const ticks = (n, at) => Array.from({length:n}, (_, i) => ['t', 760, 16, at+i*60, 'p50', .04]); // barra de HP descendo
const HITSE = [['n',200,0,.75,'bandpass',3000,200],['n',140,70,.55,'bandpass',2200,180],['t',140,120,0,'p50',.3,45],['t',900,180,10,'p25',.1,260]];
const SFX = {
  click:[['t',1320,30,0,'p25',.07],['t',1760,40,30,'p25',.07]],
  start:[['n',500,0,.2,'bandpass',300,3000],['t',196,380,0,'p25',.12,784],['t',784,200,380,'p12',.1]],
  throw:[['n',260,0,.18,'bandpass',500,2200],['t',500,200,0,'p50',.08,900]],
  hit:[['n',120,0,.55,'bandpass',1800,250],['t',150,110,0,'p50',.25,50],...ticks(6,200)],
  hitSE:[...HITSE,...ticks(6,260)],
  hitNE:[['n',90,0,.28,'lowpass',900,180],['t',110,80,0,'p50',.14,60],...ticks(3,160)],
  crit:[...HITSE,['t',1500,60,0,'p12',.12],['t',1100,80,60,'p12',.12],...ticks(6,260)],
  miss:[['n',230,0,.2,'highpass',500,2600]],
  faint:[['t',620,520,0,'p25',.13,70],['n',300,300,.18,'lowpass',900,150]],
  win:[['t',523,100,0,'p25',.13],['t',659,100,110,'p25',.13],['t',784,100,220,'p25',.13],['t',1046,300,330,'p25',.13],['t',262,380,330,'p50',.08]],
  lose:[['t',392,220,0,'p25',.12],['t',330,220,220,'p25',.12],['t',262,220,440,'p25',.12],['t',196,520,660,'p25',.12]],
  levelup:[['t',784,80,0,'p25',.12],['t',988,80,80,'p25',.12],['t',1175,170,160,'p25',.12]],
  evo:[['t',523,90,0,'p25',.12],['t',659,90,90,'p25',.12],['t',784,90,180,'p25',.12],['t',1046,90,270,'p25',.12],['t',784,90,360,'p25',.12],['t',1046,90,450,'p25',.12],['t',1318,320,540,'p25',.12]],
  catch:[['n',70,0,.35,'lowpass',500,200],['n',70,480,.35,'lowpass',500,200],['n',70,960,.35,'lowpass',500,200],['t',784,90,1500,'p25',.12],['t',1046,220,1600,'p25',.12]],
  fail:[['n',250,0,.4,'bandpass',2500,300],['t',300,120,0,'p25',.1,120],['t',220,220,130,'p25',.1,110]],
  buy:[['t',988,60,0,'p12',.12],['t',1318,160,70,'p12',.12]],
  heal:[['t',523,70,0,'p12',.1],['t',659,70,70,'p12',.1],['t',784,70,140,'p12',.1],['t',1046,160,210,'p12',.1]]
};
let menuButtonAudio=null;
function menuActionSound(action, value){
  if(!CFG.sound)return;
  if(S.screen==='battle' && !(action==='bagUse' || (action==='menu' && (value==='bag' || B?.menu==='bag'))))return;
  try{
    if(!menuButtonAudio){menuButtonAudio=new Audio('assets/sfx/menu-a.mp3');menuButtonAudio.volume=.28;}
    menuButtonAudio.currentTime=0;
    const playing=menuButtonAudio.play();if(playing?.catch)playing.catch(()=>{});
  }catch{}
}
window.desktopMenuSound=()=>menuActionSound('profile');
function sfx(n){
  if(!CFG.sound) return;
  if(n==='evo' && MUSIC_FILES.evolution){ musicStart('evolution', false); return; }
  try{
    const a = ac(); if(!a) return; const t0 = a.currentTime;
    (SFX[n]||[]).forEach(e => { if(e[0]==='t') tone(e[1], e[2]/1000, e[4]||'p25', t0+e[3]/1000, e[5]||.14, e[6]); else nz(e[1]/1000, t0+e[2]/1000, e[3], e[4], e[5], e[6]); });
  }catch(e){}
}
// grito oficial do Pokémon (rate < 1 = mais grave, usado ao desmaiar)
function crySfx(m, rate=1){
  if(!CFG.sound || !m) return;
  const c = CRIES[SP[m.sp].dex]; if(!c) return;
  try{ const a = new Audio(c); a.volume = .25; a.playbackRate = rate; const pr = a.play(); if(pr && pr.catch) pr.catch(() => {}); }catch(e){}
}
// ── Música de batalha ──
// Trilhas HG/SS enviadas pelo usuário, normalizadas e embutidas para uso offline.



const MENU_TRACKS = [{"id": "title", "name": "Title Screen"}, {"id": "city1", "name": "Goldenrod City"}, {"id": "city2", "name": "Violet City"}, {"id": "city3", "name": "Cianwood City"}, {"id": "city4", "name": "Ecruteak City"}, {"id": "city5", "name": "Cherrygrove City"}, {"id": "city6", "name": "Azalea Town"}, {"id": "city7", "name": "New Bark Town"}, {"id": "city8", "name": "Pewter City"}, {"id": "city9", "name": "Cerulean City"}, {"id": "city10", "name": "Celadon City"}, {"id": "city11", "name": "Vermilion City"}, {"id": "city12", "name": "Lavender Town"}, {"id": "city13", "name": "Pallet Town"}];
const CITY_TRACKS = ["city1", "city2", "city3", "city4", "city5", "city6", "city7", "city8", "city9", "city10", "city11", "city12", "city13"];
const NIDX = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};
const hz = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 440*Math.pow(2,(NIDX[m[1]]+(m[2]?1:0)+12*(m[3]-4))/12); };
const parse = s => s.split('|').map(b => b.split(' '));
const TRACKS = {
  // selvagem: mais leve, em Lá menor
  wild:{ bpm:156, wave:'p25', pump:false,
    lead:parse('A4 - C5 - E5 - C5 A4|G4 - B4 - D5 - B4 G4|F4 - A4 - C5 - A4 F4|E4 G#4 B4 E5 - B4 G#4 E4|A4 C5 E5 A5 - E5 C5 E5|G4 B4 D5 G5 - D5 B4 D5|F4 A4 C5 F5 E5 D5 C5 A4|E5 - D5 - C5 - B4 -'),
    bass:['A2','G2','F2','E2','A2','G2','F2','E2'] },
  // treinador/chefe: mais rápida e pesada, em Mi menor
  boss:{ bpm:172, wave:'p50', pump:true,
    lead:parse('E5 G5 B5 G5 E5 G5 B5 G5|E5 G5 C6 G5 E5 G5 C6 G5|F#5 A5 D6 A5 F#5 A5 D6 A5|F#5 B5 D#6 B5 A5 B5 D#6 B5|B5 - B5 A5 G5 - E5 G5|G5 - G5 E5 C5 - E5 G5|A5 - A5 F#5 D5 - F#5 A5|B5 A5 G5 F#5 D#5 - B4 -'),
    bass:['E2','C2','D2','B1','E2','C2','D2','B1'] }
};
TRACKS.champion = Object.assign({}, TRACKS.boss, {bpm:184});
const BATTLE_PLAYLIST = ['wild','wildKanto','trainerJohto','trainerKanto','champion'];
function chooseBattleTrack(boss, enemy){
  if(boss) return enemy.sp==='dragonite' ? 'champion' : pick(['boss','bossKanto']);
  return pick(BATTLE_PLAYLIST);
}
function victoryKind(battle){
  return battle.boss ? 'victoryBoss' : /^(trainer|rival|champion)/.test(battle.musicTrack||'') ? 'victoryTrainer' : 'victoryWild';
}
function soundtrackButton(){ return ''; }
const musicKind = (boss, e) => B && B.musicTrack ? B.musicTrack : boss ? (e && e.sp==='dragonite' ? 'champion' : 'boss') : 'wild';
let musTimer = null, musT = 0, musI = 0, musKind = 'wild', musAudio = null, musSynthReady = false, musTrackId = null;
function musicTick(){
  const a = audioCtx; if(!a || !CFG.sound || !CFG.music){ musicPause(); return; }
  const T = TRACKS[musKind], ed = 60/T.bpm/2;
  while(musT < a.currentTime + .3){
    const bar = Math.floor(musI/8)%8, st = musI%8, n = T.lead[bar][st];
    if(n !== '-') tone(hz(n), ed*.85, T.wave, musT, .05);
    const root = hz(T.bass[bar]), up = T.pump ? st%2===1 : (st===2||st===6);
    tone(up ? root*2 : root, ed*.9, 'triangle', musT, .085);
    if(T.pump ? st%2===0 : (st===0||st===4)) tone(130, .12, 'sine', musT, .13, 45);
    if(st===2||st===6) nz(.09, musT, .09, 'bandpass', 1800, 900);
    if(st%2===1) nz(.03, musT, .035, 'highpass', 7000, 7000);
    musT += ed; musI++;
  }
}
function musicPause(){
  if(musTimer){ clearInterval(musTimer); musTimer = null; }
  if(musAudio){ try{ musAudio.pause(); }catch(e){} }
}
let audioNotice = '';
function showAudioNotice(message){
  audioNotice = message;
  const node = document.getElementById('audio-notice');
  if(node) node.textContent = message;
}
function musicSync(){
  if(!CFG.sound || !CFG.music){ musicPause(); return; }
  if(musAudio){
    if(musAudio.ended) return;
    if(musAudio.paused){
      try{
        const playing = musAudio;
        const pr = playing.play();
        if(pr && pr.then) pr.then(() => { if(musAudio===playing) showAudioNotice(''); }).catch(error => {
          if(musAudio!==playing || error.name==='AbortError') return;
          showAudioNotice(error.name==='NotAllowedError' ? 'Clique em Ativar áudio para ouvir.' : 'Não foi possível reproduzir o áudio.');
        });
      }catch(e){ showAudioNotice('Não foi possível iniciar o áudio. Clique em Ativar áudio.'); }
    }
  } else if(musSynthReady && !musTimer){
    try{ const a = ac(); if(!a) return; musT = a.currentTime + .15; musTimer = setInterval(musicTick, 60); }catch(e){}
  }
}
function musicSynth(kind){
  musKind = kind; musI = 0; musSynthReady = true; musicSync();
}
function musicStart(kind, loop=true){
  musicStop(); musTrackId = kind;
  if(CITY_TRACKS.includes(kind)) lastMenuCity = kind;
  const fallback = kind==='wildKanto' ? 'wild' : /^(trainer|rival|bossKanto)/.test(kind) ? 'boss' : kind;
  const bank = MUSIC_FILES;
  const alias = kind==='bossKanto' ? 'boss' : kind==='rival' ? 'trainerJohto' : kind;
  const file = MENU_MUSIC[kind] || bank[kind] || bank[alias] || MUSIC_FILES[kind] || '';
  if(file){
    try{
      const au = new Audio(file); au.loop = loop; au.volume = .3; musAudio = au;
      au.onerror = () => { if(musAudio===au){ showAudioNotice('Esta faixa de áudio está indisponível.'); musAudio = null; if(TRACKS[fallback]) musicSynth(fallback); } }; // arquivo não achado: usa a faixa do jogo
      if(MENU_MUSIC[kind]) au.onended = () => { if(musAudio===au && menuPlayerVisible()) playCityMusic(kind); };
      au.onplay = au.onpause = au.ontimeupdate = au.onloadedmetadata = () => { if(musAudio===au) updatePlaylistStatus(); };
      musicSync();
      return;
    }catch(e){}
  }
  if(TRACKS[fallback]) musicSynth(fallback);
}
function musicStop(){
  musicPause();
  musAudio = null; musSynthReady = false; musI = 0; musTrackId = null;
}
function playCityMusic(previous){
  const i = CITY_TRACKS.indexOf(previous);
  const next = CFG.shuffle!==false ? pick(CITY_TRACKS.filter(id=>id!==previous)) : CITY_TRACKS[(i+1)%CITY_TRACKS.length];
  musicStart(next, false);
  refreshPlaylist();
}
// A troca de tela tem prioridade sobre a escolha feita na playlist anterior.
let musicScreen = null, lastMenuCity = null;
function screenMusic(){
  const context = S.screen==='hub' && S.shop ? 'shop' : S.screen;
  const changed = context!==musicScreen;
  musicScreen = context;
  if(context==='shop'){
    if(changed || musTrackId!=='pokeMart') musicStart('pokeMart');
  } else if(context==='title'){
    if(changed || !MENU_MUSIC[musTrackId] || ['pokeCenter','pokeMart'].includes(musTrackId)) musicStart('title');
  } else if(['starter','hub','journal','character','modeSelect','trainerName','camp','trainerCard','routes','missions','journeyEvent'].includes(context) && !EVOLVING){
    if(changed || !MENU_MUSIC[musTrackId] || ['pokeCenter','pokeMart'].includes(musTrackId)) playCityMusic(lastMenuCity);
  }
}
const menuPlayerVisible = () => ['title','starter','hub','journal','character','modeSelect','trainerName','camp','trainerCard','routes','missions','journeyEvent'].includes(S.screen) && !(S.screen==='hub' && S.shop);
const trackTime = value => { const t=Number.isFinite(value)?Math.max(0,Math.floor(value)):0; return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`; };
function playlistContent(){
  const current=MENU_TRACKS.find(t=>t.id===musTrackId);
  const playing=!!(musAudio && !musAudio.paused && CFG.sound && CFG.music);
  return `<div class="playlist-heading"><div><p class="playlist-label">TRILHA DO MENU · ${MENU_TRACKS.length} FAIXAS</p><h2>${current?current.name:'Escolha uma música'}</h2></div><span aria-hidden="true" class="playlist-disc">♫</span></div>
    <div class="playlist-status"><span id="playlist-state">${playing?'Tocando agora':'Pausado'}</span><span id="playlist-time">${trackTime(musAudio?.currentTime)} / ${trackTime(musAudio?.duration)}</span></div>
    <div class="row playlist-controls">
      <button class="btn alt" data-act="menuPrev" aria-label="Música anterior">◀ Anterior</button>
      <button class="btn gold" data-act="menuPlay" id="playlist-play">${playing?'Ⅱ Pausar':'▶ Reproduzir'}</button>
      <button class="btn alt" data-act="menuNext" aria-label="Próxima música">Próxima ▶</button>
      <button class="btn alt" data-act="menuShuffle" aria-pressed="${CFG.shuffle!==false}">Aleatório: ${CFG.shuffle!==false?'ligado':'desligado'}</button>
    </div>
    <div class="playlist-list" role="group" aria-label="Músicas disponíveis">${MENU_TRACKS.map((t,i)=>`<button class="playlist-track ${t.id===musTrackId?'current':''}" data-act="menuTrack" data-v="${t.id}" aria-pressed="${t.id===musTrackId}"><span class="track-number">${t.id===musTrackId?'♫':String(i+1).padStart(2,'0')}</span><span>${t.name}</span><small>${i===0?'Abertura':'Cidade'}</small></button>`).join('')}</div>`;
}
let playlistOpen=false;
function rPlaylist(){
  const shop=S.screen==='hub' && S.shop;
  if(!menuPlayerVisible() && !shop){playlistOpen=false;return '';}
  return `<aside class="playlist-dock"><button class="playlist-toggle" data-act="playlistToggle" aria-label="Abrir playlist" aria-expanded="${playlistOpen}" title="Músicas">♫</button>${playlistOpen?`<section class="panel playlist playlist-popup" aria-label="Playlist"><div class="playlist-popup-header"><strong>Músicas</strong><button class="btn alt tiny" data-act="playlistClose">Fechar</button></div>${shop?'<p class="playlist-label">TRILHA DA LOJA</p><h2>♫ Poké Mart</h2>':`<div id="menu-player">${playlistContent()}</div>`}</section>`:''}</aside>`;
}
function refreshPlaylist(){
  const box=document.getElementById('menu-player'); if(!box) return;
  const list=box.querySelector('.playlist-list'), scroll=list?list.scrollTop:0;
  box.innerHTML=playlistContent(); box.querySelector('.playlist-list').scrollTop=scroll;
}
function updatePlaylistStatus(){
  const playing=!!(musAudio && !musAudio.paused && CFG.sound && CFG.music);
  const status=document.getElementById('playlist-state'),time=document.getElementById('playlist-time'),button=document.getElementById('playlist-play');
  if(status) status.textContent=playing?'Tocando agora':'Pausado';
  if(time) time.textContent=`${trackTime(musAudio?.currentTime)} / ${trackTime(musAudio?.duration)}`;
  if(button) button.textContent=playing?'Ⅱ Pausar':'▶ Reproduzir';
}
function selectMenuTrack(id){
  if(!menuPlayerVisible() || !MENU_TRACKS.some(t=>t.id===id)) return;
  CFG.sound=true; CFG.music=true; saveCfg();
  if(id===musTrackId && musAudio && !musAudio.ended) musicSync();
  else musicStart(id, false);
}
let LAST_EVO = false;

function persist(){
  if(!R || S.screen==='battle' || S.screen==='title' || S.screen==='gameover' || S.screen==='win'){
    if(S.screen==='gameover' || S.screen==='win' || S.screen==='title') try{ SAVE_STORAGE.removeItem(SAVE_KEY); }catch(e){}
    return;
  }
  try{ SAVE_STORAGE.setItem(SAVE_KEY, JSON.stringify({R,S,V})); }catch(e){}
}
function hasSave(){ try{ return !!SAVE_STORAGE.getItem(SAVE_KEY); }catch(e){ return false; } }
function continueSave(){
  const j = JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY));
  R = j.R; S = j.S; V = j.V || null; B = null; ensureRunId();recordTeam();
  if(S.screen==='battle') S.screen = 'hub';
  if(j.inBattle && j.training){R.team.forEach((m,i)=>{if(j.trainingLiving?j.trainingLiving.includes(i):m.hp>0){m.hp=m.maxHp;m.ailment=null;}});S.screen='hub';S.shop=false;S.msg='Treino interrompido. A tentativa foi consumida, sem recompensa.';persist();}
  else if(j.inBattle) gameOver('left');
}

function known(s, L){ const ids=[]; (s.mv||[]).forEach(([l,id]) => { if(l && l<=L && M[id] && !ids.includes(id)) ids.push(id); }); return ids.slice(-4); }
function recalc(m){
  const s = SP[m.sp], L = m.lvl, old = m.maxHp || 0;
  const st = b => Math.floor(b*2*L/100)+5;
  m.maxHp = Math.floor(s.b[0]*2*L/100)+L+10;
  m.atk = st(s.b[1]); m.def = st(s.b[2]); m.spe = st(s.b[3]);
  m.types = s.t; m.moves = known(s, L);
  if(old) m.hp = Math.min(m.maxHp, m.hp + (m.maxHp-old));
}
function mk(id, L){ const m = {sp:id, lvl:L, hp:0, xp:0}; recalc(m); m.hp = m.maxHp; return m; }
const evoOpts = s => !s.evo ? [] : Array.isArray(s.evo[0]) ? s.evo : [s.evo];
let evoReady = m => evoOpts(SP[m.sp]).filter(o => m.lvl >= o[0]);
function canEvolve(m){ return m.hp > 0 && evoReady(m).length > 0; }
function levelUp(m, n, notes){
  const before = known(SP[m.sp], m.lvl);
  m.lvl += n; recalc(m);
  notes.push(`${nm(m)} subiu para o nível ${m.lvl}.`);
  known(SP[m.sp], m.lvl).forEach(id => { if(!before.includes(id)) notes.push(`${nm(m)} aprendeu ${M[id].n}!`); });
  if(canEvolve(m)) notes.push(`${nm(m)} pode evoluir para ${evoReady(m).map(o => SP[o[1]].n).join(' ou ')}!`);
}

// ── Evolução: você escolhe quando, com animação estilo jogos (dá para cancelar) ──
function evoPanel(){
  const list = R.team.map((m,i) => ({m,i})).filter(o => canEvolve(o.m));
  if(!list.length) return '';
  return `<section class="panel"><h2>Evolução disponível</h2><div class="list">${list.map(o => {
    const opts = evoReady(o.m);
    return `<div class="item"><div><b>${nm(o.m)}</b> Nv ${o.m.lvl} <span class="mute">pode evoluir</span></div><div class="row">${opts.map((p,k) => `<button class="btn gold" data-act="evolve" data-v="${o.i}:${k}">${opts.length>1 ? SP[p[1]].n : 'Evoluir para '+SP[p[1]].n}</button>`).join('')}</div></div>`;
  }).join('')}</div></section>`;
}
function evoJingle(iv){
  if(!CFG.sound) return;
  try{
    const a = ac(); if(!a) return; const sp = CFG.speed || 1;
    let t = a.currentTime + .45/sp, f = 392;
    iv.forEach((ms,i) => { const d = ms/1000/sp; tone(i%2 ? f*1.5 : f, d*.9, 'p25', t, .09); t += d; f *= 1.045; });
  }catch(e){}
}
let EVOLVING = false;
async function evolveMon(m, k=0){
  if(EVOLVING || !m || !canEvolve(m)) return;
  EVOLVING = true;
  const opt = evoReady(m)[k] || evoReady(m)[0];
  const toId = opt[1], fromN = nm(m), toN = SP[toId].n;
  const ov = document.createElement('div');
  ov.className = 'evo'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','Evolução');
  ov.innerHTML = `<div class="evo-stage"><div class="evo-glow"></div><img alt="" class="a" src="${SPRITE(SP[m.sp].dex,false)}"><img alt="" class="b" src="${SPRITE(SP[toId].dex,false)}" style="opacity:0"></div><div class="evo-text"></div><button class="btn">Cancelar (Esc)</button>`;
  document.body.appendChild(ov);
  const A = ov.querySelector('.a'), Bi = ov.querySelector('.b'), T = ov.querySelector('.evo-text'), btn = ov.querySelector('button');
  let cancelled = false;
  const stop = () => { cancelled = true; };
  const onKey = e => { if(e.key==='Escape') stop(); };
  btn.onclick = stop; document.addEventListener('keydown', onKey); btn.focus();
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waitClick = label => new Promise(res => { btn.textContent = label; btn.onclick = res; btn.focus(); });
  T.textContent = `O que? ${fromN} está evoluindo!`;
  crySfx(m);
  await sleep(1700);
  if(!cancelled){
    ov.classList.add('on'); A.classList.add('sil'); Bi.classList.add('sil');
    const iv = reduce ? [400,400,400] : [420,380,340,300,260,220,190,160,140,120,100,90,80,70,60,60,60,60,60,60];
    musicStart('evolving');
    await sleep(450);
    let showB = false;
    for(const ms of iv){
      if(cancelled) break;
      showB = !showB; A.style.opacity = showB ? 0 : 1; Bi.style.opacity = showB ? 1 : 0;
      await sleep(ms);
    }
  }
  if(cancelled){
    ov.classList.remove('on'); A.classList.remove('sil'); A.style.opacity = 1; Bi.style.opacity = 0;
    T.textContent = `Hm? A evolução de ${fromN} foi interrompida!`;
    sfx('fail');
    await waitClick('Continuar');
  } else {
    ov.classList.remove('on'); ov.classList.add('flash'); await sleep(160); ov.classList.remove('flash');
    Bi.classList.remove('sil'); Bi.style.opacity = 1; A.style.opacity = 0;
    const before = known(SP[m.sp], m.lvl);
    m.sp = toId; recalc(m);dexRecord(toId,true);
    const learned = known(SP[m.sp], m.lvl).filter(id => !before.includes(id)).map(id => M[id].n);
    T.textContent = `Parabéns! ${fromN} evoluiu para ${toN}!` + (learned.length ? ` Aprendeu ${learned.join(', ')}.` : '');
    sfx('evo'); crySfx(m);
    await waitClick('Continuar');
  }
  document.removeEventListener('keydown', onKey);
  ov.remove(); EVOLVING = false; musicStop();
  persist(); render();
}

function newRun(starterId){
  R = {mode:S.pendingMode||ModeSaveStore.current(),postgame:S.pendingFormat==='double',battle:0, won:0, caught:0, money:60, team:[mk(starterId,5)], active:0,
       bag:{potion:2,ball:3,great:0,super:0,revive:0,candy:0}, relics:{}, shop:null, reward:null, pending:null};
  R.started=new Date().toISOString();ensureRunId();recordTeam();
  S = {screen:'hub', msg:'Sua jornada começou. Batalhe quando quiser.', shop:false, sel:null};
  persist();
}
function genShop(){
  const items = ['potion','super','ball','great'].map(id => ({kind:'item',id,price:ITEMS[id].price,once:false}));
  const rl = shuffle(Object.keys(RELICS).filter(id => relic(id) < RELICS[id].max)).slice(0,2)
    .map(id => ({kind:'relic',id,price:120+rnd(5)*20,once:true}));
  const rare = pick(['revive','candy']);
  return items.concat(rl, [{kind:'item',id:rare,price:ITEMS[rare].price,once:true}]);
}
function genReward(boss){
  if(R?.mode==='classic')return [];
  const rel = shuffle(Object.keys(RELICS).filter(id => relic(id) < RELICS[id].max)).map(id => ({kind:'relic',id}));
  let items = boss
    ? [{kind:'item',id:'revive',q:1},{kind:'item',id:'candy',q:2},{kind:'item',id:'super',q:2},{kind:'item',id:'great',q:3}]
    : [{kind:'item',id:'potion',q:3},{kind:'item',id:'super',q:1},{kind:'item',id:'ball',q:4},{kind:'item',id:'great',q:2},
       {kind:'item',id:'candy',q:1},{kind:'item',id:'revive',q:1},{kind:'money',amt:40+R.battle*8}];
  items = shuffle(items);
  const out = [];
  if(boss){ rel.slice(0,3).forEach(r => out.push(r)); }
  else { if(rel.length) out.push(rel.shift()); if(rel.length && Math.random()<.5) out.push(rel.shift()); }
  while(out.length<3 && items.length) out.push(items.shift());
  while(out.length<3 && rel.length) out.push(rel.shift());
  return out.slice(0,3);
}

const TRAIN_LIMIT=3;
function trainingLeft(){
  return R.trainStage===R.battle ? Math.max(0,TRAIN_LIMIT-(R.trainUsed||0)) : TRAIN_LIMIT;
}
function endTraining(message){
  R.team.forEach((m,i)=>{if(B?.trainingLiving?.includes(i)){m.hp=m.maxHp;m.ailment=null;m.stages={};m.choiceMove=null;}});
  musicStop();B=null;V=null;S.screen='hub';S.shop=false;S.sel=null;S.msg=message;persist();render();
}
function startBattle(train){
  if(S.screen!=='hub')return;
  if(train){
    if(!trainingLeft()){S.msg='Treinos esgotados. Vença uma batalha da jornada para liberar mais 3.';return;}
    if(R.trainStage!==R.battle){R.trainStage=R.battle;R.trainUsed=0;}
    R.trainUsed=(R.trainUsed||0)+1;
  }
  const n = R.battle+1, boss = !train && n % GYM_EVERY === 0;
  let id, L; const baseL = 3+Math.floor(n*1.2);
  if(boss){
    const k = n/GYM_EVERY-1;
    const b = BOSSES[Math.min(k, BOSSES.length-1)];
    id = b.id; L = baseL+2+Math.max(0, k-(BOSSES.length-1))*3;
  } else {
    const tier = n<6 ? 0 : n<12 ? 1 : n<20 ? 2 : 3;
    id = pick(Object.values(SP).filter(s => s.w<=tier).map(s => s.id));
    L = Math.max(2, baseL+rnd(3)-1);
  }
  const e = mk(id, L);dexRecord(id);R.lastEnemy=id;
  if(boss){ e.maxHp = Math.floor(e.maxHp*1.28); e.hp = e.maxHp; }
  if(R.team[R.active].hp<=0) R.active = Math.max(0, R.team.findIndex(m => m.hp>0));
  B = {enemy:e, boss, train:!!train, used:[], log:[], lock:false, sash:false, fx:null, menu:'moves', forced:false, caught:false, title: boss ? (BOSSES[Math.min(n/GYM_EVERY-1, BOSSES.length-1)].title) : ''};
  B.musicTrack = chooseBattleTrack(boss, e);
  B.log.push(boss ? `${B.title}! ${nm(e)} entra em campo!` : (train ? `Treino: um ${nm(e)} selvagem apareceu!` : `Um ${nm(e)} selvagem apareceu!`));
  B.used.push(active());
  B.log.push(`Vai, ${nm(active())}!`);
  try{ SAVE_STORAGE.setItem(SAVE_KEY, JSON.stringify({R, S:Object.assign({}, S, {screen:'hub', shop:false, sel:null, msg:''}), V, inBattle:true, training:!!train})); }catch(e){}
  S.screen='battle'; S.sel=null; S.msg='';
  sfx('start'); crySfx(B.enemy); setTimeout(() => { if(B) crySfx(active()); }, 900); musicStart(musicKind(boss, e));
}
const label = (m,isP) => isP ? nm(m) : (B.boss ? `Chefe ${nm(m)}` : `${nm(m)} selvagem`);
async function say(t, ms=520){ B.log.push(t); render(); await sleep(ms); }

function dmgCalc(att, def, mv, pl){
  const base = Math.floor(((2*att.lvl/5+2)*mv.p*att.atk/def.def)/50)+2;
  const stab = att.types.includes(mv.t) ? (pl && relic('band') ? 2 : 1.5) : 1;
  const e = eff(mv.t, def.types);
  const crit = Math.random() < (1/16 + (pl ? .12*relic('lens') : 0));
  const mult = pl ? Math.pow(1.15, relic('claw')) : Math.pow(.85, relic('shell'));
  let d = Math.floor(base*stab*e*(crit?1.5:1)*(.85+Math.random()*.15)*mult);
  d = e>0 ? Math.max(1,d) : 0;
  return {d, e, crit};
}
function pickEnemyMove(e, p){
  const opts = e.moves.map(id => { const m=M[id]; return {id, score:m.p*eff(m.t,p.types)*(e.types.includes(m.t)?1.5:1)*(m.a/100)}; });
  if(Math.random()<.7){ opts.sort((a,b) => b.score-a.score); return opts[0].id; }
  return pick(opts).id;
}
async function attack(isP, mvId){
  const att = isP ? active() : B.enemy, def = isP ? B.enemy : active(), mv = M[mvId];
  await say(`${label(att,isP)} usou ${mv.n}!`);
  if(Math.random()*100 >= mv.a){ sfx('miss'); await say('Mas errou!'); return; }
  const r = dmgCalc(att, def, mv, isP);
  if(r.e===0){ await say(`Não afeta ${label(def,!isP)}...`); return; }
  const before = def.hp;
  def.hp = Math.max(0, def.hp-r.d);
  if(!isP && def.hp===0 && relic('sash') && !B.sash){ B.sash = true; def.hp = 1; B.log.push('A Faixa de Foco segurou o golpe!'); }
  if(isP && relic('fang')){ const h = Math.max(1, Math.floor((before-def.hp)*.1)); att.hp = Math.min(att.maxHp, att.hp+h); }
  B.fx = isP ? 'e' : 'p'; sfx(r.crit ? 'crit' : r.e>1 ? 'hitSE' : r.e<1 ? 'hitNE' : 'hit'); render(); await sleep(350); B.fx = null;
  if(r.crit) await say('Acerto crítico!', 380);
  if(r.e>1) await say('É super efetivo!', 380); else if(r.e<1) await say('Não foi muito efetivo...', 380);
}
const speedOf = (m,isP) => m.spe*(isP ? 1+.25*relic('feather') : 1);

async function playerMove(i){
  if(B.lock) return; B.lock = true;
  const pm = active(), em = B.enemy;
  const pId = pm.moves[i], eId = pickEnemyMove(em, pm);
  const pp = M[pId].pri||0, ep = M[eId].pri||0;
  let pFirst = pp!==ep ? pp>ep : (speedOf(pm,true)!==speedOf(em,false) ? speedOf(pm,true)>speedOf(em,false) : Math.random()<.5);
  const seq = pFirst ? [[true,pId],[false,eId]] : [[false,eId],[true,pId]];
  for(const [isP,id] of seq){
    if(pm.hp<=0 || em.hp<=0) break;
    await attack(isP, id);
  }
  await resolveEnd();
}
async function enemyTurn(){
  await attack(false, pickEnemyMove(B.enemy, active()));
  await resolveEnd();
}
async function resolveEnd(){
  const pm = active(), em = B.enemy;
  if(em.hp<=0){ sfx('faint'); crySfx(em, .75); await say(`${label(em,false)} desmaiou!`); finishWin(null); B.lock=false; render(); return; }
  if(pm.hp<=0){
    sfx('faint'); crySfx(pm, .75); await say(`${nm(pm)} desmaiou!`);
    if(B.train){pm.hp=pm.maxHp;endTraining(`${nm(pm)} se recuperou com HP cheio. Treino encerrado, sem recompensa.`);return;}
    if(!R.team.some(m => m.hp>0)){ gameOver(); return; }
    B.forced = true; B.menu = 'switch'; B.lock = false; render(); return;
  }
  const lf = relic('leftovers');
  if(lf && pm.hp<pm.maxHp){ pm.hp = Math.min(pm.maxHp, pm.hp+Math.max(1,Math.floor(pm.maxHp*.06*lf))); await say(`As Sobras restauraram o HP de ${nm(pm)}.`, 420); }
  B.lock = false; B.menu = 'moves'; render();
}
async function doSwitch(i){
  if(B.lock) return; B.lock = true;
  const old = active(); R.active = i; B.menu = 'moves';
  if(!B.used.includes(active())) B.used.push(active());
  crySfx(active());
  if(B.forced){ B.forced = false; await say(`Vai, ${nm(active())}!`); B.lock = false; render(); return; }
  await say(`Volta, ${nm(old)}! Vai, ${nm(active())}!`);
  await enemyTurn();
}
async function useBattleItem(id){
  if(B.lock || !R.bag[id]) return;
  const pm = active(); if(pm.hp>=pm.maxHp) return;
  B.lock = true; R.bag[id]--; B.menu = 'moves';
  const h = id==='super' ? 80 : 30; pm.hp = Math.min(pm.maxHp, pm.hp+h);
  sfx('heal'); await say(`Você usou ${ITEMS[id].n} em ${nm(pm)}.`);
  await enemyTurn();
}
async function throwBall(id){
  if(B.lock || B.boss || B.train || !R.bag[id]) return;
  B.lock = true; R.bag[id]--; B.menu = 'moves';
  const em = B.enemy; sfx('throw');
  await say(`Você lançou uma ${ITEMS[id].n}!`);
  let p = SP[em.sp].c*(id==='great'?1.6:1)*(1-.65*em.hp/em.maxHp)*(1+.25*relic('bait'));
  p = Math.min(.92, Math.max(.05, p));
  await sleep(400);
  if(Math.random()<p){
    const caught = JSON.parse(JSON.stringify(em));
    if(caught.hp<=0) caught.hp = 1;
    sfx('catch');
    await say(`Pegou ${nm(em)}!`);
    finishWin(caught);
    B.lock = false; render();
  } else {
    sfx('fail'); await say(`${nm(em)} escapou!`);
    await enemyTurn();
  }
}
const fleeCost = () => 10 + R.battle*3;
async function flee(){
  if(B.train){if(!B.lock)endTraining('Treino encerrado. A tentativa foi consumida, sem recompensa.');return;}
  const cost = fleeCost();
  if(B.lock || B.boss || R.money<cost) return;
  B.lock = true; R.money -= cost;
  await say(`Você largou ₽ ${cost} e tentou fugir...`);
  if(Math.random() < .55){
    await say('Conseguiu escapar!');
    musicStop(); B = null; S.screen = 'hub'; S.msg = 'Você fugiu. Sem recompensa.';
    persist(); render(); return;
  }
  await say('Não conseguiu!');
  await enemyTurn();
}
// ── XP compartilhado (Exp. Compartilhada) ──
const TRAIN_XP = .4, TRAIN_MONEY = 0;
const XP_BENCH = .5;
const xpNeed = L => 40 + 7*L;
function xpGain(m, enemy, boss){
  const f = Math.pow((2*enemy.lvl+10)/(enemy.lvl+m.lvl+10), 2.5); // inimigo mais forte que você rende mais
  return Math.max(1, Math.round((36+7*enemy.lvl)*f*(boss?1.6:1)));
}
function addXp(m, amt, notes){
  m.xp = (m.xp|0) + amt; let n = 0;
  while(m.xp >= xpNeed(m.lvl+n)){ m.xp -= xpNeed(m.lvl+n); n++; }
  if(n) levelUp(m, n, notes);
}
const xpBar = m => `<div class="xp"><i style="width:${Math.min(100,(m.xp|0)/xpNeed(m.lvl)*100).toFixed(1)}%"></i></div>`;

function finishWin(captured){
  const notes = []; LAST_EVO = false; musicStart(victoryKind(B), false);
  const gain = Math.floor((25+R.battle*6)*(B.boss?2.5:1)*(B.train?TRAIN_MONEY:1)*(1+.4*relic('amulet')));
  R.money += gain; if(!B.train){ R.battle++; R.won++; } // treino não avança a jornada
  R.team.forEach(m => {
    if(m.hp<=0) return; // desmaiado não ganha XP
    const amt = Math.max(1, Math.round(xpGain(m, B.enemy, B.boss) * (B.used.includes(m) ? 1 : XP_BENCH) * (B.train ? TRAIN_XP : 1)));
    notes.push(`${nm(m)} +${amt} XP`); addXp(m, amt, notes);
  });
  if(notes.some(n => /subiu para o nível/.test(n))) setTimeout(() => sfx(LAST_EVO ? 'evo' : 'levelup'), 700);
  R.pending = null;
  if(captured){
    dexRecord(captured.sp,true);R.caught++; notes.push(`${nm(captured)} entrou para a equipe.`);
    if(R.team.length<6) R.team.push(captured); else R.pending = captured;
  }
  recordTeam();
  V = {gain, notes, boss:B.boss, training:!!B.train, champ: B.boss && B.enemy.sp === 'dragonite'};
  R.reward = B.train ? null : genReward(B.boss); if(!B.train) R.shop = null;
  S.screen = 'reward'; S.msg = '';
  persist();
}
function gameOver(why){
  musicStop(); sfx('lose');
  const prev = META.best;
  archiveRun('defeat',why==='left'?'Jogo fechado durante uma batalha da jornada.':`Toda a equipe desmaiou${SP[R.lastEnemy]?' contra '+SP[R.lastEnemy].n:''}.`);
  V = {why, unlocked: STARTERS.filter(s => s.need && META.best>=s.need && prev<s.need).map(s => SP[s.id].n)};
  S.screen = 'gameover'; try{ SAVE_STORAGE.removeItem(SAVE_KEY); }catch(e){}
  render();
}
function winRun(){
  archiveRun('champion','Liga concluída.');
  S.screen = 'win'; try{ SAVE_STORAGE.removeItem(SAVE_KEY); }catch(e){}
}

function types(m){ return m.types.map(t => `<span class="tp" style="background:${TYPES[t][1]}">${TYPES[t][0]}</span>`).join(''); }
const BATTLE_SPRITE_BOUNDS={"143-b":[152.381,152.381,-25.3968,-25.3968],"41-b":[195.9184,195.9184,-48.9796,-30.6122],"93-f":[157.377,157.377,-26.2295,-13.1148],"185-b":[181.1321,181.1321,-39.6226,-41.5094],"158-f":[259.4595,259.4595,-72.973,-78.3784],"252-f":[213.3333,213.3333,-55.5556,-57.7778],"75-f":[143.2836,143.2836,-19.403,-4.4776],"259-b":[165.5172,165.5172,-35.3448,-32.7586],"443-b":[200.0,200.0,-50.0,-50.0],"220-f":[300.0,300.0,-100.0,-90.625],"499-b":[162.7119,162.7119,-30.5085,-30.5085],"147-b":[208.6957,208.6957,-45.6522,-56.5217],"152-b":[213.3333,213.3333,-48.8889,-57.7778],"285-b":[246.1538,246.1538,-71.7949,-64.1026],"183-b":[223.2558,223.2558,-60.4651,-48.8372],"387-f":[228.5714,228.5714,-63.0952,-64.2857],"198-f":[218.1818,218.1818,-61.3636,-54.5455],"10-f":[274.2857,274.2857,-88.5714,-94.2857],"196-b":[192.0,192.0,-36.0,-36.0],"82-f":[174.5455,174.5455,-32.7273,-32.7273],"453-f":[228.5714,228.5714,-64.2857,-64.2857],"6-f":[120.0,120.0,-7.5,-10.0],"155-f":[228.5714,228.5714,-76.1905,-54.7619],"126-f":[157.377,157.377,-30.3279,-29.5082],"198-b":[204.2553,204.2553,-45.7447,-48.9362],"11-b":[223.2558,223.2558,-56.9767,-60.4651],"128-b":[145.4545,145.4545,-21.2121,-16.6667],"501-b":[282.3529,282.3529,-91.1765,-91.1765],"197-b":[188.2353,188.2353,-38.2353,-41.1765],"41-f":[188.2353,188.2353,-43.1373,-27.451],"403-b":[200.0,200.0,-43.75,-39.5833],"216-f":[266.6667,266.6667,-81.9444,-83.3333],"113-f":[188.2353,188.2353,-45.098,-37.2549],"277-b":[152.381,152.381,-25.3968,-19.0476],"7-b":[246.1538,246.1538,-65.3846,-71.7949],"503-f":[120.0,120.0,-10.0,-10.0],"60-b":[192.0,192.0,-36.0,-38.0],"215-b":[181.1321,181.1321,-37.7358,-32.0755],"42-b":[120.0,120.0,-10.0,3.75],"461-b":[157.377,157.377,-25.4098,-29.5082],"242-b":[184.6154,184.6154,-42.3077,-40.3846],"171-b":[143.2836,143.2836,-22.3881,-2.9851],"296-b":[188.2353,188.2353,-44.1176,-45.098],"392-b":[133.3333,133.3333,-16.6667,-13.8889],"123-f":[157.377,157.377,-27.0492,-31.1475],"342-b":[141.1765,141.1765,-22.0588,-11.7647],"498-b":[234.1463,234.1463,-67.0732,-65.8537],"323-f":[133.3333,133.3333,-16.6667,-9.7222],"306-b":[133.3333,133.3333,-14.5833,-18.0556],"163-b":[218.1818,218.1818,-57.9545,-56.8182],"17-b":[124.6753,124.6753,-12.987,-12.987],"116-b":[300.0,300.0,-98.4375,-100.0],"81-b":[274.2857,274.2857,-88.5714,-71.4286],"281-b":[177.7778,177.7778,-38.8889,-38.8889],"375-f":[129.7297,129.7297,-14.8649,-1.3514],"159-b":[165.5172,165.5172,-27.5862,-27.5862],"354-b":[184.6154,184.6154,-35.5769,-42.3077],"56-b":[162.7119,162.7119,-32.2034,-22.0339],"61-f":[162.7119,162.7119,-33.8983,-22.0339],"228-f":[218.1818,218.1818,-57.9545,-56.8182],"153-b":[160.0,160.0,-25.0,-26.6667],"67-f":[139.1304,139.1304,-16.6667,-18.8406],"121-f":[188.2353,188.2353,-43.1373,-43.1373],"341-b":[204.2553,204.2553,-53.1915,-48.9362],"376-f":[124.6753,124.6753,-11.6883,3.8961],"462-f":[126.3158,126.3158,-13.1579,0.0],"197-f":[188.2353,188.2353,-44.1176,-43.1373],"498-f":[246.1538,246.1538,-71.7949,-71.7949],"134-f":[181.1321,181.1321,-39.6226,-39.6226],"349-b":[213.3333,213.3333,-55.5556,-55.5556],"66-b":[188.2353,188.2353,-43.1373,-47.0588],"470-f":[188.2353,188.2353,-45.098,-43.1373],"610-f":[213.3333,213.3333,-52.2222,-51.1111],"387-b":[223.2558,223.2558,-62.7907,-60.4651],"130-b":[105.4945,105.4945,-3.2967,7.6923],"112-b":[128.0,128.0,-14.6667,-5.3333],"177-f":[259.4595,259.4595,-70.2703,-75.6757],"54-f":[213.3333,213.3333,-61.1111,-53.3333],"464-f":[120.0,120.0,-10.0,-3.75],"170-b":[213.3333,213.3333,-57.7778,-48.8889],"334-b":[141.1765,141.1765,-20.5882,-23.5294],"461-f":[147.6923,147.6923,-24.6154,-24.6154],"389-f":[124.6753,124.6753,-12.3377,-14.2857],"74-b":[168.4211,168.4211,-40.3509,-10.5263],"124-f":[165.5172,165.5172,-29.3103,-25.8621],"27-b":[240.0,240.0,-57.5,-65.0],"296-f":[181.1321,181.1321,-40.566,-39.6226],"127-f":[145.4545,145.4545,-9.0909,-15.1515],"181-f":[145.4545,145.4545,-28.0303,-21.2121],"322-f":[204.2553,204.2553,-53.1915,-53.1915],"135-f":[195.9184,195.9184,-54.0816,-44.898],"9-f":[145.4545,145.4545,-19.697,-21.2121],"247-f":[223.2558,223.2558,-56.9767,-62.7907],"28-f":[181.1321,181.1321,-39.6226,-33.9623],"280-b":[234.1463,234.1463,-65.8537,-68.2927],"95-f":[131.5068,131.5068,-17.1233,-15.0685],"258-f":[228.5714,228.5714,-65.4762,-64.2857],"125-f":[157.377,157.377,-28.6885,-26.2295],"394-f":[168.4211,168.4211,-27.193,-31.5789],"472-f":[131.5068,131.5068,-16.4384,-5.4795],"103-b":[137.1429,137.1429,-17.8571,-17.1429],"258-b":[223.2558,223.2558,-63.9535,-60.4651],"27-f":[246.1538,246.1538,-76.9231,-69.2308],"178-b":[188.2353,188.2353,-28.4314,-39.2157],"154-b":[120.0,120.0,-3.75,-6.25],"185-f":[174.5455,174.5455,-40.0,-30.9091],"26-b":[147.6923,147.6923,-26.1538,-24.6154],"395-f":[124.6753,124.6753,-7.7922,-11.6883],"635-f":[120.0,120.0,-11.25,-7.5],"160-b":[124.6753,124.6753,-9.0909,-7.7922],"403-f":[204.2553,204.2553,-53.1915,-40.4255],"305-f":[165.5172,165.5172,-32.7586,-24.1379],"217-b":[141.1765,141.1765,-23.5294,-22.0588],"113-b":[188.2353,188.2353,-45.098,-39.2157],"216-b":[274.2857,274.2857,-85.7143,-85.7143],"214-f":[152.381,152.381,-27.7778,-19.0476],"63-b":[168.4211,168.4211,-33.3333,-21.0526],"232-f":[133.3333,133.3333,-11.1111,0.0],"156-b":[162.7119,162.7119,-23.7288,-20.339],"130-f":[118.5185,118.5185,-6.1728,-6.1728],"306-f":[133.3333,133.3333,-16.6667,-16.6667],"111-f":[150.0,150.0,-21.875,-17.1875],"117-f":[192.0,192.0,-46.0,-44.0],"534-b":[137.1429,137.1429,-22.8571,-5.7143],"330-b":[129.7297,129.7297,-14.8649,-9.4595],"64-b":[147.6923,147.6923,-23.0769,-20.0],"332-f":[137.1429,137.1429,-19.2857,-18.5714],"530-b":[123.0769,123.0769,-5.1282,-1.2821],"221-f":[177.7778,177.7778,-39.8148,-42.5926],"11-f":[259.4595,259.4595,-81.0811,-78.3784],"276-b":[213.3333,213.3333,-55.5556,-42.2222],"63-f":[188.2353,188.2353,-43.1373,-37.2549],"28-b":[184.6154,184.6154,-44.2308,-38.4615],"56-f":[152.381,152.381,-31.746,-15.873],"309-f":[195.9184,195.9184,-46.9388,-34.6939],"393-b":[274.2857,274.2857,-81.4286,-85.7143],"117-b":[174.5455,174.5455,-32.7273,-27.2727],"466-b":[128.0,128.0,-14.6667,-9.3333],"323-b":[124.6753,124.6753,-11.6883,-2.5974],"7-f":[246.1538,246.1538,-73.0769,-74.359],"447-f":[213.3333,213.3333,-54.4444,-55.5556],"607-b":[259.4595,259.4595,-79.7297,-78.3784],"248-b":[126.3158,126.3158,-13.1579,-13.1579],"372-b":[195.9184,195.9184,-42.8571,-48.9796],"20-f":[171.4286,171.4286,-33.9286,-30.3571],"467-f":[129.7297,129.7297,-18.2432,-12.1622],"609-f":[147.6923,147.6923,-23.0769,-23.0769],"5-f":[160.0,160.0,-38.3333,-30.0],"260-b":[129.7297,129.7297,-14.8649,-5.4054],"532-f":[204.2553,204.2553,-51.0638,-44.6809],"502-f":[171.4286,171.4286,-34.8214,-35.7143],"152-f":[218.1818,218.1818,-69.3182,-63.6364],"1-b":[300.0,300.0,-96.875,-96.875],"633-f":[192.0,192.0,-43.0,-38.0],"164-f":[145.4545,145.4545,-22.7273,-21.2121],"534-f":[117.0732,117.0732,-1.2195,2.439],"329-b":[160.0,160.0,-30.0,-15.0],"500-b":[124.6753,124.6753,-11.6883,-7.7922],"404-f":[160.0,160.0,-30.0,-20.0],"472-b":[137.1429,137.1429,-18.5714,-12.8571],"391-b":[160.0,160.0,-31.6667,-25.0],"19-f":[223.2558,223.2558,-56.9767,-51.1628],"353-f":[246.1538,246.1538,-74.359,-71.7949],"330-f":[139.1304,139.1304,-17.3913,-20.2899],"532-b":[184.6154,184.6154,-48.0769,-26.9231],"612-b":[112.9412,112.9412,-3.5294,-7.0588],"454-b":[160.0,160.0,-30.0,-31.6667],"80-f":[160.0,160.0,-32.5,-33.3333],"359-b":[171.4286,171.4286,-34.8214,-41.0714],"497-b":[126.3158,126.3158,-13.1579,-10.5263],"164-b":[143.2836,143.2836,-21.6418,-20.8955],"8-f":[168.4211,168.4211,-35.9649,-36.8421],"444-f":[147.6923,147.6923,-23.0769,-21.5385],"529-b":[195.9184,195.9184,-46.9388,-42.8571],"8-b":[157.377,157.377,-22.1311,-26.2295],"257-f":[128.0,128.0,-14.6667,-14.6667],"57-f":[154.8387,154.8387,-19.3548,-22.5806],"286-b":[157.377,157.377,-27.8689,-31.1475],"208-f":[118.5185,118.5185,-6.1728,-6.1728],"81-f":[274.2857,274.2857,-88.5714,-71.4286],"220-b":[309.6774,309.6774,-103.2258,-93.5484],"135-b":[200.0,200.0,-43.75,-47.9167],"260-f":[129.7297,129.7297,-14.8649,-4.0541],"4-f":[228.5714,228.5714,-66.6667,-69.0476],"471-f":[141.1765,141.1765,-22.0588,-10.2941],"215-f":[181.1321,181.1321,-33.9623,-35.8491],"103-f":[137.1429,137.1429,-19.2857,-21.4286],"453-b":[218.1818,218.1818,-57.9545,-59.0909],"277-f":[154.8387,154.8387,-27.4194,-22.5806],"254-b":[124.6753,124.6753,-11.6883,-12.987],"142-b":[121.519,121.519,-11.3924,-3.7975],"157-b":[137.1429,137.1429,-13.5714,-17.1429],"286-f":[154.8387,154.8387,-27.4194,-27.4194],"59-f":[137.1429,137.1429,-18.5714,-17.1429],"497-f":[124.6753,124.6753,-11.6883,-5.1948],"246-b":[218.1818,218.1818,-51.1364,-54.5455],"157-f":[135.2113,135.2113,-18.3099,-16.9014],"466-f":[133.3333,133.3333,-13.8889,-16.6667],"282-f":[131.5068,131.5068,-16.4384,-15.0685],"61-b":[143.2836,143.2836,-22.3881,-7.4627],"454-f":[165.5172,165.5172,-32.7586,-32.7586],"79-f":[171.4286,171.4286,-30.3571,-26.7857],"58-f":[200.0,200.0,-50.0,-41.6667],"503-b":[115.6627,115.6627,-7.2289,-4.8193],"20-b":[168.4211,168.4211,-35.0877,-31.5789],"354-f":[188.2353,188.2353,-47.0588,-43.1373],"570-f":[204.2553,204.2553,-52.1277,-51.0638],"37-f":[181.1321,181.1321,-37.7358,-39.6226],"42-f":[120.0,120.0,-10.0,3.75],"180-f":[188.2353,188.2353,-46.0784,-43.1373],"501-f":[266.6667,266.6667,-81.9444,-83.3333],"442-f":[174.5455,174.5455,-36.3636,-34.5455],"127-b":[139.1304,139.1304,-20.2899,-14.4928],"331-f":[177.7778,177.7778,-35.1852,-24.0741],"18-f":[141.1765,141.1765,-18.3824,-20.5882],"149-f":[120.0,120.0,-12.5,-8.75],"102-b":[181.1321,181.1321,-41.5094,-24.5283],"610-b":[213.3333,213.3333,-55.5556,-48.8889],"496-b":[162.7119,162.7119,-31.3559,-30.5085],"302-f":[223.2558,223.2558,-61.6279,-62.7907],"445-f":[126.3158,126.3158,-9.8684,-13.1579],"375-b":[110.3448,110.3448,0.0,21.8391],"390-b":[208.6957,208.6957,-51.087,-54.3478],"121-b":[177.7778,177.7778,-38.8889,-38.8889],"261-f":[218.1818,218.1818,-59.0909,-54.5455],"227-b":[121.519,121.519,-11.3924,-3.7975],"280-f":[252.6316,252.6316,-77.6316,-76.3158],"230-b":[139.1304,139.1304,-20.2899,-20.2899],"163-f":[223.2558,223.2558,-55.814,-60.4651],"333-f":[137.1429,137.1429,-18.5714,5.7143],"500-f":[120.0,120.0,-10.0,-5.0],"193-b":[123.0769,123.0769,-11.5385,14.1026],"64-f":[137.1429,137.1429,-21.4286,-11.4286],"12-f":[168.4211,168.4211,-33.3333,-28.0702],"169-b":[112.9412,112.9412,-7.0588,20.0],"496-f":[165.5172,165.5172,-32.7586,-32.7586],"394-b":[174.5455,174.5455,-37.2727,-36.3636],"181-b":[152.381,152.381,-23.0159,-25.3968],"373-b":[115.6627,115.6627,-8.4337,-3.6145],"232-b":[120.0,120.0,-16.25,10.0],"448-b":[147.6923,147.6923,-20.0,-24.6154],"60-f":[200.0,200.0,-60.4167,-43.75],"16-b":[240.0,240.0,-70.0,-65.0],"448-f":[152.381,152.381,-26.1905,-26.9841],"124-b":[171.4286,171.4286,-46.4286,-37.5],"93-b":[147.6923,147.6923,-29.2308,-7.6923],"92-b":[160.0,160.0,-23.3333,-23.3333],"221-b":[171.4286,171.4286,-41.9643,-41.0714],"473-b":[124.6753,124.6753,-11.6883,-6.4935],"193-f":[123.0769,123.0769,-11.5385,11.5385],"302-b":[228.5714,228.5714,-63.0952,-66.6667],"571-f":[141.1765,141.1765,-22.0588,-20.5882],"607-f":[259.4595,259.4595,-81.0811,-78.3784],"404-b":[174.5455,174.5455,-38.1818,-34.5455],"467-b":[137.1429,137.1429,-17.1429,-15.7143],"405-b":[143.2836,143.2836,-20.8955,-20.8955],"359-f":[165.5172,165.5172,-33.6207,-32.7586],"58-b":[181.1321,181.1321,-35.8491,-33.9623],"154-f":[117.0732,117.0732,-7.9268,-8.5366],"207-f":[162.7119,162.7119,-30.5085,-22.0339],"180-b":[188.2353,188.2353,-32.3529,-43.1373],"261-b":[208.6957,208.6957,-54.3478,-50.0],"471-b":[160.0,160.0,-30.0,-25.0],"148-f":[141.1765,141.1765,-20.5882,-16.1765],"207-b":[168.4211,168.4211,-38.5965,-31.5789],"55-b":[168.4211,168.4211,-33.3333,-33.3333],"19-b":[200.0,200.0,-47.9167,-37.5],"142-f":[121.519,121.519,-7.5949,3.7975],"282-b":[128.0,128.0,-21.3333,-14.6667],"10-b":[282.3529,282.3529,-83.8235,-97.0588],"183-f":[223.2558,223.2558,-62.7907,-51.1628],"131-b":[128.0,128.0,-14.6667,-10.6667],"229-f":[143.2836,143.2836,-22.3881,-19.403],"246-f":[218.1818,218.1818,-59.0909,-63.6364],"353-b":[234.1463,234.1463,-65.8537,-63.4146],"473-f":[120.0,120.0,-10.0,-2.5],"393-f":[274.2857,274.2857,-82.8571,-80.0],"76-f":[147.6923,147.6923,-20.0,-21.5385],"499-f":[168.4211,168.4211,-34.2105,-33.3333],"256-f":[152.381,152.381,-26.1905,-25.3968],"322-b":[184.6154,184.6154,-42.3077,-44.2308],"469-f":[123.0769,123.0769,-10.2564,-1.2821],"470-b":[177.7778,177.7778,-48.1481,-37.037],"247-b":[213.3333,213.3333,-54.4444,-53.3333],"310-b":[141.1765,141.1765,-21.3235,-20.5882],"447-b":[228.5714,228.5714,-66.6667,-64.2857],"612-f":[112.9412,112.9412,-8.8235,-8.2353],"255-b":[228.5714,228.5714,-63.0952,-64.2857],"59-b":[139.1304,139.1304,-19.5652,-18.8406],"285-f":[246.1538,246.1538,-69.2308,-64.1026],"184-f":[162.7119,162.7119,-36.4407,-27.1186],"184-b":[165.5172,165.5172,-32.7586,-32.7586],"495-b":[240.0,240.0,-70.0,-67.5],"634-b":[157.377,157.377,-19.6721,-22.9508],"635-b":[120.0,120.0,-5.625,-10.0],"160-f":[131.5068,131.5068,-16.4384,-15.0685],"373-f":[123.0769,123.0769,-11.5385,-6.4103],"68-b":[139.1304,139.1304,-23.1884,-24.6377],"65-f":[133.3333,133.3333,-12.5,-13.8889],"12-b":[165.5172,165.5172,-32.7586,-25.8621],"5-b":[165.5172,165.5172,-31.8966,-32.7586],"169-f":[109.0909,109.0909,-4.5455,22.7273],"16-f":[234.1463,234.1463,-70.7317,-65.8537],"332-b":[137.1429,137.1429,-17.1429,-18.5714],"570-b":[204.2553,204.2553,-53.1915,-51.0638],"259-f":[171.4286,171.4286,-35.7143,-35.7143],"212-b":[129.7297,129.7297,-16.8919,-14.8649],"123-b":[154.8387,154.8387,-32.2581,-27.4194],"133-b":[204.2553,204.2553,-47.8723,-53.1915],"231-b":[240.0,240.0,-72.5,-62.5],"276-f":[240.0,240.0,-70.0,-65.0],"212-f":[131.5068,131.5068,-17.1233,-19.1781],"171-f":[147.6923,147.6923,-23.0769,-10.7692],"43-f":[274.2857,274.2857,-87.1429,-91.4286],"43-b":[252.6316,252.6316,-76.3158,-73.6842],"392-f":[141.1765,141.1765,-19.1176,-17.6471],"18-b":[145.4545,145.4545,-18.9394,-21.2121],"134-b":[177.7778,177.7778,-40.7407,-37.037],"149-b":[120.0,120.0,-5.625,-5.0],"6-b":[114.2857,114.2857,-4.7619,-3.5714],"262-f":[141.1765,141.1765,-20.5882,-17.6471],"133-f":[204.2553,204.2553,-53.1915,-44.6809],"395-b":[129.7297,129.7297,-16.8919,-13.5135],"445-b":[126.3158,126.3158,-13.1579,-11.8421],"156-f":[162.7119,162.7119,-32.2034,-20.339],"37-b":[168.4211,168.4211,-31.5789,-24.5614],"529-f":[181.1321,181.1321,-37.7358,-37.7358],"469-b":[114.2857,114.2857,-7.1429,11.9048],"57-b":[145.4545,145.4545,-18.1818,-13.6364],"297-f":[126.3158,126.3158,-13.1579,-13.1579],"179-f":[234.1463,234.1463,-65.8537,-73.1707],"611-f":[165.5172,165.5172,-36.2069,-31.0345],"196-f":[181.1321,181.1321,-37.7358,-41.5094],"55-f":[162.7119,162.7119,-25.4237,-32.2034],"349-f":[208.6957,208.6957,-54.3478,-54.3478],"25-f":[208.6957,208.6957,-59.7826,-52.1739],"253-f":[160.0,160.0,-30.0,-28.3333],"68-f":[141.1765,141.1765,-16.9118,-22.0588],"609-b":[147.6923,147.6923,-23.0769,-23.0769],"371-f":[195.9184,195.9184,-42.8571,-46.9388],"1-f":[274.2857,274.2857,-80.0,-80.0],"147-f":[218.1818,218.1818,-55.6818,-59.0909],"254-f":[135.2113,135.2113,-17.6056,-16.9014],"178-f":[181.1321,181.1321,-40.566,-39.6226],"372-f":[195.9184,195.9184,-48.9796,-46.9388],"252-b":[208.6957,208.6957,-54.3478,-54.3478],"253-b":[154.8387,154.8387,-27.4194,-25.8065],"92-f":[147.6923,147.6923,-24.6154,-16.9231],"374-b":[234.1463,234.1463,-70.7317,-58.5366],"102-f":[177.7778,177.7778,-38.8889,-22.2222],"248-f":[124.6753,124.6753,-12.987,-11.6883],"17-f":[120.0,120.0,-5.0,-6.25],"3-b":[118.5185,118.5185,-7.4074,1.2346],"143-f":[143.2836,143.2836,-23.1343,-22.3881],"227-f":[141.1765,141.1765,-17.6471,-20.5882],"231-f":[259.4595,259.4595,-75.6757,-75.6757],"153-f":[157.377,157.377,-31.9672,-19.6721],"170-f":[168.4211,168.4211,-28.0702,-15.7895],"329-f":[154.8387,154.8387,-27.4194,-14.5161],"76-b":[145.4545,145.4545,-22.7273,-15.1515],"179-b":[228.5714,228.5714,-61.9048,-69.0476],"388-b":[162.7119,162.7119,-31.3559,-30.5085],"297-b":[129.7297,129.7297,-15.5405,-14.8649],"2-f":[165.5172,165.5172,-32.7586,-27.5862],"136-f":[174.5455,174.5455,-40.0,-32.7273],"376-b":[126.3158,126.3158,-11.8421,2.6316],"131-f":[141.1765,141.1765,-25.0,-19.1176],"389-b":[123.0769,123.0769,-11.5385,-11.5385],"450-b":[105.4945,105.4945,-2.1978,9.8901],"571-b":[129.7297,129.7297,-9.4595,-6.7568],"242-f":[177.7778,177.7778,-37.963,-38.8889],"66-f":[192.0,192.0,-44.0,-46.0],"9-b":[152.381,152.381,-26.9841,-25.3968],"230-f":[145.4545,145.4545,-22.7273,-22.7273],"462-b":[128.0,128.0,-10.6667,5.3333],"350-b":[118.5185,118.5185,-8.642,-6.1728],"634-f":[154.8387,154.8387,-29.0323,-25.8065],"450-f":[120.0,120.0,-10.0,1.25],"128-f":[143.2836,143.2836,-31.3433,-14.9254],"533-b":[135.2113,135.2113,-14.0845,-1.4085],"502-b":[174.5455,174.5455,-37.2727,-36.3636],"391-f":[160.0,160.0,-33.3333,-20.0],"533-f":[135.2113,135.2113,-20.4225,-1.4085],"304-b":[300.0,300.0,-100.0,-100.0],"309-b":[208.6957,208.6957,-52.1739,-43.4783],"371-b":[195.9184,195.9184,-47.9592,-48.9796],"74-f":[171.4286,171.4286,-37.5,-5.3571],"495-f":[240.0,240.0,-70.0,-65.0],"95-b":[100.0,100.0,0.0,13.5417],"334-f":[152.381,152.381,-26.1905,-25.3968],"159-f":[165.5172,165.5172,-31.0345,-31.0345],"262-b":[143.2836,143.2836,-20.8955,-19.403],"255-f":[223.2558,223.2558,-62.7907,-62.7907],"208-b":[120.0,120.0,-10.0,-10.0],"444-b":[147.6923,147.6923,-23.0769,-20.0],"331-b":[181.1321,181.1321,-41.5094,-26.4151],"62-b":[135.2113,135.2113,-16.9014,-7.0423],"257-b":[133.3333,133.3333,-15.9722,-16.6667],"67-b":[141.1765,141.1765,-21.3235,-20.5882],"94-b":[174.5455,174.5455,-38.1818,-36.3636],"25-b":[204.2553,204.2553,-42.5532,-46.8085],"155-b":[218.1818,218.1818,-52.2727,-47.7273],"4-b":[234.1463,234.1463,-57.3171,-73.1707],"256-b":[147.6923,147.6923,-23.8462,-24.6154],"111-b":[139.1304,139.1304,-24.6377,-11.5942],"374-f":[234.1463,234.1463,-68.2927,-58.5366],"430-b":[165.5172,165.5172,-31.8966,-32.7586],"611-b":[143.2836,143.2836,-20.8955,-13.4328],"79-b":[171.4286,171.4286,-35.7143,-25.0],"442-b":[177.7778,177.7778,-38.8889,-37.037],"80-b":[139.1304,139.1304,-18.8406,-14.4928],"281-f":[177.7778,177.7778,-38.8889,-38.8889],"405-f":[145.4545,145.4545,-22.7273,-19.697],"608-b":[192.0,192.0,-46.0,-44.0],"217-f":[141.1765,141.1765,-19.8529,-22.0588],"390-f":[213.3333,213.3333,-54.4444,-60.0],"228-b":[218.1818,218.1818,-57.9545,-59.0909],"430-f":[171.4286,171.4286,-35.7143,-35.7143],"342-f":[147.6923,147.6923,-23.0769,-20.0],"333-b":[139.1304,139.1304,-18.8406,2.8986],"177-b":[290.9091,290.9091,-90.9091,-90.9091],"341-f":[200.0,200.0,-41.6667,-45.8333],"3-f":[121.519,121.519,-10.1266,-2.5316],"449-f":[154.8387,154.8387,-27.4194,-9.6774],"2-b":[168.4211,168.4211,-33.3333,-26.3158],"328-b":[213.3333,213.3333,-55.5556,-57.7778],"94-f":[165.5172,165.5172,-29.3103,-31.0345],"633-b":[192.0,192.0,-44.0,-40.0],"82-b":[168.4211,168.4211,-35.0877,-29.8246],"214-b":[147.6923,147.6923,-30.7692,-16.9231],"304-f":[309.6774,309.6774,-103.2258,-103.2258],"449-b":[171.4286,171.4286,-35.7143,-25.0],"350-f":[114.2857,114.2857,-7.1429,-2.381],"136-b":[177.7778,177.7778,-38.8889,-33.3333],"62-f":[120.0,120.0,-7.5,3.75],"148-b":[145.4545,145.4545,-14.3939,-21.2121],"530-f":[123.0769,123.0769,-10.2564,1.2821],"388-f":[165.5172,165.5172,-32.7586,-25.8621],"305-b":[162.7119,162.7119,-32.2034,-22.0339],"54-b":[218.1818,218.1818,-54.5455,-56.8182],"310-f":[143.2836,143.2836,-18.6567,-22.3881],"229-b":[145.4545,145.4545,-18.1818,-18.1818],"65-b":[126.3158,126.3158,-13.1579,-5.2632],"328-f":[228.5714,228.5714,-64.2857,-64.2857],"158-b":[252.6316,252.6316,-65.7895,-76.3158],"608-f":[192.0,192.0,-46.0,-44.0],"125-b":[154.8387,154.8387,-22.5806,-25.8065],"26-f":[152.381,152.381,-15.873,-22.2222],"112-f":[131.5068,131.5068,-13.6986,-10.9589],"75-b":[147.6923,147.6923,-29.2308,-4.6154],"443-f":[188.2353,188.2353,-43.1373,-39.2157],"464-b":[106.6667,106.6667,-3.3333,10.0],"126-b":[157.377,157.377,-27.8689,-26.2295],"116-f":[274.2857,274.2857,-84.2857,-88.5714],"700-f":[165.5172,165.5172,-48.2759,-32.7586],"700-b":[162.7119,162.7119,-42.3729,-30.5085]};
function art(m, back=false, big=false){
  const s0 = SP[m.sp];
  const box = big && BATTLE_SPRITE_BOUNDS[s0.dex+'-'+(back?'b':'f')];
  const crop = box ? `style="--sprite-w:${box[0]}%;--sprite-h:${box[1]}%;--sprite-x:${box[2]}%;--sprite-y:${box[3]}%"` : '';
  return `<div ${crop} class="art ${big?'big':''} ${back?'back':''}"><img src="${SPRITE(s0.dex, back)}" alt="${esc(s0.n)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'•'}))"></div>`;
}
function hpBar(m){
  const r = Math.max(0, m.hp/m.maxHp), c = r>.5 ? 'var(--hp-hi)' : r>.2 ? 'var(--hp-mid)' : 'var(--hp-lo)';
  return `<div class="hp"><i style="width:${(r*100).toFixed(1)}%;background:${c}"></i></div>`;
}
function head(){
  const accountBack = '';
  const show = R && ['hub','battle','reward'].includes(S.screen);
  const info = show ? `<div class="stats"><span class="chip">#${R.battle+1}</span><span class="chip">Vit ${R.won}</span><span class="chip">₽ ${R.money}</span></div>` : '';
  const snd = S.screen!=='title' ? `<button class="btn alt tiny" data-act="snd">Som: ${CFG.sound?'ligado':'mudo'}</button><button class="btn alt tiny" data-act="mus">Música: ${CFG.music?'ligada':'desligada'}</button>${soundtrackButton('btn alt tiny')}` : '';
  return `<header class="top"><h1>Pokemon - Permadeath Version</h1>${info}${snd}${accountBack}</header>`;
}
const msgBox = () => S.msg ? `<div class="note" role="status">${esc(S.msg)}</div>` : '';
function gymPips(){return window.renderKantoBadges(gymIndex());}

function rTitle(){
  return `<section class="panel title-screen gba-title">
    <div class="gba-title-banner"><span>UMA JORNADA. UMA VIDA.</span><span>PERMADEATH</span></div>
    <div class="gba-title-layout">
      <div class="gba-title-art">
        <h2 class="title-logo">POKÉMON</h2><p class="title-version">PERMADEATH VERSION</p>
        <div class="title-pokemon" aria-hidden="true"><img src="${SPRITE(154)}" alt=""><img src="${SPRITE(157)}" alt=""><img src="${SPRITE(160)}" alt=""></div>
        <p class="gba-adventure-line">Seu próximo capítulo começa aqui.</p>
      </div>
      <div class="gba-start-panel"><h3 class="gba-label">MENU PRINCIPAL</h3>
        <nav class="gba-menu" aria-label="Menu principal">
          ${Object.keys(ModeSaveStore.slots()).length?`<button class="btn gba-option" data-act="cont"><span>Continuar</span><small>Retomar sua jornada</small></button>`:''}
          <button class="btn gba-option" data-act="start"><span>Jogar</span><small>Escolher modo e começar uma jornada</small></button>
          <button class="btn gba-option" data-act="journal" data-v="dex"><span>Pokédex</span><small>Espécies vistas e obtidas</small></button>
          <button class="btn gba-option" data-act="journal" data-v="history"><span>Histórico de jornadas</span><small>Suas equipes e resultados</small></button>
          <button class="btn gba-option" data-act="journal" data-v="achievements"><span>Conquistas</span><small>Avatares e títulos</small></button>
          <button class="btn gba-option" data-act="titleMusic"><span>Ativar áudio</span><small>Ouvir a trilha sonora</small></button>
        </nav>
        <div class="gba-record"><span>RECORDE <strong>${META.best}</strong></span><span>JORNADAS <strong>${META.runs}</strong></span>${META.champ?'<span class="gba-champion">★ Campeão da Liga</span>':''}</div>
      </div>
    </div>
    <details class="gba-options"><summary>Opções de jogo</summary><div class="settings"><button class="btn alt" data-act="spd">Velocidade ×${CFG.speed}</button><button class="btn alt" data-act="snd">Som: ${CFG.sound?'ligado':'mudo'}</button>${soundtrackButton()}<button class="btn alt" data-act="mus">Música: ${CFG.music?'ligada':'desligada'}</button></div></details>
    <div class="gba-dialogue"><p>Escolha seu parceiro. Desafie a Liga.</p><span>No modo Permadeath, perder a equipe encerra a jornada.</span></div>
  </section>`;
}
function rStarter(){
  const category = STARTER_CATEGORIES.find(c=>c.id===S.starterCategory) || STARTER_CATEGORIES[0];
  const categories = STARTER_CATEGORIES.map(c=>`<button class="btn ${c.id===category.id?'':'alt'}" data-act="starterCategory" data-v="${c.id}" aria-pressed="${c.id===category.id}">${c.n}</button>`).join('');
  const cards = STARTERS.filter(st=>st.category===category.id).map(st => {
    const s = SP[st.id], ok = !st.need || META.best>=st.need, m = {sp:st.id, types:s.t};
    const mvs = known(s,5).map(id => M[id].n).join(', ');
    return `<div class="card starter-card ${ok?'':'locked'}">
      <div class="row starter-identity">${art(m)}<div class="starter-name"><h3>${s.n}</h3>${types(m)}</div></div>
      <div class="mute tiny starter-moves">${ok ? mvs : `Bloqueado: ${st.need} vitórias numa run.`}</div>
      <button class="btn" data-act="pickStarter" data-v="${st.id}" ${ok?'':'disabled'}>Escolher</button>
    </div>`;
  }).join('');
  return `<section class="panel"><h2>Escolha seu inicial</h2><p class="mute">Escolha uma região e depois o Pokémon que você quer. Todos começam no nível 5.</p><div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:16px" role="group" aria-label="Categorias de iniciais">${categories}</div><h3>${category.n}</h3><div class="grid">${cards}</div></section>`;
}
function teamCard(m,i){
  const dead = m.hp<=0, lead = i===R.active;
  return `<div class="card${dead?' dead':''}" data-act="card" data-v="${i}">
    <div class="row" style="align-items:center;flex-wrap:nowrap">${art(m)}<div style="min-width:0"><h3>${nm(m)} <span class="mute">Nv ${m.lvl}</span>${lead?' ★':''}</h3>${types(m)}</div></div>
    ${hpBar(m)}
    ${dead ? '' : xpBar(m)}<div class="tiny">${dead ? 'Desmaiado' : `HP ${m.hp}/${m.maxHp}   XP ${m.xp|0}/${xpNeed(m.lvl)}`}</div>
    <div class="mute tiny">${m.moves.map(id => M[id].n).join(', ')}</div>
    <button class="btn alt" data-act="summary" data-v="${i}">Sumário</button>
    ${(!dead && !lead) ? `<button class="btn alt" data-act="lead" data-v="${i}">Liderar</button>` : ''}
  </div>`;
}
function rHub(){
  const n = R.battle+1, boss = nextIsBoss(), b = nextBoss();
  const bag = ['potion','super','revive','candy'].filter(id=>R.bag[id]>0).map(id => {
    const q = R.bag[id];
    return `<button class="btn alt ${S.sel===id?'sel':''}" data-act="sel" data-v="${id}" ${q?'':'disabled'} title="${ITEMS[id].d}">${ITEMS[id].ico} ${ITEMS[id].n} ×${q}</button>`;
  }).join('');
  const relics = Object.keys(R.relics).map(id => `<div class="item"><div><span class="ico">${RELICS[id].ico}</span>${RELICS[id].n}${R.relics[id]>1?` ×${R.relics[id]}`:''}<div class="d">${RELICS[id].d}</div></div></div>`).join('');
  let shop = '';
  if(S.shop){
    if(!R.shop) R.shop = genShop();
    const tab=S.shopTab==='held'?'held':'general';
    shop = `<section class="panel shop-panel"><h2>Loja</h2><nav class="shop-tabs" aria-label="Categorias da loja"><button class="btn ${tab==='general'?'':'alt'}" data-act="shopTab" data-v="general" aria-pressed="${tab==='general'}">Suprimentos e evolução</button><button class="btn ${tab==='held'?'':'alt'}" data-act="shopTab" data-v="held" aria-pressed="${tab==='held'}">Itens equipáveis</button></nav><p>${tab==='held'?'Equipe pelo sumário do Pokémon. Cada companheiro pode carregar um item.':'Poções, Pokébolas, itens de evolução e relíquias para a jornada.'}</p><div class="list">${R.shop.map((it,i) => {
      if((it.kind==='item'&&!!window.journeyHeldItems?.[it.id]) !== (tab==='held'))return '';
      const d = it.kind==='relic' ? RELICS[it.id] : ITEMS[it.id];
      return `<div class="item"><div><span class="ico">${d.ico}</span>${d.n}<div class="d">${d.d}</div></div>
        <button class="btn" data-act="buy" data-v="${i}" ${(it.sold || R.money<it.price)?'disabled':''}>${it.sold?'Esgotado':`₽ ${it.price}`}</button></div>`;
    }).join('')}</div></section>`;
  }
  return `${msgBox()}
  <section class="panel gba-hub"><div class="gba-hub-layout">
    <div class="gba-journey"><p class="gba-label">SUA JORNADA</p><h2>${boss ? `${b.title}` : `Próxima batalha ${n}`}</h2>${gymPips()}
      <div class="gba-partner">${art(active())}<div><strong>${nm(active())}</strong><span>Nível ${active().lvl}</span><span>${R.team.filter(m=>m.hp>0).length} Pokémon na equipe</span></div></div>
      <p class="gba-journey-tip">${boss?'Prepare sua equipe para o ginásio. Os 3 treinos só renovam ao vencer uma batalha da jornada.':'3 treinos por etapa. Vença uma batalha da jornada para renovar o limite. Desmaiou no treino? Volta com HP cheio.'}</p>
    </div>
    <nav class="gba-menu gba-hub-menu" aria-label="Ações da jornada">
      <button class="btn gba-option" data-act="go"><span>${boss?'Desafiar ginásio':'Batalhar'}</span><small>Avançar na jornada</small></button>
      <button class="btn gba-option" data-act="train" ${trainingLeft()===0?'disabled':''}><span>Treinar (${trainingLeft()}/${TRAIN_LIMIT})</span><small>Sem morte permanente · apenas XP</small></button>
      <button class="btn gba-option" data-act="shop"><span>${S.shop?'Fechar loja':'Loja'}</span><small>Itens e suprimentos</small></button>
      <button class="btn gba-option" data-act="rest" ${R.mode!=='classic'&&R.money<60?'disabled':''}><span>Descansar</span><small>₽60 · recupera 35% de HP</small></button>
    </nav>
  </div></section>
  ${shop}
  ${evoPanel()}
  <section class="panel"><h2>Equipe</h2>
    <p class="mute">${S.sel ? `Clique num Pokémon para usar ${ITEMS[S.sel].n}.` : 'Selecione um item e clique no Pokémon.'}</p>
    <div class="grid">${R.team.map(teamCard).join('')}</div>
  </section>
  <section class="panel"><h2>Mochila</h2>
    <div class="row" style="margin-bottom:8px">${bag}</div>
    <div class="mute">${ITEMS.ball.ico} Pokébolas ×${R.bag.ball} &nbsp; ${ITEMS.great.ico} Grandes Bolas ×${R.bag.great}</div>
  </section>
  ${relics ? `<section class="panel"><h2>Relíquias</h2><div class="list">${relics}</div></section>` : ''}
  <section class="panel"><button class="btn alt" data-act="abandon">Abandonar run</button></section>`;
}
function rBattle(){
  const pm = active(), em = B.enemy;
  const lk = B.lock ? 'disabled' : '';
  let ctl = '';
  if(B.menu==='moves'){
    ctl = `<div class="moves">${pm.moves.map((id,i) => {
      const mv = M[id], e = eff(mv.t, em.types);
      const hint = e===0 ? 'sem efeito' : e>1 ? 'super efetivo' : e<1 ? 'pouco efetivo' : '';
      return `<button class="btn alt mv" style="border-left-color:${TYPES[mv.t][1]}" data-act="mv" data-v="${i}" ${lk}>
        ${i+1}. ${mv.n}<small>${TYPES[mv.t][0]} · poder ${mv.p}${hint?` · ${hint}`:''}</small></button>`;
    }).join('')}</div>
    <div class="row">
      <button class="btn" data-act="menu" data-v="bag" ${lk}>Mochila</button>
      <button class="btn" data-act="menu" data-v="ball" ${(lk||B.boss||B.train)?'disabled':''}>${B.train?'Treino: sem captura':B.boss?'Chefe: sem captura':'Capturar'}</button>
      <button class="btn" data-act="menu" data-v="switch" ${(lk||R.team.filter((m,i)=>m.hp>0&&i!==R.active).length===0)?'disabled':''}>Trocar</button>
      <button class="btn alt" data-act="flee" ${(lk||(!B.train&&(B.boss||R.money<fleeCost())))?'disabled':''} title="${B.train?'Consome a tentativa, sem recompensa':'Custa dinheiro mesmo se falhar'}">${B.train?'Encerrar treino':`Fugir (₽ ${fleeCost()})`}</button>
    </div>`;
  } else if(B.menu==='bag'){
    ctl = `<div class="list">${['potion','super'].map(id => `<button class="btn alt" data-act="bagUse" data-v="${id}" ${(lk||!R.bag[id]||pm.hp>=pm.maxHp)?'disabled':''}>${ITEMS[id].ico} ${ITEMS[id].n} ×${R.bag[id]} <span class="mute">${ITEMS[id].d}</span></button>`).join('')}
    <button class="btn" data-act="menu" data-v="moves">Voltar</button></div>`;
  } else if(B.menu==='ball'){
    ctl = `<div class="list">${['ball','great'].map(id => `<button class="btn alt" data-act="ballUse" data-v="${id}" ${(lk||!R.bag[id])?'disabled':''}>${ITEMS[id].ico} ${ITEMS[id].n} ×${R.bag[id]} <span class="mute">${ITEMS[id].d}</span></button>`).join('')}
    <button class="btn" data-act="menu" data-v="moves">Voltar</button></div>`;
  } else {
    const opts = R.team.map((m,i) => ({m,i})).filter(o => o.m.hp>0 && o.i!==R.active);
    ctl = `<p>${B.forced ? 'Seu Pokémon desmaiou. Escolha o próximo:' : 'Trocar gasta o turno.'}</p><div class="list">${opts.map(o => `<button class="btn alt" data-act="sw" data-v="${o.i}" ${lk}>${nm(o.m)} Nv ${o.m.lvl}  HP ${o.m.hp}/${o.m.maxHp}</button>`).join('')}
    ${B.forced ? '' : '<button class="btn" data-act="menu" data-v="moves">Voltar</button>'}</div>`;
  }
  return `<div class="arena battle-classic">
    <div class="battle-platform enemy-platform"></div>
    <div class="battle-platform player-platform"></div>
    <div class="battle-status enemy-status plate"><div class="nm"><span>${label(em,false)}</span><span>Nv ${em.lvl}</span></div><div class="battle-types">${types(em)}</div>${hpBar(em)}</div>
    <div class="battle-mon enemy-mon ${B.fx==='e'?'hit':''} ${em.hp<=0?'faint':''}">${art(em,false,true)}</div>
    <div class="battle-mon player-mon ${B.fx==='p'?'hit':''} ${pm.hp<=0?'faint':''}">${art(pm,true,true)}</div>
    <div class="battle-status player-status plate"><div class="nm"><span>${nm(pm)}</span><span>Nv ${pm.lvl}</span></div><div class="battle-types">${types(pm)}</div>${hpBar(pm)}<div class="battle-hp">HP ${pm.hp}/${pm.maxHp}</div>${xpBar(pm)}</div>
  </div>
  <div class="log battle-log" aria-live="polite">${B.log.slice(-40).map(l => `<div>${esc(l)}</div>`).join('')}</div>
  ${ctl}`;
}
function rewardCard(r,i){
  const blocked = R.pending ? 'disabled' : '';
  let ico, title, d;
  if(r.kind==='relic'){ const x = RELICS[r.id]; ico=x.ico; title=x.n; d=x.d; if(relic(r.id)) title += ` (você tem ×${relic(r.id)})`; }
  else if(r.kind==='money'){ ico=MONEY_ICO; title=`₽ ${r.amt}`; d='Dinheiro para a loja'; }
  else { const x = ITEMS[r.id]; ico=x.ico; title=`${x.n} ×${r.q}`; d=x.d; }
  return `<div class="card"><h3><span class="ico">${ico}</span>${title}</h3><div class="mute tiny">${d}</div>
    <button class="btn gold" data-act="reward" data-v="${i}" ${blocked}>Pegar</button></div>`;
}
function rReward(){
  const pend = R.pending ? `<section class="panel"><h2>Equipe cheia (6)</h2>
    <p>Para ficar com ${nm(R.pending)} Nv ${R.pending.lvl}, solte alguém.</p>
    <div class="list">${R.team.map((m,i) => `<button class="btn alt" data-act="release" data-v="${i}">Soltar ${nm(m)} Nv ${m.lvl}</button>`).join('')}
    <button class="btn" data-act="skipCatch">Deixar ${nm(R.pending)} ir embora</button></div></section>` : '';
  const champ = V.champ ? `<section class="panel"><h2>Você venceu o Campeão.</h2><p>Pode encerrar a jornada como lenda, ou continuar no modo infinito — ainda permadeath.</p>
    <button class="btn gold" data-act="retire">Aposentar (vitória)</button></section>` : '';
  return `<section class="panel"><h2>${(V.training||V.exploration) ? 'Treino concluído!' : V.boss ? 'Ginásio conquistado!' : 'Vitória!'}</h2>
    <p>+₽ ${V.gain}</p>
    <div class="mute">${V.notes.map(n => `<div>${esc(n)}</div>`).join('')}</div></section>
  ${champ}
  ${pend}
  ${evoPanel()}
  ${(V.training||V.exploration) ? `<section class="panel"><p class="mute">Treino não avança a jornada: o ginásio continua te esperando.</p><button class="btn" data-act="back" ${R.pending?'disabled':''}>Voltar</button></section>` : `<section class="panel"><h2>Escolha 1 de 3</h2><div class="grid">${R.reward.map(rewardCard).join('')}</div></section>`}`;
}
function rOver(){
  const unlocked = (V && V.unlocked || []).map(n => `<p>Desbloqueado: ${n}.</p>`).join('');
  return `<section class="panel"><h2>Tudo perdido.</h2>
    <p>${V && V.why==='left' ? 'Você saiu no meio de uma batalha. No permadeath, isso conta como derrota.' : 'A equipe inteira desmaiou.'} Vitórias: ${R.won}. Capturas: ${R.caught}.</p>
    <p class="mute">Recorde: ${META.best}.</p>${unlocked}
    <div class="grid" style="margin-bottom:12px">${R.team.map(m => `<div class="card dead"><div class="row" style="align-items:center">${art(m)}<div><h3>${nm(m)} <span class="mute">Nv ${m.lvl}</span></h3></div></div></div>`).join('')}</div>
    <button class="btn" data-act="start">Nova run</button></section>`;
}
function rWin(){
  return `<section class="panel">
    <h2>Campeão. Uma vida foi o bastante.</h2>
    <p>Você fechou a liga com ${R.won} vitórias e ${R.caught} capturas. A run acaba aqui — de propósito.</p>
    <div class="grid">${R.team.map(m => `<div class="card"><div class="row" style="align-items:center">${art(m)}<div><h3>${nm(m)} Nv ${m.lvl}</h3>${types(m)}</div></div></div>`).join('')}</div>
    <button class="btn" data-act="start" style="margin-top:12px">Nova run</button>
  </section>`;
}
function render(){
  screenMusic();
  const f = {title:rTitle, journal:rJournal, starter:rStarter, hub:rHub, battle:rBattle, reward:rReward, gameover:rOver, win:rWin}[S.screen];
  $app.innerHTML = head() + `<p id="audio-notice" class="audio-notice" role="status">${esc(audioNotice)}</p>` + f() + rPlaylist();
  window.dispatchEvent(new Event('game-screen-changed'));
  const l = document.querySelector('.log'); if(l) l.scrollTop = l.scrollHeight;
}

function applyItem(id, m){
  if(id==='potion' || id==='super'){
    if(m.hp<=0) return {ok:false, msg:'Esse Pokémon desmaiou. Use um Reviver.'};
    if(m.hp>=m.maxHp) return {ok:false, msg:`${nm(m)} já está com o HP cheio.`};
    m.hp = Math.min(m.maxHp, m.hp+(id==='super'?80:30)); return {ok:true, msg:`${nm(m)} recuperou HP.`};
  }
  if(id==='revive'){
    if(m.hp>0) return {ok:false, msg:`${nm(m)} não está desmaiado.`};
    m.hp = Math.ceil(m.maxHp/2); return {ok:true, msg:`${nm(m)} voltou.`};
  }
  if(id==='candy'){
    if(m.hp<=0) return {ok:false, msg:'Esse Pokémon desmaiou.'};
    const notes = []; levelUp(m, 2, notes); return {ok:true, msg:notes.join(' ')};
  }
  return {ok:false, msg:'Não deu.'};
}
const ACT = {
  accountTitle(){ if(S.screen==='battle' || EVOLVING) return; if(R && S.screen==='hub') persist(); S.screen='title'; S.shop=false; },
  menuTrack(id){ selectMenuTrack(id); },
  playlistToggle(){playlistOpen=!playlistOpen;},
  playlistClose(){playlistOpen=false;},
  menuPrev(){ if(!menuPlayerVisible()) return; const i=MENU_TRACKS.findIndex(t=>t.id===musTrackId); selectMenuTrack(MENU_TRACKS[(i-1+MENU_TRACKS.length)%MENU_TRACKS.length].id); },
  menuNext(){ if(!menuPlayerVisible()) return; const i=MENU_TRACKS.findIndex(t=>t.id===musTrackId); selectMenuTrack(CFG.shuffle!==false ? pick(CITY_TRACKS.filter(id=>id!==musTrackId)) : MENU_TRACKS[(i+1)%MENU_TRACKS.length].id); },
  menuPlay(){
    if(!menuPlayerVisible()) return;
    if(musAudio && !musAudio.paused && CFG.sound && CFG.music){ CFG.music=false; saveCfg(); musicSync(); }
    else selectMenuTrack(MENU_MUSIC[musTrackId]?musTrackId:CITY_TRACKS[0]);
  },
  menuShuffle(){ CFG.shuffle=CFG.shuffle===false; saveCfg(); },
  titleMusic(){ CFG.sound=true; CFG.music=true; saveCfg(); ac(); screenMusic(); musicSync(); },
  journal(tab){if(!['title','journal'].includes(S.screen))return;S.screen='journal';S.journal=['dex','history','achievements'].includes(tab)?tab:'dex';},
  journalBack(){S.screen='title';},
  dexFilter(v){if(['all','seen','caught'].includes(v))S.dexFilter=v;},
  start(){ if(hasSave()){if(!confirm('Iniciar outra jornada encerra a jornada salva. Ela ficará no histórico como abandonada. Continuar?'))return;continueSave();if(S.screen!=='gameover')archiveRun('abandoned','Substituída por uma nova jornada.');SAVE_STORAGE.removeItem(SAVE_KEY);R=null;} musicStop(); S = {screen:'starter', msg:'', shop:false, sel:null}; },
  cont(){ continueSave(); },
  starterCategory(id){ if(STARTER_CATEGORIES.some(c=>c.id===id)) S.starterCategory=id; },
  pickStarter(id){
    const st=STARTERS.find(st=>st.id===id);
    if(S.screen!=='starter' || !st || (st.need && META.best<st.need)) return;
    newRun(id);
  },
  go(){ startBattle(false); },
  train(){ startBattle(true); },
  back(){ if(R.pending) return; musicStop(); R.reward = null; S.screen = 'hub'; S.shop = false; S.msg = ''; persist(); },
  shop(){ S.shop = !S.shop; persist(); },
  rest(){
    if(R.money<60) return; R.money -= 60;
    R.team.forEach(m => { if(m.hp>0) m.hp = Math.min(m.maxHp, m.hp+Math.ceil(m.maxHp*.35)); });
    sfx('heal'); S.msg = 'A equipe descansou.'; persist();
  },
  buy(i){
    const it = R.shop[+i]; if(!it || it.sold || R.money<it.price) return;
    R.money -= it.price;
    if(it.kind==='relic') R.relics[it.id] = relic(it.id)+1; else R.bag[it.id]++;
    if(it.once) it.sold = true;
    sfx('buy'); S.msg = `Comprou ${(it.kind==='relic'?RELICS:ITEMS)[it.id].n}.`; persist();
  },
  lead(i){ R.active = +i; S.msg = `${nm(active())} lidera.`; persist(); },
  sel(id){ S.sel = S.sel===id ? null : id; },
  evolve(v){ const [i,k] = String(v).split(':'); evolveMon(R.team[+i], +k||0); },
  card(i){
    if(!S.sel) return;
    LAST_EVO = false;
    const m = R.team[+i], id = S.sel, res = applyItem(id, m);
    if(res.ok){ R.bag[id]--; if(!R.bag[id]) S.sel = null; sfx(id==='candy' ? (LAST_EVO ? 'evo' : 'levelup') : 'heal'); persist(); }
    S.msg = res.msg;
  },
  mv(i){ playerMove(+i); },
  menu(v){ if(B.lock || (B.train && v==='ball')) return; B.menu = v; },
  bagUse(id){ useBattleItem(id); },
  ballUse(id){ throwBall(id); },
  sw(i){ doSwitch(+i); },
  flee(){ flee(); },
  reward(i){
    if(!R || R.mode==='classic' || R.pending || !R.reward?.[+i]) return;
    musicStop();
    const r = R.reward[+i];
    if(r.kind==='relic') R.relics[r.id] = relic(r.id)+1;
    else if(r.kind==='money') R.money += r.amt;
    else R.bag[r.id] += r.q;
    R.reward = null; S.screen = 'hub'; S.shop = false; S.msg = ''; persist();
  },
  release(i){ R.team[+i] = R.pending; R.pending = null; persist(); },
  skipCatch(){ R.pending = null; persist(); },
  retire(){ winRun(); },
  async abandon(){
    const message='A equipe e o progresso desta jornada serão perdidos. Pokédex, histórico e conquistas permanecem.';
    if(!(window.GameDialogs?await GameDialogs.confirm(message,{title:'Abandonar esta jornada?',confirmLabel:'Encerrar jornada'}):confirm('Abandonar esta jornada? '+message))) return;
    musicStop(); archiveRun('abandoned','Abandonada pelo treinador.'); R=null; S={screen:'title',msg:'',shop:false,sel:null};
    try{ SAVE_STORAGE.removeItem(SAVE_KEY); }catch(e){}
  },
  spd(){ CFG.speed = CFG.speed>=2 ? 1 : +(CFG.speed+0.5).toFixed(1); saveCfg(); },
  snd(){ CFG.sound = !CFG.sound; saveCfg(); musicSync(); },
  mus(){ CFG.music = !CFG.music; saveCfg(); musicSync(); }
};
$app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(!el || el.disabled) return;
  if(window.GameCommands){void GameCommands.dispatch(el.dataset.act,el.dataset.v||'');return;}
  const fn = ACT[el.dataset.act]; if(!fn) return;
  if(S.screen!=='battle') S.msg = '';
  menuActionSound(el.dataset.act,el.dataset.v);
  fn(el.dataset.v);
  render();
});
document.addEventListener('pointerdown', e => { try{ ac(); if(!e.target.closest('[data-act="menuPlay"]')) musicSync(); }catch(e){} }, {passive:true});
document.addEventListener('keydown', e => {
  if(e.key==='Enter' || e.key===' '){ ac(); musicSync(); }
  if(S.screen!=='battle' || !B || B.lock || B.menu!=='moves') return;
  const k = e.key;
  if(k>='1' && k<='4'){ const i=+k-1; if(active().moves[i]) playerMove(i); }
});
try{const old=JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY)||'null');if(old?.R){for(const m of old.R.team||[])dexRecord(m.sp,true);if(old.R.pending)dexRecord(old.R.pending.sp,true);META.peak=Math.max(META.peak,old.R.won||0);saveMeta();}}catch{}
// The expansion initializes migrations before rendering the first screen.

window.desktopCanManage = () => S.screen==='title' && !EVOLVING;

window.desktopProfileRewards=()=>({avatars:profileAvatars(),titles:earnedAchievements().map(a=>a.title)});
window.desktopGetProfile = () => CFG.profile || {};
window.desktopSaveProfile = profile => {
  const name=String(profile.name||'').trim().slice(0,24);
  const rewards=window.desktopProfileRewards(),avatars=rewards.avatars;
  if(!name || !avatars.includes(profile.avatar))throw new Error('Perfil inválido.');
  const title=rewards.titles.includes(profile.title)?profile.title:'';
  const next={...CFG,profile:{name,avatar:profile.avatar,title}};
  SAVE_STORAGE.setItem('umavida-cfg',JSON.stringify(next));
  CFG.profile=next.profile;
};
window.desktopCanReturnTitle = () => S.screen==='hub' && !EVOLVING;
window.desktopReturnTitle = () => {if(!window.desktopCanReturnTitle())return;persist();S.screen='title';S.shop=false;render();};

// Directional navigation inside the handheld-style menus.
$app.addEventListener('keydown', event => {
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const menu=event.target.closest('.gba-menu');if(!menu)return;
  const buttons=[...menu.querySelectorAll('button:not(:disabled)')];
  const i=buttons.indexOf(event.target);if(i<0||!buttons.length)return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  buttons[next].focus();
});

$app.addEventListener('click',event=>{if(event.target.closest('.gba-options summary'))menuActionSound('options');});

$app.addEventListener('keydown',event=>{
 if(event.key==='Escape' && playlistOpen){playlistOpen=false;render();document.querySelector('.playlist-toggle')?.focus();}
});
