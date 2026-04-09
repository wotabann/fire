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
  if (getRegisteredPlans() !== null) {
    //return;
  }
  const details0 = [{term: 10, rate: "3.0", amount: 5}];
  const details1 = [{term: 10, rate: "4.0", amount: 5}];
  const details2 = [{term: 10, rate: "5.0", amount: 5}];
  const plans = [
    { id: 0, name: "planA", description: "初期100万 / 月利3% / 積立5万", value: 100,  year: 2026, month: 4, details: details0},
    { id: 1, name: "planB", description: "初期100万 / 月利4% / 積立5万", value: 100,  year: 2026, month: 4, details: details1},
    { id: 2, name: "planC", description: "初期100万 / 月利5% / 積立5万", value: 100,  year: 2026, month: 4, details: details2},
  ];
  localStorage.setItem("fire-plans", JSON.stringify(plans));
}
function getRegisteredPlans() {
  json = localStorage.getItem("fire-plans");
  if (json === null) {
    return null;
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
      y2 += plans[p].details[d].term;
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
        for (let t = 0; t < (term * 12); t++) {
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



class DumpGameRecordHtml {

  constructor() {
    this._dialogHtml = new DialogHtml();
    this._showLimit = 20;
  }

  get _html_section()    { return $("#dump-game-record"); }
  get _html_head()       { return $(this._html_section).children(".dump-section-head"); }
  get _html_body()       { return $(this._html_section).children(".dump-section-body"); }

  get _html_notice()     { return $(this._html_body.children(".dump-game-record-notice")); }
  get _html_moreButton() { return $(this._html_body.children(".dump-table-more-button")); }
  get _html_lessButton() { return $(this._html_body.children(".dump-table-less-button")); }
  
  get _html_table()      { return $(this._html_body.find("table")); }
  get _html_tbody()      { return $(this._html_table.children("tbody")); }
  get _html_trs()        { return $(this._html_tbody.children("tr")); }

  _html_td_id(html_tr)         { return html_tr.children(".id"); }
  _html_td_date(html_tr)       { return html_tr.children(".date"); }
  _html_td_rate(html_tr)       { return html_tr.children(".rate"); }
  _html_td_stock(html_tr)      { return html_tr.children(".stock"); }
  _html_td_fighter(html_tr)    { return html_tr.children(".fighter"); }
  _html_td_fighterId(html_tr)  { return html_tr.children(".fighter-id"); }
  _html_td_isVip(html_tr)      { return html_tr.children(".is-vip"); }
  _html_td_isDisabled(html_tr) { return html_tr.children(".is-disabled"); }


  /**
   * @note   表示を更新する。
   * @param  {GameRecords} gameRecords
   * @param  {Object} noticeIds
   */
  update(gameRecords, noticeIds) {
    // レコードがなければ何もしない
    if (gameRecords.length == 0) {
      this._html_section.hide();
      return;
    }

    // テーブル更新
    this._clearTable();
    this._updateTable(gameRecords, noticeIds);
    this._limit(this._showLimit);

    // More/Lessボタン設定
    this._html_moreButton.on("click", () => { this._more(); });
    this._html_lessButton.on("click", () => { this._less(); });
    if (gameRecords.length > this._showLimit) {
      this._html_moreButton.show();
      this._html_lessButton.hide();
    }
    else {
      this._html_moreButton.hide();
      this._html_lessButton.hide();
    }

    // セクション表示
    this._html_section.show();
  }


  /**
   * @note テーブルをクリアする。
   */
  _clearTable() {
    var html_trs = this._html_trs;
    for (let i = 1; i < html_trs.length; i++) {
      $(html_trs[i]).remove();
    }
    $(html_trs[0]).off("click");
  }


  /**
   * @note テーブルを更新する。
   * @param {gameRecords} gameRecords
   * @param {Object} noticeIds
   */
  _updateTable(gameRecords, noticeIds) {
    var html_tr_head = $(this._html_trs[0]);
    var length = gameRecords.length;

    for (let i = (length - 1); i >= 0; i--) {
      var gameRecord = gameRecords.index(i);
      var isNotice = noticeIds.includes(gameRecord.id);
      var html_tr = html_tr_head.clone().appendTo(this._html_table);

      this._setGameRecordToRow(html_tr, gameRecord);
      this._updateRowClickListener(html_tr);
      this._updateRowNotice(html_tr, isNotice);
      this._updateRowStyle(html_tr, gameRecord);
    }

    html_tr_head.remove();
  }

  
  /**
   * @note 行のクリックイベントを設定する。
   * @param {Object} html_tr
   */
  _updateRowClickListener(html_tr) {
    var arg = {
      callback: this._dialogHtml.openRegisterDialog.bind(this._dialogHtml),
      gameRecord: this._getGameRecordFromRow(html_tr)
    };
    var fnc = function(e) {
      var msg = "";
      msg += e.data.gameRecord.toLineString();
      msg += "\n上記の戦績を修正しますか？";
      if (window.confirm(msg)) {
        e.data.callback(e.data.gameRecord);
      }
    };
    html_tr.on("click", arg, fnc);
  }

  
  /**
   * @note 行に注釈を設定する。
   * @param {Object} html_tr
   * @param {Boolean} isNotice
   */
  _updateRowNotice(html_tr, isNotice) {
    if (isNotice) {
      html_tr.addClass("notice-background");
    }
    else  {
      html_tr.removeClass("notice-background");
    }
  }


  /**
   * @note 行のスタイルを更新する。
   * @param {Object} html_tr
   * @param {GameRecord} gameRecord
   */
  _updateRowStyle(html_tr, gameRecord) {
    // 勝敗に応じてフォントを設定
    if (gameRecord.stock > 0) {
      html_tr.addClass("positive-font");
      html_tr.removeClass("negative-font");
    }
    else {
      html_tr.addClass("negative-font");
      html_tr.removeClass("positive-font");
    }

    // 削除済みかどうかに応じてフォントを設定
    if (gameRecord.isDisabled) {
      html_tr.addClass("line-through");
    }
    else {
      html_tr.removeClass("line-through");
    }

    // VIPは王冠マークを付ける
    if (gameRecord.isVip != 0) {
      this._html_td_date(html_tr).addClass("crown");
    }
    else {
      this._html_td_date(html_tr).removeClass("crown");
    }
  }


  /**
   * @note GameRecordを行の内容に反映する。
   * @param {Object} html_tr
   * @param {GameRecord} gameRecord
   */
  _setGameRecordToRow(html_tr, gameRecord) {
    // 各要素の表示を更新
    this._html_td_id(html_tr).text(gameRecord.id);
    this._html_td_date(html_tr).text(gameRecord.date.substr(5, 5));
    this._html_td_rate(html_tr).text(gameRecord.rate + "万");
    this._html_td_stock(html_tr).text(gameRecord.stock);
    this._html_td_fighter(html_tr).text(Fighter.idToName[gameRecord.fighterId]);
    this._html_td_fighterId(html_tr).text(gameRecord.fighterId);
    this._html_td_isVip(html_tr).text(gameRecord.isVip);
    this._html_td_isDisabled(html_tr).text(gameRecord.isDisabled);

    // 参照用に生の値を仕込む
    this._html_td_id(html_tr).data("sort-value", gameRecord.id);
    this._html_td_date(html_tr).data("sort-value", gameRecord.date);
    this._html_td_rate(html_tr).data("sort-value", gameRecord.rate);
    this._html_td_stock(html_tr).data("sort-value", gameRecord.stock);
    this._html_td_fighter(html_tr).data("sort-value", Fighter.idToName[gameRecord.fighterId]);
    this._html_td_fighterId(html_tr).data("sort-value", gameRecord.fighterId);
    this._html_td_isVip(html_tr).data("sort-value", gameRecord.isVip);
    this._html_td_isDisabled(html_tr).data("sort-value", gameRecord.isDisabled);
  }

  
  /**
   * @note 行の内容をGameRecordとして返す。
   * @param  {Object} html_tr
   * @return {GameRecord}
   */
  _getGameRecordFromRow(html_tr) {
    var gameRecord = new GameRecord();
    gameRecord.id         = this._html_td_id(html_tr).data("sort-value");
    gameRecord.date       = this._html_td_date(html_tr).data("sort-value");
    gameRecord.rate       = this._html_td_rate(html_tr).data("sort-value");
    gameRecord.stock      = this._html_td_stock(html_tr).data("sort-value");
    gameRecord.fighterId  = this._html_td_fighterId(html_tr).data("sort-value");
    gameRecord.isVip      = this._html_td_isVip(html_tr).data("sort-value");
    gameRecord.isDisabled = this._html_td_isDisabled(html_tr).data("sort-value");
    return gameRecord;
  }


  /**
   * @note 表示数を制限する。(未使用)
   * @param {Integer} count
   */
  _limit(count) {
    var html_trs = this._html_trs;
    var headIndex = (count < 0) ? html_trs.length : count;

    for (let i = 0; i < headIndex; i++) {
      $(html_trs[i]).show();
    }

    for (let i = headIndex; i < html_trs.length; i++) {
      $(html_trs[i]).hide();
    }
  }


  /**
   * @note 全件表示
   */
  _more() {
    this._limit(-1);
    this._html_moreButton.hide();
    this._html_lessButton.show();
  }


  /**
   * @note 直近のみ表示
   */
  _less() {
    this._limit(this._showLimit);
    this._html_lessButton.hide();
    this._html_moreButton.show();
  }


}
