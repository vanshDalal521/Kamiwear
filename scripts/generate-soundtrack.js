#!/usr/bin/env node
/**
 * Original anime/taiko-inspired instrumental for the Kamiwear videos.
 *
 * This is intentionally synthesized from scratch (sine/saw/noise oscillators)
 * so the project ships with a fully owned soundtrack. No copyrighted Demon
 * Slayer audio is downloaded or embedded.
 */
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DURATION = 64;
const N = Math.floor(SR * DURATION);
const left = new Float32Array(N);
const right = new Float32Array(N);

let seed = 0x9e3779b9;
function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
}

const NOTE_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteToFreq(note) {
    const match = /^([A-G])([#b]?)(-?\d)$/.exec(String(note));
    if (!match) throw new Error(`Bad note: ${note}`);
    const [, letter, accidental, octave] = match;
    let midi = 12 * (Number(octave) + 1) + NOTE_OFFSETS[letter];
    if (accidental === '#') midi += 1;
    if (accidental === 'b') midi -= 1;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function panGains(pan) {
    const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
    return [Math.cos(angle), Math.sin(angle)];
}

function addSample(index, value, pan = 0) {
    if (index < 0 || index >= N) return;
    const [lg, rg] = panGains(pan);
    left[index] += value * lg;
    right[index] += value * rg;
}

// ------------------------------------------------------------------ taiko
function addTaiko(startSec, strength = 1, pitch = 1, pan = 0) {
    const start = Math.floor(startSec * SR);
    const length = Math.floor(SR * 0.85);
    let phase = 0;
    let noiseState = 0;
    let clickState = 0;

    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        const f = 48 * pitch + 82 * pitch * Math.exp(-t * 10);
        phase += (2 * Math.PI * f) / SR;

        const env = Math.exp(-t * 7.5) * (1 - Math.exp(-t * 500));
        const body = Math.sin(phase) * env;
        const overtone = Math.sin(phase * 2.02) * Math.exp(-t * 13) * 0.22;

        const noise = random() * 2 - 1;
        noiseState += (noise - noiseState) * 0.08;
        clickState += (noise - clickState) * 0.5;
        const skin = (noiseState - clickState) * Math.exp(-t * 24) * 0.7;
        const click = clickState * Math.exp(-t * 120) * 0.35;

        addSample(start + i, (body + overtone + skin + click) * strength * 0.55, pan);
    }
}

// ---------------------------------------------------------------- shakuhachi
function addShakuhachi(startSec, duration, note, options = {}) {
    const freq = noteToFreq(note);
    const amp = options.amp || 0.16;
    const pan = options.pan == null ? -0.12 : options.pan;
    const start = Math.floor(startSec * SR);
    const length = Math.floor(duration * SR);
    const attack = Math.min(0.16, duration * 0.25);
    const release = Math.min(0.28, duration * 0.35);
    let phase = 0;
    let phase2 = 0;
    let breathState = 0;

    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        const progress = t / duration;
        const env = Math.min(1, t / attack) * Math.min(1, (duration - t) / release);

        // A small slide into each note plus gentle vibrato gives the flute its
        // human, shakuhachi-like character.
        const slide = 1 - 0.014 * Math.exp(-t * 12);
        const vibrato = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t * 3);
        const f = freq * slide * vibrato;
        phase += (2 * Math.PI * f) / SR;
        phase2 += (2 * Math.PI * f * 1.002) / SR;

        const tone =
            Math.sin(phase) * 0.74 +
            Math.sin(phase * 2) * 0.18 +
            Math.sin(phase * 3) * 0.06 +
            Math.sin(phase2) * 0.12;

        const noise = random() * 2 - 1;
        breathState += (noise - breathState) * 0.11;
        const breath = breathState * 0.1 * Math.min(1, t * 8) * (1 - progress * 0.4);

        addSample(start + i, (tone + breath) * env * amp, pan);
    }
}

