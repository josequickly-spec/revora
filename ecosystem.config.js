module.exports = {
 apps: [
 {
 name: 'revora-next',
 script: 'node',
 args: 'scripts/start.mjs',
 env: {
 NODE_ENV: 'production'
 }
 },
 {
 name: 'outreach-worker',
 script: 'node',
 args: 'src/workers/outreach-worker.ts',
 env: {
 NODE_ENV: 'production'
 }
 }
 ]
};
