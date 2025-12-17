import { timeIcons, weatherIcons, volumeIcons, pond, trees } from "./assets.js";

let userEntered = false;

let birds = []; // all fetched birds
let sceneBirds = []; // birds currently in scene
let currentCaller = null; // bird currently making a random call
let mode = "realtime"; // realtime, dawn, day, dusk, night

// handle ambient random bird sounds
let callTimerId = null; // id of next scheduled bird call
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

  // so birds can be clickable to pull up modal
  enableClicks();

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
      scheduleNextCall();
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

  // logic surrounding site info popup
  const infoButton = document.getElementById("about-button");
  const infoModal = document.getElementById("info-modal");
  infoButton.addEventListener("click", () => {
    infoButton.classList.toggle("active");
    infoModal.classList.toggle("hidden");
  });

  // logic surrounding dropdown allowing user to change the time of day mode
  const modeButton = document.getElementById("mode-button");
  const modeMenu = document.getElementById("mode-menu");
  modeButton.addEventListener("click", () => {
    modeButton.classList.toggle("active");
    modeMenu.classList.toggle("hidden");
  });

  modeMenu.querySelectorAll("div").forEach((item) => {
    item.addEventListener("click", () => {
      // update mode to reflect selected mode div
      mode = item.dataset.mode;

      // update main mode button to reflect the selected div
      modeButton.querySelector("p").textContent = item.textContent;

      modeMenu.classList.add("hidden");
      modeButton.classList.remove("active");

      // first stop old population loops
      stopPopulationLoops();
      // stop current call loop
      stopCallLoop();

      // update scene for new mode
      applyBackground();
      updateTime();
      spawnInitialBirdsForCurrentMode();
      if (userEntered && !window.globalMuted) {
        scheduleNextCall();
      }
      setTimeout(() => {
        startPopulationLoops();
      }, 10000);
    });
  });

  // logic surrounding bird name appearin gon hover
  const topRight = document.getElementById("top-right");
  const hoverName = document.getElementById("bird-text");

  document.addEventListener("mouseover", (e) => {
    const birdDiv = e.target.closest(".bird-instance");
    if (!birdDiv) return;

    const birdId = birdDiv.dataset.id;
    const bird = birds.find((b) => b.id === birdId);
    if (!bird) return;

    hoverName.textContent = bird.name;
    topRight.classList.remove("hidden");
  });

  document.addEventListener("mouseout", (e) => {
    const birdDiv = e.target.closest(".bird-instance");
    if (!birdDiv) return;

    topRight.classList.add("hidden");
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
      spawnInitialBirdsForCurrentMode(); // place birds in scene
      setTimeout(() => {
        startPopulationLoops();
      }, 10000);
    })
    .catch((err) => {
      console.error("Failed to load birds.json:", err);
    });
});

let resizeTimeout = null;

// need to reset scene whenever window is resized so birds are positioned correctly
window.addEventListener("resize", () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    resetSceneOnResize();
  }, 250);
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
  const html = document.documentElement;

  // remove current styling
  html.classList.remove("bg-dawn", "bg-day", "bg-dusk", "bg-night");

  // apply custom mode
  if (mode !== "realtime") {
    html.classList.add("bg-" + mode);
    return;
  }

  // apply real-time mode
  const realState = getDayState();
  html.classList.add(realState.className);
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
    ).textContent = `${state.label}, ${tempF}°F`;
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

// get max width between vw and 1300px
function getSceneWidth() {
  return Math.max(window.innerWidth, 1300);
}

function resetSceneOnResize() {
  // stop everything that depends on timing
  stopPopulationLoops();
  stopCallLoop();

  // stop any playing audio
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }

  currentCaller = null;

  // remove all birds from DOM
  document.querySelectorAll(".bird-instance").forEach((b) => b.remove());

  // reset scene state
  sceneBirds = [];
  sceneBirdsByLayer = {
    pond: [],
    ground: [],
    near: [],
    mid: [],
    far: [],
  };

  slotState = {
    nearLeft: null,
    nearRight: null,
    midTree1: null,
    midTree2: null,
    farTree1: null,
    farTree2: null,
    pondLeft: null,
    pondRight: null,
    ground: null,
  };

  // reapply background (viewport may have crossed a breakpoint)
  applyBackground();

  // rebuild scene
  spawnInitialBirdsForCurrentMode();

  // restart loops only if the user has entered
  if (userEntered && !window.globalMuted) {
    scheduleNextCall();
  }

  startPopulationLoops();
}

