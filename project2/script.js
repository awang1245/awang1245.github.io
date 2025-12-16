import { timeIcons, weatherIcons, volumeIcons, pond, trees } from "./assets.js";

let userEntered = false;

let birds = []; // all fetched birds
let sceneBirds = []; // birds currently in scene
let currentCaller = null; // bird currently making a random call
let mode = "realtime"; // realtime, dawn, day, dusk, night
let isPaused = false; // to pause ambient logic when bird modal is open

// handle ambient random bird sounds
let ambientAudio = null;
let isMuted = false;
window.globalMuted = false;

// fires when the HTML document has been completely parsed,
// and all deferred scripts (<script defer src="…"> and <script type="module">) have downloaded and executed
window.addEventListener("DOMContentLoaded", () => {
  // set up the scene
  applyBackground();
  placeAscii();

  // update time display every second
  updateTime();
  setInterval(updateTime, 1000);

  // update weather/temp display for prov every 10 mins
  updateWeather();
  setInterval(updateWeather, 10 * 60 * 1000);

  const enterButton = document.getElementById("enter-button");
  if (enterButton) {
    enterButton.addEventListener("click", () => {
      userEntered = true;

      document.getElementById("enter-overlay").style.display = "none";

      // unlock audio
      const unlock = new Audio();
      unlock.volume = 0;
      unlock.play().catch(() => {});

      // start ambient audio only after interaction
      startCallLoop();
    });
  }

  // logic surrounding sound button allowing user to mute/unmute ambient bird sounds
  const soundButton = document.getElementById("sound-button");
  soundButton.innerHTML = volumeIcons.on;
  soundButton.addEventListener("click", () => {
    isMuted = !isMuted;
    window.globalMuted = isMuted;

    // set volume property on htmlaudioelement instance based on whether muted or not
    if (ambientAudio) {
      ambientAudio.volume = isMuted ? 0 : 0.5;
    }

    soundButton.innerHTML = isMuted ? volumeIcons.off : volumeIcons.on;
  });

  // logic surrounding dropdown allowing user to change the time of day mode
  const modeButton = document.getElementById("mode-button");
  const modeMenu = document.getElementById("mode-menu");
  modeButton.addEventListener("click", () => {
    modeMenu.classList.toggle("hidden");
    modeButton.classList.toggle("open");
  });

  modeMenu.querySelectorAll("div").forEach((item) => {
    item.addEventListener("click", () => {
      // update mode to reflect selected mode div
      mode = item.dataset.mode;

      // update main mode button to reflect the selected div
      modeButton.querySelector("p").textContent = item.textContent;

      modeMenu.classList.add("hidden");
      modeButton.classList.remove("open");

      // update scene for new mode
      applyBackground();
      updateTime();
      spawnBirdsForCurrentMode();
    });
  });

  // get all bird data
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
      spawnBirdsForCurrentMode(); // place birds in scene
    })
    .catch((err) => {
      console.error("Failed to load birds.json:", err);
    });
});

/*
SETTING UP UI + SCENE
*/

