// Only retry transient upstream failures. Never retry authentication or quota errors.
async function fetchRetry(url,options,{fetchImpl=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms)),attemptTimeoutMs=17000,attempts=3}={}){
 for(let attempt=0;attempt<attempts;attempt++){
  const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(attemptTimeoutMs)]):AbortSignal.timeout(attemptTimeoutMs);
  try{const response=await fetchImpl(url,{...options,signal});if(![500,502,503,504].includes(response.status)||attempt===attempts-1)return response;await response.body?.cancel()}catch(e){if(options.signal?.aborted||attempt===attempts-1||!['TimeoutError','TypeError'].includes(e.name))throw e}
  await wait(attempt===0?700:1500);
 }
}
module.exports={fetchRetry};
