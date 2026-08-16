/**
 * Journey audio — one sound, and nothing else.
 *
 * There is deliberately no ambient bed here: no pad, no drone, no sub, no
 * background track. An earlier version had a filtered chord whose cutoff rose
 * with scroll progress, which is exactly why it read as a motor spinning up.
 * That is gone, along with the distance-triggered notes that layered over it.
 *
 * What remains is a chiptune flourish that fires when the camera passes
 * through a gate: two fast rising square-wave notes, the arcade "reward"
 * shape. Each gate in a run steps up a MAJOR pentatonic — major because minor
 * scales sound moody and the brief is fun — so flying a colonnade plays a
 * cheerful little riff and sitting still is completely silent.
 *
 * The motif is original. The chiptune *idiom* is not ownable, but specific
 * game soundtracks very much are, so nothing here quotes one.
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
function makeImpulse(ctx: AudioContext, seconds = 1.1, decay = 3.2): AudioBuffer {
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
	wet.gain.value = 0.3;
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
		nodes.master.gain.setTargetAtTime(0.9, nodes.ctx.currentTime, 0.15);
	} else if (nodes) {
		nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
		nodes.master.gain.linearRampToValueAtTime(0, nodes.ctx.currentTime + 0.2);
	}
}

/**
 * One chiptune tone: a square with a hard attack and a short decay.
 *
 * `bend` slides the pitch during the attack, which is what separates an
 * arcade blip from a plain beep.
 */
function tone(freq: number, gain: number, at: number, dur: number, bend = 1) {
	if (!nodes) return;
	const { ctx, dry, wet } = nodes;
	const t = ctx.currentTime + at;

	const osc = ctx.createOscillator();
	osc.type = 'square';
	osc.frequency.setValueAtTime(freq * bend, t);
	if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(freq, t + 0.035);

	// A little vibrato. Pure square is stiff; this gives it some wobble.
	const lfo = ctx.createOscillator();
	lfo.frequency.value = 7;
	const lfoAmt = ctx.createGain();
	lfoAmt.gain.value = freq * 0.006;
	lfo.connect(lfoAmt);
	lfoAmt.connect(osc.frequency);

	// Rounds off the square's harshest harmonics without dulling the attack.
	const filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.value = Math.min(9000, freq * 7);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, t);
	amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
	amp.gain.setValueAtTime(gain, t + dur * 0.55);
	amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

	osc.connect(filter);
	filter.connect(amp);
	amp.connect(dry);
	amp.connect(wet);

	osc.start(t);
	lfo.start(t);
	osc.stop(t + dur + 0.05);
	lfo.stop(t + dur + 0.05);
}

/**
 * The arcade flourish: two fast rising notes.
 *
 * A single tone reads as a UI beep; two notes a fourth apart, 55ms apart,
 * read as a reward. This is an original motif in the chiptune idiom — the
 * style is fair game, specific game soundtracks are not.
 */
function blip(freq: number, gain: number) {
	tone(freq, gain, 0, 0.1, 0.75);
	tone(freq * semitone(5), gain * 0.95, 0.055, 0.26);
}

/**
 * The camera passing through a gate — the only thing that makes a sound.
 * `step` is the gate's index in its run, so a colonnade plays as a rising riff.
 */
export function playGate(step = 0, intensity = 1) {
	if (!enabled || !nodes) return;
	const degree = SCALE[Math.abs(step) % SCALE.length];
	blip(ROOT * semitone(degree), 0.22 * intensity);
}

/** Hover feedback: the same blip, higher and much quieter. */
export function playTick() {
	if (!enabled || !nodes) return;
	blip(ROOT * semitone(SCALE[4] + 12), 0.06);
}
