/**
 * Ambient audio for the journey.
 *
 * Synthesised with Web Audio — no files required, and every layer can be
 * steered continuously by scroll in a way a looping sample never could.
 *
 * There is deliberately NO noise layer. Filtered white noise is the obvious
 * way to score "movement", and it reads as tape hiss; everything here that
 * responds to speed does so musically instead.
 *
 * Layers:
 *
 *  1. PAD    — always present. A minor-pentatonic chord that transposes
 *              through a four-step progression across the journey, so the end
 *              is harmonically somewhere else than the beginning.
 *  2. NOTES  — one FM pluck per fixed distance travelled. This is what makes
 *              scrolling *play* the instrument: fast scrolling fires a
 *              cascade, slow scrolling leaves them sparse, stopping stops
 *              them. Pitches come from a pentatonic scale, so any density in
 *              any order stays consonant.
 *  3. ENERGY — a reward for sustained scrolling. Builds quickly while moving
 *              and decays slowly when idle, layering in a harmony voice, an
 *              octave shimmer and sub weight as it rises. Keep scrolling and
 *              the music thickens; stop and it thins out again.
 *  4. REVERB — a generated impulse response everything feeds into. Most of
 *              what makes it sound like a place rather than a set of beeps.
 *
 * An external track can replace the pad: drop a licensed file at
 * `/assets/audio/ambient.mp3` and it is used automatically, with the notes
 * layered over it. Absent, the synth pad plays. See `loadBed`.
 *
 * Two hard rules:
 *  - Muted by default. Sound that starts on its own is hostile, and browsers
 *    block it anyway.
 *  - The AudioContext is only constructed inside a real user gesture.
 */

const STORAGE_KEY = 'sz-journey-audio';

/** Optional user-supplied bed. Nothing breaks if it is not there. */
const BED_URL = '/assets/audio/ambient.mp3';

/** World units travelled between note triggers. */
const NOTE_STEP_UNITS = 13;
/** Floor on note spacing, so a violent scroll cannot machine-gun. */
const MIN_NOTE_GAP = 0.055;

/** A minor pentatonic, in semitones. Any subset in any order stays consonant. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
/** A contour rather than a random walk, so phrases have shape. */
const CONTOUR = [0, 2, 4, 3, 5, 7, 6, 4, 2, 3, 5, 8, 6, 4, 1, 3];
/** Four-chord progression the pad moves through across the journey. */
const PROGRESSION = [0, 3, 5, 7];

const ROOT = 55; // A1

type Nodes = {
	ctx: AudioContext;
	master: GainNode;
	dry: GainNode;
	wet: GainNode;
	padGain: GainNode;
	padFilter: BiquadFilterNode;
	padOscs: OscillatorNode[];
	subGain: GainNode;
	bedGain: GainNode;
	bedSource: AudioBufferSourceNode | null;
};

let nodes: Nodes | null = null;
let enabled = false;

// Scroll-tracking state.
let lastZ: number | null = null;
let distanceAccum = 0;
let noteIndex = 0;
let lastNoteTime = 0;
let currentChord = -1;
let energy = 0;
let lastUpdate = 0;

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
 * Impulse response for the reverb: stereo noise with an exponential decay.
 * Cheap to generate and indistinguishable from a real hall at this level.
 * (Noise is fine *here* — convolved, it is a room, not a hiss.)
 */
function makeImpulse(ctx: AudioContext, seconds = 3.4, decay = 2.6): AudioBuffer {
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

/**
 * Try to load a user-supplied bed track. Entirely optional: any failure
 * (missing file, wrong type, decode error) silently leaves the synth pad in
 * charge, so shipping without the file is a supported configuration.
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
		n.bedSource = src;

		// Hand the bed the low end and pull the synth pad back to a texture,
		// so the two do not fight over the same frequencies.
		n.bedGain.gain.setTargetAtTime(0.55, n.ctx.currentTime, 1.5);
		n.padGain.gain.setTargetAtTime(0.03, n.ctx.currentTime, 1.5);
	} catch {
		/* no bed — the synth pad is the intended default */
	}
}

