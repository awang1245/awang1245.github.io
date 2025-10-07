// ui
const body = document.body;
const nav = document.querySelector("nav");
const astigButton = document.getElementById("astig-button");
const toggleButton = document.getElementById("toggle-button");
const navButton = document.getElementById("nav-button");

// lamp
const lampGlow = document.getElementById("lamp-glow");
const lampShade = document.getElementById("lamp-shade");
const lampNeck = document.getElementById("lamp-neck");
const lampBase = document.getElementById("lamp-base");

let isLight = true;
let isAstig = false;

setColor();

toggleButton.addEventListener("click", () => {
  isLight = !isLight;
  if (isLight) {
    isAstig = false;
    astigButton.textContent = "Astigmatism On";
  }
  setColor();
});

astigButton.addEventListener("click", () => {
  isAstig = !isAstig;
  setAstig();
});

function setAstig() {
  if (!isLight) {
    if (isAstig) {
      lampGlow.classList.add("lamp-glow-astig");
      lampGlow.classList.remove("lamp-glow");
      astigButton.textContent = "Astigmatism Off";
    } else {
      lampGlow.classList.remove("lamp-glow-astig");
      lampGlow.classList.add("lamp-glow");
      astigButton.textContent = "Astigmatism On";
    }
  }
}

function setColor() {
  if (isLight) {
    // ui
    body.classList.add("body-light");
    body.classList.remove("body-dark");
    navButton.classList.add("nav-button-light");
    navButton.classList.remove("nav-button-dark");
    nav.classList.add("nav-light");
    nav.classList.remove("nav-dark");

    // button
    astigButton.style.visibility = "hidden";
    toggleButton.classList.add("toggle-button-light");
    toggleButton.classList.remove("toggle-button-dark");
    toggleButton.textContent = "Lights Off";

    // lamp
    lampGlow.style.visibility = "hidden";
    lampShade.classList.add("lamp-shade-light");
    lampShade.classList.remove("lamp-shade-dark");
    lampNeck.classList.add("lamp-neck-light");
    lampNeck.classList.remove("lamp-neck-dark");
    lampBase.classList.add("lamp-base-light");
    lampBase.classList.remove("lamp-base-dark");
  } else {
    // ui
    body.classList.add("body-dark");
    body.classList.remove("body-light");
    navButton.classList.add("nav-button-dark");
    navButton.classList.remove("nav-button-light");
    nav.classList.add("nav-dark");
    nav.classList.remove("nav-light");

    // buttons
    astigButton.style.visibility = "visible";
    astigButton.classList.add("toggle-button-dark");
    astigButton.classList.remove("toggle-button-light");
    toggleButton.classList.add("toggle-button-dark");
    toggleButton.classList.remove("toggle-button-light");
    toggleButton.textContent = "Lights On";

    //lamp
    lampGlow.style.visibility = "visible";
    lampShade.classList.add("lamp-shade-dark");
    lampShade.classList.remove("lamp-shade-light");
    lampNeck.classList.add("lamp-neck-dark");
    lampNeck.classList.remove("lamp-neck-light");
    lampBase.classList.add("lamp-base-dark");
    lampBase.classList.remove("lamp-base-light");
  }
}
