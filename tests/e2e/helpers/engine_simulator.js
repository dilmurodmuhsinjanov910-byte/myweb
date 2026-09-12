/**
 * VideoScrubEngine and DualControlPhysics Reference Oracle & Simulator
 * Implements the mathematical and state-machine specifications from PROJECT.md
 */

class MockVideoElement {
  constructor(duration = 10.0) {
    this.duration = duration;
    this.currentTime = 0.0;
    this.paused = true;
    this.seeking = false;
    this.src = '';
    this.poster = '';
    this.eventListeners = {};
    this.seekHistory = [];
    this.fastSeekCount = 0;
    this.currentTimeAssignmentCount = 0;
    this.asyncSeekDelayMs = 0; // Configurable seek latency
  }

  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  emit(event) {
    if (this.eventListeners[event]) {
      for (const cb of this.eventListeners[event]) {
        cb({ type: event, target: this });
      }
    }
  }

  fastSeek(time) {
    this.fastSeekCount++;
    this._performSeek(time);
  }

  _performSeek(time) {
    const clamped = Math.max(0, Math.min(time, this.duration || 10.0));
    this.seeking = true;
    this.emit('seeking');
    this.seekHistory.push({ time: clamped, timestamp: Date.now() });

    if (this.asyncSeekDelayMs > 0) {
      setTimeout(() => {
        this.currentTime = clamped;
        this.seeking = false;
        this.emit('seeked');
      }, this.asyncSeekDelayMs);
    } else {
      this.currentTime = clamped;
      this.seeking = false;
      this.emit('seeked');
    }
  }

  play() {
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit('pause');
  }

  load() {
    this.emit('loadstart');
    this.emit('loadedmetadata');
    this.emit('canplay');
  }
}

// 5-State Finite State Machine definitions
const PHYSICS_STATES = {
  IDLE_SCROLL_DRIVEN: 0,
  MANUAL_TURNTABLE_DRAG: 1,
  MANUAL_TIMELINE_SLIDER: 2,
  CINEMA_PLAYBACK: 3,
  INERTIA_COOLDOWN: 4
};