/** Must be called from inside a user gesture. */
function build(): Nodes {
	const Ctor =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	const ctx = new Ctor();

	const master = ctx.createGain();
	master.gain.value = 0;

	// Keeps a fast scroll (many overlapping notes) from clipping without
	// leaving huge headroom everywhere else.
	const comp = ctx.createDynamicsCompressor();
	comp.threshold.value = -16;
	comp.knee.value = 22;
	comp.ratio.value = 5;
	comp.attack.value = 0.006;
	comp.release.value = 0.28;

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

	// --- Pad ---------------------------------------------------------------
	const padGain = ctx.createGain();
	padGain.gain.value = 0.085;

	const padFilter = ctx.createBiquadFilter();
	padFilter.type = 'lowpass';
	padFilter.frequency.value = 420;
	padFilter.Q.value = 1.1;

	padGain.connect(padFilter);
	padFilter.connect(dry);
	padFilter.connect(wet);

	const intervals = [0, 7, 12, 19];
	const padOscs = intervals.map((iv, i) => {
		const osc = ctx.createOscillator();
		osc.type = i === 0 ? 'sine' : 'triangle';
		osc.frequency.value = ROOT * semitone(iv);
		osc.detune.value = (i - 1.5) * 5;

		const g = ctx.createGain();
		g.gain.value = i === 0 ? 0.5 : 0.2 / (i * 0.5 + 1);
		osc.connect(g);
		g.connect(padGain);
		osc.start();
		return osc;
	});

	// Slow filter LFO so the pad breathes while idle.
	const lfo = ctx.createOscillator();
	lfo.frequency.value = 0.06;
	const lfoGain = ctx.createGain();
	lfoGain.gain.value = 90;
	lfo.connect(lfoGain);
	lfoGain.connect(padFilter.frequency);
	lfo.start();

	// --- Sub: weight that arrives only with sustained scrolling ------------
	const subGain = ctx.createGain();
	subGain.gain.value = 0;
	subGain.connect(dry);

	const sub = ctx.createOscillator();
	sub.type = 'sine';
	sub.frequency.value = ROOT / 2;
	sub.connect(subGain);
	sub.start();

	// --- Optional external bed ---------------------------------------------
	const bedGain = ctx.createGain();
	bedGain.gain.value = 0;
	bedGain.connect(dry);
	bedGain.connect(wet);

	const n: Nodes = {
		ctx,
		master,
		dry,
		wet,
		padGain,
		padFilter,
		padOscs,
		subGain,
		bedGain,
		bedSource: null,
	};

	void loadBed(n);
	return n;
}

export async function setAudioEnabled(on: boolean) {
	enabled = on;
	try {
		localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
	} catch {
		/* storage can be unavailable in private modes; the toggle still works */
	}

	if (on) {
		if (!nodes) nodes = build();
		if (nodes.ctx.state === 'suspended') await nodes.ctx.resume();
		nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
		nodes.master.gain.linearRampToValueAtTime(0.55, nodes.ctx.currentTime + 1.4);
	} else if (nodes) {
		nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
		nodes.master.gain.linearRampToValueAtTime(0, nodes.ctx.currentTime + 0.35);
	}
}

/**
 * One FM voice — a bell/electric-piano tone.
 *
 * The modulation index decays much faster than the amplitude, which is what
 * gives a struck instrument its bright attack and mellow tail. A plain
 * oscillator with an envelope always sounds like a test tone instead.
 */
function voice(freq: number, gain: number, decay = 1.6) {
	if (!nodes) return;
	const { ctx, dry, wet } = nodes;
	const now = ctx.currentTime;

	const carrier = ctx.createOscillator();
	carrier.type = 'sine';
	carrier.frequency.value = freq;

	const mod = ctx.createOscillator();
	mod.type = 'sine';
	mod.frequency.value = freq * 2;

	const modIndex = ctx.createGain();
	modIndex.gain.setValueAtTime(freq * 2.4, now);
	modIndex.gain.exponentialRampToValueAtTime(freq * 0.02, now + 0.32);

	mod.connect(modIndex);
	modIndex.connect(carrier.frequency);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + decay);

	carrier.connect(amp);
	amp.connect(dry);
	amp.connect(wet);

	carrier.start(now);
	mod.start(now);
	carrier.stop(now + decay + 0.1);
	mod.stop(now + decay + 0.1);
}

