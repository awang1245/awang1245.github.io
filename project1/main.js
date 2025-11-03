// cluster properties
const num_clusters = 6;
const min_leaves = 10;
const radius = 100;
const padding = 100; // how far from cell border leaves can spawn
const tea_types = ["green", "white", "yellow", "oolong", "black", "pu'er"];

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

/**
 * set up where clusters are located on screen
 * placing them within a grid of 6 cells to prevent cluster overlap
 */
function initClusters() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // choose grid layout based on aspect ratio
  let cols, rows;
  // for wider screens, desktop especially
  if (vw >= vh) {
    cols = 3;
    rows = 2;
    // for narrower screens, tablet and mobile especially
  } else {
    cols = 2;
    rows = 3;
  }

  // get dims for each cell in curr grid
  const cellWidth = vw / cols;
  const cellHeight = vh / rows;

  centers = []; // reset global centers variable

  let i = 0; // tracks which cluster we are on
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (i >= num_clusters) break;

      // get allowed x,y range within current cell
      const xMin = c * cellWidth + padding;
      const xMax = (c + 1) * cellWidth - padding;
      const yMin = r * cellHeight + padding;
      const yMax = (r + 1) * cellHeight - padding;

      // pick a random x,y within allowable range for center
      centers.push({
        x: getRandomInt(xMin, xMax),
        y: getRandomInt(yMin, yMax),
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
  const xPos = x + dx - element.offsetWidth / 2;
  const yPos = y + dy - element.offsetHeight / 2;

  // update CSS with calculated x,y position and random rotation
  element.style.setProperty("--x-position", `${xPos}px`);
  element.style.setProperty("--y-position", `${yPos}px`);
  element.style.setProperty("--rotation", `${getRandomInt(-180, 180)}deg`);
  // set z-index so clusters will sit on different layers, with a little variation within each cluster
  element.style.zIndex = i + getRandomInt(0, 2);

  // set data-* attribute to the cluster’s tea type
  element.dataset.type = type[i];
}

// apply random placement to all images
const imgs = document.querySelectorAll("img");

// on first page load
window.addEventListener("load", () => {
  // initialize clusters
  initClusters();
  // take each leaf img and randomly place it into a cluster
  imgs.forEach((img) => randomOrder(img));
});

window.addEventListener("resize", () => {
  // reinitialize clusters
  initClusters();

  counts = Array(num_clusters).fill(0); // reset leaf counts
  imgs.forEach((img) => randomOrder(img));
});