class ReferenceDualControlPhysics {
  constructor(options = {}) {
    this.state = PHYSICS_STATES.IDLE_SCROLL_DRIVEN;
    this.cooldownDurationMs = options.cooldownDurationMs || 1800;
    this.blendWindowMs = options.blendWindowMs || 300;
    this.lastInteractionTime = 0;
    this.cooldownTimer = null;
    this.onBlendBackToScroll = options.onBlendBackToScroll || null;
    this.onStateChange = options.onStateChange || null;
  }

  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      if (this.onStateChange) this.onStateChange(newState, oldState);
    }
  }

  notifyUserInteracting(source = 'drag') {
    this.lastInteractionTime = Date.now();
    if (source === 'drag') {
      this.setState(PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);
    } else if (source === 'slider') {
      this.setState(PHYSICS_STATES.MANUAL_TIMELINE_SLIDER);
    }

    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }

    this.cooldownTimer = setTimeout(() => {
      this.setState(PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
      this.cooldownTimer = null;
    }, this.cooldownDurationMs);
  }

  notifyCinemaPlayback(active) {
    if (active) {
      if (this.cooldownTimer) {
        clearTimeout(this.cooldownTimer);
        this.cooldownTimer = null;
      }
      this.setState(PHYSICS_STATES.CINEMA_PLAYBACK);
    } else {
      if (this.state === PHYSICS_STATES.CINEMA_PLAYBACK) {
        this.setState(PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
      }
    }
  }

  notifyScroll(scrollProgress) {
    // If user is currently dragging turntable or slider, ignore scroll
    if (
      this.state === PHYSICS_STATES.MANUAL_TURNTABLE_DRAG ||
      this.state === PHYSICS_STATES.MANUAL_TIMELINE_SLIDER ||
      this.state === PHYSICS_STATES.INERTIA_COOLDOWN
    ) {
      return false; // Scroll ignored
    }

    // If cinema is playing, scroll interrupts cinema and blends back
    if (this.state === PHYSICS_STATES.CINEMA_PLAYBACK) {
      this.setState(PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
      if (this.onBlendBackToScroll) {
        this.onBlendBackToScroll(scrollProgress, this.blendWindowMs);
      }
      return true;
    }

    return true; // Scroll accepted
  }

  isScrollAllowed() {
    return this.state === PHYSICS_STATES.IDLE_SCROLL_DRIVEN;
  }

  destroy() {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}

class ReferenceVideoScrubEngine {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.fps = options.fps || 60;
    this.lerpFactor = options.lerpFactor || 0.12;
    this.quantizeDelta = options.quantizeDelta || 0.038;

    this.targetProgress = 0.0;
    this.smoothProgress = 0.0;
    this.pendingTime = null;
    this.isSeeking = false;
    this.isAutonomousPlaying = false;
    this.lastSeekTime = 0.0;
    this.totalSeeksIssued = 0;

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.video) return;
    this._onSeeking = () => {
      this.isSeeking = true;
    };
    this._onSeeked = () => {
      this.isSeeking = false;
      if (this.pendingTime !== null) {
        const nextTime = this.pendingTime;
        this.pendingTime = null;
        this._dispatchSeek(nextTime);
      }
    };
    this.video.addEventListener('seeking', this._onSeeking);
    this.video.addEventListener('seeked', this._onSeeked);
  }

  setTargetProgress(progress) {
    if (typeof progress !== 'number' || isNaN(progress)) return;
    this.targetProgress = Math.max(0.0, Math.min(1.0, progress));
  }

  tickRAF() {
    if (this.isAutonomousPlaying) return;

    // Exponential smoothing (Tier 2 RAF lerp)
    const diff = this.targetProgress - this.smoothProgress;
    this.smoothProgress += diff * this.lerpFactor;

    const rawDuration = this.video?.duration;
    const duration = (typeof rawDuration === 'number' && !isNaN(rawDuration)) ? rawDuration : 10.0;
    const targetTime = duration > 0 ? this.smoothProgress * duration : 0.0;

    // Check quantization (Tier 3 Seek-lock & quantization)
    const delta = Math.abs(targetTime - this.lastSeekTime);
    if (delta >= this.quantizeDelta) {
      if (this.isSeeking) {
        this.pendingTime = targetTime;
      } else {
        this._dispatchSeek(targetTime);
      }
    }
  }

  _dispatchSeek(time) {
    this.lastSeekTime = time;
    this.totalSeeksIssued++;
    if (typeof this.video.fastSeek === 'function') {
      this.video.fastSeek(time);
    } else {
      this.video.currentTime = time;
    }
  }

  seekImmediate(timeInSeconds) {
    const duration = this.video?.duration || 10.0;
    const clamped = Math.max(0, Math.min(timeInSeconds, duration));
    this.targetProgress = duration > 0 ? clamped / duration : 0;
    this.smoothProgress = this.targetProgress;
    this._dispatchSeek(clamped);
  }

  playAutonomous() {
    this.isAutonomousPlaying = true;
    if (this.video) {
      return this.video.play();
    }
    return Promise.resolve();
  }

  pauseAutonomous() {
    this.isAutonomousPlaying = false;
    if (this.video) {
      this.video.pause();
    }
  }

  loadSource(srcWebm, srcMp4 = null, poster = null) {
    if (this.video) {
      this.video.src = srcWebm;
      if (poster) this.video.poster = poster;
      this.video.load();
    }
  }

  destroy() {
    if (this.video) {
      this.video.removeEventListener('seeking', this._onSeeking);
      this.video.removeEventListener('seeked', this._onSeeked);
    }
  }
}

module.exports = {
  MockVideoElement,
  PHYSICS_STATES,
  ReferenceDualControlPhysics,
  ReferenceVideoScrubEngine
};
