initialize();


function initialize() {
  initializePlans();

  $("#edit-plan-request-button").on("click", () => { registerPlan(); });
  $("#edit-select-button").on("click", () => { selectEditPlan(); });
  $("#progress-button").on("click", () => { progress(); });
  $("#simulate-button").on("click", () => { simulate(); });
  $("#edit-plan-details").find(".edit-plan-form-insert").on("click", function(){insertEditDetail($(this))});
  $("#edit-plan-details").find(".edit-plan-form-remove").on("click", function(){removeEditDetail($(this))});
  $("#dialog-close-button").on("click", () => { $("#dialog").hide() });

  let plans = getRegisteredPlans();
  refreshEditSelectSection(plans);
}


//---------------------------------------------------
// Plan registries
//---------------------------------------------------
function initializePlans() {
  let plans = localStorage.getItem("fire-plans");
  if (plans === null) {
    plans = makeInitialPlans();
    localStorage.setItem("fire-plans", JSON.stringify(plans));
  }
}
function makeInitialPlans() {
  const details0 = [{term: 120, rate: "3.0", amount: 5}];
  const details1 = [{term: 120, rate: "4.0", amount: 5}];
  const details2 = [{term: 120, rate: "5.0", amount: 5}];
  const plans = [
    { id: 0, name: "planA", description: "初期100万 / 月利3% / 積立5万", value: 100,  year: 2026, month: 4, details: details0},
    { id: 1, name: "planB", description: "初期100万 / 月利4% / 積立5万", value: 100,  year: 2026, month: 4, details: details1},
    { id: 2, name: "planC", description: "初期100万 / 月利5% / 積立5万", value: 100,  year: 2026, month: 4, details: details2},
  ];
  return plans;
}
function getRegisteredPlans() {
  if (!window.localStorage) {
    return makeInitialPlans();
  }
  json = localStorage.getItem("fire-plans");
  if (json === null) {
    return makeInitialPlans();
  }
  plans = JSON.parse(json);
  for (let p = 0; p < plans.length; p++) {
    plans[p].value = parseFloat(plans[p].value);
    plans[p].year  = parseInt(plans[p].year);
    plans[p].month = parseInt(plans[p].month);
    for (let d = 0; d < plans[p].details.length; d++) {
      plans[p].details[d].term  = parseInt(plans[p].details[d].term);
      plans[p].details[d].rate  = parseFloat(plans[p].details[d].rate);
      plans[p].details[d].amount = parseFloat(plans[p].details[d].amount);
    }
  }
  return plans;
}




//---------------------------------------------------
// Select Edit Plan
//---------------------------------------------------
function selectEditPlan() {
  let id = parseInt($("#edit-select").val());
  let plans = getRegisteredPlans();
  refreshEditPlanDialog(plans[id]);
  showEditPlanDialog();
}
function refreshEditSelectSection(plans) {
  let html = "";
  for (let i = 0; i < plans.length; i++) {
    html += "<option value=" + i + ">" + plans[i].name + ": " + plans[i].description + "</option>";
  }
  $("#edit-select").html(html);
}