// -------------------------------------------------------------------- koto
function addKoto(startSec, note, options = {}) {
    const freq = noteToFreq(note);
    const amp = options.amp || 0.11;
    const pan = options.pan == null ? 0.22 : options.pan;
    const duration = options.duration || 2.0;
    const start = Math.floor(startSec * SR);
    const length = Math.floor(duration * SR);
    const phases = new Float64Array(7);

    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        let value = 0;
        for (let h = 1; h <= 6; h += 1) {
            phases[h] += (2 * Math.PI * freq * h) / SR;
            const decay = Math.exp(-t * (2.4 + h * 0.85));
            value += Math.sin(phases[h]) * (1 / h) * decay;
        }
        const pick = (random() * 2 - 1) * Math.exp(-t * 200) * 0.18;
        addSample(start + i, (value * 0.7 + pick) * amp, pan);
    }
}

// --------------------------------------------------------------------- pad
function addPad(startSec, duration, notes, options = {}) {
    const amp = options.amp || 0.06;
    const start = Math.floor(startSec * SR);
    const length = Math.floor(duration * SR);
    const attack = Math.min(1.1, duration * 0.3);
    const release = Math.min(1.2, duration * 0.35);
    const voices = notes.map(note => {
        const f = noteToFreq(note);
        return [
            { freq: f * 0.996, phase: random() * Math.PI * 2, state: 0 },
            { freq: f, phase: random() * Math.PI * 2, state: 0 },
            { freq: f * 1.004, phase: random() * Math.PI * 2, state: 0 },
        ];
    });

    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        const env = Math.min(1, t / attack) * Math.min(1, (duration - t) / release);
        let value = 0;

        voices.forEach((group, noteIndex) => {
            group.forEach(voice => {
                voice.phase += (2 * Math.PI * voice.freq) / SR;
                const saw = 2 * ((voice.phase / (Math.PI * 2)) % 1) - 1;
                voice.state += (saw - voice.state) * 0.035;
                value += voice.state * (0.5 + 0.5 / (noteIndex + 1));
            });
        });

        addSample(start + i, value * env * amp * 0.22, 0);
    }
}

// -------------------------------------------------------------------- bell
function addBell(startSec, note, options = {}) {
    const freq = noteToFreq(note);
    const amp = options.amp || 0.08;
    const pan = options.pan == null ? 0.28 : options.pan;
    const start = Math.floor(startSec * SR);
    const length = Math.floor(2.6 * SR);
    const partials = [
        { ratio: 1, gain: 1, decay: 1.6 },
        { ratio: 2.76, gain: 0.45, decay: 2.4 },
        { ratio: 5.4, gain: 0.2, decay: 3.6 },
    ];

    for (let i = 0; i < length; i += 1) {
        const t = i / SR;
        let value = 0;
        partials.forEach(partial => {
            value += Math.sin(2 * Math.PI * freq * partial.ratio * t) *
                partial.gain * Math.exp(-t * partial.decay);
        });
        addSample(start + i, value * amp * (1 - Math.exp(-t * 900)), pan);
    }
}

// ------------------------------------------------------------------- drone
function addDrone() {
    const d2 = noteToFreq('D2');
    const a2 = noteToFreq('A2');
    for (let i = 0; i < Math.floor(61 * SR); i += 1) {
        const t = i / SR;
        const fade = Math.min(1, t / 3) * Math.min(1, Math.max(0, (60 - t) / 3));
        const value =
            Math.sin(2 * Math.PI * d2 * t) * 0.09 +
            Math.sin(2 * Math.PI * d2 * 2 * t) * 0.025 +
            Math.sin(2 * Math.PI * a2 * t + 0.3) * 0.035 +
            Math.sin(2 * Math.PI * d2 * t * 1.003) * 0.02;
        addSample(i, value * fade, 0);
    }
}

// ------------------------------------------------------------------ effects
function addNoiseSweep(startSec, duration, options = {}) {
    const start = Math.floor(startSec * SR);
    const length = Math.floor(duration * SR);
    const amp = options.amp || 0.07;
    let low = 0;
    let high = 0;
    for (let i = 0; i < length; i += 1) {
        const progress = i / length;
        const env = Math.sin(Math.PI * progress) ** 2;
        const noise = random() * 2 - 1;
        low += (noise - low) * (0.02 + progress * 0.22);
        high += (noise - high) * 0.5;
        const value = (low - high * 0.4) * env * amp;
        addSample(start + i, value, options.pan || 0);
    }
}