/*
AMBIENT BIRD CALL LOOP
*/

function pickRandomBirdCall() {
  if (!userEntered) return;
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

  console.log("calling:", randomBird.id);

  // if sound button is muted rn, skip sound creation, but keep random bird selection logic ongoing
  if (window.globalMuted) {
    scheduleNextCall();
    return;
  }

  // initialize htmlaudioelement object
  const audio = new Audio(randomBird.sound);
  ambientAudio = audio;
  audio.volume = window.globalMuted ? 0 : 0.5;

  audio.onloadedmetadata = () => {
    let repeats = 1;
    if (audio.duration < 3) {
      repeats = 3;
    } else if (audio.duration <= 9) {
      repeats = 2;
    } else {
      repeats = 1;
    }

    let playCount = 0;

    // function to play bird call one time
    const playOnce = () => {
      if (audio !== ambientAudio) return;

      audio.currentTime = 0;
      audio.play();

      // add calling class to new calling bird
      if (birdDiv) {
        birdDiv.classList.add("calling");
      }
    };

    audio.onended = () => {
      if (audio !== ambientAudio) return;

      playCount++; // increment play count after audio ends

      // remove calling class when not actively calling
      if (birdDiv) {
        birdDiv.classList.remove("calling");
      }

      // if more repeats remain, keep going
      if (playCount < repeats) {
        // wait 1 second, then replay
        setTimeout(playOnce, 1000);

        // finished all repeats
      } else {
        // clear ambientAudio for next bird
        if (ambientAudio === audio) {
          ambientAudio = null;
        }

        scheduleNextCall(); // continue ambient audio loop
      }
    };

    // call playOnce for the first time
    playOnce();
  };
}

// continue ambient audio loop by picking another random bird after 20 seconds
function scheduleNextCall() {
  if (callTimerId) clearTimeout(callTimerId);
  callTimerId = setTimeout(() => {
    callTimerId = null;
    pickRandomBirdCall();
  }, 20000);
}

// to call before switching modes
function stopCallLoop() {
  // cancel next scheduled call
  if (callTimerId) {
    clearTimeout(callTimerId);
    callTimerId = null;
  }

  // remove calling class from all bird instances
  document
    .querySelectorAll(".bird-instance.calling")
    .forEach((el) => el.classList.remove("calling"));

  // stop current audio
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }
}

/*
RANDOM BIRD SPAWNING LOGIC
*/

const LAYER_CAPACITY = {
  pond: 2,
  ground: 1,
  near: 2,
  mid: 2,
  far: 2,
};

let sceneBirdsByLayer = {
  pond: [],
  ground: [],
  near: [],
  mid: [],
  far: [],
};

let slotState = {
  nearLeft: null,
  nearRight: null,
  midTree1: null,
  midTree2: null,
  farTree1: null,
  farTree2: null,
  pondLeft: null,
  pondRight: null,
  ground: null,
};

// get birds allowed per layer
function birdsForLayer(birds, layer) {
  return birds.filter((b) => b.spawn?.includes(layer));
}

