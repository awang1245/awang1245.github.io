const button = document.getElementById("toggle-button");
const lampGlow = document.getElementById("lamp-glow");
const lampShade = document.getElementById("lamp-shade");
const lampNeck = document.getElementById("lamp-neck");
const lampBase = document.getElementById("lamp-base");
const body = document.body;

let isLight = true;

setColor();

button.addEventListener("click", () => {
  isLight = !isLight;
  const next = body.classList.contains("theme-on") ? "off" : "on";
  setColor();
});

function setColor() {
  if (isLight) {
    // color
    body.classList.add("body-light");
    body.classList.remove("body-dark");
    button.textContent = "Lights Off";

    // lamp
    lampGlow.style.visibility = "hidden";
    lampShade.classList.add("lamp-shade-light");
    lampShade.classList.remove("lamp-shade-dark");
    lampNeck.classList.add("lamp-neck-light");
    lampNeck.classList.remove("lamp-neck-dark");
    lampBase.classList.add("lamp-base-light");
    lampBase.classList.remove("lamp-base-dark");
  } else {
    // color
    body.classList.add("body-dark");
    body.classList.remove("body-light");
    button.textContent = "Lights On";

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
