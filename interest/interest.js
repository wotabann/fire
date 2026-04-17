initialize();


function initialize() {
  initializeConfiguration();

  const c = loadConfiguration();
  setUserConfiguration(c);
  refreshSimulationTable(c);

  $("#simulation-button").on("click", function () {
    const c = getUserConfiguration();
    const m = validateConfiguretion(c);
    if (m != "") {
      alert(m);
      return;
    }
    refreshSimulationTable(c);
    showSimulationTable();
    saveConfiguration(c);
  });

  $("#configuration-type").on("change", function () {
    if ($(this).val() == 2) {
      $("#configuration-form-principal").prop("disabled", false);
    }
    else {
      $("#configuration-form-principal").prop("disabled", true);
    }
  });
}



//------------------------------------------------------------------------------
// Configuration Registries
//------------------------------------------------------------------------------
function initializeConfiguration() {
  let c = localStorage.getItem("fire-sim-config");
  if (c === null) {
    c = makeInitialConfiguration();
    saveConfiguration(c);
  }
}
function makeInitialConfiguration() {
  return {
    type: 0,
    rate_min: 2.0,
    rate_max: 5.0,
    rate_step: 0.5,
    years: 10,
    principal: 100
  };
}
function saveConfiguration(c) {
  localStorage.setItem("fire-sim-config", JSON.stringify(c));
}
function loadConfiguration() {
  if (!window.makeInitialConfiguration) {
    return makeInitialPlans();
  }
  json = localStorage.getItem("fire-sim-config");
  if (json === null) {
    return makeInitialConfiguration();
  }
  c = JSON.parse(json);
  c.type = parseInt(c.type);
  c.rate_min = parseFloat(c.rate_min);
  c.rate_max = parseFloat(c.rate_max);
  c.rate_step = parseFloat(c.rate_step);
  c.years = parseInt(c.years);
  c.principal = parseInt(c.principal);
  return c;
}




//------------------------------------------------------------------------------
// User Configuration
//------------------------------------------------------------------------------
function getUserConfiguration() {
  let type = parseInt($("#configuration-type").val());
  let rate_min = parseFloat($("#configuration-form-rate-min").val());
  let rate_max = parseFloat($("#configuration-form-rate-max").val());
  let rate_step = parseFloat($("#configuration-form-rate-step").val());
  let years = parseInt($("#configuration-form-years").val());
  let principal = parseInt($("#configuration-form-principal").val());
  return {
    type: type,
    rate_min: rate_min,
    rate_max: rate_max,
    rate_step: rate_step,
    years: years,
    principal: principal
  };
}
function setUserConfiguration(c) {
  $("#configuration-type").val(c.type);
  $("#configuration-form-rate-min").val(c.rate_min);
  $("#configuration-form-rate-max").val(c.rate_max);
  $("#configuration-form-rate-step").val(c.rate_step);
  $("#configuration-form-years").val(c.years);
  $("#configuration-form-principal").val(c.principal);
  if (c.type == 2) {
    $("#configuration-form-principal").prop("disabled", false);
  }
  else {
    $("#configuration-form-principal").prop("disabled", true);
  }
}
function validateConfiguretion(c) {
  if (isOutOfRange(c.type, 0, 2)) {
    return "早見表の種別が不正です。";
  }
  if (isOutOfRange(c.rate_min, 0, 100)) {
    return "最小利率が不正です。";
  }
  if (!Number.isInteger(c.rate_min * 100)) {
    return "最小利率の最小単位は0.01にしてください。";
  }
  if (isOutOfRange(c.rate_max, c.rate_min, 200)) {
    return "最大利率が不正です。";
  }
  if (!Number.isInteger(c.rate_max * 100)) {
    return "最大利率の最小単位は0.01にしてください。";
  }
  if (isOutOfRange(c.rate_step, 0, 100)) {
    return "利率の刻み幅が不正です。";
  }
  if (!Number.isInteger(c.rate_step * 100)) {
    return "利率の刻み幅の最小単位は0.01にしてください。";
  }
  if (isOutOfRange(c.years, 0, 99)) {
    return "年数が不正です。";
  }
  if (isOutOfRange(c.principal, 0, 1000000)) {
    return "元金が不正です。";
  }
  return "";
}




//------------------------------------------------------------------------------
// Simulation
//------------------------------------------------------------------------------
function showSimulationTable() {
  $("#simulation").show();
}
function hideSimulationTable() {
  $("#simulation").hide();
}
function refreshSimulationTable(c) {
  $("#simulation-thead").html("");
  $("<tr></tr>").appendTo($("#simulation-thead"));
  $("<th></th>").appendTo($("#simulation-thead tr")).text("経過年数");
  for (r = c.rate_min; r <= c.rate_max; r += c.rate_step) {
    $("<th></th>").appendTo($("#simulation-thead tr")).text(r.toFixed(2) + "%");
  }

  $("#simulation-tbody").html("");
  for (m = 1; m <= (c.years * 12); m++) {
    let tr = $("<tr></tr>").appendTo($("#simulation-tbody"));
    $("<td></td>").appendTo(tr).text(monthsToString(m));
    for (r = c.rate_min; r <= c.rate_max; r += c.rate_step) {
      let ci = calculateCompoundInterest(r / 100, m);
      let val = ((ci-1)*100).toFixed(2) + "%";
      if (c.type == 1) {
        val = (ci*100).toFixed(0) + "%";
      }
      if (c.type == 2) {
        val = assetsToString(c.principal * ci);
      }
      $("<td></td>").appendTo(tr).text(val);
    }
  }
}



//------------------------------------------------------------------------------
// Utilities
//------------------------------------------------------------------------------
function calculateCompoundInterest(step, count) {
  let v = 1.0;
  for (i = 0; i < count; i++) {
    v = v * (1.0 + step);
  }
  return v;
}
function isOutOfRange(v, min, max) {
  if (v === null) {
    return true;
  }
  if (v === "") {
    return true;
  }
  if (isNaN(v)) {
    return true;
  }
  v = Number(v);
  if (v < min) {
    return true;
  }
  if (v > max) {
    return true;
  }
  return false;
}

function monthsToString(m) {
  const years = (Math.floor(m / 12)).toString() + "年";
  const months = (m % 12).toString() + "ヶ月";
  return (years + " " + months);
}

function assetsToString(assets) {
  if (assets >= (10000 * 10000)) {
    return (assets / (10000 * 10000)).toFixed(2) + "兆";
  }
  if (assets >= (10000)) {
    return (assets / 10000).toFixed(2) + "億";
  }
  return Math.round(assets).toString() + "万";
}
