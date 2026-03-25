import type { SyncedDocument } from "@audiotool/nexus"
import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"

/** Tonematrix that syncs FEN, and settings. */
export const FEN_TONEMATRIX_NAME = "Ambient Chess FEN"

/** Tonematrix the app syncs to the chess board */
export const AMBIENT_CHESS_TONEMATRIX_NAME = "Ambient Chess"

export const setupProject = async (
  nexus: SyncedDocument,
): Promise<{
  tonematrix: NexusEntity<"tonematrix"> | undefined
  fenTonematrix: NexusEntity<"tonematrix"> | undefined
}> => {
  return nexus.modify((t) => {
    let groove = t.entities.ofTypes("groove").getOne()
    let config = t.entities.ofTypes("config").getOne()

    if (groove === undefined) {
      groove = t.create("groove", {
        functionIndex: 1,
        durationTicks: 1920,
        impact: 0.20000000298023224,
        displayName: "Default Groove",
      })
    }

    if (config === undefined) {
      if (groove !== undefined) {
        config = t.create("config", {
          tempoBpm: 64,
          baseFrequencyHz: 440,
          signatureNumerator: 4,
          signatureDenominator: 4,
          durationTicks: 245760,
          defaultGroove: groove.location,
        })
      }
    }

    const tonematrices = t.entities.ofTypes("tonematrix").get()
    let tonematrix = tonematrices.find(
      (tm) => tm.fields.displayName.value === AMBIENT_CHESS_TONEMATRIX_NAME,
    )

    let fenTonematrix = tonematrices.find(
      (tm) => tm.fields.displayName.value === FEN_TONEMATRIX_NAME,
    )

    if (tonematrix === undefined && config) {
      tonematrix = setupAmbientChessBoardSignalChain(t)
    }

    if (fenTonematrix === undefined && config) {
      fenTonematrix = setupFenToneMatrixSignalChain(t)
    }

    if (config !== undefined) {
      t.update(config.fields.tempoBpm, 64)
      const master = t.entities.ofTypes("mixerMaster").getOne()
      if (master) {
        t.update(master.fields.limiterEnabled, true)
      }
    }

    return { tonematrix, fenTonematrix }
  })
}

/**
 * Ambient Chess board signal chain: tonematrix → Pulverisateur → phaser → Quasar → Pulsar → mixer.
 */
