const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
const modal = document.querySelector('.portfolio-modal');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.portfolio-card').forEach(card => {
  card.addEventListener('click', () => {
    modal.querySelector('h2').textContent = card.dataset.title;
    modal.querySelector('.modal-copy').textContent = card.dataset.copy;
    modal.showModal();
  });
});

modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  const rect = modal.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                 event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) modal.close();
});

document.getElementById('year').textContent = new Date().getFullYear();
/* =========================================
   AUDIO PLAYLIST PLAYERS
========================================= */

function createPlaylistPlayer(playlistName, tracks) {
  const player = document.querySelector(
    `.playlist-player[data-playlist="${playlistName}"]`
  );

  if (!player) {
    return;
  }

  const audio = player.querySelector(".playlist-audio");
  const title = player.querySelector(".playlist-title");
  const counter = player.querySelector(".playlist-counter");
  const playButton = player.querySelector(".playlist-play");
  const previousButton = player.querySelector(".playlist-prev");
  const nextButton = player.querySelector(".playlist-next");

  const progress = player.querySelector(".playlist-progress");
  const currentTimeDisplay = player.querySelector(
    ".playlist-current-time"
  );
  const durationDisplay = player.querySelector(".playlist-duration");
  const volumeSlider = player.querySelector(
    ".playlist-volume-slider"
  );
  const meterBars = player.querySelectorAll(".playlist-meter span");
  const leftMeterFill = player.querySelector(".stereo-meter-left");
const rightMeterFill = player.querySelector(".stereo-meter-right");

const leftPeakMarker = player.querySelector(".stereo-peak-left");
const rightPeakMarker = player.querySelector(".stereo-peak-right");

const leftMeterValue = player.querySelector(".stereo-value-left");
const rightMeterValue = player.querySelector(".stereo-value-right");
  let audioContext = null;
let analyser = null;
let sourceNode = null;
let gainNode = null;

let channelSplitter = null;
let leftAnalyser = null;
let rightAnalyser = null;

let meterAnimationFrame = null;
  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  }

  function updatePlayButton(isPlaying) {
    playButton.textContent = isPlaying ? "❚❚" : "▶";

    playButton.setAttribute(
      "aria-label",
      isPlaying ? "Pause mix" : "Play mix"
    );

    player.classList.toggle("is-playing", isPlaying);
  }

  function resetMeter() {
  meterBars.forEach((bar) => {
    bar.style.height = "12%";
    bar.style.opacity = "0.35";
  });

  if (leftMeterFill) {
    leftMeterFill.style.width = "0%";
  }

  if (rightMeterFill) {
    rightMeterFill.style.width = "0%";
  }

  if (leftPeakMarker) {
    leftPeakMarker.style.left = "0%";
    leftPeakMarker.style.opacity = "0";
  }

  if (rightPeakMarker) {
    rightPeakMarker.style.left = "0%";
    rightPeakMarker.style.opacity = "0";
  }

  if (leftMeterValue) {
    leftMeterValue.textContent = "-∞";
  }

  if (rightMeterValue) {
    rightMeterValue.textContent = "-∞";
  }
}

  function initializeAudioAnalyser() {
    if (analyser) {
      return;
    }

    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();

   analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.72;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;

sourceNode = audioContext.createMediaElementSource(audio);
gainNode = audioContext.createGain();

// Main audio path.
sourceNode.connect(gainNode);
gainNode.connect(analyser);
analyser.connect(audioContext.destination);

// Split the post-volume stereo signal.
channelSplitter = audioContext.createChannelSplitter(2);
gainNode.connect(channelSplitter);

leftAnalyser = audioContext.createAnalyser();
rightAnalyser = audioContext.createAnalyser();

leftAnalyser.fftSize = 1024;
rightAnalyser.fftSize = 1024;

leftAnalyser.smoothingTimeConstant = 0.65;
rightAnalyser.smoothingTimeConstant = 0.65;



channelSplitter.connect(leftAnalyser, 0);
channelSplitter.connect(rightAnalyser, 1);
}
  function startMeter() {
  if (
    !analyser ||
    !audioContext ||
    meterBars.length === 0
  ) {
    return;
  }

  const frequencyData = new Uint8Array(
    analyser.frequencyBinCount
  );

  const leftTimeData = leftAnalyser
    ? new Uint8Array(leftAnalyser.fftSize)
    : null;

  const rightTimeData = rightAnalyser
    ? new Uint8Array(rightAnalyser.fftSize)
    : null;

  const minimumFrequency = 50;

  const maximumFrequency = Math.min(
    16000,
    audioContext.sampleRate / 2
  );

  const binWidth =
    audioContext.sampleRate / analyser.fftSize;

  let leftPeakLevel = 0;
let rightPeakLevel = 0;

let displayedLeftLevel = 0;
let displayedRightLevel = 0;

let leftPeakHold = 0;
let rightPeakHold = 0;

let leftPeakHoldTimer = 0;
let rightPeakHoldTimer = 0;

  function getBandLevel(startFrequency, endFrequency) {
    const startBin = Math.max(
      0,
      Math.floor(startFrequency / binWidth)
    );

    const endBin = Math.min(
      frequencyData.length - 1,
      Math.ceil(endFrequency / binWidth)
    );

    let total = 0;
    let peak = 0;
    let count = 0;

    for (let bin = startBin; bin <= endBin; bin += 1) {
      const value = frequencyData[bin];

      total += value;
      peak = Math.max(peak, value);
      count += 1;
    }

    if (count === 0) {
      return 0;
    }

    const average = total / count;

    return average * 0.72 + peak * 0.28;
  }

  function getChannelLevel(channelAnalyser, timeData) {
    if (!channelAnalyser || !timeData) {
      return {
        decibels: -Infinity,
        percentage: 0
      };
    }

    channelAnalyser.getByteTimeDomainData(timeData);

    let sumSquares = 0;

    for (let index = 0; index < timeData.length; index += 1) {
      const sample = (timeData[index] - 128) / 128;
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / timeData.length);

    const decibels =
      rms > 0 ? 20 * Math.log10(rms) : -Infinity;

    const minimumDecibels = -60;
    const limitedDecibels = Math.max(
      minimumDecibels,
      Math.min(0, decibels)
    );

    function decibelsToPercentage(value) {
  if (value <= -60) {
    return 0;
  }

  if (value <= -30) {
    return ((value + 60) / 30) * 35;
  }

  if (value <= -18) {
    return 35 + ((value + 30) / 12) * 20;
  }

  if (value <= -12) {
    return 55 + ((value + 18) / 6) * 15;
  }

  if (value <= -6) {
    return 70 + ((value + 12) / 6) * 17;
  }

  if (value <= -3) {
    return 87 + ((value + 6) / 3) * 8;
  }

  return 95 + ((value + 3) / 3) * 5;
}

const percentage = decibelsToPercentage(
  limitedDecibels
);
    return {
      decibels,
      percentage
    };
  }

  function formatMeterValue(decibels) {
    if (!Number.isFinite(decibels) || decibels <= -60) {
      return "-∞";
    }

    return decibels.toFixed(1);
  }

  function updateStereoMeter() {
    const leftLevel = getChannelLevel(
      leftAnalyser,
      leftTimeData
    );

    const rightLevel = getChannelLevel(
      rightAnalyser,
      rightTimeData
    );

    const attackSpeed = 0.7;
const releaseSpeed = 0.08;
const peakReleaseSpeed = 0.22;
const peakHoldFrames = 55;

displayedLeftLevel +=
  (leftLevel.percentage - displayedLeftLevel) *
  (leftLevel.percentage > displayedLeftLevel
    ? attackSpeed
    : releaseSpeed);

displayedRightLevel +=
  (rightLevel.percentage - displayedRightLevel) *
  (rightLevel.percentage > displayedRightLevel
    ? attackSpeed
    : releaseSpeed);

if (leftLevel.percentage >= leftPeakHold) {
  leftPeakHold = leftLevel.percentage;
  leftPeakHoldTimer = peakHoldFrames;
} else if (leftPeakHoldTimer > 0) {
  leftPeakHoldTimer -= 1;
} else {
  leftPeakHold = Math.max(
    displayedLeftLevel,
    leftPeakHold - peakReleaseSpeed
  );
}

if (rightLevel.percentage >= rightPeakHold) {
  rightPeakHold = rightLevel.percentage;
  rightPeakHoldTimer = peakHoldFrames;
} else if (rightPeakHoldTimer > 0) {
  rightPeakHoldTimer -= 1;
} else {
  rightPeakHold = Math.max(
    displayedRightLevel,
    rightPeakHold - peakReleaseSpeed
  );
}

leftPeakLevel = leftPeakHold;
rightPeakLevel = rightPeakHold;

    if (leftMeterFill) {
      leftMeterFill.style.width =
  `${displayedLeftLevel}%`;
    }

    if (rightMeterFill) {
      rightMeterFill.style.width =
  `${displayedRightLevel}%`;
    }

    if (leftPeakMarker) {
      leftPeakMarker.style.left =
        `${Math.min(99.5, leftPeakLevel)}%`;

      leftPeakMarker.style.opacity =
        leftPeakLevel > 1 ? "1" : "0";
    }

    if (rightPeakMarker) {
      rightPeakMarker.style.left =
        `${Math.min(99.5, rightPeakLevel)}%`;

      rightPeakMarker.style.opacity =
        rightPeakLevel > 1 ? "1" : "0";
    }

    if (leftMeterValue) {
      leftMeterValue.textContent =
        formatMeterValue(leftLevel.decibels);
    }

    if (rightMeterValue) {
      rightMeterValue.textContent =
        formatMeterValue(rightLevel.decibels);
    }
  }

  function drawMeter() {
    analyser.getByteFrequencyData(frequencyData);

    meterBars.forEach((bar, index) => {
      const lowerRatio =
        index / meterBars.length;

      const upperRatio =
        (index + 1) / meterBars.length;

      const startFrequency =
        minimumFrequency *
        Math.pow(
          maximumFrequency / minimumFrequency,
          lowerRatio
        );

      const endFrequency =
        minimumFrequency *
        Math.pow(
          maximumFrequency / minimumFrequency,
          upperRatio
        );

      const level = getBandLevel(
        startFrequency,
        endFrequency
      );

      const highFrequencyCompensation =
        1 + index * 0.025;

      const adjustedLevel = Math.min(
        255,
        level * highFrequencyCompensation
      );

      const normalizedLevel =
        adjustedLevel / 255;

      const height = Math.max(
        8,
        Math.pow(normalizedLevel, 0.72) * 100
      );

      const opacity = Math.max(
        0.3,
        normalizedLevel
      );

      bar.style.height = `${height}%`;
      bar.style.opacity = opacity.toString();
    });

    updateStereoMeter();

    meterAnimationFrame =
      requestAnimationFrame(drawMeter);
  }

  cancelAnimationFrame(meterAnimationFrame);
  drawMeter();
}

  function stopMeter() {
    cancelAnimationFrame(meterAnimationFrame);
    meterAnimationFrame = null;
    resetMeter();
  }

  function loadTrack(index, shouldPlay = false) {
    currentTrack = index;

    audio.src = tracks[currentTrack].file;
    title.textContent = tracks[currentTrack].title;
    counter.textContent =
      `${currentTrack + 1} of ${tracks.length}`;

    if (progress) {
      progress.value = 0;
    }

    if (currentTimeDisplay) {
      currentTimeDisplay.textContent = "0:00";
    }

    if (durationDisplay) {
      durationDisplay.textContent = "0:00";
    }

    audio.load();
    updatePlayButton(false);
    stopMeter();

    if (shouldPlay) {
      playAudio();
    }
  }

  async function playAudio() {
    try {
      initializeAudioAnalyser();

      if (
        audioContext &&
        audioContext.state === "suspended"
      ) {
        await audioContext.resume();
      }

      await audio.play();

      updatePlayButton(true);
      startMeter();
    } catch (error) {
      console.error("Unable to play audio:", error);
      updatePlayButton(false);
      stopMeter();
    }
  }

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      playAudio();
    } else {
      audio.pause();
    }
  });

  previousButton.addEventListener("click", () => {
    const previousTrack =
      (currentTrack - 1 + tracks.length) % tracks.length;

    const wasPlaying = !audio.paused;
    loadTrack(previousTrack, wasPlaying);
  });

  nextButton.addEventListener("click", () => {
    const nextTrack =
      (currentTrack + 1) % tracks.length;

    const wasPlaying = !audio.paused;
    loadTrack(nextTrack, wasPlaying);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationDisplay) {
      durationDisplay.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (currentTimeDisplay) {
      currentTimeDisplay.textContent =
        formatTime(audio.currentTime);
    }

    if (progress && Number.isFinite(audio.duration)) {
  const progressValue =
    (audio.currentTime / audio.duration) * 100;

  progress.value = progressValue;

  progress.style.background =
    `linear-gradient(
      to right,
      var(--gold) 0%,
      var(--gold) ${progressValue}%,
      rgba(255, 255, 255, 0.14) ${progressValue}%,
      rgba(255, 255, 255, 0.14) 100%
    )`;
}
  });

  if (progress) {
    progress.addEventListener("input", () => {
      if (!Number.isFinite(audio.duration)) {
        return;
      }

      audio.currentTime =
        (Number(progress.value) / 100) * audio.duration;
    });
    const progressValue = Number(progress.value);

progress.style.background =
  `linear-gradient(
    to right,
    var(--gold) 0%,
    var(--gold) ${progressValue}%,
    rgba(255, 255, 255, 0.14) ${progressValue}%,
    rgba(255, 255, 255, 0.14) 100%
  )`;
  }

  if (volumeSlider) {
  const updateVolumeVisual = (value) => {
    const percentage = Number(value) * 100;

    volumeSlider.style.background =
      `linear-gradient(
        to right,
        var(--gold) 0%,
        var(--gold) ${percentage}%,
        rgba(255, 255, 255, 0.14) ${percentage}%,
        rgba(255, 255, 255, 0.14) 100%
      )`;
  };

  const setVolume = (value) => {
    const volume = Number(value);

    if (gainNode && audioContext) {
      gainNode.gain.setTargetAtTime(
        volume,
        audioContext.currentTime,
        0.01
      );
    } else {
      audio.volume = volume;
    }

    updateVolumeVisual(volume);
  };

  setVolume(volumeSlider.value);

  volumeSlider.addEventListener("input", () => {
    setVolume(volumeSlider.value);
  });
}

  audio.addEventListener("play", () => {
    updatePlayButton(true);
    startMeter();
  });

  audio.addEventListener("pause", () => {
    updatePlayButton(false);
    stopMeter();
  });

  audio.addEventListener("ended", () => {
    const nextTrack =
      (currentTrack + 1) % tracks.length;

    loadTrack(nextTrack, true);
  });

  audio.addEventListener("error", () => {
    updatePlayButton(false);
    stopMeter();
  });

  resetMeter();