/**
 * Steer every layer from scroll.
 *
 * `z` is the camera's world position; notes trigger per unit of distance
 * travelled rather than per unit of time, which is what makes their density
 * follow how hard the visitor is scrolling rather than how long they wait.
 */
export function updateAudio(progress: number, velocity: number, z: number) {
	if (!enabled || !nodes) return;
	const { ctx, padFilter, padGain, padOscs, subGain, bedSource } = nodes;
	const now = ctx.currentTime;

	const dt = lastUpdate === 0 ? 0.016 : Math.min(0.1, now - lastUpdate);
	lastUpdate = now;

	const speed = Math.min(Math.abs(velocity), 2.5);

	// --- Energy: rises fast while moving, falls slowly when idle -----------
	// The asymmetry is the point. Sustained scrolling is rewarded with a
	// thicker arrangement, and a brief pause does not tear it back down.
	const targetEnergy = Math.min(1, speed / 1.1);
	const rate = targetEnergy > energy ? 2.6 : 0.32;
	energy += (targetEnergy - energy) * Math.min(1, rate * dt);

	// --- Pad: brightness and body follow energy ----------------------------
	padFilter.frequency.setTargetAtTime(340 + progress * 380 + energy * 900, now, 0.3);
	if (!bedSource) {
		padGain.gain.setTargetAtTime(0.085 + energy * 0.05, now, 0.3);
	}

	// Sub weight only arrives once the visitor has really committed.
	subGain.gain.setTargetAtTime(Math.max(0, energy - 0.45) * 0.16, now, 0.5);

	const chord = Math.min(PROGRESSION.length - 1, Math.floor(progress * PROGRESSION.length));
	if (chord !== currentChord) {
		currentChord = chord;
		const shift = semitone(PROGRESSION[chord]);
		const intervals = [0, 7, 12, 19];
		padOscs.forEach((osc, i) => {
			// Glide rather than jump — a stepped pad root sounds like a bug.
			osc.frequency.setTargetAtTime(ROOT * semitone(intervals[i]) * shift, now, 1.2);
		});
	}

	// --- Notes: one per NOTE_STEP_UNITS of distance travelled ---------------
	if (lastZ === null) {
		lastZ = z;
		return;
	}
	distanceAccum += Math.abs(z - lastZ);
	lastZ = z;

	if (distanceAccum < NOTE_STEP_UNITS) return;
	// Consume whole steps, but never let a huge jump (a teleport-nav flight or
	// the loop warp) dump a burst of notes at once.
	distanceAccum = Math.min(distanceAccum - NOTE_STEP_UNITS, NOTE_STEP_UNITS);
	if (now - lastNoteTime < MIN_NOTE_GAP) return;
	lastNoteTime = now;

	const degree = CONTOUR[noteIndex % CONTOUR.length];
	noteIndex++;

	const shift = PROGRESSION[Math.max(0, currentChord)];
	// Rise through the octaves as the visitor travels, so depth is audible.
	const octave = progress > 0.66 ? 24 : progress > 0.33 ? 12 : 0;
	const base = SCALE[degree % SCALE.length] + shift + octave;
	const freq = ROOT * 4 * semitone(base);

	voice(freq, 0.1 + energy * 0.06);

	// Energy layers the arrangement up: a harmony a fifth above, then an
	// octave shimmer on top of that.
	if (energy > 0.45) {
		voice(ROOT * 4 * semitone(base + 7), 0.05 * energy, 1.3);
	}
	if (energy > 0.75 && noteIndex % 2 === 0) {
		voice(ROOT * 8 * semitone(base + 12), 0.03 * energy, 0.9);
	}
}

/**
 * The camera passing through a gate. A struck tonal hit rather than a noise
 * burst — it lands in the same key as everything else.
 */
export function playImpact(intensity = 1) {
	if (!enabled || !nodes) return;
	const shift = PROGRESSION[Math.max(0, currentChord)];
	voice(ROOT * 2 * semitone(shift), 0.16 * intensity, 2.2);
}

/** Tiny blip for hover feedback. */
export function playTick() {
	if (!enabled || !nodes) return;
	voice(ROOT * 8 * semitone(SCALE[3]), 0.05, 0.4);
}
