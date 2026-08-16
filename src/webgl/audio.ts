/**
 * Journey audio — one sound, and nothing else.
 *
 * There is deliberately no ambient bed here: no pad, no drone, no sub, no
 * background track. An earlier version had a filtered chord whose cutoff rose
 * with scroll progress, which is exactly why it read as a motor spinning up.
 * That is gone, along with the distance-triggered notes that layered over it.
 *
 * What remains is a single cartoon blip that fires when the camera passes
 * through a gate. It slides up in pitch, which is what makes it read as
 * playful rather than as an instrument, and each gate in a run steps up a
 * MAJOR pentatonic — major because minor scales sound moody and the brief is
 * fun. Flying a colonnade plays a cheerful little riff; sitting still is
 * completely silent.
 *
 * Two hard rules, unchanged:
 *  - Muted by default. Sound that starts on its own is hostile, and browsers
 *    block it anyway.
 *  - The AudioContext is only constructed inside a real user gesture.
 */

const STORAGE_KEY = 'sz-journey-audio';

/** Major pentatonic. Cheerful in any order, which suits a random gate run. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Root of the blips — high enough to read as a "boop", not a bass note. */
const ROOT = 261.63; // C4

type Nodes = {
	ctx: AudioContext;
	master: GainNode;
	dry: GainNode;
	wet: GainNode;
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

	return { ctx, master, dry, wet };
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
 * The blip.
 *
 * A square through a lowpass, pitch sliding up about a fifth over the first
 * 50ms. That rising slide is the whole character: flat, it is a beep; bent,
 * it is a boop.
 */
function blip(freq: number, gain: number) {
	if (!nodes) return;
	const { ctx, dry, wet } = nodes;
	const now = ctx.currentTime;
	const dur = 0.2;

	const osc = ctx.createOscillator();
	osc.type = 'square';
	osc.frequency.setValueAtTime(freq * 0.62, now);
	osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);

	// A quieter sine above rounds off the square's edge.
	const shine = ctx.createOscillator();
	shine.type = 'sine';
	shine.frequency.setValueAtTime(freq * 1.24, now);
	shine.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.05);

	const filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.setValueAtTime(Math.min(7000, freq * 6), now);
	filter.Q.value = 1;

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(gain, now + 0.008);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);

	const shineAmp = ctx.createGain();
	shineAmp.gain.value = 0.22;

	osc.connect(filter);
	shine.connect(shineAmp);
	shineAmp.connect(filter);
	filter.connect(amp);
	amp.connect(dry);
	amp.connect(wet);

	osc.start(now);
	shine.start(now);
	osc.stop(now + dur + 0.05);
	shine.stop(now + dur + 0.05);
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
