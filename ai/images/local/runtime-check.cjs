const Atlas=require('../../../dist/js/battle/effects/sprite-atlas.js'),Palette=require('../../../dist/js/palette.js'),Types=require('../../../dist/js/weapons/types.js');
function check(inspection,index,element){
 if(!inspection.pixels)return inspection;
 const source=Buffer.from(inspection.pixels,'base64');delete inspection.pixels;
 if(source.length!==96*96*4*4)return{...inspection,valid:false,issues:[{reason:'pixel data length'}]};
 const pixels=new Uint8ClampedArray(384*384*4);
 for(let col=0;col<4;col++)for(let y=0;y<96;y++){const from=(col*96*96+y*96)*4;pixels.set(source.subarray(from,from+96*4),((index*96+y)*384+col*96)*4);}
 try{Atlas.clearWhiteMattes(pixels,96);Atlas.quantize(pixels,element,Palette,Types,true);Atlas.clearWhiteMattes(pixels,96);Atlas.cleanEdges(pixels,96);Atlas.assertFrames(pixels,96,4,true,[index]);
  const coverage=[];for(let col=0;col<4;col++){let count=0,edge=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){const opaque=pixels[((index*96+y)*384+col*96+x)*4+3]>=96;if(opaque){count++;if(x<2||x>=94)edge++;if(y<2||y>=94)edge++;}}const amount=count/(96*96);coverage.push(Math.round(amount*10000)/10000);if((col<3&&amount<.005)||amount>.85||edge>8)throw Error('정리 후에도 프레임이 비었거나 테두리에 잘린 픽셀이 있습니다.');}
  return{...inspection,valid:true,issues:[],coverage,runtimeChecked:true};
 }catch(error){return{...inspection,valid:false,issues:[...(inspection.issues||[]),{reason:error.message}]};}
}
module.exports={check};
