// Counters use authoritative final box scores. Receiving TDs count once; passing
// TDs are the same scores, and conversions do not add touchdowns to box scores.
export function totalsFor(match){
 if(!match.over)throw Error('Finish the match before saving.');
 const rows=match.stats.flatMap(team=>Object.values(team));
 return {touchdowns:rows.reduce((n,s)=>n+s.rushTD+s.recTD+s.returnTD,0),tackles:rows.reduce((n,s)=>n+s.tackles,0)};
}
export function contribution(db,id,mode,match){
 const {touchdowns,tackles}=totalsFor(match);
 return db.prepare('INSERT OR IGNORE INTO stadium_games(id,mode,touchdowns,tackles) VALUES(?,?,?,?)').bind(id,mode,touchdowns,tackles);
}