loadTrack(0);
}

/* FOH PLAYLIST */

/* FOH PLAYLIST */

createPlaylistPlayer("foh", [
  {
    title: "Acoustic Guitar FOH Mix",
    file: "assets/audio/foh-acoustic-guitar.mp3"
  },
  {
    title: "Full Band FOH Mix 01",
    file: "assets/audio/foh-full-band-01.mp3"
  },
  {
    title: "Full Band FOH Mix 02",
    file: "assets/audio/foh-full-band-02.mp3"
  },
  {
    title: "Full Band FOH Mix 03",
    file: "assets/audio/foh-full-band-03.mp3"
  },
  {
    title: "Full Band FOH Mix 04",
    file: "assets/audio/foh-full-band-04.mp3"
  },
  {
    title: "Full Band FOH Mix 05",
    file: "assets/audio/foh-full-band-05.mp3"
  },
  {
    title: "Full Band FOH Mix 06",
    file: "assets/audio/foh-full-band-06.mp3"
  },
  {
    title: "DJ + Live Vocal FOH Mix 01",
    file: "assets/audio/foh-dj-live-vocal-01.mp3"
  },
  {
    title: "DJ + Live Vocal FOH Mix 02",
    file: "assets/audio/foh-dj-live-vocal-02.mp3"
  }
]);


/* IEM PLAYLIST */

createPlaylistPlayer("iem", [
  {
    title: "Drums IEM Mix",
    file: "assets/audio/iem-drums.mp3"
  },
  {
    title: "Bass IEM Mix",
    file: "assets/audio/iem-bass.mp3"
  },
  {
    title: "Guitar IEM Mix",
    file: "assets/audio/iem-guitar.mp3"
  },
  {
    title: "Lead Vocal 1 IEM Mix",
    file: "assets/audio/iem-lead-vocal-01.mp3"
  },
  {
    title: "Lead Vocal 2 IEM Mix",
    file: "assets/audio/iem-lead-vocal-02.mp3"
  },
  {
    title: "Lead Vocal 3 IEM Mix",
    file: "assets/audio/iem-lead-vocal-03.mp3"
  },
  {
    title: "Lead Vocal 4 IEM Mix",
    file: "assets/audio/iem-lead-vocal-04.mp3"
  }
]);