//---------------------------------------------------
// Edit Plan
//---------------------------------------------------
function showEditPlanDialog() {
  $("#dialog").show();
}
function hideEditPlanDialog() {
  $("#dialog").hide();
}
function refreshEditPlanDialog(plan) {
  $("#edit-plan-id").val(plan.id);
  $("#edit-plan-name").val(plan.name);
  $("#edit-plan-description").val(plan.description);
  $("#edit-plan-start-value").val(plan.value);
  $("#edit-plan-start-year").val(plan.year);
  $("#edit-plan-start-month").val(plan.month);

  let html_trs = $("#edit-plan-details").children("tr");
  for (let i = 1; i < html_trs.length; i++) {
    $(html_trs[i]).remove();
  }
  let html_tr_head = $(html_trs[0]);

  for (let i = 0; i < plan.details.length; i++) {
    let term = plan.details[i].term;
    let rate = plan.details[i].rate;
    let amount = plan.details[i].amount;
    let html_tr = $(html_tr_head).clone(true);
    $(html_tr).find(".edit-plan-form-term").val(term);
    $(html_tr).find(".edit-plan-form-rate").val(rate);
    $(html_tr).find(".edit-plan-form-amount").val(amount);
    $(html_tr_head).before($(html_tr));
  }
  $(html_tr_head).remove();
}
function insertEditDetail(button) {
  let html_tr_base = $(button).closest("tr");
  let html_tr_clone = $(html_tr_base).clone(true);
  $(html_tr_base).after($(html_tr_clone));
}
function removeEditDetail(button) {
  let html_tr_base = $(button).closest("tr");
  let trCount = $(html_tr_base).closest("tbody").find("tr").length;
  if (trCount > 1) {
    $(html_tr_base).remove();
  }
}
function registerPlan() {
  let id    = $("#edit-plan-id").val();
  let plans = getRegisteredPlans();
  plans[id].name  = $("#edit-plan-name").val();
  plans[id].description  = $("#edit-plan-description").val();
  plans[id].value = $("#edit-plan-start-value").val();
  plans[id].year  = $("#edit-plan-start-year").val();
  plans[id].month  = $("#edit-plan-start-month").val();
  let html_trs = $("#edit-plan-details").children("tr");

  plans[id].details = [];
  for (let i = 0; i < $(html_trs).length; i++) {
    let term = $(html_trs[i]).find(".edit-plan-form-term").val();
    let rate = $(html_trs[i]).find(".edit-plan-form-rate").val();
    let amount = $(html_trs[i]).find(".edit-plan-form-amount").val();
    let detail = {"term": term, "rate": rate, "amount": amount};
    plans[id].details[i] = detail;
  }
  localStorage.setItem("fire-plans", JSON.stringify(plans));
  alert("登録しました。");
  hideEditPlanDialog();
  plans = getRegisteredPlans();
  refreshEditSelectSection(plans);
  refreshProgressTable(plans);
  refreshSimulateTable(plans);
}

//---------------------------------------------------
// Progress
//---------------------------------------------------
function progress() {
  refreshProgressTable(getRegisteredPlans());
  showProgressTable();
}
function showProgressTable() {
  $("#progress-table").show();
}
function refreshProgressTable(plans) {
  const assets = $("#progress-form-assets").val();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let html_tbody_tr = "";
  for (let p = 0; p < plans.length; p++) {
    const plannedAssets = calculateProgress(year, month, plans[p]);
    let valueDiff = (assets - plannedAssets);
    let rateDiff  = ((assets - plannedAssets) / plannedAssets);
    valueDiff = ((valueDiff > 0) ? "+" : "") + assetsToString(valueDiff);
    rateDiff *= 100;
    rateDiff = (Math.round(rateDiff * 100) / 100);
    rateDiff = ((rateDiff > 0) ? "+" : "") + rateDiff.toString() + "%";
    html_tbody_tr += "<tr>";
    html_tbody_tr += "<td>" + plans[p].name + "</td>";
    html_tbody_tr += "<td>" + assetsToString(plannedAssets) + "</td>";
    html_tbody_tr += "<td>" + valueDiff + "</td>";
    html_tbody_tr += "<td>" + rateDiff + "</td>";
    html_tbody_tr += "<td>" + plans[p].description + "</td>";
    html_tbody_tr += "</tr>";
  }
  $("#progress-tbody").html(html_tbody_tr);
}
function calculateProgress(year, month, plan) {
  let elapsedYear  = year - plan.year;
  let elapsedMonth = (month - plan.month + 1) + ((month < plan.month) ? 12 : 0);
  let elapcedCount = (elapsedYear * 12) + elapsedMonth;
  let cnt = 0;
  let assets = plan.value;
  for (let d = 0; d < plan.details.length; d++) {
    let rate   = plan.details[d].rate;
    let amount = plan.details[d].amount;
    for (let t = 0; t < plan.details[d].term; t++) {
      cnt++;
      assets *= ((1 + rate / 100));
      if (cnt >= elapcedCount) {
        return Math.round(assets);
      }
      assets += amount;
    }
  }
}


