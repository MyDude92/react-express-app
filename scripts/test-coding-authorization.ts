import assert from 'node:assert/strict';
import { handleCodingSubmit, handleCodingReveal } from '../lib/coding/handlers';
import { encodeCodingSession } from '../lib/quiz-tokens';
async function main() {
  const session = encodeCodingSession({taskId:'js-double-numbers',track:'javascript',userId:'other-account',roadmapAttemptId:'other-attempt-0123456789'});
  for (const handler of [handleCodingSubmit, handleCodingReveal]) {
    const response = {statusCode:200,body:null as unknown,setHeader(){},status(code:number){this.statusCode=code;return this;},json(body:unknown){this.body=body;return this;}};
    await handler({method:'POST',headers:{},body:{session,code:'const double=ns=>ns.map(n=>n*2)',hintsUsed:20}} as never,response as never,null);
    assert.equal(response.statusCode,403,'reject another account’s session before grading or database access');
  }
  console.log('Coding account-bound submit and reveal authorization passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
