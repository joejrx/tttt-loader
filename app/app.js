(function () {
  // -------------------------
  // DOM references
  // -------------------------
  var statusEl, fileInput, categorySelect, searchInput, btnClearSearch;
  var btnLoadMore, btnShowLess;

  function setStatus(cls, msg) {
    if (!statusEl) return;
    statusEl.className = "status " + cls;
    statusEl.textContent = msg;
  }

  function safeStr(x) { return (x == null) ? "" : String(x); }

  // -------------------------
  // Canonical terp order (desktop TTTT order)
  // -------------------------
  var TERP_COLS = [
    "BetaCaryphyllene","Limonene","Linalool","BetaMyrcene","Humulene","Terpinolene","BetaPinene","AlphaPinene",
    "ThreeCarene","AlphaTerpinene","BetaEudesmol","Bisabolol","Camphene","Eucalyptol","Geraniol","Guaiol",
    "Isopulegol","Nerolidol","NerolidolTwo","Ocimene","OcimeneOne","OcimeneTwo","pCymene","pIsopropyltouluene",
    "Terpinene","TransNerolidol"
  ];

  var TERP_INFO = {
    BetaCaryphyllene: { aroma: "Spicy, peppery, clove-like.", research: "Common in black pepper and cloves; being studied for potential anti-inflammatory effects and CB2 receptor activity." },
    Limonene: { aroma: "Bright citrus (lemon, orange).", research: "Found in citrus rinds; associated in research with uplifting mood and stress-supporting properties." },
    Linalool: { aroma: "Floral, lavender-like.", research: "Abundant in lavender; studied for potential calming and relaxing effects." },
    BetaMyrcene: { aroma: "Earthy, musky, herbal.", research: "Common in hops and mango; often associated with \"heavy\" or relaxing profiles in consumer reports." },
    Humulene: { aroma: "Woody, hoppy, earthy.", research: "Found in hops and coriander; being researched for potential anti-inflammatory and appetite-related effects." },
    Terpinolene: { aroma: "Piney, herbal, floral.", research: "Less common but distinctive; often linked with more uplifting or energetic profiles in user reports." },
    BetaPinene: { aroma: "Sharp pine, resinous.", research: "Present in pine needles; studied for potential alertness-supporting and bronchodilatory properties." },
    AlphaPinene: { aroma: "Fresh pine, evergreen.", research: "One of the most common terpenes in nature; research suggests possible support for focus and respiratory function." },
    ThreeCarene: { aroma: "Sweet, cedar, woody.", research: "Found in cedar and rosemary; sometimes associated with \"dry\" mouth/eyes in anecdotal reports." },
    AlphaTerpinene: { aroma: "Citrus, herbal.", research: "Less common; studied for antioxidant and aroma-modifying roles in plant essential oils." },
    BetaEudesmol: { aroma: "Woody, earthy.", research: "Seen in some wood-derived oils; research is early but looks at potential calming or sedative-like effects." },
    Bisabolol: { aroma: "Sweet, floral, chamomile-like.", research: "Major terpene in chamomile; being studied for potential soothing and skin-calming properties." },
    Camphene: { aroma: "Sharp, herbal, fir-like.", research: "Found in fir needles; early research explores potential cardiovascular and antioxidant roles." },
    Eucalyptol: { aroma: "Minty, cool, eucalyptus-like.", research: "Common in eucalyptus; studied for potential respiratory and cognitive clarity effects." },
    Geraniol: { aroma: "Sweet, rose, floral.", research: "Present in roses and geraniums; research looks at antioxidant and aroma-modifying properties." },
    Guaiol: { aroma: "Woody, piney.", research: "Found in guaiacum and conifers; less-studied but often grouped with woody, grounding aroma profiles." },
    Isopulegol: { aroma: "Minty, herbal.", research: "Related to menthol; being researched for potential calming and neuroprotective properties." },
    Nerolidol: { aroma: "Woody, floral, green.", research: "Found in jasmine and tea tree; studies focus on sedative-like and skin-penetration-enhancing properties." },
    NerolidolTwo: { aroma: "Woody, floral (nerolidol isomer).", research: "Isomer of nerolidol; similar research focus on potential sedative-like and terpene-carrying effects." },
    Ocimene: { aroma: "Sweet, herbal, fresh.", research: "Found in mint and basil; associated with bright, sweet aroma profiles." },
    OcimeneOne: { aroma: "Sweet, herbal (ocimene isomer).", research: "Isomer of ocimene; contributes to sweet, fresh aromatics in certain cultivars." },
    OcimeneTwo: { aroma: "Sweet, green (ocimene isomer).", research: "Another ocimene isomer; overall similar aromatic and research profile to ocimene." },
    pCymene: { aroma: "Citrusy, slightly solvent-like.", research: "Found in cumin and thyme; studied as a component of essential oils with potential antioxidant roles." },
    pIsopropyltouluene: { aroma: "Sharp, solvent-like, minor note.", research: "Less-characterized in cannabis; typically present at low levels and discussed mainly in analytical contexts." },
    Terpinene: { aroma: "Citrus, herbal, turpentine-like.", research: "Occurs in tea tree and cardamom; research looks at antioxidant and antimicrobial properties." },
    TransNerolidol: { aroma: "Woody, floral (trans-nerolidol isomer).", research: "Trans isomer of nerolidol; studied for similar potential calming and skin-penetration effects." }
  };

  var BASE_COLS = [
    { key: "Product",        label: "Product",        type: "txt" },
    { key: "Location",       label: "Location",       type: "txt" },
    { key: "Product Type",   label: "Category",       type: "txt" },
    { key: "Room",           label: "Room",           type: "txt" },
    { key: "THC",            label: "THC",            type: "num" },
    { key: "Total Terpenes", label: "Total Terpenes", type: "num" }
  ];

  var UI_CATEGORIES = ["Flower","Vape","Concentrate"];

  var allRows = [];
  var lastRawRowCount = 0;
  var filteredRows = [];
  var rowsPerPage = 5;
  var rowsShown = 0;
  var showingAll = false;

  var sortKey = null;
  var sortDir = -1;

  var colType = {};
  BASE_COLS.forEach(function (c) { colType[c.key] = c.type; });
  TERP_COLS.forEach(function (t) { colType[t] = "num"; });

  // -------------------------
  // Helpers
  // -------------------------
  function normalizePercent(val) {
    if (val == null) return 0;
    var s = String(val).trim();
    if (!s) return 0;
    s = s.replace(/,/g, "");
    if (/mg\/g/i.test(s)) { var n1 = parseFloat(s); return isFinite(n1) ? (n1 / 10) : 0; }
    if (/%/.test(s)) { var n2 = parseFloat(s); return isFinite(n2) ? n2 : 0; }
    var n3 = parseFloat(s);
    return isFinite(n3) ? n3 : 0;
  }

  function fmtPct(num) {
    var n = Number(num) || 0;
    if (n === 0) return "";
    return n.toFixed(2) + "%";
  }

  function mapToUiCategory(rawCat) {
    var c = String(rawCat || "").toLowerCase();
    if (c === "flower") return "Flower";
    if (c.indexOf("vape") >= 0 || c.indexOf("cartridge") >= 0 || c.indexOf("cartridges") >= 0 || c.indexOf("disposable") >= 0) return "Vape";
    if (c.indexOf("budder") >= 0 || c.indexOf("badder") >= 0 || c.indexOf("sugar") >= 0 || c.indexOf("sauce") >= 0 ||
        c.indexOf("resin") >= 0 || c.indexOf("rosin") >= 0 || c.indexOf("wax") >= 0 || c.indexOf("shatter") >= 0 ||
        c.indexOf("concentrate") >= 0) return "Concentrate";
    if (c === "vape") return "Vape";
    if (c === "concentrate") return "Concentrate";
    return "";
  }

  // -------------------------
  // FIX 1: Top scrollbar mirror
  // Adds a scrollbar ABOVE the table that stays visible so users
  // don't have to scroll to the bottom to pan horizontally
  // -------------------------
  function initHorizontalScroll() {
    var wrapEl = document.querySelector(".wrap");
    if (!wrapEl) return;

    // Create a mirror div that sits above the table with its own scrollbar
    var topScroll = document.createElement("div");
    topScroll.id = "topScrollMirror";
    topScroll.style.cssText = [
      "overflow-x: auto",
      "overflow-y: hidden",
      "-webkit-overflow-scrolling: touch",
      "margin-bottom: 2px",
      "height: 16px"        // just enough height to show the scrollbar
    ].join(";");

    // Inner spacer — same width as the table
    var spacer = document.createElement("div");
    spacer.id = "topScrollSpacer";
    spacer.style.height = "1px";
    topScroll.appendChild(spacer);

    // Insert the mirror div directly before .wrap
    wrapEl.parentNode.insertBefore(topScroll, wrapEl);

    // Keep widths in sync after table renders
    function syncWidth() {
      var tbl = document.getElementById("tbl");
      if (tbl) spacer.style.width = tbl.scrollWidth + "px";
    }

    // Sync scroll positions both ways
    var syncing = false;
    topScroll.addEventListener("scroll", function () {
      if (syncing) return;
      syncing = true;
      wrapEl.scrollLeft = topScroll.scrollLeft;
      syncing = false;
    });
    wrapEl.addEventListener("scroll", function () {
      if (syncing) return;
      syncing = true;
      topScroll.scrollLeft = wrapEl.scrollLeft;
      syncing = false;
    });

    // Sync width on load and after any render
    syncWidth();
    window.addEventListener("resize", syncWidth);

    // Re-sync width after rows are rendered (table may have changed)
    window._syncTopScrollWidth = syncWidth;
  }

  // -------------------------
  // Terp header tooltips
  // -------------------------
  function initTerpHeaderTooltips() {
    var tooltipId = 'terpene-tooltip';
    var tooltip = document.getElementById(tooltipId);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = tooltipId;
      tooltip.className = 'terpene-tooltip';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.innerHTML =
        '<div class="terpene-tooltip-content">' +
          '<div class="terpene-tooltip-aroma"></div>' +
          '<div class="terpene-tooltip-research"></div>' +
        '</div>';
      document.body.appendChild(tooltip);
    }

    var aromaEl = tooltip.querySelector('.terpene-tooltip-aroma');
    var researchEl = tooltip.querySelector('.terpene-tooltip-research');
    var currentTarget = null;

    function getTerpInfo(terpKey) {
      return TERP_INFO[terpKey] || { aroma: "Aroma details not available.", research: "Research notes not available for this terpene in this tool." };
    }

    function showTooltipFor(btn) {
      var terpKey = btn.getAttribute('data-terp') || '';
      var info = getTerpInfo(terpKey);
      aromaEl.textContent = info.aroma || '';
      researchEl.textContent = info.research || '';
      var rect = btn.getBoundingClientRect();
      var scrollY = window.scrollY || window.pageYOffset;
      var scrollX = window.scrollX || window.pageXOffset;
      tooltip.style.top = (rect.bottom + scrollY + 6) + 'px';
      tooltip.style.left = (rect.left + scrollX) + 'px';
      tooltip.classList.add('visible');
      tooltip.setAttribute('aria-hidden', 'false');
      currentTarget = btn;
    }

    function hideTooltip() {
      tooltip.classList.remove('visible');
      tooltip.setAttribute('aria-hidden', 'true');
      currentTarget = null;
    }

    var infoButtons = document.querySelectorAll('#hdrRow .terp-info-btn');
    infoButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentTarget === btn) { hideTooltip(); } else { showTooltipFor(btn); }
      });
      btn.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) showTooltipFor(btn); });
      btn.addEventListener('mouseleave', function () { if (window.matchMedia('(hover: hover)').matches) hideTooltip(); });
    });

    if (!window.__terpTooltipGlobalsBound) {
      window.__terpTooltipGlobalsBound = true;
      document.body.addEventListener('click', function (e) { if (!tooltip.contains(e.target)) hideTooltip(); });
      window.addEventListener('scroll', function () { if (currentTarget) showTooltipFor(currentTarget); });
      window.addEventListener('resize', function () { if (currentTarget) showTooltipFor(currentTarget); });
    }
  }

  // -------------------------
  // Header building
  // -------------------------
  function buildHeader() {
    var hdr = document.getElementById("hdrRow");
    if (!hdr) return;
    var html = "";
    for (var i = 0; i < BASE_COLS.length; i++) {
      var c = BASE_COLS[i];
      var cls = (c.type === "num") ? "num sortable" : "txt sortable";
      html += '<th class="' + cls + '" data-key="' + c.key + '">' + c.label + '<span class="sort-ind"></span></th>';
    }
    for (var t = 0; t < TERP_COLS.length; t++) {
      var key = TERP_COLS[t];
      html += '<th class="num sortable" data-key="' + key + '">' +
        '<span class="terp-header-text">' + key + '</span>' +
        '<button type="button" class="terp-info-btn" aria-label="' + key + ' – aroma & research info" data-terp="' + key + '">ⓘ</button>' +
        '<span class="sort-ind"></span></th>';
    }
    hdr.innerHTML = html;
    updateSortIndicators();
    initTerpHeaderTooltips();
  }

  function updateSortIndicators() {
    var hdr = document.getElementById("hdrRow");
    if (!hdr) return;
    var ths = hdr.querySelectorAll("th.sortable");
    for (var i = 0; i < ths.length; i++) {
      var th = ths[i];
      var ind = th.querySelector(".sort-ind");
      if (!ind) continue;
      var key = th.getAttribute("data-key");
      ind.textContent = (key && key === sortKey) ? (sortDir === 1 ? " ▲" : " ▼") : "";
    }
  }

  // -------------------------
  // Category dropdown
  // -------------------------
  function initCategoryDropdown() {
    categorySelect.innerHTML = "";
    for (var i = 0; i < UI_CATEGORIES.length; i++) {
      var opt = document.createElement("option");
      opt.value = UI_CATEGORIES[i];
      opt.textContent = UI_CATEGORIES[i];
      categorySelect.appendChild(opt);
    }
    categorySelect.value = "Flower";
  }

  // -------------------------
  // Sorting
  // -------------------------
  function defaultComparator(a, b) {
    if (b["Total Terpenes"] !== a["Total Terpenes"]) return b["Total Terpenes"] - a["Total Terpenes"];
    return (b.BetaCaryphyllene || 0) - (a.BetaCaryphyllene || 0);
  }

  function typedCompare(a, b, key, dir) {
    var type = colType[key] || "txt";
    if (type === "num") {
      var na = Number(a[key]) || 0, nb = Number(b[key]) || 0;
      if (na === nb) return 0;
      return dir * (na - nb);
    } else {
      var sa = safeStr(a[key]).toLowerCase(), sb = safeStr(b[key]).toLowerCase();
      if (sa < sb) return -1 * dir;
      if (sa > sb) return  1 * dir;
      return 0;
    }
  }

  // -------------------------
  // Render helpers
  // -------------------------
  function buildRowHtml(row) {
    var baseCells = "";
    for (var bc = 0; bc < BASE_COLS.length; bc++) {
      var col = BASE_COLS[bc];
      baseCells += col.type === "txt"
        ? '<td class="txt">' + safeStr(row[col.key]) + "</td>"
        : '<td class="num">' + fmtPct(row[col.key]) + "</td>";
    }
    var terpCells = "";
    for (var t = 0; t < TERP_COLS.length; t++) {
      terpCells += '<td class="num">' + fmtPct(row[TERP_COLS[t]]) + "</td>";
    }
    return baseCells + terpCells;
  }

  function renderNextBatch() {
    var tbody = document.querySelector("#tbl tbody");
    if (!tbody || !filteredRows || filteredRows.length === 0) {
      updatePaginationButtons();
      return;
    }
    var start = rowsShown;
    var end = Math.min(rowsShown + rowsPerPage, filteredRows.length);
    for (var i = start; i < end; i++) {
      var tr = document.createElement("tr");
      tr.innerHTML = buildRowHtml(filteredRows[i]);
      tbody.appendChild(tr);
    }
    rowsShown = end;
    updatePaginationButtons();
  }

  // FIX 2: Show Less — collapses back to first 10 rows
  function showLess() {
    var tbody = document.querySelector("#tbl tbody");
    if (!tbody) return;

    // Remove all rows beyond the first rowsPerPage
    var rows = tbody.querySelectorAll("tr");
    for (var i = rowsPerPage; i < rows.length; i++) {
      tbody.removeChild(rows[i]);
    }
    rowsShown = Math.min(rowsPerPage, filteredRows.length);
    showingAll = false;
    updatePaginationButtons();

    // Scroll back up to the table so user sees the collapsed view
    var wrapEl = document.querySelector(".wrap");
    if (wrapEl) wrapEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updatePaginationButtons() {
    var remaining = filteredRows.length - rowsShown;
    var hasMore = remaining > 0;

    if (btnLoadMore) {
      btnLoadMore.style.display = hasMore ? "inline-block" : "none";
      if (hasMore) btnLoadMore.textContent = "Show More (" + remaining + " remaining)";
    }

    // Show Less only appears when we've expanded beyond the first page
    if (btnShowLess) {
      btnShowLess.style.display = (rowsShown > rowsPerPage) ? "inline-block" : "none";
    }
  }

  // -------------------------
  // Main render
  // -------------------------
  function render() {
    var selectedCat = categorySelect.value;
    var q = searchInput.value.trim().toLowerCase();

    if (btnClearSearch) btnClearSearch.disabled = (q.length === 0);

    var filtered = allRows.filter(function (r) {
      if (r["Product Type"] !== selectedCat) return false;
      if (!q) return true;
      return safeStr(r.Product).toLowerCase().indexOf(q) >= 0;
    });

    if (sortKey) {
      filtered.sort(function (a, b) {
        var primary = typedCompare(a, b, sortKey, sortDir);
        return primary !== 0 ? primary : defaultComparator(a, b);
      });
    } else {
      filtered.sort(defaultComparator);
    }

    filteredRows = filtered;
    rowsShown = 0;
    showingAll = false;

    var tbody = document.querySelector("#tbl tbody");
    tbody.innerHTML = "";

    renderNextBatch();

    var msg = "JS status: RUNNING ✅ (raw: " + lastRawRowCount + " • included: " + allRows.length +
              " • showing: " + selectedCat + " • rows: " + filteredRows.length;
    if (q) msg += ' • search: "' + q + '"';
    msg += ")";
    setStatus("running", msg);

    // Keep top scrollbar width in sync with table
    if (window._syncTopScrollWidth) window._syncTopScrollWidth();
  }

  var searchTimer = null;
  function onSearchInput() {
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(render, 120);
  }

  function onClearSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    searchInput.value = "";
    if (searchInput && searchInput.blur) searchInput.blur();
    render();
  }

  function onHeaderClick(evt) {
    var th = evt.target.closest ? evt.target.closest("th") : null;
    if (!th) return;
    var key = th.getAttribute("data-key");
    if (!key) return;
    if (sortKey === key) { sortDir = (sortDir === 1) ? -1 : 1; }
    else { sortKey = key; sortDir = (colType[key] === "num") ? -1 : 1; }
    updateSortIndicators();
    render();
  }

  // -------------------------
  // XLSX parsing
  // -------------------------
  function findColumn(obj, candidates) {
    var keys = Object.keys(obj || {});
    for (var c = 0; c < candidates.length; c++) {
      var want = String(candidates[c]).toLowerCase();
      for (var k = 0; k < keys.length; k++) {
        if (String(keys[k]).toLowerCase() === want) return keys[k];
      }
    }
    return null;
  }

  function normalizeRow(raw) {
    var productKey = findColumn(raw, ["Product","Product Name","Name","Item"]);
    var locKey     = findColumn(raw, ["Location","Store","Dispensary"]);
    var roomKey    = findColumn(raw, ["Room"]);
    var catKey     = findColumn(raw, ["Category","Category Name","Product Type","ProductType","Type"]);
    var thcKey     = findColumn(raw, ["THC","THC%","THC %","Total THC","Total THC %","TotalTHC"]);

    var product = productKey ? safeStr(raw[productKey]) : "";
    if (!product.trim()) return null;

    var rawCat = catKey ? safeStr(raw[catKey]) : "";
    var uiCat = mapToUiCategory(rawCat);
    if (!uiCat) return null;

    var row = {
      "Product": product,
      "Location": locKey ? safeStr(raw[locKey]) : "",
      "Room": roomKey ? safeStr(raw[roomKey]) : "",
      "Product Type": uiCat,
      "THC": normalizePercent(thcKey ? raw[thcKey] : ""),
      "Total Terpenes": 0
    };

    var total = 0;
    for (var t = 0; t < TERP_COLS.length; t++) {
      var terpName = TERP_COLS[t];
      var terpKey = findColumn(raw, [terpName]);
      var v = normalizePercent(terpKey ? raw[terpKey] : "");
      row[terpName] = v;
      total += v;
    }
    row["Total Terpenes"] = Math.round(total * 100) / 100;
    return row;
  }

  function pickFirstNonEmptySheet(wb) {
    for (var i = 0; i < wb.SheetNames.length; i++) {
      var name = wb.SheetNames[i];
      var ws = wb.Sheets[name];
      var test = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (test && test.length > 0) return name;
    }
    return wb.SheetNames[0];
  }

  function detectHeaderRow(ws) {
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    function normCell(x) { return String(x || "").trim().toLowerCase(); }
    for (var r = 0; r < Math.min(aoa.length, 50); r++) {
      var row = aoa[r].map(normCell);
      if (row.indexOf("product") >= 0 && (row.indexOf("location") >= 0 || row.indexOf("room") >= 0 || row.indexOf("category") >= 0 || row.indexOf("product type") >= 0)) {
        return r;
      }
    }
    return -1;
  }

  function onFileChange(evt) {
    var file = evt.target.files && evt.target.files[0];
    if (!file) return;
    setStatus("running", "JS status: RUNNING ✅ (reading XLSX...)");
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var bytes = new Uint8Array(e.target.result);
        var wb = XLSX.read(bytes, { type: "array" });
        var sheetName = pickFirstNonEmptySheet(wb);
        var ws = wb.Sheets[sheetName];
        var headerRow = detectHeaderRow(ws);
        if (headerRow === -1) {
          setStatus("error", "JS ERROR: Could not find header row in first 50 rows.");
          return;
        }
        var rawRows = XLSX.utils.sheet_to_json(ws, { defval: "", range: headerRow });
        lastRawRowCount = rawRows.length;
        var normalized = [];
        for (var i = 0; i < rawRows.length; i++) {
          var n = normalizeRow(rawRows[i]);
          if (n) normalized.push(n);
        }
        allRows = normalized;
        categorySelect.value = "Flower";
        searchInput.value = "";
        sortKey = null;
        sortDir = -1;
        updateSortIndicators();
        render();
      } catch (err) {
        console.error(err);
        setStatus("error", "JS ERROR: " + err.message);
      }
    };
    reader.onerror = function () { setStatus("error", "JS ERROR: failed to read file"); };
    reader.readAsArrayBuffer(file);
  }

  // -------------------------
  // Init
  // -------------------------
  function init() {
    statusEl       = document.getElementById("jsStatus");
    fileInput      = document.getElementById("fileInput");
    categorySelect = document.getElementById("categorySelect");
    searchInput    = document.getElementById("searchInput");
    btnClearSearch = document.getElementById("btnClearSearch");
    btnLoadMore    = document.getElementById("btnLoadMore");
    btnShowLess    = document.getElementById("btnShowLess");

    if (!statusEl || !fileInput || !categorySelect || !searchInput) return;

    if (typeof XLSX === "undefined") {
      setStatus("error", "JS ERROR: XLSX library not loaded.");
      return;
    }

    buildHeader();
    initCategoryDropdown();
    initHorizontalScroll();   // FIX 1: horizontal scroll

    var hdr = document.getElementById("hdrRow");
    if (hdr) hdr.addEventListener("click", onHeaderClick);

    categorySelect.addEventListener("change", render);
    searchInput.addEventListener("input", onSearchInput);
    fileInput.addEventListener("change", onFileChange);

    if (btnClearSearch) { btnClearSearch.addEventListener("click", onClearSearch); btnClearSearch.disabled = true; }

    if (btnLoadMore) {
      btnLoadMore.addEventListener("click", function () { renderNextBatch(); });
      btnLoadMore.style.display = "none";
    }

    // FIX 2: Show Less button
    if (btnShowLess) {
      btnShowLess.addEventListener("click", showLess);
      btnShowLess.style.display = "none";
    }

    setStatus("running", "JS status: RUNNING ✅ (ready for XLSX)");
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
