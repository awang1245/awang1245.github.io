// cluster properties
const num_clusters = 6;
const min_leaves = 10;
let radius = 80;
const padding = 100; // how far from cell border leaves can spawn
const tea_types = ["green", "white", "yellow", "oolong", "black", "puer"];

// each array has 6 slots for each cluster
let centers = []; // centers[i] = {x, y}
let counts = Array(num_clusters).fill(0); // counts[i] = num leaves
let type = []; // type[i] = tea type

/**
 * helper to get an integer between min and max inclusive
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sm = window.matchMedia("(max-width: 767px)");
const md = window.matchMedia("(min-width: 768px) and (max-width: 1087px)");
const lg = window.matchMedia("(min-width: 1088px)");

let numRows, numCols;

/**
 * set up where clusters are located on screen
 * placing them within a grid of 6 cells to prevent cluster overlap
 */
function initClusters() {
  let vw = window.innerWidth;
  let vh = window.innerHeight;

  if (md.matches) {
    vh = Math.max(vh, 1000);
  } else if (sm.matches) {
    vh = Math.max(vh, 1100);
  }

  // choose grid layout based on aspect ratio
  let cols, rows, radius;
  // for wider screens, desktop especially
  if (lg.matches) {
    cols = 3;
    rows = 2;
    radius = 80;
    // for narrower screens, tablet and mobile especially
  } else if (md.matches) {
    cols = 2;
    rows = 3;
    radius = 60;
  } else {
    cols = 1;
    rows = 6;
    radius = 40;
  }

  // store in global vars for later use
  numRows = rows;
  numCols = cols;

  // get dims for each cell in curr grid
  const cellWidth = vw / cols;
  const cellHeight = vh / rows;

  centers = []; // reset global centers variable

  let i = 0; // tracks which cluster we are on
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (i >= num_clusters) break;

      // get allowed x,y range within current cell
      let xMin = c * cellWidth;
      let xMax = (c + 1) * cellWidth - 2 * padding;
      let yMin = r * cellHeight;
      let yMax = (r + 1) * cellHeight - 2 * padding;

      // to allow extra vertical gapping between clusters for medium screens
      if (md.matches) {
        yMin = r * (cellHeight + 50);
        yMax = yMin + cellHeight - 2 * padding;
      }

      // if bottom row
      if (r === rows - 1) {
        yMin += 100;
        yMax = Math.min(yMax, vh - 2 * padding);
      }
      // if rightmost col
      if (c === cols - 1) {
        xMax = Math.min(xMax, vw - 2 * padding);
      }

      // to allow even more vertical gapping for small screens
      if (sm.matches) {
        xMax = vw - 2 * padding;
        yMin = r * (cellHeight + 200);
        yMax = yMin + cellHeight - padding;
      }

      // if leftmost col
      if (c === 0) {
        xMin = 0;
      }
      // if top row
      if (r === 0) {
        yMin = 0;
      }

      // pick a random x,y within allowable range for center
      centers.push({
        x: getRandomInt(xMin, xMax),
        y: getRandomInt(yMin, yMax),
        row: r,
        col: c,
      });

      i++;
    }
  }

  // randomize tea assignment 1:1
  type = [...tea_types].sort(() => Math.random() - 0.5);
}

/**
 * helper that picks the cluster with the least number of leaves
 * used to try and keep num of leaves in all clusters balanced
 */