// --------------------------------------------------------------- composition
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const CHORDS = {
    Dm: ['D3', 'F3', 'A3', 'D4'],
    Bb: ['Bb2', 'D3', 'F3', 'Bb3'],
    F: ['F2', 'A2', 'C3', 'F3'],
    C: ['C3', 'E3', 'G3', 'C4'],
    Gm: ['G2', 'Bb2', 'D3', 'G3'],
    A: ['A2', 'C#3', 'E3', 'A3'],
};

const PROGRESSION = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Gm', 'A', 'Dm'];
const TOTAL_BARS = 24;

function chordAt(bar) {
    return PROGRESSION[bar % PROGRESSION.length];
}

// Melody is written as [note, beats]; rests use null.
const MELODY = [
    ['D4', 1.5], ['F4', 0.5], ['A4', 2],
    ['Bb4', 1.5], ['A4', 0.5], ['F4', 2],
    ['A4', 1], ['C5', 1], ['A4', 1], ['F4', 1],
    ['G4', 1.5], ['E4', 0.5], ['C4', 2],
    ['D4', 1], ['F4', 1], ['A4', 1], ['D5', 1],
    ['C5', 1.5], ['Bb4', 0.5], ['G4', 2],
    ['A4', 1], ['C#5', 1], ['E5', 1], ['C#5', 1],
    ['D5', 3], [null, 1],
];

function scheduleMelody(startBar, transpose = 0, amp = 0.16) {
    let beatCursor = 0;
    MELODY.forEach(([note, beats]) => {
        const when = startBar * BAR + beatCursor * BEAT;
        if (note) {
            const transposed = transpose ? transposeNote(note, transpose) : note;
            addShakuhachi(when, Math.min(beats * BEAT * 1.15, 2.2), transposed, { amp });
        }
        beatCursor += beats;
    });
}

