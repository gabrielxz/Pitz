// Tiny synthesized sound effects via the Web Audio API — no asset files needed.
// Keeps the build light and avoids external requests on itch.

type SfxName = "step" | "lightOn" | "lightOff" | "death" | "win" | "click" | "blocked";

class Audio {
  private ctx: AudioContext | null = null;
  muted = false;

  private ac(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.18, slideTo?: number): void {
    const ctx = this.ac();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  play(name: SfxName): void {
    switch (name) {
      case "step": this.blip(220, 0.07, "square", 0.08); break;
      case "blocked": this.blip(110, 0.08, "sawtooth", 0.06); break;
      case "lightOn": this.blip(440, 0.12, "triangle", 0.14, 880); break;
      case "lightOff": this.blip(440, 0.12, "triangle", 0.12, 160); break;
      case "click": this.blip(330, 0.06, "square", 0.1); break;
      case "win": this.arp([523, 659, 784, 1047], 0.12); break;
      case "death": this.blip(200, 0.5, "sawtooth", 0.2, 60); break;
    }
  }

  private arp(freqs: number[], step: number): void {
    const ctx = this.ac();
    if (!ctx) return;
    freqs.forEach((f, i) => setTimeout(() => this.blip(f, 0.18, "triangle", 0.15), i * step * 1000));
  }
}

export const audio = new Audio();
