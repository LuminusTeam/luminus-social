// Vreta Sound System — mixerbordets ljudprocessorer.
// tap: spelar in exakt ett antal sampel från ett däck, för taktfasta slingor.
// pitch: höjer eller sänker tonhöjden utan att ändra tempot (två korsande fördröjningar).
class Tap extends AudioWorkletProcessor {
  constructor(){
    super(); this.job = null;
    this.port.onmessage = e => {
      const d = e.data;
      if(!d.len){ this.job = null; return; }
      this.job = {id: d.id, start: d.start, len: d.len, head: d.head, pos: 0, sent: false, L: new Float32Array(d.len), R: new Float32Array(d.len)};
    };
  }
  process(inputs){
    const j = this.job; if(!j) return true;
    const a = inputs[0][0], b = inputs[0][1] || a, n = a ? a.length : 128, f0 = currentFrame;
    if(j.start + j.pos < f0) j.start = f0 - j.pos;            // kom vi sent: börja nu
    for(let i = Math.max(0, j.start + j.pos - f0); i < n && j.pos < j.len; i++){ j.L[j.pos] = a ? a[i] : 0; j.R[j.pos] = b ? b[i] : 0; j.pos++; }
    if(!j.sent && j.head > 0 && j.pos >= j.head){ j.sent = true; this.port.postMessage({id: j.id, part: "head", start: j.start, L: j.L.slice(0, j.head), R: j.R.slice(0, j.head)}); }
    if(j.pos >= j.len){ this.port.postMessage({id: j.id, part: "full", start: j.start, L: j.L, R: j.R}, [j.L.buffer, j.R.buffer]); this.job = null; }
    return true;
  }
}
registerProcessor("tap", Tap);

class Pitch extends AudioWorkletProcessor {
  static get parameterDescriptors(){ return [{name: "ratio", defaultValue: 1, minValue: .25, maxValue: 4, automationRate: "k-rate"}]; }
  constructor(){ super(); this.N = 16384; this.buf = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.ph = 0; this.g = Math.round(sampleRate * .07); }
  process(inputs, outputs, params){
    const inp = inputs[0], out = outputs[0], r = params.ratio[0], n = out[0].length, N = this.N, g = this.g;
    for(let i = 0; i < n; i++){
      for(let c = 0; c < 2; c++){ const ch = inp[c] || inp[0]; this.buf[c][this.w] = ch ? ch[i] : 0; }
      if(r === 1){ for(let c = 0; c < out.length; c++) out[c][i] = this.buf[c][this.w]; }
      else {
        this.ph += (1 - r) / g; this.ph -= Math.floor(this.ph);
        for(let c = 0; c < out.length; c++){
          const b = this.buf[c]; let y = 0;
          for(let k = 0; k < 2; k++){
            const p = (this.ph + k * .5) % 1, s = Math.sin(Math.PI * p), x = this.w - p * g + N, i0 = Math.floor(x), fr = x - i0;
            y += s * s * (b[i0 % N] * (1 - fr) + b[(i0 + 1) % N] * fr);
          }
          out[c][i] = y;
        }
      }
      this.w = (this.w + 1) % N;
    }
    return true;
  }
}
registerProcessor("pitch", Pitch);
