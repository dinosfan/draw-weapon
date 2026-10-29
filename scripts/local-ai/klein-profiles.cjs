// Speed comparisons keep model, prompt, seed, dimensions and sampling identical.
module.exports=Object.freeze({
 baseline:{backend:'diffusion=Vulkan0,te=Vulkan0,vae=Vulkan0',extra:[]},
 fp16:{backend:'diffusion=Vulkan0,te=Vulkan0,vae=Vulkan0',extra:['--tensor-type-rules','(vae|first_stage_model)\\.=f16']},
 direct:{backend:'diffusion=Vulkan0,te=Vulkan0,vae=Vulkan0',extra:['--tensor-type-rules','(vae|first_stage_model)\\.=f16','--conv-direct','auto,vae=on']},
 'cpu-vae':{backend:'diffusion=Vulkan0,te=Vulkan0,vae=cpu',extra:[]}
});
