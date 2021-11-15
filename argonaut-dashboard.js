// Argonaut - Dashboard portion
// by Jason Lee

function getInitialWindDirection() {
  let original = initialState.windSpeed ? initialState.windSpeed : new vec2.fromValues(0.0, 0.0);
  let length = vec2.length(original);
  let degrees = 0;
  if (length > EPSILON) {
    degrees = Math.atan2(original[1], original[0]) * 180 / Math.PI - 90;
    document.querySelector("#windDirectionValue").innerHTML = Math.round(degrees);
    document.querySelector("#windSpeedValue").innerHTML = Math.round(length);
    document.querySelector("#windDirection").value = Math.round(degrees);
    document.querySelector("#windSpeed").value = Math.round(length);
  } else {
    document.querySelector("#windDirectionValue").innerHTML = 0;
    document.querySelector("#windSpeedValue").innerHTML = 0;
    document.querySelector("#windDirection").value = 0;
    document.querySelector("#windSpeed").value = 0;
  }
}

getInitialWindDirection();

function setWindDirection() {
  let degrees = parseFloat(document.querySelector("#windDirection").value);

  document.querySelector("#windDirectionValue").innerHTML = Math.round(degrees);
}

function linkWindDirection() {
  let elem = document.querySelector("#windDirection");
  elem.oninput = setWindDirection;
}
linkWindDirection();

function setWindSpeed() {
  let speed = parseFloat(document.querySelector("#windSpeed").value);

  document.querySelector("#windSpeedValue").innerHTML = Math.round(speed);
}

function linkWindSpeed() {
  let elem = document.querySelector("#windSpeed");
  elem.oninput = setWindSpeed;
}
linkWindSpeed();

function confirmSettings() {
  let degrees = parseFloat(document.querySelector("#windDirection").value) + 90;
  if (degrees > 180) degrees -= 360;
  let speed = document.querySelector("#windSpeed").value;
  let windSpeedX = speed * Math.cos(degrees * Math.PI / 180);
  let windSpeedY = speed * Math.sin(degrees * Math.PI / 180);

  // console.log(degrees, windSpeedX, windSpeedY);

  document.querySelector("#c").dispatchEvent(
    new CustomEvent('confirmSettings', {
      detail: { windSpeedX: windSpeedX, windSpeedY: windSpeedY }, bubbles: true
    }));
}

function linkConfirmSettingsButton() {
  document.querySelector("#confirmSettings").onclick = confirmSettings;
}

linkConfirmSettingsButton();
