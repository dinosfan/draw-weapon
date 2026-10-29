const Story=require('../dist/js/weapons/story.js');
const Types=require('../dist/js/weapons/types.js');
const Rules=require('../dist/js/weapons/move-rules.js');
const Feel=require('../dist/js/weapons/hit-feel.js');
const string={type:'string'};
const typeId={type:'string',enum:Object.keys(Types.labels)};
const number=(minimum,maximum,type='integer')=>({type,minimum,maximum});
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const rule=object({kind:string,accuracy:number(50,100),chance:number(0,100),amount:number(1,2)});
const anchor={type:'number',minimum:0,maximum:1};
const rig=object({family:string,gripX:anchor,gripY:anchor,tipX:anchor,tipY:anchor});
const delivery=object({mode:string,payload:string,count:number(1,6),spread:number(0,30),path:{type:'string',enum:['straight','arc','spiral']}});
// A deeply nested constrained decoder rejects this timeline. Parse and validate its
// JSON data on the server instead; the normalized client representation is an object.
const motionPlan={type:'string',description:'JSON-encoded motionPlan object with duration, contact, carrier and layers. Follow the timeline and glyph specification. JSON data only, no executable code.'};
// Nested scene enums exceed Gemini's decoder budget once physical rig data is added.
// Story.normalize still validates each action/target/part on the server.
const scene=object({label:string,action:string,motif:string,target:string,part:string,duration:number(350,800)});
const move=object({ultimate:{type:'boolean',description:'Exactly one of the four moves is the concept-defining signature, eligible as a one-use ultimate at mythic rarity. Other moves false.'},name:string,description:string,effectGlyph:{type:'string',maxLength:599,description:'12-16 square pixel shape guide of the detached VFX, slash-separated equal-width .1234 rows. For melee/throws draw contact trace only, never the held carrier. Matches effectBrief; does not add a motion layer.'},effectBrief:{type:'string',maxLength:300,description:'One English sentence describing ONLY the detached emitted matter, contact trace or support manifestation and its impact. For emitted attacks omit the off-screen carrier, handle and firing mechanism. Explicit throws may describe the original object.'},element:typeId,damage:number(0,48),heal:number(0,30),skipCounter:{type:'boolean'},pp:number(2,15),feel:{type:'string',enum:Object.keys(Feel.profiles)},delivery,motionPlan,rule});
module.exports=object({
  concept:object({defense:string,healing:string}),rig,engine:object({mode:{type:'string',enum:['none','resource']},name:string,rule:string}),name:string,type:string,trait:string,reason:string,
  types:{type:'array',items:typeId,minItems:1,maxItems:2},typeReason:string,
  attack:number(18,28),moves:{type:'array',items:move,minItems:4,maxItems:4}
});

