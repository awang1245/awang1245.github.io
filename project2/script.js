let birds = [];
let currentCaller = null;
let callInterval = null;
let mode = "realtime";
let isPaused = false;

const timeIcons = {
  dawn: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         class="icon icon-tabler icon-tabler-sunset-2">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 13h1" />
      <path d="M20 13h1" />
      <path d="M5.6 6.6l.7 .7" />
      <path d="M18.4 6.6l-.7 .7" />
      <path d="M8 13a4 4 0 1 1 8 0" />
      <path d="M3 17h18" />
      <path d="M7 20h5" />
      <path d="M16 20h1" />
      <path d="M12 5v-1" />
    </svg>
  `,

  day: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-sun"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
  `,

  dusk: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         class="icon icon-tabler icon-tabler-haze-moon">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 16h18" />
      <path d="M3 20h18" />
      <path d="M8.296 16c-2.268 -1.4 -3.598 -4.087 -3.237 -6.916c.443 -3.48 3.308 -6.083 6.698 -6.084v.006h.296c-1.991 1.916 -2.377 5.03 -.918 7.405c1.459 2.374 4.346 3.33 6.865 2.275a6.888 6.888 0 0 1 -2.777 3.314" />
    </svg>
  `,

  night: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         class="icon icon-tabler icon-tabler-moon">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </svg>
  `,
};

const weatherIcons = {
  clear: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-sun"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
  `,
  partly: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-sun-wind"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14.468 10a4 4 0 1 0 -5.466 5.46" /><path d="M2 12h1" /><path d="M11 3v1" /><path d="M11 20v1" /><path d="M4.6 5.6l.7 .7" /><path d="M17.4 5.6l-.7 .7" /><path d="M5.3 17.7l-.7 .7" /><path d="M15 13h5a2 2 0 1 0 0 -4" /><path d="M12 16h5.714l.253 0a2 2 0 0 1 2.033 2a2 2 0 0 1 -2 2h-.286" /></svg>
  `,
  cloudy: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" /></svg>
  `,
  rain: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-rain"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7" /><path d="M11 13v2m0 3v2m4 -5v2m0 3v2" /></svg>  `,
  snow: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-snow"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7" /><path d="M11 15v.01m0 3v.01m0 3v.01m4 -4v.01m0 3v.01" /></svg>
  `,
  storm: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-bolt"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 18.004h-6.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.396 0 2.6 .831 3.148 2.03" /><path d="M19 16l-2 3h4l-2 3" /></svg>`,
};

const iconVolume = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M15 8a5 5 0 0 1 0 8" />
  <path d="M17.7 5a9 9 0 0 1 0 14" />
  <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5
    a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
</svg>`;

const iconVolumeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-volume-off"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464" /><path d="M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615" /><path d="M9.069 5.054l.431 -.554a.8 .8 0 0 1 1.5 .5v2m0 4v8a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l1.294 -1.664" /><path d="M3 3l18 18" /></svg>`;

const pond = `         ___________________
     ___/                   \\__
  __/             ^^           \\___
 /                      ^          \\__
|         ^^^                         \\
|  ^^                                  | 
 \\____         ^^            ^^^   ___/
      \\___           ^     _______/
          \\_______________/            `;

const trees = {
  near: `|  |  |
| |   |
|     |
|     |
|  |  |
|     |
|   | |
|     |
|     |
|     |
|     |
|     |
| |   |
|  |  |
|     |
|   | |
|     |
|     |
| |   |
|     |
|     |
|     |
|     |
|     |
|  |  |
|   | |
|     |
|     |
|     |
|     |
|     |
|     |
|     |`,
  mid: `|    |
|    |
|    |
| |  |
|  | |
|    |
|    |
|    |
||   |
|    |
|    |
|    |
|    |
|  | |
|    |
|   ||
|    |
|    |
| |  |
|  | |
|    |
|    |
||   |
|    |
|    |
|    |
|  | |
|    |
| |  |
|   ||
|    |
|    |
|    |`,
  far: `|   |
|  ||
|   |
|   |
|   |
|   |
| | |
|   |
||  |
|   |
|   |
|   |
|   |
|   |
|   |
| | |
|   |
|   |
|   |
||  |
| | |
|   |
|   |
|   |
|   |
|   |
| | |
|   |
|  ||
|   |
|   |
|   |
|   |`,
};

