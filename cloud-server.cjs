// Render serves the poster locally and relays its live creation to the game host.
const {prepare}=require('./deployment/storage.cjs');
function start(){
 if(!['chatkhu','gemini'].includes(process.env.AI_IMAGE_PROVIDER))throw Error('Cloud deployment requires an API image provider');
 const store=prepare();process.env.AI_WORK_DIR=store.work;process.env.AI_USAGE_LOG_FILE=store.usageFile;
 const gateway=process.env.AI_IMAGE_PROVIDER==='chatkhu'?require('./ai/chatkhu-http.cjs'):null;
 const fetchImpl=gateway?.request;
 const entryOrigin=process.env.RENDER==='true'?process.env.DRAW_WEAPON_PUBLIC_ORIGIN:undefined;
 const posterRelay=process.env.RENDER==='true'?require('./deployment/poster-relay.cjs').createPosterRelay({origin:entryOrigin}):undefined;
 if(gateway&&process.env.RENDER==='true'&&!entryOrigin)gateway.checkGateway({
  key:(process.env.BAZE_API_KEY||process.env.GEMINI_API_KEY||process.env.AI_API_KEY||'').trim(),
  analysisModel:process.env.AI_MODEL||'gemini-3.5-flash',
  imageModel:process.env.AI_IMAGE_MODEL||require('./ai/baze.cjs').MODEL,
 });
 const server=require('./public-server.cjs').createPublicServer({
  feedbackFile:store.feedbackFile,
  factory:options=>require('./serve.cjs').createServer({...options,fetchImpl}),
  entryOrigin,posterRelay,
 });
 const port=Number(process.env.PORT||10000);server.listen(port,'0.0.0.0',()=>console.log('Draw Weapon cloud server ready on port '+port));
 const stop=()=>{server.close(()=>process.exit(0));setTimeout(()=>{server.closeAllConnections();process.exit(0);},25000).unref();};process.once('SIGTERM',stop);process.once('SIGINT',stop);return server;
}
if(require.main===module)start();module.exports={start};
