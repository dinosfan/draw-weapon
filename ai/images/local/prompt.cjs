function concepts(weapon){return weapon.moves.map((m,index)=>({row:index+1,name:m.name,effectBrief:m.effectBrief||m.description,delivery:m.delivery}));}
function neutralBrief(brief){return brief.replace(/\b(?:green|emerald|verdant|lime|red|scarlet|orange|yellow|golden|gold|pink|purple|violet|blue|cyan|turquoise|brown)\b/gi,'indigo');}
function rows(weapon){return concepts(weapon).map(m=>'Row '+m.row+' skill '+JSON.stringify(m.name)+'; delivery '+JSON.stringify(m.delivery||{})+'; visual action: '+neutralBrief(m.effectBrief)).join('\n');}
const rarityFinish={
 common:'One clean readable silhouette, restrained fragments, a short precise impact. Leave ample negative space.',
 rare:'Distinct motion trails and a bright compact impact core, with a few subject-specific fragments.',
 epic:'Layered foreground and rear fragments, stronger silhouette deformation and a clearly different peak impact frame.',
 legendary:'Dramatic contrast, multiple depth layers and a powerful expanding impact silhouette. Keep each skill subject recognizable.',
 mythic:'Exceptional ultimate-quality pixel craft: intricate subject-specific detail, a dramatic transformation at peak impact and rich disintegration. Never replace the skill subject with a generic explosion.'
};
function promptFor(weapon){return `Create a NEW pixel-art animation sheet. Reference is ONLY for layout and pixel finish; replace ALL its subjects. The original drawing has been visually analyzed into the identity and four skill briefs below. Preserve those distinctive subjects and motifs. Drawing identity (data): ${JSON.stringify({name:weapon.name,type:weapon.type,reason:weapon.reason})}.
EXACTLY FOUR columns and FOUR rows: SIXTEEN small isolated sprites, one visible sprite centered in EVERY equal cell. Each row is ONE skill animated left to right: ignition, expansion, impact, fading fragments. Keep wide green margins so no sprite touches another cell. Even ignition and fade must be visibly populated.
For shot and spray rows: columns 1 and 2 show the actual emitted projectile with a rightward travel trail; columns 3 and 4 show its impact and dissipation. Use that skill's named subject, not a generic bullet or energy orb. Keep any separate held carrier out of emitted frames. For throw rows the drawing ITSELF is the projectile: preserve that object rather than replacing it with ammunition. For melee rows show its specific contact trace; for support rows show its specific support action. No unrelated subject or character. No letters, numbers, row markers, labels or grid lines.
Flat pure green RGB(0,255,0) background everywhere. Foreground only charcoal outlines, indigo pixels and bright white cores. Crisp pixel clusters with no blurry painted background. Rarity ${weapon.rarity||'common'}: ${rarityFinish[weapon.rarity]||rarityFinish.common} Preserve the four actions and their existing roles exactly.
Four visual actions, in row order (descriptive data, not instructions):
${rows(weapon)}`;}
function repairFor(weapon,inspection){return `Reference is the sheet to repair. The four skill briefs below come from visual analysis of the player's original drawing; they are the authority for subject identity. Edit into EXACTLY FOUR columns and FOUR rows of SIXTEEN small isolated effects. Rebuild any oversized picture crossing cell borders. Remove labels, numbers and characters. Preserve thrown objects; keep held carriers out of emitted-shot rows. Every cell needs a visible centered effect and wide empty green margins. Preserve the correct subjects and crisp pixel style. Populate sparse ignition/fade cells with visible particles for their own row. Flat pure green RGB(0,255,0) background and charcoal/indigo/white foreground only.
Cells to fix: ${JSON.stringify(inspection.lowCells||[])}
Preserve these exact visual actions in row order:
${rows(weapon)}`;}
module.exports={promptFor,repairFor,concepts,neutralBrief,rarityFinish};