//---------------------------------------------------
// Simulate
//---------------------------------------------------
function simulate() {
  refreshSimulateTable(getRegisteredPlans());
  showSimulateTable();
}
function showSimulateTable() {
  $("#simulate-table").show();
}
function refreshSimulateTable(plans) {
  // 開始～終了の最大期間を計算
  let v1 = 210001;
  let v2 = 200001;
  for (let p = 0; p < plans.length; p++) {
    let y1 = plans[p].year;
    let m1 = plans[p].month;
    let y2 = y1;
    let m2 = m1;
    for (let d = 0; d < plans[p].details.length; d++) {
      y2 += Math.round(plans[p].details[d].term / 12);
      y2 += ((plans[p].details[d].term % 12) > 0) ? 1 : 0;
    }
    v1 = Math.min(v1, parseInt(y1.toString() + m1.toString().padStart(2, "0")));
    v2 = Math.max(v2, parseInt(y2.toString() + m2.toString().padStart(2, "0")));
  }
  let minYear  = parseInt(v1.toString().substring(0, 4));
  let maxYear  = parseInt(v2.toString().substring(0, 4));
  let minMonth = parseInt(v1.toString().substring(4, 6));
  let maxMonth = parseInt(v2.toString().substring(4, 6));

  // ヘッダ行を作成
  {
    let html_thead_tr = "";
    html_thead_tr += "<tr>";
    html_thead_tr += "<th>年目</th>";
    html_thead_tr += "<th>年/月</th>";
    for (let p = 0; p < plans.length; p++) {
      html_thead_tr += "<th>" + plans[p].name + "</th>";
    }
    html_thead_tr += "</tr>";
    $("#simulate-thead").html(html_thead_tr);
  }

  // 先に空行を作成
  {
    let maxRow = (maxYear - minYear) * 12;
    let year = minYear;
    let month = minMonth;
    $("#simulate-tbody").html("");
    for (let row = 0; row < maxRow; row++) {
      month = ((minMonth - 1 + row) % 12) + 1;
      year += ((row > 0) && (month == 1)) ? 1 : 0;
      let yearTerm = ((row % 12) > 0) ? "" : parseInt(row / 12 + 1).toString() + "年目";
      let html_tbody_tr = "";
      html_tbody_tr += "<tr>";
      html_tbody_tr += "<td>" + yearTerm + "</td>";
      html_tbody_tr += "<td>" + year.toString() + "/" + month.toString().padStart(2, "0") + "</td>";
      for (let p = 0; p < plans.length; p++) {
        html_tbody_tr += "<td>-</td>";
      }
      html_tbody_tr += "</tr>";
      $("#simulate-tbody").append(html_tbody_tr);
    }
  }

  // 行に記入
  {
    let html_trs = $("#simulate-tbody").find("tr");
    for (let p = 0; p < plans.length; p++) {
      let assets = plans[p].value;
      let year = minYear;
      let month = minMonth;
      let maxRow = (maxYear - minYear) * 12;
      let row = 0;
      for (row = 0; row < maxRow; row++) {
        month = ((minMonth - 1 + row) % 12) + 1;
        year += ((row > 0) && (month == 1)) ? 1 : 0;
        if ((year >= plans[p].year) && (month >= plans[p].month)) {
          break;
        }
      }
      for (let d = 0; d < plans[p].details.length; d++) {
        let term   = plans[p].details[d].term;
        let rate   = plans[p].details[d].rate;
        let amount = plans[p].details[d].amount;
        for (let t = 0; t < term; t++) {
          let html_tr  = $(html_trs[row]);
          let html_tds = $(html_tr).find("td");
          let html_td  = $(html_tds[p+2]);
          assets = assets * ((1 + rate / 100));
          html_td.html(assetsToString(assets));
          assets += amount;
          row++;
        }
      }
    }    
  }
}



//---------------------------------------------------
// Utilities
//---------------------------------------------------
function assetsToString(assets) {
  if (assets < 10000) {
    return Math.round(assets).toString() + "万";
  }
  else {
    return (Math.round(assets / 100) / 100).toString() + "億";
  }
}