function pickClusterIdx() {
  // get smallest num of leaves among clusters
  const minCount = Math.min(...counts);

  // get all clusters with that min count currently
  const candidates = [];
  for (let i = 0; i < num_clusters; i++)
    if (counts[i] === minCount) candidates.push(i);

  // randomly pick one of those clusters
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * takes in a leaf, selects a cluster and positions it randomly within it
 */
function randomOrder(element) {
  // get cluster the leaf will be placed into
  const i = pickClusterIdx();
  counts[i]++; // update leaf count for that cluster

  // get cluster center x,y
  const { x, y } = centers[i];
  // get random x and y offset from cluster center within radius
  const dx = getRandomInt(-radius, radius);
  const dy = getRandomInt(-radius, radius);
  // calc final x,y for leaf
  const xPos = x + dx + element.offsetHeight / 2;
  const yPos = y + dy + element.offsetHeight / 2;

  // update CSS with calculated x,y position and random rotation
  element.style.setProperty("--x-position", `${xPos}px`);
  element.style.setProperty("--y-position", `${yPos}px`);
  element.style.setProperty("--rotation", `${getRandomInt(-180, 180)}deg`);
  // set z-index so clusters will sit on different layers, with a little variation within each cluster
  element.style.zIndex = i + getRandomInt(0, 2);

  // set data-* attribute to the cluster’s tea type
  element.dataset.type = type[i];
}

// set up layer to contain all of the cluster hitboxes
const hitboxes = document.createElement("div");
hitboxes.className = "hitbox-layer";
document.querySelector(".grid-container").appendChild(hitboxes);

/**
 * set up hit boxes around each cluster for "tea leaf reading"
 */
function renderHitboxes() {
  hitboxes.innerHTML = ""; // clear any old hitboxes

  // create a hitbox div around each cluster center
  centers.forEach((center, i) => {
    // set up hitbox properties
    const box = document.createElement("a");
    box.className = "hitbox";
    box.href = `./tea/${type[i]}-tea.html`;
    box.style.width = `${radius * 2.5}px`;
    box.style.height = `${radius * 2.5}px`;
    // center hitbox around cluster center
    box.style.left = `${center.x}px`;
    box.style.top = `${center.y}px`;
    // box.style.backgroundColor = "red";

    box.dataset.type = type[i];
    // save left and top positioning
    box.dataset.left = String(center.x);
    box.dataset.top = String(center.y);
    box.dataset.row = center.row;
    box.dataset.col = center.col;

    hitboxes.appendChild(box);
  });
}

hitboxes.addEventListener(
  "mouseenter",
  (e) => {
    const box = e.target.closest(".hitbox");

    if (!box) return;

    // first make sure all other tea cards are hidden
    document
      .querySelectorAll(".tea-card")
      .forEach((c) => c.classList.remove("show"));

    // get tea type and row, col for current hitbox
    const tea = box.dataset.type;
    const row = parseInt(box.dataset.row);
    const col = parseInt(box.dataset.col);

    // display the corresponding tea card for current cluster
    const card = document.querySelector(`.tea-card[data-type="${tea}"]`);

    // if bottom row
    if (row == numRows - 1) {
      card.style.top = `${
        Number(box.dataset.top) + (radius * 2.5) / 2 - 240
      }px`;
    } else {
      card.style.top = `${Number(box.dataset.top) + (radius * 2.5) / 2}px`;
    }

    if (sm.matches) {
      // only one col so keep it centered for mobile
      card.style.left = `calc(50% - 195px)`;
    } else {
      // if last col
      if (col == numCols - 1) {
        card.style.left = `${
          Number(box.dataset.left) + (radius * 2.5) / 2 - 390
        }px`;
      } else {
        card.style.left = `${Number(box.dataset.left) + (radius * 2.5) / 2}px`;
      }
    }

    card.classList.add("show");
  },
  true
);

hitboxes.addEventListener(
  "mouseleave",
  (e) => {
    const box = e.target.closest(".hitbox");

    if (!box) return;

    // get tea type for current hitbox
    const tea = box.dataset.type;
    // hide all tea cards
    document
      .querySelector(`.tea-card[data-type="${tea}"]`)
      ?.classList.remove("show");
  },
  true
);

// apply random placement to all images
const imgs = document.querySelectorAll("img");

// on first page load
window.addEventListener("load", () => {
  // initialize clusters and hitboxes
  initClusters();
  renderHitboxes();

  // take each leaf img and randomly place it into a cluster
  imgs.forEach((img) => randomOrder(img));
});

window.addEventListener("resize", () => {
  // reinitialize clusters and hitboxes
  initClusters();
  renderHitboxes();

  counts = Array(num_clusters).fill(0); // reset leaf counts
  imgs.forEach((img) => randomOrder(img));
});

lg.addEventListener("change", initClusters);
md.addEventListener("change", initClusters);

document.getElementById("reshuffle").addEventListener("click", () => {
  location.reload();
});