// get fields corresponding to real-time mode
function getDayState() {
  const h = new Date().getHours();

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

// apply background based on current mode
function applyBackground() {
  const body = document.body;

  // remove current styling
  body.classList.remove("bg-dawn", "bg-day", "bg-dusk", "bg-night");

  // apply custom mode
  if (mode !== "realtime") {
    body.classList.add("bg-" + mode);
    return;
  }

  // apply real-time mode
  const realState = getDayState();
  body.classList.add(realState.className);
}

// getter for current mode
function getCurrentMode() {
  // return immediately if custom picked mode
  if (mode !== "realtime") {
    return mode;
  }

  // if realtime, use actual real time logic
  const h = new Date().getHours();

  if (h >= 4.5 && h < 7.5) {
    return "dawn";
  } else if (h >= 7.5 && h < 17) {
    return "day";
  } else if (h >= 17 && h < 19) {
    return "dusk";
  } else {
    return "night";
  }
}

// handle updating the time UI
function updateTime() {
  // update time text based on current time
  const timeText = document.getElementById("time-text");
  let h = new Date().getHours();
  let m = new Date().getMinutes().toString().padStart(2, "0");
  let s = new Date().getSeconds().toString().padStart(2, "0");

  const am = h < 12;
  h = h % 12 || 12;
  timeText.textContent = `${h}:${m}:${s} ${am ? "AM" : "PM"}`;

  // update icon in time panel according to real-time time of day
  const iconContainer = document.getElementById("time-icon");
  const state = getDayState();
  iconContainer.innerHTML = timeIcons[state.mode];
}

// handle updating weather UI
async function updateWeather() {
  // fetch weather data from open source weather api using providence coordinates
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=41.8245&longitude=-71.4127&current_weather=true";

  try {
    const res = await fetch(url);
    const data = await res.json();

    const tempC = data.current_weather.temperature; // celsius by default
    const tempF = Math.round((tempC * 9) / 5 + 32); // convert to fahrenheit

    // get icon + label for current weather code
    const code = data.current_weather.weathercode;
    const state = interpretWeatherCode(code);
    document.getElementById("weather-icon").innerHTML =
      weatherIcons[state.icon];
    document.getElementById(
      "weather-text"
    ).textContent = `${state.label}, ${tempF}°F / ${tempC}°C`;
  } catch (err) {
    console.error("Error fetching weather data:", err);
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

// add in ascii scene
function placeAscii() {
  document.getElementById("trees-far-1").textContent = trees.far;
  document.getElementById("trees-far-2").textContent = trees.far;

  document.getElementById("trees-mid-1").textContent = trees.mid;
  document.getElementById("trees-mid-2").textContent = trees.mid;

  document.getElementById("trees-near").textContent = trees.near;

  document.getElementById("pond").textContent = pond;
}

/*
AMBIENT BIRD CALL LOOP
*/

// start ambient audio loop by picking a random bird to call
function startCallLoop() {
  // small delay to ensure birds are placed first
  setTimeout(() => {
    pickRandomBirdCall();
  }, 5000);
}

function pickRandomBirdCall() {
  if (!userEntered) return;
  if (isPaused) return;
  if (!sceneBirds.length) return;

  // remove calling class from previous caller
  if (currentCaller) {
    const prevDiv = document.querySelector(
      `.bird-instance[data-id="${currentCaller.id}"]`
    );
    if (prevDiv) prevDiv.classList.remove("calling");
  }

  // choose and select random bird
  const randomBird = sceneBirds[Math.floor(Math.random() * sceneBirds.length)];
  currentCaller = randomBird;
  const birdDiv = document.querySelector(
    `.bird-instance[data-id="${randomBird.id}"]`
  );

  console.log("Current bird calling", randomBird.id);

  // if sound button is muted rn, skip sound creation, but keep random bird selection logic ongoing
  if (window.globalMuted) {
    scheduleNextCall();
    return;
  }

  // initialize htmlaudioelement object
  ambientAudio = new Audio(randomBird.sound);
  ambientAudio.volume = window.globalMuted ? 0 : 0.5;

  ambientAudio.onloadedmetadata = () => {
    let repeats = 1;
    if (ambientAudio.duration < 3) {
      repeats = 3;
    } else if (ambientAudio.duration <= 9) {
      repeats = 2;
    } else {
      repeats = 1;
    }

    let playCount = 0;

    // function to play bird call one time
    const playOnce = () => {
      if (isPaused) return;

      ambientAudio.currentTime = 0;
      ambientAudio.play();

      // add calling class to new calling bird
      if (birdDiv) {
        birdDiv.classList.add("calling");
      }
    };

    ambientAudio.onended = () => {
      playCount++; // increment play count after audio ends

      // remove calling class when not actively calling
      if (birdDiv) {
        birdDiv.classList.remove("calling");
      }

      // if more repeats remain, keep going
      if (playCount < repeats) {
        // wait 1 second, then replay
        setTimeout(() => {
          if (!isPaused) playOnce();
        }, 1000);

        // finished all repeats
      } else {
        ambientAudio = null; // clear ambientAudio for next bird
        if (birdDiv) birdDiv.classList.remove("calling");
        scheduleNextCall(); // continue ambient audio loop
      }
    };

    // call playOnce for the first time
    playOnce();
  };
}

// continue ambient audio loop by picking another random bird after 15 seconds
function scheduleNextCall() {
  if (isPaused) return;
  setTimeout(() => {
    pickRandomBirdCall();
  }, 15000);
}

/*
GENERAL BIRD SPAWNING LOGIC
*/

// get birds allowed per layer
function birdsForLayer(birds, layer) {
  return birds.filter((b) => b.spawn?.includes(layer));
}

// place birds in scene for current time of day
function spawnBirdsForCurrentMode() {
  // clear any previous bird instances + reset list of birds curr in scene
  document.querySelectorAll(".bird-instance").forEach((b) => b.remove());
  sceneBirds = [];

  // get birds that match the current time of day
  const eligible = birds.filter((b) =>
    b.time_of_day.some(
      (t) => t.toLowerCase() === getCurrentMode().toLowerCase()
    )
  );

  // get allowed pond birds and randomize
  const pondBirds = birdsForLayer(eligible, "pond").sort(
    () => Math.random() - 0.5
  );
  // 1 bird on left and right side of pond
  spawnPondLayer(pondBirds.slice(0, 2));

  // get allowed ground birds and randomize
  const groundBirds = birdsForLayer(eligible, "ground").sort(
    () => Math.random() - 0.5
  );
  // 1 ground bird
  groundBirds.slice(0, 1).forEach((bird) => spawnGroundBird(bird));

  // get allowed near tree birds and randomize
  const nearBirds = birdsForLayer(eligible, "near").sort(
    () => Math.random() - 0.5
  );
  // 1 bird on left and right side of tree
  spawnNearLayer(nearBirds.slice(0, 2));

  // get allowed mid tree birds and randomize
  const midBirds = birdsForLayer(eligible, "mid").sort(
    () => Math.random() - 0.5
  );
  // 1 bird per mid tree
  spawnMidLayer(midBirds.slice(0, 2));

  // get allowed far tree birds and randomize
  const farBirds = birdsForLayer(eligible, "far").sort(
    () => Math.random() - 0.5
  );
  // 1 bird per far tree
  spawnFarLayer(farBirds.slice(0, 2));

  // make all birds clickable
  requestAnimationFrame(enableClicks);
}

// set up div and styling for each bird
function createBirdDiv(bird, fontSize, opacity) {
  // make new bird-instance
  const div = document.createElement("div");
  div.classList.add("bird-instance");

  // add styling
  div.style.position = "absolute";
  div.style.whiteSpace = "pre";
  div.style.fontSize = `${fontSize}px`;
  div.style.zIndex = "50";
  div.style.opacity = opacity;

  // ascii art
  div.textContent = bird.ascii;

  // store bird id for modal
  div.dataset.id = bird.id;

  document.body.appendChild(div);
  return div;
}

// add transition for when bird appears in scene
function fadeIn(div, opacity = 1) {
  div.style.opacity = 0;
  requestAnimationFrame(() => {
    div.style.transition = "opacity 0.8s ease";
    div.style.opacity = `${opacity}`;
  });
}

/*
SPAWN GROUND BIRD
*/

const GROUND_LEFT = window.innerWidth * 0.2 + 200;
const GROUND_RIGHT = window.innerWidth * 0.2 + 640;

const GROUND_MIN_Y = window.innerHeight * 0.85; // top of bottom 20%
const GROUND_MAX_Y = window.innerHeight - 100;

// randomly place a ground bird in scene within allowed bounds
function spawnGroundBird(bird) {
  // add bird to list of birds curr in scene + create div
  sceneBirds.push(bird);
  const birdDiv = createBirdDiv(bird, 24, 1.0);

  // random x within allowed bounds
  const x = GROUND_LEFT + Math.random() * (GROUND_RIGHT - GROUND_LEFT - 80);
  // random y within allowed bounds
  let y = GROUND_MIN_Y + Math.random() * (GROUND_MAX_Y - GROUND_MIN_Y);

  birdDiv.style.left = `${x}px`;
  birdDiv.style.top = `${y}px`;

  fadeIn(birdDiv, 1.0);
}

/*
SPAWN POND BIRDS
*/

const POND_BOUNDS = {
  left: {
    xMin: window.innerWidth * 0.2 + 30,
    xMax: window.innerWidth * 0.2 + 230,
  },
  right: {
    xMin: window.innerWidth * 0.2 + 270,
    xMax: window.innerWidth * 0.2 + 480,
  },
  yMin: window.innerHeight - 320,
  yMax: window.innerHeight - 210,
};

// randomly place a pond bird in scene within allowed bounds
function spawnPondBird(bird, side) {
  // add bird to list of birds curr in scene + create div
  sceneBirds.push(bird);
  const birdDiv = createBirdDiv(bird, 24, 0.8);

  // get allowed bounds based on which side of pond
  const bounds = POND_BOUNDS[side];

  // random x within allowed bounds
  const x = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
  // random y within allowed bounds
  const y =
    POND_BOUNDS.yMin + Math.random() * (POND_BOUNDS.yMax - POND_BOUNDS.yMin);

  birdDiv.style.left = `${x}px`;
  birdDiv.style.top = `${y}px`;

  fadeIn(birdDiv, 0.8);
}

// spawn one pond bird in each slot within the pond layer
function spawnPondLayer(birdList) {
  const slots = [
    { side: "left", bird: birdList[0] },
    { side: "right", bird: birdList[1] },
  ];

  slots.forEach(({ bird, side }) => {
    if (!bird) return;
    spawnPondBird(bird, side);
  });
}

/*
SPAWN TREE BIRDS
*/

// text styling for each tree layer
const LAYERS = {
  near: { font: 24, opacity: 1.0 },
  mid: { font: 20, opacity: 0.8 },
  far: { font: 16, opacity: 0.6 },
};

// position birds on specific parts of tree to reduce some potential overlap
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

// randomly place a tree bird within the allowed bounds
function spawnTreeBird(bird, treeRect, layer, side) {
  // add bird to list of birds curr in scene
  sceneBirds.push(bird);

  const birdDiv = createBirdDiv(bird, layer.font, layer.opacity);

  requestAnimationFrame(() => {
    // get y within upper 60% of tree
    let y = treeRect.top + Math.random() * (treeRect.height * 0.6);
    // if y is within top 10% of screen, shift down a random amount so bird isn't cut off
    if (y < window.innerHeight * 0.1) {
      y = window.innerHeight * 0.1 + Math.random() * 40;
    }

    // get x based on side of tree
    let x;
    if (side === "left") {
      // if bird is on left side, offset it by the width of the bird
      x = treeRect.left - birdDiv.getBoundingClientRect().width;
    } else {
      x = treeRect.right;
    }

    birdDiv.style.left = `${x}px`;
    birdDiv.style.top = `${y}px`;

    fadeIn(birdDiv, layer.opacity);
  });
}

// need to make sure woodpeckers are on right side of a tree
function getBirdTreeSide(bird, defaultSide) {
  const woodpeckers = new Set(["downy_woodpecker", "red_bellied_woodpecker"]);
  return woodpeckers.has(bird.id) ? "right" : defaultSide;
}

// spawn one tree bird in each slot within the near layer
function spawnNearLayer(birdList) {
  if (!birdList.length) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document.getElementById("trees-near").getBoundingClientRect();
  const positions = [
    { side: "left", bird: birdList[0] },
    { side: "right", bird: birdList[1] },
  ];

  // spawn a tree bird for each side of the tree
  positions.forEach((entry) => {
    if (!entry.bird) return;

    spawnTreeBird(
      entry.bird,
      treeDiv,
      LAYERS.near,
      getBirdTreeSide(entry.bird, entry.side)
    );
  });
}

// spawn one tree bird in each slot within the mid layer
function spawnMidLayer(birdList) {
  if (!birdList.length) return;

  // spawn a tree bird for each side of the tree
  TREE_SLOTS.mid.forEach((slot, i) => {
    const bird = birdList[i];
    if (!bird) return; // return if no valid birds for layer

    // get tree div to use its bounding box width and height in spawnTreeBird
    const treeDiv = document.getElementById(slot.id).getBoundingClientRect();

    spawnTreeBird(bird, treeDiv, LAYERS.mid, getBirdTreeSide(bird, slot.side));
  });
}

// spawn one tree bird in each slot within the far layer
function spawnFarLayer(birdList) {
  if (!birdList.length) return;

  TREE_SLOTS.far.forEach((slot, i) => {
    const bird = birdList[i];
    if (!bird) return; // return if no valid birds for layer

    // get tree div to use its bounding box width and height in spawnTreeBird
    const treeDiv = document.getElementById(slot.id).getBoundingClientRect();

    spawnTreeBird(bird, treeDiv, LAYERS.far, getBirdTreeSide(bird, slot.side));
  });
}

/*
MODAL LOGIC
*/

let modalAudio = null;

document.getElementById("modal-sound-btn").addEventListener("click", () => {
  if (!modalAudio) return;
  if (!modalAudio) return;
  if (window.globalMuted) return;

  modalAudio.currentTime = 0;
  modalAudio.play().catch((err) => console.warn("Sound failed:", err));
});

// make all bird instances in scene clickable
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

// handle logic for showing bird modal
function openBirdModal(bird) {
  // pause the random ambient bird call logic
  isPaused = true;
  // stop any current ambient bird calls that might be playing
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }

  // add overlay over scene + disable buttons in scene
  const overlay = document.getElementById("bird-overlay");
  overlay.style.display = "block";
  document.getElementById("top-left").classList.add("ui-disabled");
  document.getElementById("bottom-right").classList.add("ui-disabled");

  // populate modal fields with bird info from json
  document.getElementById("modal-name").textContent = bird.name;
  document.getElementById("modal-science").textContent = bird.scientific_name;
  document.getElementById("modal-img").src = bird.img;
  document.getElementById("modal-seasonality").textContent = bird.seasonality;
  document.getElementById("modal-range").textContent = bird.us_range;
  document.getElementById("modal-description").textContent = bird.description;
  modalAudio = new Audio(bird.sound);
}

// handle logic for closing bird modal
function closeBirdModal() {
  // remove overlay and unpause scene
  document.getElementById("bird-overlay").style.display = "none";
  isPaused = false;
  document.getElementById("top-left").classList.remove("ui-disabled");
  document.getElementById("bottom-right").classList.remove("ui-disabled");

  // remove selected class from clicked bird
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