export const setupAmbientChessBoardSignalChain = (
  t: SafeTransactionBuilder,
): NexusEntity<"tonematrix"> => {
  const mixerChannel = t.create("mixerChannel", {
    displayParameters: {
      orderAmongStrips: 0,
      displayName: AMBIENT_CHESS_TONEMATRIX_NAME,
      colorIndex: 0,
    },
    preGain: 0.5,
    doesPhaseReverse: false,
    trimFilter: {
      highPassCutoffFrequencyHz: 20,
      lowPassCutoffFrequencyHz: 20000,
      isActive: true,
    },
    compressor: {
      attackMs: 15,
      releaseMs: 100,
      makeupGainDb: 0,
      detectionModeIndex: 1,
      ratio: 2,
      thresholdDb: -10,
      isActive: false,
    },
    eq: {
      lowShelfFrequencyHz: 60,
      lowShelfGainDb: 0,
      lowMidFrequencyHz: 500,
      lowMidGainDb: 0,
      highMidFrequencyHz: 4800,
      highMidGainDb: 0,
      highShelfFrequencyHz: 12000,
      highShelfGainDb: 0,
      isActive: true,
    },
    auxSendsAreActive: true,
    faderParameters: {
      panning: 0,
      postGain: 1,
      isMuted: false,
      isSoloed: false,
    },
  })
  t.create("mixerChannel", {
    displayParameters: {
      orderAmongStrips: 0,
      displayName: AMBIENT_CHESS_TONEMATRIX_NAME,
      colorIndex: 0,
    },
    preGain: 0.39810699224472046,
    doesPhaseReverse: false,
    trimFilter: {
      highPassCutoffFrequencyHz: 20,
      lowPassCutoffFrequencyHz: 20000,
      isActive: true,
    },
    compressor: {
      attackMs: 15,
      releaseMs: 100,
      makeupGainDb: 0,
      detectionModeIndex: 1,
      ratio: 2,
      thresholdDb: -10,
      isActive: false,
    },
    eq: {
      lowShelfFrequencyHz: 60,
      lowShelfGainDb: 0,
      lowMidFrequencyHz: 500,
      lowMidGainDb: 0,
      highMidFrequencyHz: 4800,
      highMidGainDb: 0,
      highShelfFrequencyHz: 12000,
      highShelfGainDb: 0,
      isActive: true,
    },
    auxSendsAreActive: true,
    faderParameters: {
      panning: 0,
      postGain: 1,
      isMuted: false,
      isSoloed: false,
    },
  })
  t.create("mixerChannel", {
    displayParameters: {
      orderAmongStrips: 1,
      displayName: "",
      colorIndex: 1,
    },
    preGain: 0.39810699224472046,
    doesPhaseReverse: false,
    trimFilter: {
      highPassCutoffFrequencyHz: 20,
      lowPassCutoffFrequencyHz: 20000,
      isActive: true,
    },
    compressor: {
      attackMs: 15,
      releaseMs: 100,
      makeupGainDb: 0,
      detectionModeIndex: 1,
      ratio: 2,
      thresholdDb: -10,
      isActive: false,
    },
    eq: {
      lowShelfFrequencyHz: 60,
      lowShelfGainDb: 0,
      lowMidFrequencyHz: 500,
      lowMidGainDb: 0,
      highMidFrequencyHz: 4800,
      highMidGainDb: 0,
      highShelfFrequencyHz: 12000,
      highShelfGainDb: 0,
      isActive: true,
    },
    auxSendsAreActive: true,
    faderParameters: {
      panning: 0,
      postGain: 1,
      isMuted: false,
      isSoloed: false,
    },
  })

  const tonematrix_0 = t.create("tonematrix", {
    displayName: AMBIENT_CHESS_TONEMATRIX_NAME,
    positionX: -789,
    positionY: 934,
    patternIndex: 0,
    isActive: true,
  })

  const stompboxPhaser_0 = t.create("stompboxPhaser", {
    displayName: "Phaser",
    positionX: -686,
    positionY: 498,
    minFrequencyHz: 30,
    maxFrequencyHz: 300,
    feedbackFactor: 0.699999988079071,
    lfoFrequencyHz: 0.2555009722709656,
    mix: 1,
    isActive: true,
  })

  const quasar_0 = t.create("quasar", {
    displayName: "Quasar",
    positionX: -480,
    positionY: 462,
    preDelayMs: 243.31549072265625,
    lowPassFrequencyHz: 20000,
    highPassFrequencyHz: 151.10858154296875,
    filterSlopeIndex: 1,
    dryGain: 1,
    wetGain: 0.09686483442783356,
    isActive: true,
    plateDecay: 0.754606306552887,
    plateDamp: 0,
    inputDiffusion: 0,
    tankDiffusion: 0,
    vibratoDepth: 0.10866516828536987,
    vibratoFrequencyHz: 1,
  })

  const pulverisateur_0 = t.create("pulverisateur", {
    displayName: "Pulverisateur",
    positionX: -365,
    positionY: 859,
    gain: 0.1780480593442917,
    oscillatorA: {
      channel: { isActive: true, panning: 0, gain: 1 },
      oscillator: { tuneSemitones: 0, tuneOctaves: -2, waveform: 0 },
    },
    oscillatorB: {
      channel: { isActive: true, panning: 0, gain: 1 },
      oscillator: {
        tuneSemitones: 0,
        tuneOctaves: -2,
        waveform: 0.3972941040992737,
      },
      hardSyncToOscillatorA: true,
    },
    oscillatorC: {
      channel: { isActive: false, panning: 0, gain: 1 },
      oscillator: { tuneSemitones: 0, tuneOctaves: 0, waveform: 0 },
      doesTrackKeyboard: true,
    },
    noise: { channel: { isActive: true, panning: 0, gain: 0.25 }, color: 1 },
    audio: { channel: { isActive: false, panning: 0, gain: 1 }, drive: 0 },
    filter: {
      modeIndex: 1,
      cutoffFrequencyHz: 551.6554565429688,
      resonance: 0.22523778676986694,
      filterSpacing: 0,
      keyboardTrackingAmount: 0.25353580713272095,
    },
    lfo: {
      waveform: 0,
      rateIsSynced: true,
      rateNormalized: 0.5197243094444275,
      restartOnNote: true,
      targetsOscillatorAPitch: false,
      targetsOscillatorBPitch: true,
      targetsOscillatorCPitch: false,
      targetsFilterCutoff: true,
      targetsPulseWidth: false,
      modulationDepth: 0.2329723984003067,
    },
    filterEnvelope: {
      attackMs: 1,
      decayMs: 500,
      decayIsLooped: false,
      sustainFactor: 0,
      releaseMs: 1650.340087890625,
      modulationDepth: 0.123881034553051,
    },
    amplitudeEnvelope: {
      attackMs: 1,
      decayMs: 670.9227905273438,
      decayIsLooped: false,
      sustainFactor: 0.13795818388462067,
      releaseMs: 1919.2100830078125,
    },
    glideTimeMs: 0,
    tuneSemitones: 0,
    playModeIndex: 2,
    isActive: true,
  })

  const pulsar_0 = t.create("pulsar", {
    displayName: "Pulsar Delay",
    positionX: -30,
    positionY: 515,
    preDelayLeftTimeSemibreveIndex: 1,
    preDelayLeftTimeMs: 0,
    preDelayLeftPanning: -1,
    preDelayRightTimeSemibreveIndex: 6,
    preDelayRightTimeMs: 0,
    preDelayRightPanning: 1,
    feedbackDelayTimeSemibreveIndex: 6,
    feedbackDelayTimeMs: 0,
    lfoSpeedHz: 5,
    lfoModulationDepthMs: 0.5210570693016052,
    feedbackFactor: 0.5955817103385925,
    stereoCrossFactor: 0.718647837638855,
    filterMinHz: 111.53932189941406,
    filterMaxHz: 20000,
    dryGain: 1,
    wetGain: 0.2395240217447281,
    isActive: true,
  })

  t.create("desktopAudioCable", {
    fromSocket: quasar_0.fields.audioOutput.location,
    toSocket: pulsar_0.fields.audioInput.location,
    colorIndex: 12,
  })
  t.create("desktopAudioCable", {
    fromSocket: pulverisateur_0.fields.audioOutput.location,
    toSocket: stompboxPhaser_0.fields.audioInput.location,
    colorIndex: 8,
  })
  t.create("desktopAudioCable", {
    fromSocket: stompboxPhaser_0.fields.audioOutput.location,
    toSocket: quasar_0.fields.audioInput.location,
    colorIndex: 13,
  })
  t.create("desktopAudioCable", {
    fromSocket: pulsar_0.fields.audioOutput.location,
    toSocket: mixerChannel.fields.audioInput.location,
    colorIndex: 32,
  })
  t.create("desktopNoteCable", {
    fromSocket: tonematrix_0.fields.noteOutput.location,
    toSocket: pulverisateur_0.fields.notesInput.location,
    colorIndex: 31,
  })

  return tonematrix_0
}

