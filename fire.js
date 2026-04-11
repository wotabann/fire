initialize();


function initialize() {
  initializePlans();

  $("#edit-plan-request-button").on("click", () => { registerPlan(); });
  $("#edit-select-button").on("click", () => { selectEditPlan(); });
  $("#progress-button").on("click", () => { progress(); });
  $("#simulate-button").on("click", () => { simulate(); });
  $("#edit-plan-details").find(".edit-plan-form-insert").on("click", function(){insertEditDetail($(this))});
  $("#edit-plan-details").find(".edit-plan-form-remove").on("click", function(){removeEditDetail($(this))});
  $("#dialog-close-button").on("click", () => { hideEditPlanDialog() });

  let plans = loadRegisteredPlans();
  refreshEditSelectSection(plans);
}



//------------------------------------------------------------------------------
// Plan registries
//------------------------------------------------------------------------------
function initializePlans() {
  let plans = localStorage.getItem("fire-plans");
  if (plans === null) {
    plans = makeInitialPlans();
    localStorage.setItem("fire-plans", JSON.stringify(plans));
  }
}
function makeInitialPlans() {
  const details0 = [
    {term: 6,  rate: "1.5", amount: 3},
    {term: 6,  rate: "2.0", amount: 3},
    {term: 24, rate: "2.5", amount: 3},
    {term: 24, rate: "3.0", amount: 5},
    {term: 60, rate: "3.8", amount: 5},
  ];
  const details1 = [
    {term: 12, rate: "1.0", amount: 3},
    {term: 12, rate: "2.0", amount: 3},
    {term: 96, rate: "3.5", amount: 5},
  ];
  const details2 = [{term: 120, rate: "4.0", amount: 5}];
  const plans = [
    { id: 0, name: "planA", description: "10年で1億①", value: 100,  year: 2026, month: 4, tax: true, details: details0},
    { id: 1, name: "planB", description: "10年で1億②", value: 100,  year: 2026, month: 4, tax: true, details: details1},
    { id: 2, name: "planC", description: "10年で2.5億", value: 100,  year: 2026, month: 4, tax: true, details: details2},
  ];
  return plans;
}
function loadRegisteredPlans() {
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




//------------------------------------------------------------------------------
// Select Edit Plan
//------------------------------------------------------------------------------
function selectEditPlan() {
  let id = parseInt($("#edit-select").val());
  let plans = loadRegisteredPlans();
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



//------------------------------------------------------------------------------
// Edit Plan
//------------------------------------------------------------------------------
function showEditPlanDialog() {
  $("#edit-select").prop("disabled", true);
  $("#dialog").show();
}
function hideEditPlanDialog() {
  $("#dialog").hide();
  $("#edit-select").prop("disabled", false);
}
function refreshEditPlanDialog(plan) {
  $("#edit-plan-id").val(plan.id);
  $("#edit-plan-name").val(plan.name);
  $("#edit-plan-description").val(plan.description);
  $("#edit-plan-start-value").val(plan.value);
  $("#edit-plan-start-year").val(plan.year);
  $("#edit-plan-start-month").val(plan.month);
  $("#edit-plan-tax").prop("checked", plan.tax);

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
  let plans = loadRegisteredPlans();
  plans[id].name  = $("#edit-plan-name").val();
  plans[id].description  = $("#edit-plan-description").val();
  plans[id].value = $("#edit-plan-start-value").val();
  plans[id].year  = $("#edit-plan-start-year").val();
  plans[id].month  = $("#edit-plan-start-month").val();
  plans[id].tax = $("#edit-plan-tax").prop("checked");
  let html_trs = $("#edit-plan-details").children("tr");

  plans[id].details = [];
  for (let i = 0; i < $(html_trs).length; i++) {
    let term = $(html_trs[i]).find(".edit-plan-form-term").val();
    let rate = $(html_trs[i]).find(".edit-plan-form-rate").val();
    let amount = $(html_trs[i]).find(".edit-plan-form-amount").val();
    let detail = {"term": term, "rate": rate, "amount": amount};
    plans[id].details[i] = detail;
  }
  errorMessage = validatePlan(plans[id]);
  if (errorMessage != "") {
    alert(errorMessage);
    return;
  }
  try {
    localStorage.setItem("fire-plans", JSON.stringify(plans));
    alert("登録しました。");
  }
  catch {
    alert("登録に失敗しました。");
    return;
  }
  hideEditPlanDialog();
  plans = loadRegisteredPlans();
  refreshEditSelectSection(plans);
  hideProgressTable(plans);
  hideSimulateTable(plans);
}
function validatePlan(plan) {
  if (plan.name == "") {
    return "プラン名が空欄です。";
  }
  if (isOutOfRange(plan.value, 0, 1000000)) {
    return "開始額が不正です。";
  }
  if (isOutOfRange(plan.year, 1900, 2100)) {
    return "開始年が不正です。";
  }
  if (isOutOfRange(plan.month, 1, 12)) {
    return "開始月が不正です。";
  }
  for (let i = 0; i < plan.details.length; i++) {
    let term = plan.details[i].term;
    let rate = plan.details[i].rate;
    let amount = plan.details[i].amount;
    if (isOutOfRange(term, 1, 600)) {
      return "期間が不正です。";
    }
    if (isOutOfRange(rate, -100, 100)) {
      return "月利が不正です。";
    }
    if (isOutOfRange(amount, -1000, 1000)) {
      return "積立額が不正です。";
    }
  }
  return "";
}


//------------------------------------------------------------------------------
// Progress
//------------------------------------------------------------------------------
function progress() {
  const assets = $("#progress-form-assets").val();
  if (isOutOfRange(assets, -100000, 100000)) {
    alert("現在資産が不正です。");
    return;
  }
  refreshProgressTable(loadRegisteredPlans());
  showProgressTable();
}
function showProgressTable() {
  $("#progress-table").show();
}
function hideProgressTable() {
  $("#progress-table").hide();
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
  let taxRate = plan.tax ? 0.20315 : 0.0;
  let elapsedYear  = year - plan.year;
  let elapsedMonth = (month - plan.month + 1) + ((month < plan.month) ? 12 : 0);
  let elapcedCount = (elapsedYear * 12) + elapsedMonth;
  let cnt = 0;
  let assets = plan.value;
  for (let d = 0; d < plan.details.length; d++) {
    let rate   = plan.details[d].rate;
    let amount = plan.details[d].amount;
    for (let t = 0; t < plan.details[d].term; t++) {
      //assets *= ((1 + rate / 100));
      let profit = (assets * rate / 100);
      let tax = profit * taxRate;
      assets += profit - tax;
      cnt++;
      if (cnt >= elapcedCount) {
        return Math.round(assets);
      }
      assets += amount;
    }
  }
}




//------------------------------------------------------------------------------
// Simulate
//------------------------------------------------------------------------------
function simulate() {
  refreshSimulateTable(loadRegisteredPlans());
  showSimulateTable();
}
function showSimulateTable() {
  $("#simulate-table").show();
}
function hideSimulateTable() {
  $("#simulate-table").hide();
}
function refreshSimulateTable(plans) {
  // 開始～終了の最大期間を計算
  let v1 = 210001;
  let v2 = 190001;
  for (let p = 0; p < plans.length; p++) {
    let y1 = plans[p].year;
    let m1 = plans[p].month;
    let y2 = y1;
    let m2 = m1;
    let m  = m1;
    for (let d = 0; d < plans[p].details.length; d++) {
      for (let t = 0; t < plans[p].details[d].term; t++) {
        m++;
        if (m > 12) {
          y2++;
          m = 1;
        }
      }
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
    let html_thead = $("#simulate-thead");
    html_thead.html("");
    let html_tr = $("<tr></tr>").appendTo(html_thead);
    $("<th></th>").appendTo(html_tr).text("年目");
    $("<th></th>").appendTo(html_tr).text("年/月");
    for (let p = 0; p < plans.length; p++) {
      $("<th></th>").appendTo(html_tr).text(plans[p].name);
    }
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
      let taxRate = plans[p].tax ? 0.20315 : 0.0;
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
      let totalMonth = 0;
      let totalGain = 0.0;
      let totalAmount = 0.0;
      let totalTax = 0.0;
      for (let d = 0; d < plans[p].details.length; d++) {
        let term   = plans[p].details[d].term;
        let rate   = plans[p].details[d].rate;
        let amount = plans[p].details[d].amount;
        for (let t = 0; t < term; t++) {
          // html要素
          let html_tr  = $(html_trs[row]);
          let html_tds = $(html_tr).find("td");
          let html_td  = $(html_tds[p+2]);

          // その月の計算
          let profit = (assets * rate / 100);
          let tax = profit * taxRate;
          let gain = profit -tax;
          assets += gain;
          html_td.html(assetsToString(assets));
          row++;

          // トータル計算
          totalMonth++;
          totalGain += gain;
          totalTax += tax;

          // tooltip用のデータを仕込む
          html_td.data("plan-name", plans[p].name);
          html_td.data("plan-description", plans[p].description);
          html_td.data("total-month", totalMonth);
          html_td.data("total-gain", totalGain);
          html_td.data("total-amount", totalAmount);
          html_td.data("total-tax", totalTax);
          html_td.addClass("simulate-detail");

          // 最初の月は積み立てしない
          totalAmount += amount;
          assets += amount;
        }
      }
    }    
  }
}




//------------------------------------------------------------------------------
// Simulate Popup
//------------------------------------------------------------------------------
function refreshTooltip(html_td) {
  const planName = html_td.data("plan-name");
  const planDescription = html_td.data("plan-description");
  const totalMonth = html_td.data("total-month");
  const totalGain = assetsToString(html_td.data("total-gain")) + "円";
  const totalAmount = assetsToString(html_td.data("total-amount")) + "円";
  const totalTax = assetsToString(html_td.data("total-tax")) + "円";
  const elapsed = Math.floor(totalMonth / 12).toString() + "年 " + (totalMonth % 12).toString() + "ヶ月";
  $("#simulate-tooltip-plan-name").text(planName);
  $("#simulate-tooltip-plan-description").text(planDescription);
  $("#simulate-tooltip-total-month").text(elapsed);
  $("#simulate-tooltip-total-gain").text(totalGain);
  $("#simulate-tooltip-total-amount").text(totalAmount);
  $("#simulate-tooltip-total-tax").text(totalTax);
}

$(function () {

  const tooltip = $("#simulate-tooltip");
  const arrow = $("#simulate-tooltip-arrow");
  const arrowBorder = $("#simulate-tooltip-arrow-border");
  let currentCell = null;

  /* =========================
     tdクリック（イベント委譲）
  ========================= */
  $("#simulate-table").on("click", ".simulate-detail", function (e) {
    e.stopPropagation();

    // 画面外セルは無視
    const rect = this.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    // 同じセル再クリックで閉じる（トグル）
    if (currentCell === this) {
      tooltip.fadeOut(150);
      currentCell = null;
      return;
    }
    currentCell = this;

    /* ===== tooltip内容更新 ===== */
    refreshTooltip($(this));
    tooltip.stop(true,true).fadeIn(150);

    /* ===== 位置計算 ===== */
    const tdWidth  = rect.width;
    const tdHeight = rect.height;

    const tooltipWidth  = tooltip.outerWidth();
    const tooltipHeight = tooltip.outerHeight();

    const windowWidth  = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 基本：セル中央の下
    let left = rect.left + tdWidth/2 - tooltipWidth/2;
    let top  = rect.bottom + 10;
    let showAbove = false;

    /* 右端・左端はみ出し防止 */
    if (left + tooltipWidth > windowWidth - 10)
      left = windowWidth - tooltipWidth - 10;

    if (left < 10) left = 10;

    /* 下にはみ出すなら上表示 */
    if (top + tooltipHeight > windowHeight) {
      top = rect.top - tooltipHeight - 10;
      showAbove = true;
    }

    /* 矢印向き */
    arrow.removeClass("arrow-top arrow-bottom");
    arrowBorder.removeClass("arrow-top-border arrow-bottom-border");
    if (showAbove) {
      arrow.addClass("arrow-bottom");
      arrowBorder.addClass("arrow-bottom-border");
    } else {
      arrow.addClass("arrow-top");
      arrowBorder.addClass("arrow-top-border");
    }

    /* 矢印の横位置 */
    let arrowLeft = rect.left + tdWidth/2 - left - 8;
    arrowLeft = Math.max(12, arrowLeft);
    arrowLeft = Math.min(tooltipWidth - 20, arrowLeft);
    arrow.css("left", arrowLeft);
    arrowBorder.css("left", arrowLeft - 2);

    /* ここ重要：スクロール量を足す */
    tooltip.css({
      top:  top + window.scrollY,
      left: left + window.scrollX
    });
  });

  /* =========================
     外クリックで閉じる
  ========================= */
  $(document).on("click", function () {
    tooltip.fadeOut(150);
    currentCell = null;
  });

  tooltip.on("click", function (e) {
    e.stopPropagation();
  });

  /* =========================
     スクロール時は閉じる
  ========================= */
  $(window).on("scroll", function () {
    tooltip.fadeOut(100);
    currentCell = null;
  });

  $(".table-wrapper").on("scroll", function () {
    tooltip.fadeOut(100);
    currentCell = null;
  });
});



//------------------------------------------------------------------------------
// Utilities
//------------------------------------------------------------------------------
function isOutOfRange(v, min, max) {
  if (v == null) {
    return true;
  }
  if (v == "") {
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

function assetsToString(assets) {
  if (assets < 10000) {
    return Math.round(assets).toString() + "万";
  }
  else {
    return (Math.round(assets / 100) / 100).toString() + "億";
  }
}