// place a random num of initial birds in scene for current time of day
function spawnInitialBirdsForCurrentMode() {
  // clear any previous bird instances + reset list of scenebirds + reset slos
  document.querySelectorAll(".bird-instance").forEach((b) => b.remove());
  sceneBirds = [];
  sceneBirdsByLayer = {
    pond: [],
    ground: [],
    near: [],
    mid: [],
    far: [],
  };
  slotState = {
    nearLeft: null,
    nearRight: null,
    midTree1: null,
    midTree2: null,
    farTree1: null,
    farTree2: null,
    pondLeft: null,
    pondRight: null,
    ground: null,
  };

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
  // spawn anywhere from 0 to 1 pond birds initially for left slot
  if (pondBirds[0] && Math.random() < 0.5) spawnPondLeft(pondBirds[0]);
  // spawn 1 right pond bid (not random so scene is less empty)
  if (pondBirds[1]) spawnPondRight(pondBirds[1]);

  // get allowed ground birds and randomize
  const groundBirds = birdsForLayer(eligible, "ground").sort(
    () => Math.random() - 0.5
  );
  // spawn 1 ground bird (not random so scene is less empty)
  if (groundBirds[0]) spawnGroundBird(groundBirds[0]);

  // get allowed near tree birds and randomize
  const nearBirds = birdsForLayer(eligible, "near").sort(
    () => Math.random() - 0.5
  );
  // spawn 1 left near bird (not random so scene is less empty)
  if (nearBirds[0]) spawnNearLeft(nearBirds[0]);
  // spawn betwen 0 and 1 birds on near layer for right slot
  if (nearBirds[1] && Math.random() < 0.5) spawnNearRight(nearBirds[1]);

  // get allowed mid tree birds and randomize
  const midBirds = birdsForLayer(eligible, "mid").sort(
    () => Math.random() - 0.5
  );

  // spawn 1 mid bird on tree 1 (not random so scene is less empty)
  if (midBirds[0]) spawnMidTree1(midBirds[0]);
  // spawn anywhere between 0 and 1 birds on mid layer for tree 2
  if (midBirds[1] && Math.random() < 0.5) spawnMidTree2(midBirds[1]);

  // get allowed far tree birds and randomize
  const farBirds = birdsForLayer(eligible, "far").sort(
    () => Math.random() - 0.5
  );
  // spawn anywhere between 0 and 1 birds on far layer for each tree
  if (farBirds[0] && Math.random() < 0.5) spawnFarTree1(farBirds[0]);
  if (farBirds[1] && Math.random() < 0.5) spawnFarTree2(farBirds[1]);
}

// based on layer and list of birds specified, randomly spawn one in an avail slot
function spawnSingleBirdInLayer(layer, birds) {
  // get a random bird that is eligible for curr layer
  const bird = birds[Math.floor(Math.random() * birds.length)];

  if (layer === "pond") {
    const slots = []; // empty list to store avail spawn functions

    // if avail, push pond left/right slot spawn functions
    if (!slotState.pondLeft) slots.push(spawnPondLeft);
    if (!slotState.pondRight) slots.push(spawnPondRight);

    // if there are available slots, randomly pick one and spawn a random bird there
    if (slots.length) {
      slots[Math.floor(Math.random() * slots.length)](bird);
    }
  } else if (layer === "ground") {
    if (!slotState.ground) spawnGroundBird(bird);
  } else if (layer === "near") {
    const slots = []; // empty list to store avail spawn functions

    // if avail, push near tree left/right slot spawn functions
    if (!slotState.nearLeft) slots.push(spawnNearLeft);
    if (!slotState.nearRight) slots.push(spawnNearRight);

    // if there are available slots, randomly pick one and spawn a random bird there
    if (slots.length) slots[Math.floor(Math.random() * slots.length)](bird);
  } else if (layer === "mid") {
    const slots = []; // empty list to store avail spawn functions

    // if avail, push near tree left/right slot spawn functions
    if (!slotState.midTree1) slots.push(spawnMidTree1);
    if (!slotState.midTree2) slots.push(spawnMidTree2);

    // if avail, push near tree left/right slot spawn functions
    if (slots.length) slots[Math.floor(Math.random() * slots.length)](bird);
  } else if (layer === "far") {
    const slots = []; // empty list to store avail spawn functions

    // if avail, push near tree left/right slot spawn functions
    if (!slotState.farTree1) slots.push(spawnFarTree1);
    if (!slotState.farTree2) slots.push(spawnFarTree2);

    // if avail, push near tree left/right slot spawn functions
    if (slots.length) slots[Math.floor(Math.random() * slots.length)](bird);
  }
}

// track timers for each layer to prevent duplicated intervals
const populationTimers = {
  pond: null,
  ground: null,
  near: null,
  mid: null,
  far: null,
};

function startLayerPopulationLoop(layer) {
  // check to prevent duplicate intervals
  if (populationTimers[layer]) return;

  const tick = () => {
    // get birds that match the current time of day
    const eligible = birds.filter((b) =>
      b.time_of_day.some(
        (t) => t.toLowerCase() === getCurrentMode().toLowerCase()
      )
    );

    // update layer population for each layer (either spawn, despawn, or do nothing)
    updateLayerPopulation(layer, birdsForLayer(eligible, layer));

    // schedule next tick at a random time b/w 30 and 60 seconds later
    populationTimers[layer] = setTimeout(tick, 30000 + Math.random() * 30000);
  };
  // add a delay to the first tick, so birds don't suddenly spawn/despawn when loop begins
  populationTimers[layer] = setTimeout(tick, 30000 + Math.random() * 30000);
}

