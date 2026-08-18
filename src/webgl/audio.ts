/**
 * Journey audio — one sound, and nothing else.
 *
 * There is deliberately no ambient bed here: no pad, no drone, no sub, no
 * background track. An earlier version had a filtered chord whose cutoff rose
 * with scroll progress, which is exactly why it read as a motor spinning up.
 * That is gone, along with the distance-triggered notes that layered over it.
 *
 * What remains is a soft bell that sounds when the camera passes through a
 * gate. Sine tones with a gentle attack and a long tail, into a generous
 * room — the melody comes from the gates themselves, each stepping a major
 * pentatonic, so a run plays as a calm phrase rather than a game cue.
 *
 * The motif is original; nothing here quotes an existing soundtrack.
 *
 * Two hard rules, unchanged:
 *  - Muted by default. Sound that starts on its own is hostile, and browsers
 *    block it anyway.
 *  - The AudioContext is only constructed inside a real user gesture.
 */

const STORAGE_KEY = 'sz-journey-audio';

/**
 * Optional music bed, supplied by you.
 *
 * Drop a file you hold rights to at `public/assets/audio/theme.mp3` and it
 * loops quietly under the gate blips. Nothing breaks if it is absent — that
 * is the default and supported state, so the site ships fine with no file.
 *
 * Royalty-free chiptune that gets close to the arcade feel:
 *   - pixabay.com/music  (search "chiptune" / "8-bit")
 *   - opengameart.org    (filter by CC0)
 *   - freesound.org      (filter by CC0)
 *   - incompetech.com    (Kevin MacLeod, CC-BY with attribution)
 */
const BED_URL = '/assets/audio/theme.mp3';

/** Major pentatonic. Cheerful in any order, which suits a random gate run. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Root of the blips — high enough to read as a "boop", not a bass note. */
const ROOT = 261.63; // C4

type Nodes = {
	ctx: AudioContext;
	master: GainNode;
	dry: GainNode;
	wet: GainNode;
	bedGain: GainNode;
};

let nodes: Nodes | null = null;
let enabled = false;

export function isAudioEnabled() {
	return enabled;
}

export function audioPreference(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === 'on';
	} catch {
		return false;
	}
}

const semitone = (n: number) => Math.pow(2, n / 12);

/**
 * A small room. The blips sound thin and clicky completely dry, and a short
 * tail is the difference between "toy" and "cheap".
 */
function makeImpulse(ctx: AudioContext, seconds = 2.8, decay = 2.4): AudioBuffer {
	const len = Math.floor(ctx.sampleRate * seconds);
	const buf = ctx.createBuffer(2, len, ctx.sampleRate);
	for (let ch = 0; ch < 2; ch++) {
		const data = buf.getChannelData(ch);
		for (let i = 0; i < len; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
		}
	}
	return buf;
}

/** Must be called from inside a user gesture. */
function build(): Nodes {
	const Ctor =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	const ctx = new Ctor();

	const master = ctx.createGain();
	master.gain.value = 0;

	// Keeps a fast scroll through a dense gate run from clipping.
	const comp = ctx.createDynamicsCompressor();
	comp.threshold.value = -14;
	comp.knee.value = 20;
	comp.ratio.value = 4;
	comp.attack.value = 0.004;
	comp.release.value = 0.2;

	master.connect(comp);
	comp.connect(ctx.destination);

	const dry = ctx.createGain();
	dry.gain.value = 1;
	dry.connect(master);

	const convolver = ctx.createConvolver();
	convolver.buffer = makeImpulse(ctx);
	const wet = ctx.createGain();
	wet.gain.value = 0.5;
	wet.connect(convolver);
	convolver.connect(master);

	// Music bed, silent until a file is actually found.
	const bedGain = ctx.createGain();
	bedGain.gain.value = 0;
	bedGain.connect(master);

	const n: Nodes = { ctx, master, dry, wet, bedGain };
	void loadBed(n);
	return n;
}

/**
 * Load the optional bed. Any failure — missing file, wrong type, decode error
 * — silently leaves the gate blips as the only sound, which is the intended
 * default rather than a fallback.
 */