const PERCH_RULES = {
  ground: ["duck", "swan", "robin", "mourningdove"],
  rightSide: ["downywoodpecker", "redbellied"], // woodpeckers
};

window.addEventListener("DOMContentLoaded", () => {
  // const ascii =
  //   " 　_---\n -´0 \\\n  l ( \\\\.____\n   \\_`_.----\n===/=/========";

  // const el = document.createElement("pre");
  // el.textContent = ascii;
  // document.body.appendChild(el);
  applyBackground();
  updateTimePanel();
  setInterval(updateTimePanel, 1000);

  updateWeather();
  setInterval(updateWeather, 10 * 60 * 1000); // every 10 mins

  placeAscii();

  let isMuted = false;
  const soundButton = document.getElementById("sound-button");
  soundButton.innerHTML = iconVolume;

  soundButton.addEventListener("click", () => {
    isMuted = !isMuted;

    soundButton.innerHTML = isMuted ? iconVolumeOff : iconVolume;

    window.globalMuted = isMuted;
  });

  const modeButton = document.getElementById("mode-button");
  const modeMenu = document.getElementById("mode-menu");

  modeButton.addEventListener("click", () => {
    modeMenu.classList.toggle("hidden");
    modeButton.classList.toggle("open");
  });

  modeMenu.querySelectorAll("div").forEach((item) => {
    item.addEventListener("click", () => {
      mode = item.dataset.mode;

      const label =
        item.dataset.mode === "realtime"
          ? "Real-Time"
          : item.dataset.mode.charAt(0).toUpperCase() +
            item.dataset.mode.slice(1);

      modeButton.querySelector("p").textContent = label;

      modeMenu.classList.add("hidden");
      modeButton.classList.remove("open");

      // reapply immediately
      applyBackground();
      updateTimePanel();

      spawnBirdsForCurrentMode();
    });
  });

  fetch("./birds.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      birds = data.birds || [];
      console.log("Loaded birds:", birds);

      if (!birds.length) {
        console.warn("No birds found in JSON.");
        return;
      }

      startCallLoop();

      requestAnimationFrame(() => {
        console.log("Calling spawnBirdsForCurrentMode()");
        spawnBirdsForCurrentMode();
      });
    })
    .catch((err) => {
      console.error("Failed to load birds.json:", err);
    });
});

const TREE_ANCHORS = {
  near: [{ el: "trees-near", dx: 8, dy: 20 }],
  mid: [
    { el: "trees-mid-1", dx: 8, dy: 20 },
    { el: "trees-mid-2", dx: 8, dy: 20 },
  ],
  far: [
    { el: "trees-far-1", dx: 8, dy: 20 },
    { el: "trees-far-2", dx: 8, dy: 20 },
  ],
  ground: {
    minY: window.innerHeight * 0.7,
    maxY: window.innerHeight * 0.88,
  },
};

function getBirdsForCurrentTime() {
  const cur = getCurrentMode();

  return birds.filter((b) => b.activeTimes.includes(cur));
}

function startCallLoop() {
  // small delay to ensure birds are placed first
  setTimeout(() => {
    pickRandomBirdCall();
  }, 1000);
}

function pickRandomBirdCall() {
  if (isPaused) return;
  if (!birds.length) return;

  // remove calling class from previous caller
  if (currentCaller) {
    const prevDiv = document.querySelector(
      `.bird-instance[data-id="${currentCaller.id}"]`
    );
    if (prevDiv) prevDiv.classList.remove("calling");
  }

  // choose random bird
  const randomBird = birds[Math.floor(Math.random() * birds.length)];
  currentCaller = randomBird;

  const birdDiv = document.querySelector(
    `.bird-instance[data-id="${randomBird.id}"]`
  );

  if (birdDiv && !isPaused) {
    birdDiv.classList.add("calling"); // wiggle class
  }

  if (isPaused) return;

  console.log("Playing:", randomBird.id);

  const audio = new Audio(randomBird.sound);
  audio.type = "audio/wav";

  // play audio
  audio.play().catch((err) => {
    console.warn("Audio failed to play:", err);
    scheduleNextCall();
  });

  audio.onended = () => {
    if (birdDiv) birdDiv.classList.remove("calling");
    scheduleNextCall();
  };
}

function scheduleNextCall() {
  if (isPaused) return;
  setTimeout(() => {
    pickRandomBirdCall();
  }, 10000);
}