// to start up population loops for each layer
function startPopulationLoops() {
  startLayerPopulationLoop("pond");
  startLayerPopulationLoop("ground");
  startLayerPopulationLoop("near");
  startLayerPopulationLoop("mid");
  startLayerPopulationLoop("far");
}

// stop all population loops, used when changing modes or pulling up modal
function stopPopulationLoops() {
  Object.keys(populationTimers).forEach((layer) => {
    if (populationTimers[layer]) {
      clearTimeout(populationTimers[layer]);
      populationTimers[layer] = null;
    }
  });
}

// set up div and styling for each bird
function createBirdDiv(bird, fontSize) {
  // make new bird-instance
  const div = document.createElement("div");
  div.classList.add("bird-instance");

  // add styling
  div.style.position = "absolute";
  div.style.whiteSpace = "pre";
  div.style.fontSize = `${fontSize}px`;
  div.style.zIndex = "50";
  div.style.opacity = 0;

  // ascii art
  div.textContent = bird.ascii;

  // store bird id for modal
  div.dataset.id = bird.id;

  document.getElementById("scene").appendChild(div);
  return div;
}

// add transition for when bird appears in scene
function fadeIn(div, opacity = 1) {
  div.style.transition = "none";
  div.style.opacity = 0;

  div.getBoundingClientRect();

  div.style.transition = "opacity 1s ease";
  div.style.opacity = `${opacity}`;
}

// handles logic for despawning a bird from the scene
function despawnBird(div) {
  // make sure transition is drawn
  div.getBoundingClientRect();
  div.style.transition = "opacity 0.8s ease";
  div.style.opacity = 0;

  // timeout to make sure transition happens
  setTimeout(() => {
    const id = div.dataset.id;
    const layer = div.dataset.layer;
    const slot = div.dataset.slot;

    console.log("despawned:", {
      bird: id,
      layer,
      slot,
    });

    // remove from scene lists
    sceneBirds = sceneBirds.filter((b) => b.id !== id);
    sceneBirdsByLayer[layer] = sceneBirdsByLayer[layer].filter(
      (b) => b.id !== id
    );

    // free slot in list tracking slots
    if (slot && slotState[slot]) {
      slotState[slot] = null;
      console.log("slot freed:", slot);
    }

    div.remove(); // remove bird div
  }, 800);
}

// function to randomly update the layer and list of birds specified
function updateLayerPopulation(layer, eligibleBirds) {
  const current = sceneBirdsByLayer[layer].length;
  const max = LAYER_CAPACITY[layer];

  // random choice: spawn, despawn, or do nothing
  const roll = Math.random();

  // spawn, if scene not full
  if (roll < 0.4 && current < max) {
    const available = eligibleBirds.filter(
      (b) => !sceneBirdsByLayer[layer].some((sb) => sb.id === b.id)
    );

    // if there is room, randomly spawn a bird
    if (available.length) {
      spawnSingleBirdInLayer(layer, available);
    }
  }

  // despawn, if scene not empty
  else if (roll > 0.8 && current > 0) {
    const divs = document.querySelectorAll(
      `.bird-instance[data-layer="${layer}"]`
    );
    // if there is are birds that can be removed, randomly pick one
    if (divs.length) {
      despawnBird(divs[Math.floor(Math.random() * divs.length)]);
    }
  }
}

/*
SPAWN GROUND BIRD
*/

const GROUND_LEFT = getSceneWidth() * 0.2 + 200;
const GROUND_RIGHT = getSceneWidth() * 0.2 + 640;

const GROUND_MIN_Y = window.innerHeight * 0.85; // top of bottom 20%
const GROUND_MAX_Y = window.innerHeight - 100;

// randomly place a ground bird in scene within allowed bounds
function spawnGroundBird(bird) {
  if (slotState.ground) return;

  // add bird to list of birds curr in scene + create div
  sceneBirds.push(bird);
  sceneBirdsByLayer.ground.push(bird);
  const birdDiv = createBirdDiv(bird, 24);
  // for easy despawning later
  birdDiv.dataset.layer = "ground";
  birdDiv.dataset.slot = "ground";

  console.log("spawned:", {
    bird: bird.id,
    layer: "ground",
    slot: "ground",
  });

  // random x within allowed bounds
  const x = GROUND_LEFT + Math.random() * (GROUND_RIGHT - GROUND_LEFT - 80);
  // random y within allowed bounds
  let y = GROUND_MIN_Y + Math.random() * (GROUND_MAX_Y - GROUND_MIN_Y);

  birdDiv.style.left = `${x}px`;
  birdDiv.style.top = `${y}px`;

  fadeIn(birdDiv, 1.0);

  slotState.ground = bird; // fill slot
}

