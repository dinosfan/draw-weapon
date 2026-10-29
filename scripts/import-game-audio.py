"""Copy selected tracks safely and convert the uncompressed AIFF cue to WAV."""
from pathlib import Path
import zipfile, struct, math, wave
out=Path('dist/assets/audio');out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile('output/audio-sources/chiptunes.zip') as z:
    name=next(n for n in z.namelist() if n.endswith('3. Boss Fight.ogg'))
    (out/'battle-1.ogg').write_bytes(z.read(name))
with zipfile.ZipFile('output/audio-sources/8bit.zip') as z:
    for original,target in [('Craft_00.mp3','evolution-craft.mp3'),('Jingle_Achievement_01.mp3','evolution-complete.mp3'),('Menu_Navigate_00.mp3','menu-confirm.mp3')]:
        name=next(n for n in z.namelist() if n.endswith('/Mp3/'+original))
        (out/target).write_bytes(z.read(name))
with zipfile.ZipFile('output/audio-sources/powerup.zip') as z:
    data=z.read('Rise03.aif')
assert data[:4]==b'FORM' and data[8:12]==b'AIFF'
offset=12; comm=pcm=None
while offset+8<=len(data):
    kind=data[offset:offset+4];size=int.from_bytes(data[offset+4:offset+8],'big');chunk=data[offset+8:offset+8+size]
    if kind==b'COMM': comm=chunk
    if kind==b'SSND': pcm=chunk[8+int.from_bytes(chunk[:4],'big'):]
    offset+=8+size+(size%2)
channels,frames,bits=struct.unpack('>hIh',comm[:8]);exponent=int.from_bytes(comm[8:10],'big');mantissa=int.from_bytes(comm[10:18],'big');rate=round(math.ldexp(mantissa,exponent-16383-63))
assert channels in [1,2] and bits in [16,24] and rate in [22050,44100,48000]
width=bits//8;pcm=pcm[:frames*channels*width];little=b''.join(pcm[i:i+width][::-1] for i in range(0,len(pcm),width))
with wave.open(str(out/'evolution-rise.wav'),'wb') as w:
    w.setnchannels(channels);w.setsampwidth(width);w.setframerate(rate);w.writeframes(little)
print('Imported stage-one boss track, evolution cues and PCM rise:',rate,'Hz')