function enableClicks() {
  const birdDivs = document.querySelectorAll(".bird-instance");

  birdDivs.forEach((div) => {
    div.addEventListener("click", () => {
      const birdId = div.dataset.id;
      const bird = birds.find((b) => b.id === birdId);
      if (!bird) return;

      // remove previous selection
      document.querySelectorAll(".bird-instance.selected").forEach((prev) => {
        prev.classList.remove("selected");
      });

      // highlight clicked bird
      div.classList.add("selected");

      // open modal
      openBirdModal(bird);
    });
  });
}

// function updateInfoPanel(bird) {
//   const panel = document.getElementById("bird-info");
//   if (!panel) return;

//   panel.innerHTML = `
//     <h2>${bird.name}</h2>
//     <p>${bird.description}</p>
//   `;
// }

// for ui and background
function getDayState(date = new Date()) {
  const h = date.getHours();

  if (h >= 4.5 && h < 7.5) {
    return {
      mode: "dawn",
      label: "Dawn",
      className: "bg-dawn",
    };
  } else if (h >= 7.5 && h < 17) {
    return {
      mode: "day",
      label: "Day",
      className: "bg-day",
    };
  } else if (h >= 17 && h < 19) {
    return {
      mode: "dusk",
      label: "Dusk",
      className: "bg-dusk",
    };
  } else {
    return {
      mode: "night",
      label: "Night",
      className: "bg-night",
    };
  }
}

function applyBackground() {
  const body = document.body;

  body.classList.remove("bg-dawn", "bg-day", "bg-dusk", "bg-night");

  if (mode !== "realtime") {
    body.classList.add("bg-" + mode);
    return;
  }

  const realState = getDayState();
  body.classList.add(realState.className);
}

function formatTime(date = new Date()) {
  let h = date.getHours();
  let m = date.getMinutes().toString().padStart(2, "0");
  let s = date.getSeconds().toString().padStart(2, "0");

  const am = h < 12;
  h = h % 12 || 12;

  return `${h}:${m}:${s} ${am ? "AM" : "PM"}`;
}

function updateTimePanel() {
  const now = new Date();
  const state = getDayState(now);

  const timeText = document.getElementById("time-text");

  if (timeText) {
    timeText.textContent = formatTime(now);
  }

  const iconContainer = document.getElementById("time-icon");
  iconContainer.innerHTML = timeIcons[state.mode];
}

async function updateWeather() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=41.8236&longitude=-71.4222&current_weather=true";

  try {
    const res = await fetch(url);
    const data = await res.json();

    const tempC = data.current_weather.temperature; // °C
    const tempF = Math.round((tempC * 9) / 5 + 32); // convert to F

    const code = data.current_weather.weathercode;
    const state = interpretWeatherCode(code);

    document.getElementById("weather-icon").innerHTML =
      weatherIcons[state.icon];

    document.getElementById(
      "weather-text"
    ).textContent = `${state.label}, ${tempF}°F / ${tempC}°C`;
  } catch (err) {
    console.error("Weather error:", err);
  }
}

// handle weather condition codes from open-meteo api
function interpretWeatherCode(code) {
  if (code === 0) return { icon: "clear", label: "Clear" };

  if ([1, 2].includes(code)) return { icon: "partly", label: "Partly Cloudy" };

  if (code === 3) return { icon: "cloudy", label: "Cloudy" };

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return { icon: "rain", label: "Rain" };

  if ([71, 73, 75, 85, 86].includes(code))
    return { icon: "snow", label: "Snow" };

  if ([95, 96, 99].includes(code)) return { icon: "storm", label: "Storm" };

  // fallback
  return { icon: "cloudy", label: "Unknown" };
}

function getCurrentMode() {
  if (mode !== "realtime") {
    return mode;
  }

  // if realtime, use actual real time logic
  const h = new Date().getHours();

  if (h >= 4.5 && h < 7.5) return "dawn";
  if (h >= 7.5 && h < 17) return "day";
  if (h >= 17 && h < 19) return "dusk";
  return "night";
}

function placeAscii() {
  document.getElementById("trees-far-1").textContent = trees.far;
  document.getElementById("trees-far-2").textContent = trees.far;

  document.getElementById("trees-mid-1").textContent = trees.mid;
  document.getElementById("trees-mid-2").textContent = trees.mid;

  document.getElementById("trees-near").textContent = trees.near;

  document.getElementById("pond").textContent = pond;
}

// bird spawning logic