/**
 * FEN tonematrix signal chain: Space → Panorama → phaser → reverb → delay → slope → mixer.
 */
export const setupFenToneMatrixSignalChain = (
  t: SafeTransactionBuilder,
): NexusEntity<"tonematrix"> => {
  const mixerChannelSpace = t.create("mixerChannel", {
    displayParameters: {
      orderAmongStrips: 2,
      displayName: "Space",
      colorIndex: 2,
    },
    preGain: 0.39810699224472046,
    doesPhaseReverse: false,
    trimFilter: {
      highPassCutoffFrequencyHz: 69.614013671875,
      lowPassCutoffFrequencyHz: 574.597,
      isActive: true,
    },
    compressor: {
      attackMs: 15,
      releaseMs: 100,
      makeupGainDb: 0,
      detectionModeIndex: 1,
      ratio: 2,
      thresholdDb: -10,
      isActive: false,
    },
    eq: {
      lowShelfFrequencyHz: 60,
      lowShelfGainDb: 0,
      lowMidFrequencyHz: 500,
      lowMidGainDb: 0,
      highMidFrequencyHz: 4800,
      highMidGainDb: 0,
      highShelfFrequencyHz: 12000,
      highShelfGainDb: 0,
      isActive: true,
    },
    auxSendsAreActive: true,
    faderParameters: {
      panning: 0,
      postGain: 0.5011872053146362,
      isMuted: false,
      isSoloed: false,
    },
  })

  const fenTonematrix = t.create("tonematrix", {
    displayName: FEN_TONEMATRIX_NAME,
    positionX: -878,
    positionY: -497,
    patternIndex: 0,
    isActive: true,
  })

  const spaceWithToneMatrix = t.create("space", {
    displayName: "Space",
    positionX: -850,
    positionY: -70,
    gain: 0.06122339516878128,
    stereoDetuneShift: 0,
    tuneSemitones: 0,
    tuneASemitones: -12,
    tuneBSemitones: 0,
    glideMs: 0,
    mixAB: -1,
    lfoMixModulationDepth: 0,
    lfoGainModulationDepth: 0,
    lfoStereoDetuneShiftModulationDepth: 0,
    lfoPanningModulationDepth: 0,
    envelopeMixModulationDepth: 0,
    envelopeTuneModulationDepth: 0,
    envelopeLfoRateModulationDepth: 0,
    envelopeLfoAmountModulationDepth: 0,
    velocityGainModulationDepth: 0,
    velocityMixModulationDepth: 0,
    keyboardMixModulationDepth: 0,
    notePlayModeIndex: 3,
    lfo: {
      waveformIndex: 1,
      rateNormalized: 0.25,
      phaseOffset: 0,
      isSynced: false,
      doesRetrigger: true,
    },
    amplitudeEnvelope: {
      isSynced: false,
      attackTimeNormalized: 0.25812801718711853,
      attackSlopeFactor: 0.5,
      decayTimeNormalized: 1,
      decaySlopeFactor: 0.5,
      decayIsLooped: false,
      sustainFactor: 0.5629866719245911,
      releaseTimeNormalized: 0.6912184953689575,
      releaseSlopeFactor: 0.75,
    },
    modulationEnvelope: {
      isSynced: false,
      attackTimeNormalized: 0.4050000011920929,
      attackSlopeFactor: 0.5,
      decayTimeNormalized: 0,
      decaySlopeFactor: 0.5,
      decayIsLooped: false,
      sustainFactor: 1,
      releaseTimeNormalized: 0.5,
      releaseSlopeFactor: 0.5,
    },
    modulationEnvelopeHasRelease: true,
    soundA: {
      dispersion: 0.47826087474823,
      vaporisation: 0.20000004768371582,
      brightness: -0.002008987357839942,
      metal: 0,
      separation: 1,
      harmonicsCount: 32,
      combFilterAmount: 1,
      combFilterRate: 0.1428571492433548,
      combFilterWidth: 0,
    },
    soundB: {
      dispersion: 0.47826087474823,
      vaporisation: 0.20000004768371582,
      brightness: 0,
      metal: 0,
      separation: 1,
      harmonicsCount: 32,
      combFilterAmount: 0,
      combFilterRate: 0.1428571492433548,
      combFilterWidth: 0,
    },
    isActive: true,
  })

  const stompboxSlopeFx = t.create("stompboxSlope", {
    displayName: "Slope",
    positionX: 409,
    positionY: -449,
    filterModeIndex: 2,
    frequencyHz: 559.960205078125,
    resonanceFactor: 0,
    bandWidthHz: 0,
    mix: 1,
    isActive: true,
  })

  const stompboxReverbFx = t.create("stompboxReverb", {
    displayName: "Reverb",
    positionX: -6,
    positionY: -445,
    roomSizeFactor: 1,
    preDelayTimeMs: 160,
    feedbackFactor: 0.803886890411377,
    dampFactor: 0.17989793419837952,
    mix: 1,
    isActive: true,
  })

  const stompboxPhaserFx = t.create("stompboxPhaser", {
    displayName: "Phaser",
    positionX: -226,
    positionY: -440,
    minFrequencyHz: 38.059349060058594,
    maxFrequencyHz: 878.6071166992188,
    feedbackFactor: 0.5466269850730896,
    lfoFrequencyHz: 0.03999999910593033,
    mix: 1,
    isActive: true,
  })

  const stompboxDelayFx = t.create("stompboxDelay", {
    displayName: "Delay",
    positionX: 209,
    positionY: -446,
    stepCount: 3,
    stepLengthIndex: 1,
    feedbackFactor: 0.6619201302528381,
    mix: 0.20000000298023224,
    isActive: true,
  })

  const panoramaFx = t.create("panorama", {
    displayName: "Panorama",
    positionX: -406,
    positionY: -426,
    leftFactor: 0,
    rightFactor: 1,
    leftPanning: 0,
    rightPanning: 0,
    isActive: true,
  })

  t.create("desktopAudioCable", {
    fromSocket: stompboxPhaserFx.fields.audioOutput.location,
    toSocket: stompboxReverbFx.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopAudioCable", {
    fromSocket: stompboxSlopeFx.fields.audioOutput.location,
    toSocket: mixerChannelSpace.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopAudioCable", {
    fromSocket: spaceWithToneMatrix.fields.audioOutput.location,
    toSocket: panoramaFx.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopAudioCable", {
    fromSocket: panoramaFx.fields.audioOutput.location,
    toSocket: stompboxPhaserFx.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopAudioCable", {
    fromSocket: stompboxReverbFx.fields.audioOutput.location,
    toSocket: stompboxDelayFx.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopAudioCable", {
    fromSocket: stompboxDelayFx.fields.audioOutput.location,
    toSocket: stompboxSlopeFx.fields.audioInput.location,
    colorIndex: 40,
  })
  t.create("desktopNoteCable", {
    fromSocket: fenTonematrix.fields.noteOutput.location,
    toSocket: spaceWithToneMatrix.fields.notesInput.location,
    colorIndex: 30,
  })

  return fenTonematrix
}