/*
SPAWN POND BIRDS
*/

const POND_BOUNDS = {
  left: {
    xMin: getSceneWidth() * 0.2 + 30,
    xMax: getSceneWidth() * 0.2 + 230,
  },
  right: {
    xMin: getSceneWidth() * 0.2 + 270,
    xMax: getSceneWidth() * 0.2 + 480,
  },
  yMin: window.innerHeight - 320,
  yMax: window.innerHeight - 210,
};

// randomly place a pond bird in scene within allowed bounds
function spawnPondBird(bird, side, slot) {
  // add bird to list of birds curr in scene + create div
  sceneBirds.push(bird);
  sceneBirdsByLayer.pond.push(bird);
  const birdDiv = createBirdDiv(bird, 24);
  // for easy despawning later
  birdDiv.dataset.layer = "pond";
  birdDiv.dataset.slot = slot;

  console.log("spawned:", {
    bird: bird.id,
    layer: "pond",
    slot: slot,
  });

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

// randomly place a pond bird in the left side of pond
function spawnPondLeft(bird) {
  if (slotState.pondLeft) return;

  spawnPondBird(bird, "left", "pondLeft");
  slotState.pondLeft = bird; // fill slot
}
// randomly place a pond bird in the right side of pond
function spawnPondRight(bird) {
  if (slotState.pondRight) return;

  spawnPondBird(bird, "right", "pondRight");
  slotState.pondRight = bird; // fill slot
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

// randomly place a tree bird within the allowed bounds
function spawnTreeBird(bird, treeRect, layerName, slot, layerStyle, side) {
  // add bird to list of birds curr in scene
  sceneBirds.push(bird);
  sceneBirdsByLayer[layerName].push(bird);
  const birdDiv = createBirdDiv(bird, layerStyle.font);
  // for easy despawning later
  birdDiv.dataset.layer = layerName;
  birdDiv.dataset.slot = slot;

  console.log("spawned:", {
    bird: bird.id,
    layer: layerName,
    side: side,
    slot: slot,
  });

  requestAnimationFrame(() => {
    // get scene bounding box
    const sceneRect = document.getElementById("scene").getBoundingClientRect();
    // compute tree x and y relative to the scene
    const treeX = treeRect.left - sceneRect.left;
    const treeY = treeRect.top - sceneRect.top;

    // get y within upper 60% of tree
    let y = treeY + Math.random() * (treeRect.height * 0.6);
    // if y is within top 10% of screen, shift down a random amount so bird isn't cut off
    if (y < window.innerHeight * 0.1) {
      y = window.innerHeight * 0.1 + Math.random() * 40;
    }

    // get x based on side of tree
    let x;
    if (side === "left") {
      // if bird is on left side, offset it by the width of the bird
      x = treeX - birdDiv.getBoundingClientRect().width;
    } else {
      x = treeX + treeRect.width;
    }

    birdDiv.style.left = `${x}px`;
    birdDiv.style.top = `${y}px`;

    fadeIn(birdDiv, layerStyle.opacity);
  });
}

// need to make sure woodpeckers are on right side of a tree
function getBirdTreeSide(bird, defaultSide) {
  const woodpeckers = new Set(["downy_woodpecker", "red_bellied_woodpecker"]);
  return woodpeckers.has(bird.id) ? "right" : defaultSide;
}

// spawn one tree bird in left near tree slot
function spawnNearLeft(bird) {
  if (slotState.nearLeft) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document.getElementById("trees-near").getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "near",
    "nearLeft",
    LAYERS.near,
    getBirdTreeSide(bird, "left")
  );
  slotState.nearLeft = bird; // fill slot
}

function spawnNearRight(bird) {
  if (slotState.nearRight) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document.getElementById("trees-near").getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "near",
    "nearRight",
    LAYERS.near,
    getBirdTreeSide(bird, "right")
  );
  slotState.nearRight = bird; // fill slot
}