const TREE_WIDTH = {
  near: 108,
  mid: 77,
  far: 52,
};

const SCREEN_TOP_LIMIT = window.innerHeight * 0.1; // top 10%
const SCREEN_BOTTOM_GROUND = window.innerHeight * 0.7; // bottom 30%

// pond horizontal limits
const POND_LEFT = window.innerWidth * 0.2 + 50;
const POND_RIGHT = POND_LEFT + 510;

// pond vertical limits (from bottom)
const POND_MIN_Y = window.innerHeight - 320; // higher up
const POND_MAX_Y = window.innerHeight - 210; // near bottom

const GROUND_LEFT = POND_LEFT - 50;
const GROUND_RIGHT = POND_RIGHT + 50;

const GROUND_MIN_Y = window.innerHeight * 0.85; // top of bottom 20%
const GROUND_MAX_Y = window.innerHeight - 100;

// depth layers
const LAYERS = {
  near: { font: 24, opacity: 1.0 },
  mid: { font: 20, opacity: 0.8 },
  far: { font: 16, opacity: 0.6 },
};

const TREE_SLOTS = {
  near: [
    { id: "trees-near", side: "left" },
    { id: "trees-near", side: "right" },
  ],
  mid: [
    { id: "trees-mid-1", side: "right" },
    { id: "trees-mid-2", side: "right" },
  ],
  far: [
    { id: "trees-far-1", side: "right" },
    { id: "trees-far-2", side: "left" },
  ],
};

const POND_BIRDS = new Set([
  "mallard",
  "americanblackduck",
  "hoodedmerganser",
  "bufflehead",
  "commoneider",
  "muteswan",
]);

const GROUND_BIRDS = new Set(["mourningdove", "americanrobin"]);

// need to make sure woodpeckers are on right side of a tree
const WOODPECKERS = new Set(["downywoodpecker", "redbelliedwoodpecker"]);

function spawnBirdsForCurrentMode() {
  console.log("SPAWN CALLED");
  document.querySelectorAll(".bird-instance").forEach((b) => b.remove());

  const tod = getCurrentMode().toLowerCase();

  // filter birds by time-of-day ONLY
  const eligible = birds.filter((b) =>
    b.time_of_day.some((t) => t.toLowerCase() === tod)
  );
  // randomize list
  const shuffled = eligible.sort(() => Math.random() - 0.5);

  // prepare layers
  const pondBirds = shuffled.filter((b) => POND_BIRDS.has(b.id));
  const landBirds = shuffled.filter((b) => GROUND_BIRDS.has(b.id));
  const rest = shuffled.filter(
    (b) => !POND_BIRDS.has(b.id) && !GROUND_BIRDS.has(b.id)
  );

  // pond 2 birds
  pondBirds.slice(0, 2).forEach((bird) => spawnPondBird(bird));

  // ground 1 bird
  landBirds.slice(0, 1).forEach((bird) => spawnGroundBird(bird));

  // Near: exactly 2 (left + right)
  const nearBirds = rest.slice(0, 2);
  spawnNearLayer(nearBirds);

  // Mid: 1 each
  const midBirds = rest.slice(2, 4);
  spawnMidLayer(midBirds);

  // Far: 1 each
  const farBirds = rest.slice(4, 6);
  spawnFarLayer(farBirds);

  requestAnimationFrame(() => enableClicks());
}

function spawnPondBird(bird) {
  const div = createBirdDiv(bird, 24, 1.0);

  // X must be inside pond region
  const x = POND_LEFT + Math.random() * (POND_RIGHT - POND_LEFT - 80);

  // Y must be between POND_MIN_Y and POND_MAX_Y
  let y = POND_MIN_Y + Math.random() * (POND_MAX_Y - POND_MIN_Y);

  div.style.left = `${x}px`;
  div.style.top = `${y}px`;

  fadeIn(div);
}

function spawnGroundBird(bird) {
  const div = createBirdDiv(bird, 24, 1.0);

  // X within pond region + 100px extra on both sides
  const x = GROUND_LEFT + Math.random() * (GROUND_RIGHT - GROUND_LEFT - 80);

  // Y within bottom 20%
  let y = GROUND_MIN_Y + Math.random() * (GROUND_MAX_Y - GROUND_MIN_Y);

  div.style.left = `${x}px`;
  div.style.top = `${y}px`;

  fadeIn(div);
}

