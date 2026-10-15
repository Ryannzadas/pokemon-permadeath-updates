'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function rules(input={}){
 if(![50,100].includes(input.level)||!['single','double'].includes(input.format))throw Error('Regras inválidas.');
 return {level:input.level,format:input.format,bag:!!input.bag,editableTeams:!!input.editableTeams,banned:Array.isArray(input.banned)?[...new Set(input.banned.filter(x=>typeof x==='string'))].slice(0,100):[]};
}
function schedule(ids,format){
 if(!Array.isArray(ids)||ids.length<2||ids.length>32||new Set(ids).size!==ids.length)throw Error('A liga precisa de 2 a 32 participantes.');
 if(format==='round-robin'){const games=[];for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)games.push({id:String(games.length),round:1,players:[ids[a],ids[b]],winner:null,state:'pending'});return games;}
 if(format!=='knockout')throw Error('Formato inválido.');
 const size=2**Math.ceil(Math.log2(ids.length)),slots=[...ids,...Array(size-ids.length).fill(null)],games=[];
 // Spread byes across pairings, avoiding empty-vs-empty matches.
 for(let i=0;i<size/2;i++){const pair=[slots[i],slots[size-1-i]],winner=pair.includes(null)?pair.find(Boolean):null;games.push({id:String(i),round:1,players:pair,winner,state:winner?'completed':'pending'});}
 return games;
}
function standings(league){const table=league.members.map(id=>({id,wins:0,losses:0,played:0,points:0}));for(const game of league.matches){if(!game.winner||game.state!=='completed'||game.players.includes(null))continue;for(const id of game.players){const row=table.find(x=>x.id===id);row.played++;if(id===game.winner){row.wins++;row.points+=3;}else row.losses++;}}return table.sort((a,b)=>b.points-a.points||a.losses-b.losses||a.id.localeCompare(b.id));}
function record(league,gameId,winner,matchId){
 const g=league.matches.find(x=>x.id===gameId);if(!g||!g.players.includes(winner))throw Error('Resultado inválido.');
 if(g.state==='completed'){if(g.winner!==winner||g.matchId!==matchId)throw Error('Resultado já registrado.');return league;}
 g.winner=winner;g.matchId=matchId;g.state='completed';
 const round=league.matches.filter(x=>x.round===g.round);
 if(league.format==='knockout'&&round.every(x=>x.state==='completed')){
  const winners=round.map(x=>x.winner);if(winners.length===1){league.state='completed';league.champion=winners[0];league.championTeam=clone(league.teams[winners[0]]);}
  else if(!league.matches.some(x=>x.round===g.round+1))for(let i=0;i<winners.length;i+=2)league.matches.push({id:String(league.matches.length),round:g.round+1,players:[winners[i],winners[i+1]],winner:null,state:'pending'});
 }else if(league.format==='round-robin'&&league.matches.every(x=>x.state==='completed')){league.state='completed';const ranking=standings(league),leaders=ranking.filter(x=>x.points===ranking[0].points);if(leaders.length===1){league.champion=leaders[0].id;league.championTeam=clone(league.teams[league.champion]);}else{league.tied=leaders.map(x=>x.id);league.format='knockout';const playoff=schedule(league.tied,'knockout'),offset=league.matches.length,round=Math.max(...league.matches.map(x=>x.round))+1;league.matches.push(...playoff.map((x,i)=>({...x,id:String(offset+i),round})));league.state='playing';}}
 return league;
}
module.exports={rules,schedule,standings,record};
