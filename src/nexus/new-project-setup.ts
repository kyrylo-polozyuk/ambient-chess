import type { SyncedDocument } from "@audiotool/nexus";

/**
 * Populates a newly created project with the Ambient Chess setup:
 * mixer auxes, channels, tonematrix with pattern, effects chain (phaser, quasar, pulsar),
 * pulverisateur synth, and all audio/note connections.
 * Run this only when creating a new project (empty document).
 */
export const setupNewProject = async (
  syncedDocument: SyncedDocument,
): Promise<void> => {
  await syncedDocument.modify((t) => {
    t.create("mixerReverbAux", {
      displayParameters: {
        orderAmongStrips: 0,
        displayName: "",
        colorIndex: 0,
      },
      preGain: 1,
      trimFilter: {
        highPassCutoffFrequencyHz: 20,
        lowPassCutoffFrequencyHz: 20000,
        isActive: true,
      },
      roomSizeFactor: 0.800000011920929,
      preDelayTimeMs: 160,
      dampFactor: 0.10000000149011612,
      faderParameters: {
        panning: 0,
        postGain: 1,
        isMuted: false,
        isSoloed: false,
      },
    });
    t.create("mixerDelayAux", {
      displayParameters: {
        orderAmongStrips: 0,
        displayName: "",
        colorIndex: 0,
      },
      preGain: 1,
      trimFilter: {
        highPassCutoffFrequencyHz: 20,
        lowPassCutoffFrequencyHz: 20000,
        isActive: true,
      },
      feedbackFactor: 0.30000001192092896,
      stepCount: 3,
      stepLengthIndex: 1,
      faderParameters: {
        panning: 0,
        postGain: 1,
        isMuted: false,
        isSoloed: false,
      },
    });
    const mixerChannel = t.create("mixerChannel", {
      displayParameters: {
        orderAmongStrips: 0,
        displayName: "Ambient Chess",
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
    });
    t.create("mixerChannel", {
      displayParameters: {
        orderAmongStrips: 0,
        displayName: "Ambient Chess",
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
    });
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
    });
    const tonematrix_0 = t.create("tonematrix", {
      displayName: "Ambient Chess",
      positionX: -789,
      positionY: 934,
      patternIndex: 0,
      isActive: true,
    });
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
    });
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
    });
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
      noise: { channel: { isActive: false, panning: 0, gain: 1 }, color: 1 },
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
    });
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
    });
    t.create("mixerMaster", {
      positionX: 523,
      positionY: 667,
      doBypassInserts: false,
      panning: 0,
      postGain: 1,
      limiterEnabled: false,
      isMuted: false,
    });
    const groove_0 = t.create("groove", {
      functionIndex: 1,
      durationTicks: 1920,
      impact: 0.20000000298023224,
      displayName: "Default Groove",
    });
    t.create("noteTrack", {
      orderAmongTracks: 157.19004821777344,
      isEnabled: true,
      groove: groove_0.location,
      player: pulverisateur_0.location,
    });
    t.create("desktopAudioCable", {
      fromSocket: quasar_0.fields.audioOutput.location,
      toSocket: pulsar_0.fields.audioInput.location,
      colorIndex: 0,
    });
    t.create("desktopAudioCable", {
      fromSocket: pulverisateur_0.fields.audioOutput.location,
      toSocket: stompboxPhaser_0.fields.audioInput.location,
      colorIndex: 0,
    });
    t.create("desktopAudioCable", {
      fromSocket: stompboxPhaser_0.fields.audioOutput.location,
      toSocket: quasar_0.fields.audioInput.location,
      colorIndex: 0,
    });
    t.create("desktopAudioCable", {
      fromSocket: pulsar_0.fields.audioOutput.location,
      toSocket: mixerChannel.fields.audioInput.location,
      colorIndex: 0,
    });
    t.create("desktopNoteCable", {
      fromSocket: tonematrix_0.fields.noteOutput.location,
      toSocket: pulverisateur_0.fields.notesInput.location,
      colorIndex: 0,
    });
    t.create("config", {
      tempoBpm: 64,
      baseFrequencyHz: 440,
      signatureNumerator: 4,
      signatureDenominator: 4,
      durationTicks: 245760,
      defaultGroove: groove_0.location,
    });
  });
};