async function loadBed(n: Nodes) {
	try {
		const res = await fetch(BED_URL);
		if (!res.ok) return;
		const type = res.headers.get('content-type') ?? '';
		if (!type.startsWith('audio/')) return;

		const buf = await n.ctx.decodeAudioData(await res.arrayBuffer());
		const src = n.ctx.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		src.connect(n.bedGain);
		src.start();

		// Well under the blips: the gates stay the foreground event.
		n.bedGain.gain.setTargetAtTime(0.28, n.ctx.currentTime, 1.2);
	} catch {
		/* no bed — blips only */
	}
}

/**
 * iOS mutes Web Audio with the hardware ringer switch unless the page has
 * played through a media element first, which promotes the audio session.
 * One silent sample on the unlock gesture is enough, and it is harmless
 * everywhere else.
 */
function nudgeIosAudioSession() {
	try {
		const el = document.createElement('audio');
		el.setAttribute('playsinline', '');
		el.muted = true;
		el.src =
			'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';
		void el.play().catch(() => {});
	} catch {
		/* best effort only */
	}
}

export async function setAudioEnabled(on: boolean) {
	enabled = on;
	try {
		localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
	} catch {
		/* storage can be unavailable in private modes; the toggle still works */
	}

	if (on) {
		if (!nodes) {
			nudgeIosAudioSession();
			nodes = build();
		}
		if (nodes.ctx.state === 'suspended') await nodes.ctx.resume();
		nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
		nodes.master.gain.setTargetAtTime(0.32, nodes.ctx.currentTime, 0.25);
	} else if (nodes) {
		nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
		nodes.master.gain.linearRampToValueAtTime(0, nodes.ctx.currentTime + 0.2);
	}
}

/**
 * One soft bell tone.
 *
 * Sine fundamental with a quiet partial a twelfth above, a gentle attack and a
 * long decay. This replaces the square-wave arcade blip: a square is all odd
 * harmonics and a hard edge, which is bright and toy-like — pleasant for two
 * notes and grating for thirty. Sines carry almost no harmonic content, so the
 * same melody lands soft.
 */
function tone(freq: number, gain: number, at: number, dur: number) {
	if (!nodes) return;
	const { ctx, dry, wet } = nodes;
	const t = ctx.currentTime + at;

	const osc = ctx.createOscillator();
	osc.type = 'sine';
	osc.frequency.value = freq;

	// A twelfth up, barely audible — enough to give the note a bell's shimmer
	// without any of a square's bite.
	const partial = ctx.createOscillator();
	partial.type = 'sine';
	partial.frequency.value = freq * 3;
	const partialAmp = ctx.createGain();
	partialAmp.gain.value = 0.06;

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, t);
	// 25ms attack rather than 6ms. The sharp attack was most of what made the
	// old sound read as a beep.
	amp.gain.exponentialRampToValueAtTime(gain, t + 0.025);
	amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

	osc.connect(amp);
	partial.connect(partialAmp);
	partialAmp.connect(amp);
	amp.connect(dry);
	amp.connect(wet);

	osc.start(t);
	partial.start(t);
	osc.stop(t + dur + 0.05);
	partial.stop(t + dur + 0.05);
}

/**
 * A single soft chime, with a quiet octave below for warmth.
 *
 * Deliberately one note, not a two-note flourish: a rising pair reads as a
 * game reward, and the brief is now a melody rather than an arcade cue. One
 * note per gate lets the run itself carry the tune.
 */
function blip(freq: number, gain: number) {
	tone(freq, gain, 0, 1.9);
	tone(freq / 2, gain * 0.3, 0.01, 2.4);
}

/**
 * The camera passing through a gate — the only thing that makes a sound.
 * `step` is the gate's index in its run, so a colonnade plays as a rising riff.
 */
export function playGate(step = 0, intensity = 1) {
	if (!enabled || !nodes) return;
	const degree = SCALE[Math.abs(step) % SCALE.length];
	blip(ROOT * semitone(degree), 0.1 * intensity);
}

/** Hover feedback: the same blip, higher and much quieter. */
export function playTick() {
	if (!enabled || !nodes) return;
	blip(ROOT * semitone(SCALE[4] + 12), 0.03);
}
