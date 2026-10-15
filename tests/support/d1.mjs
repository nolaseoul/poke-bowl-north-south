import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function database(){
 const sql=new DatabaseSync(':memory:'),directory=new URL('../../migrations/',import.meta.url);
 for(const name of readdirSync(directory).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL(name,directory),'utf8'));
 const db={prepare(query){return{bind(...args){return{async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)},execute(){return sql.prepare(query).run(...args)}}}}},async batch(statements){sql.exec('BEGIN');try{const result=statements.map(s=>s.execute());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}};
 return{db,sql};
}
