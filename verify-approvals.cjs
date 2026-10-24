const assert = require('node:assert/strict');
const fs = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');

async function main(){
  const pg = new PGlite();
  await pg.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    create function gen_random_bytes(n integer) returns bytea language sql
      as $$select decode(repeat('ab',n),'hex')$$;
  `);
  await pg.exec(fs.readFileSync(__dirname+'/supabase/schema.sql','utf8'));
  await pg.exec(fs.readFileSync(__dirname+'/supabase/migrations/20261023_approvals.sql','utf8'));
  const owner='11111111-1111-1111-1111-111111111111';
  const friend='22222222-2222-2222-2222-222222222222';
  await pg.exec(`
    insert into auth.users values ('${owner}'),('${friend}');
    insert into mm_profiles(id,name) values ('${owner}','Owner'),('${friend}','Friend');
    set role authenticated;
    set request.jwt.claim.sub='${owner}';
  `);
  const group=(await pg.query("select mm_create_group('Friends') as id")).rows[0].id;
  const code=(await pg.query(`select code from mm_groups where id='${group}'`)).rows[0].code;
  const request=(await pg.query(`insert into mm_approval_requests
    (group_id,user_id,item,currency,price,reason,mode)
    values ('${group}','${owner}','Book','USD',12.50,'Want to read it','multi')
    returning id`)).rows[0].id;
  await assert.rejects(pg.exec(`insert into mm_approval_votes(request_id,user_id,choice,reason)
    values ('${request}','${owner}','approve','self vote')`));
  await pg.exec(`set request.jwt.claim.sub='${friend}'`);
  assert.equal((await pg.query('select * from mm_approval_requests')).rows.length,0);
  await assert.rejects(pg.exec(`insert into mm_approval_votes(request_id,user_id,choice,reason)
    values ('${request}','${friend}','approve','outside group')`));
  await pg.query('select mm_join_group($1)',[code]);
  assert.equal((await pg.query('select * from mm_approval_requests')).rows.length,1);
  await pg.exec(`insert into mm_approval_votes(request_id,user_id,choice,reason)
    values ('${request}','${friend}','approve','Good idea')`);
  assert.equal((await pg.query('select * from mm_approval_votes')).rows.length,1);
  console.log('Approval RLS passed: group isolation, friend vote, owner self-vote rejection.');
}
main().catch(error=>{console.error(error);process.exit(1)});
