// Always-on public entry point. No tunnels, desktop launchers or GPU processes.
const {prepare}=require('./deployment/storage.cjs');
function start(){
 if(!['chatkhu','gemini'].includes(process.env.AI_IMAGE_PROVIDER))throw Error('Cloud deployment requires an API image provider');
 const store=prepare();process.env.AI_WORK_DIR=store.work;process.env.AI_USAGE_LOG_FILE=store.usageFile;
 const server=require('./public-server.cjs').createPublicServer({feedbackFile:store.feedbackFile});
 const port=Number(process.env.PORT||10000);server.listen(port,'0.0.0.0',()=>console.log('Draw Weapon cloud server ready on port '+port));
 const stop=()=>{server.close(()=>process.exit(0));setTimeout(()=>{server.closeAllConnections();process.exit(0);},25000).unref();};process.once('SIGTERM',stop);process.once('SIGINT',stop);return server;
}
if(require.main===module)start();module.exports={start};
