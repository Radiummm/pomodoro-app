import type { AmbientSound } from '../types'

let audioCtx: AudioContext | null = null
let sourceNode: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let filterNode: BiquadFilterNode | null = null
let isPlaying = false
let currentSound: AmbientSound = 'none'

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function createNoiseBuffer(ctx: AudioContext, type: AmbientSound): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * 4 // 4 second loop
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'whitenoise') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  } else {
    // Brown noise base for rain and cafe (smoother)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }
  return buffer
}

export function playAmbient(sound: AmbientSound, volume: number) {
  stopAmbient()
  if (sound === 'none') return

  const ctx = getContext()
  if (ctx.state === 'suspended') ctx.resume()

  const buffer = createNoiseBuffer(ctx, sound)
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = buffer
  sourceNode.loop = true

  gainNode = ctx.createGain()
  gainNode.gain.value = volume * 0.3 // scale down

  if (sound === 'rain') {
    filterNode = ctx.createBiquadFilter()
    filterNode.type = 'bandpass'
    filterNode.frequency.value = 800
    filterNode.Q.value = 0.5
    sourceNode.connect(filterNode).connect(gainNode).connect(ctx.destination)
  } else if (sound === 'cafe') {
    filterNode = ctx.createBiquadFilter()
    filterNode.type = 'lowpass'
    filterNode.frequency.value = 400
    filterNode.Q.value = 0.8
    sourceNode.connect(filterNode).connect(gainNode).connect(ctx.destination)
  } else {
    filterNode = null
    sourceNode.connect(gainNode).connect(ctx.destination)
  }

  sourceNode.start()
  isPlaying = true
  currentSound = sound
}

export function stopAmbient() {
  if (sourceNode) {
    try { sourceNode.stop() } catch {}
    sourceNode.disconnect()
    sourceNode = null
  }
  if (filterNode) { filterNode.disconnect(); filterNode = null }
  if (gainNode) { gainNode.disconnect(); gainNode = null }
  isPlaying = false
  currentSound = 'none'
}

export function setVolume(v: number) {
  if (gainNode) gainNode.gain.value = v * 0.3
}

export function getIsPlaying() { return isPlaying }
export function getCurrentSound() { return currentSound }