function spawnNearLayer(birdList) {
  if (!birdList.length) return;
  const anchor = document.getElementById("trees-near");
  const rect = anchor.getBoundingClientRect();

  const positions = [
    { side: "left", bird: birdList[0] },
    { side: "right", bird: birdList[1] },
  ];

  positions.forEach((entry) => {
    if (!entry.bird) return;

    // woodpeckers ALWAYS go on the right
    const side = WOODPECKERS.has(entry.bird.id) ? "right" : entry.side;

    placeBirdAtTree(entry.bird, rect, LAYERS.near, side, "near");
  });
}

function spawnMidLayer(birdList) {
  TREE_SLOTS.mid.forEach((slot, i) => {
    if (!birdList[i]) return;

    const el = document.getElementById(slot.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    placeBirdAtTree(birdList[i], rect, LAYERS.mid, slot.side, "mid");
  });
}

function spawnFarLayer(birdList) {
  TREE_SLOTS.far.forEach((slot, i) => {
    if (!birdList[i]) return;

    const el = document.getElementById(slot.id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    placeBirdAtTree(birdList[i], rect, LAYERS.far, slot.side, "far");
  });
}

function placeBirdAtTree(
  bird,
  treeRect,
  layer,
  side = "right",
  treeType = "near"
) {
  const div = createBirdDiv(bird, layer.font, layer.opacity);

  requestAnimationFrame(() => {
    const birdRect = div.getBoundingClientRect();
    const birdWidth = birdRect.width;

    // Y: within upper 60%
    let y = treeRect.top + Math.random() * (treeRect.height * 0.6);
    if (y < SCREEN_TOP_LIMIT) {
      y = SCREEN_TOP_LIMIT + Math.random() * 40;
    }

    let x;

    if (side === "left") {
      x = treeRect.left - birdWidth; // same as near tree logic
    } else {
      x = treeRect.right;
    }

    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    fadeIn(div);
  });
}

function createBirdDiv(bird, fontSize = 24, opacity = 1) {
  const div = document.createElement("div");
  div.classList.add("bird-instance");
  div.style.position = "absolute";
  div.style.whiteSpace = "pre";
  div.style.fontSize = `${fontSize}px`;
  div.style.zIndex = "50";
  div.style.opacity = opacity;
  div.textContent = bird.ascii;

  div.dataset.id = bird.id; // needed for selection + modal

  document.body.appendChild(div);
  return div;
}

function fadeIn(div) {
  div.style.opacity = 0;
  requestAnimationFrame(() => {
    div.style.transition = "opacity 0.8s ease";
    div.style.opacity = 1;
  });
}

// modal logic

let modalAudio = null;

document.getElementById("modal-sound-btn").addEventListener("click", () => {
  if (!modalAudio) return;

  modalAudio.currentTime = 0;
  modalAudio.play().catch((err) => console.warn("Sound failed:", err));
});

function openBirdModal(bird) {
  isPaused = true;
  const overlay = document.getElementById("bird-overlay");

  document.getElementById("top-left").classList.add("ui-disabled");
  document.getElementById("bottom-right").classList.add("ui-disabled");

  document.getElementById("modal-name").textContent = bird.name;
  document.getElementById("modal-science").textContent =
    bird.scientific_name || "";
  document.getElementById("modal-img").src = bird.img || "";
  document.getElementById("modal-seasonality").textContent =
    bird.seasonality || "";
  document.getElementById("modal-time").textContent =
    bird.time_of_day?.join(", ") || "";
  document.getElementById("modal-range").textContent = bird.us_range || "";
  document.getElementById("modal-description").textContent =
    bird.description || "";
  modalAudio = new Audio(bird.sound);
  modalAudio.type = "audio/wav";

  overlay.style.display = "block";
}

function closeBirdModal() {
  document.getElementById("bird-overlay").style.display = "none";
  isPaused = false;

  document.getElementById("top-left").classList.remove("ui-disabled");
  document.getElementById("bottom-right").classList.remove("ui-disabled");

  document
    .querySelectorAll(".bird-instance.selected")
    .forEach((el) => el.classList.remove("selected"));

  // restart the call loop
  scheduleNextCall();
}

// close button
document
  .getElementById("modal-close-btn")
  .addEventListener("click", closeBirdModal);

// clicking outside closes modal
document.getElementById("bird-overlay").addEventListener("click", (e) => {
  if (e.target.id === "bird-overlay") {
    closeBirdModal();
  }
});