// spawn one tree bird in first mid tree
function spawnMidTree1(bird) {
  if (slotState.midTree1) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document
    .getElementById("trees-mid-1")
    .getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "mid",
    "midTree1",
    LAYERS.mid,
    getBirdTreeSide(bird, "right")
  );
  slotState.midTree1 = bird; // fill slot
}
// spawn one tree bird in second mid tree
function spawnMidTree2(bird) {
  if (slotState.midTree2) return;

  const treeDiv = document
    .getElementById("trees-mid-2")
    .getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "mid",
    "midTree2",
    LAYERS.mid,
    getBirdTreeSide(bird, "right")
  );
  slotState.midTree2 = bird; // fill slot
}

// spawn one tree bird in first far tree
function spawnFarTree1(bird) {
  if (slotState.farTree1) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document
    .getElementById("trees-far-1")
    .getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "far",
    "farTree1",
    LAYERS.far,
    getBirdTreeSide(bird, "left")
  );
  slotState.farTree1 = bird; // fill slot
}
// spawn one tree bird in second far tree
function spawnFarTree2(bird) {
  if (slotState.farTree2) return;

  // get tree div to use its bounding box width and height in spawnTreeBird
  const treeDiv = document
    .getElementById("trees-far-2")
    .getBoundingClientRect();

  spawnTreeBird(
    bird,
    treeDiv,
    "far",
    "farTree2",
    LAYERS.far,
    getBirdTreeSide(bird, "right")
  );
  slotState.farTree2 = bird;
}

/*
MODAL LOGIC
*/

let modalAudio = null;

document.getElementById("modal-sound-button").addEventListener("click", () => {
  if (!modalAudio) return;
  if (window.globalMuted) return;

  modalAudio.currentTime = 0;
  modalAudio.play().catch((err) => console.warn("Sound failed:", err));
});

// make all bird instances in scene clickable
function enableClicks() {
  document.addEventListener("click", (e) => {
    const birdDiv = e.target.closest(".bird-instance");
    if (!birdDiv) return;

    // highlight clicked bird
    birdDiv.classList.add("selected");

    const birdId = birdDiv.dataset.id;
    if (!birdId) return;

    // open modal
    openBirdModal(birdId);
  });
}

// handle logic for showing bird modal
function openBirdModal(birdId) {
  // pause the random ambient bird call logic
  stopCallLoop();
  stopPopulationLoops();
  // stop any current ambient bird calls that might be playing
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }

  // get bird object using passed in id
  const bird = birds.find((b) => b.id === birdId);
  if (!bird) return;

  // add overlay over scene + disable buttons in scene + close any popups
  const overlay = document.getElementById("bird-overlay");
  overlay.style.display = "block";
  document.getElementById("about-button").classList.add("ui-disabled");
  document.getElementById("bottom-right").classList.add("ui-disabled");
  document.getElementById("mode-button").classList.remove("active");
  document.getElementById("mode-menu").classList.add("hidden");
  document.getElementById("about-button").classList.remove("active");
  document.getElementById("info-modal").classList.add("hidden");

  // populate modal fields with bird info from json
  document.getElementById("modal-name").textContent = bird.name;
  document.getElementById("modal-science").textContent = bird.scientific_name;
  document.getElementById("modal-img").src = bird.img;
  document.getElementById("modal-img").alt = bird.name;
  document.getElementById("modal-seasonality").textContent = bird.seasonality;
  document.getElementById("modal-range").textContent = bird.us_range;
  document.getElementById("modal-description").textContent = bird.description;
  modalAudio = new Audio(bird.sound);
}

// handle logic for closing bird modal
function closeBirdModal() {
  // remove overlay and un-disable ui
  document.getElementById("bird-overlay").style.display = "none";
  document.getElementById("about-button").classList.remove("ui-disabled");
  document.getElementById("bottom-right").classList.remove("ui-disabled");

  // remove selected class from clicked bird
  document
    .querySelectorAll(".bird-instance.selected")
    .forEach((el) => el.classList.remove("selected"));

  // restart the call loop
  scheduleNextCall();
  startPopulationLoops();
}

// close button
document
  .getElementById("modal-close-button")
  .addEventListener("click", closeBirdModal);

// clicking outside closes modal
document.getElementById("bird-overlay").addEventListener("click", (e) => {
  if (e.target.id === "bird-overlay") {
    closeBirdModal();
  }
});