function transposeNote(note, semitones) {
    const match = /^([A-G])([#b]?)(-?\d)$/.exec(note);
    const letter = match[1];
    let midi = 12 * (Number(match[3]) + 1) + NOTE_OFFSETS[letter];
    if (match[2] === '#') midi += 1;
    if (match[2] === 'b') midi -= 1;
    midi += semitones;
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function scheduleBar(bar) {
    const chord = chordAt(bar);
    const notes = CHORDS[chord];
    const start = bar * BAR;

    // Pad + root every bar.
    addPad(start, BAR * 1.05, notes, { amp: 0.075 + (bar >= 12 ? 0.02 : 0) });
    const root = noteToFreq(notes[0]) / 2;
    for (let i = 0; i < Math.floor(BAR * SR); i += 1) {
        const t = i / SR;
        const env = Math.min(1, t / 0.2) * Math.min(1, (BAR - t) / 0.35);
        addSample(Math.floor(start * SR) + i, Math.sin(2 * Math.PI * root * t) * env * 0.05, 0);
    }

    // Koto arpeggio, entering after the intro.
    if (bar >= 2) {
        const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
        pattern.forEach((index, step) => {
            const note = notes[index % notes.length];
            addKoto(start + step * BEAT * 0.5, note, {
                amp: 0.075 + (bar >= 12 ? 0.025 : 0),
                pan: step % 2 === 0 ? -0.28 : 0.28,
                duration: 1.6,
            });
        });
    }

    // Bell on the first bar of each 4-bar phrase.
    if (bar % 4 === 0) {
        addBell(start, notes[notes.length - 1], { amp: 0.07, pan: 0.35 });
    }
}

function scheduleTaiko() {
    // Sparse intro.
    [0, 2, 4].forEach((bar, index) => {
        addTaiko(bar * BAR, 0.55 + index * 0.1, 1, -0.1);
        addTaiko(bar * BAR + BEAT * 2, 0.4, 1.15, 0.2);
    });

    // Main groove.
    for (let bar = 4; bar < TOTAL_BARS; bar += 1) {
        const start = bar * BAR;
        const full = bar >= 12;
        for (let beat = 0; beat < 4; beat += 1) {
            const when = start + beat * BEAT;
            const accent = beat === 0 || beat === 2;
            addTaiko(when, accent ? (full ? 0.95 : 0.7) : (full ? 0.6 : 0.42), 1, beat % 2 ? 0.18 : -0.18);
            if (full) addTaiko(when + BEAT * 0.5, 0.3, 1.35, beat % 2 ? -0.3 : 0.3);
        }
        if (bar % 4 === 3) {
            addTaiko(start + BEAT * 3.5, 0.55, 1.25, 0);
            addTaiko(start + BEAT * 3.75, 0.5, 1.45, 0.2);
        }
    }

    // Outro hits.
    [48, 49.2, 50.4, 52.8, 55.2].forEach((when, index) => {
        addTaiko(when, 1 - index * 0.08, 1 - index * 0.03, index % 2 ? 0.2 : -0.2);
    });
}

function compose() {
    addDrone();

    for (let bar = 0; bar < TOTAL_BARS; bar += 1) scheduleBar(bar);

    // Flute enters softly, then takes the theme twice at full strength, then a
    // final reflective statement in the outro.
    scheduleMelody(2, 0, 0.12);
    scheduleMelody(8, 0, 0.19);
    scheduleMelody(16, 12, 0.18);
    scheduleMelody(20, 0, 0.15);

    scheduleTaiko();

    // Cinematic transitions.
    [4.8, 24, 48].forEach((when, index) => addNoiseSweep(when, 2.2, { amp: 0.09 - index * 0.01 }));

    // Final low impact.
    addTaiko(57.6, 1.2, 0.85, 0);
    addBell(57.6, 'D5', { amp: 0.1, pan: 0 });
}

// ------------------------------------------------------------------- mixing
function applyReverb() {
    const delayL = Math.floor(0.089 * SR);
    const delayR = Math.floor(0.113 * SR);
    const wet = 0.16;
    const feedback = 0.28;
    const bufL = new Float32Array(N);
    const bufR = new Float32Array(N);

    for (let i = 0; i < N; i += 1) {
        const dl = i >= delayL ? bufL[i - delayL] : 0;
        const dr = i >= delayR ? bufR[i - delayR] : 0;
        bufL[i] = (left[i] + dr * 0.18) + dl * feedback;
        bufR[i] = (right[i] + dl * 0.18) + dr * feedback;
        left[i] += dl * wet;
        right[i] += dr * wet;
    }
}

function finalize() {
    applyReverb();

    let peak = 1e-9;
    for (let i = 0; i < N; i += 1) {
        peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    }
    const gain = 0.92 / peak;
    const fadeIn = Math.floor(0.25 * SR);
    const fadeOut = Math.floor(3.2 * SR);

    for (let i = 0; i < N; i += 1) {
        let envelope = 1;
        if (i < fadeIn) envelope = i / fadeIn;
        if (i > N - fadeOut) envelope = Math.min(envelope, (N - i) / fadeOut);

        // Soft clip keeps loud taiko transients musical instead of harsh.
        left[i] = Math.tanh(left[i] * gain * envelope * 1.08) * 0.93;
        right[i] = Math.tanh(right[i] * gain * envelope * 1.08) * 0.93;
    }
}

function writeWav(filePath) {
    const dataBytes = N * 2 * 2;
    const buffer = Buffer.alloc(44 + dataBytes);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataBytes, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(2, 22);
    buffer.writeUInt32LE(SR, 24);
    buffer.writeUInt32LE(SR * 2 * 2, 28);
    buffer.writeUInt16LE(2 * 2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataBytes, 40);

    let offset = 44;
    for (let i = 0; i < N; i += 1) {
        const l = Math.max(-1, Math.min(1, left[i]));
        const r = Math.max(-1, Math.min(1, right[i]));
        buffer.writeInt16LE(Math.round(l * 32767), offset);
        buffer.writeInt16LE(Math.round(r * 32767), offset + 2);
        offset += 4;
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return buffer.length;
}

compose();
finalize();

const output = path.join(__dirname, '..', 'public', 'assets', 'audio', 'kamiwear-anthem.wav');
const bytes = writeWav(output);
console.log(`Wrote ${output} (${(bytes / 1024 / 1024).toFixed(1)} MB, ${DURATION}s)`);
