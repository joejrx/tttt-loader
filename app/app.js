(function () {
  // -------------------------
  // DOM references
  // -------------------------
  var statusEl, fileInput, categorySelect, searchInput;

  function setStatus(cls, msg) {
    if (!statusEl) return;
    statusEl.className = "status " + cls;
    statusEl.textContent = msg;
  }

  function safeStr(x) {
    return (x == null) ? "" : String(x);
  }

  // -------------------------
  // Canonical terp order (desktop TTTT order)
  // -------------------------
  var TERP_COLS = [
    "BetaCaryphyllene","Limonene","Linalool","BetaMyrcene","Humulene","Terpinolene","BetaPinene","AlphaPinene",
    "ThreeCarene","AlphaTerpinene","BetaEudesmol","Bisabolol","Camphene","Eucalyptol","Geraniol","Guaiol",
    "Isopulegol","Nerolidol","NerolidolTwo","Ocimene","OcimeneOne","OcimeneTwo","pCymene","pIsopropyltouluene",
    "Terpinene","TransNerolidol"
  ];

  // Base columns in the web table
  var BASE_COLS = [
    { key: "Product",        label: "Product",        type: "txt" },
    { key: "Location",       label: "Location",       type: "txt" },
    { key: "Product Type",   label: "Category",       type: "txt" },
    { key: "Room",           label: "Room",           type: "txt" },
    { key: "THC",            label: "THC",            type: "num_pct" },
    { key: "Total Terpenes", label: "Total Terpenes", type: "num_pct" }
  ];

  // Always show these categories (no ALL), default Flower
  var UI_CATEGORIES = ["Flower","Vape","Concentrate"];

  // Normalized data rows from XLSX
  var allRows = [];

  // -------------------------
  // Helpers: normalize values
  // -------------------------
  function normalizePercent(val) {
    // Accepts values like:
    // "22.9 %" -> 22.9
    // "666.0 mg/g" -> 66.6
    // "" -> 0
    // 22.9 -> 22.9
    if (val == null) return 0;

    var s = String(val).trim();
    if (!s) return 0;

    s = s.replace(/,/g, "");

    if (/mg\/g/i.test(s)) {
      var n1 = parseFloat(s);
      return isFinite(n1) ? (n1 / 10) : 0; // mg/g ÷ 10 = %
    }

    if (/%/.test(s)) {
      var n2 = parseFloat(s);
      return isFinite(n2) ? n2 : 0;
    }

    var n3 = parseFloat(s);
    return isFinite(n3) ? n3 : 0;
  }

  function fmtPct(num) {
    // blank zeros like your export feel
    var n = Number(num) || 0;
    if (n === 0) return "";
    return n.toFixed(2) + "%"; // no space
  }

  function mapToUiCategory(rawCat) {
    // Collapses granular export categories into UI buckets
    var c = String(rawCat || "").toLowerCase();

    if (c === "flower") return "Flower";

    // Vape bucket
    if (c.indexOf("vape") >= 0 || c.indexOf("cartridge") >= 0 || c.indexOf("cartridges") >= 0 || c.indexOf("disposable") >= 0) {
      return "Vape";
    }

    // Concentrate bucket
    if (
      c.indexOf("budder") >= 0 || c.indexOf("badder") >= 0 || c.indexOf("sugar") >= 0 || c.indexOf("sauce") >= 0 ||
      c.indexOf("resin") >= 0 || c.indexOf("rosin") >= 0 || c.indexOf("wax") >= 0 || c.indexOf("shatter") >= 0 ||
      c.indexOf("concentrate") >= 0
    ) {
      return "Concentrate";
    }

    // If your export ever uses the simplified categories directly:
    if (c === "vape") return "Vape";
    if (c === "concentrate") return "Concentrate";

    // Ignore others for now (edible/tincture/etc.)
    return "";
  }

  // -------------------------
  // Build header row once
  // -------------------------
  function buildHeader() {
    var hdr = document.getElementById("hdrRow");
    if (!hdr) return;

    var html = "";
    for (var i = 0; i < BASE_COLS.length; i++) {
      var col = BASE_COLS[i];
      var isNum = col.type.indexOf("num") === 0;
      html += '<th class="' + (isNum ? "num" : "txt") + '">' + col.label + "</th>";
    }
    for (var t = 0; t < TERP_COLS.length; t++) {
      html += '<th class="num">' + TERP_COLS[t] + "</th>";
    }
    hdr.innerHTML = html;
  }

  // -------------------------
  // Init category dropdown
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
  // Render pipeline: category + search + sorting
  // -------------------------
  function render() {
    var selectedCat = categorySelect.value;
    var q = searchInput.value.trim().toLowerCase();

    var filtered = allRows.filter(function (r) {
      if (r["Product Type"] !== selectedCat) return false;
      if (!q) return true;
      // Search ONLY on Product (your naming convention carries vendor/size/type/etc.)
      return safeStr(r.Product).toLowerCase().indexOf(q) >= 0;
    });

    // Sort: Total Terpenes desc, then BetaCaryphyllene desc
    filtered.sort(function (a, b) {
      if (b["Total Terpenes"] !== a["Total Terpenes"]) return b["Total Terpenes"] - a["Total Terpenes"];
      return (b.BetaCaryphyllene || 0) - (a.BetaCaryphyllene || 0);
    });

    var tbody = document.querySelector("#tbl tbody");
    tbody.innerHTML = "";

    for (var i = 0; i < filtered.length; i++) {
      var row = filtered[i];

      var baseCells = "";
      for (var bc = 0; bc < BASE_COLS.length; bc++) {
        var col = BASE_COLS[bc];
        if (col.type === "txt") {
          baseCells += '<td class="txt">' + safeStr(row[col.key]) + "</td>";
        } else {
          baseCells += '<td class="num">' + fmtPct(row[col.key]) + "</td>";
        }
      }

      var terpCells = "";
      for (var t = 0; t < TERP_COLS.length; t++) {
        var k = TERP_COLS[t];
        terpCells += '<td class="num">' + fmtPct(row[k]) + "</td>";
      }

      var tr = document.createElement("tr");
      tr.innerHTML = baseCells + terpCells;
      tbody.appendChild(tr);
    }

    var msg = "JS status: RUNNING ✅ (category: " + selectedCat + " • rows: " + filtered.length;
    if (q) msg += ' • search: "' + q + '"';
    msg += ")";
    setStatus("running", msg);
  }

  // Debounce typing (nice on iPad/phone)
  var searchTimer = null;
  function onSearchInput() {
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(render, 120);
  }

  // -------------------------
  // XLSX parsing helpers
  // -------------------------
  function findColumn(obj, candidates) {
    // returns first matching key present in obj (case-insensitive)
    var keys = Object.keys(obj || {});
    for (var c = 0; c < candidates.length; c++) {
      var want = candidates[c].toLowerCase();
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].toLowerCase() === want) return keys[k];
      }
    }
    return null;
  }

  function normalizeRow(raw) {
    // Handle header variants
    var productKey = findColumn(raw, ["Product"]);
    var locKey     = findColumn(raw, ["Location"]);
    var roomKey    = findColumn(raw, ["Room"]);
    var catKey     = findColumn(raw, ["Category", "Product Type", "ProductType"]);
    var thcKey     = findColumn(raw, ["THC", "THC%","THC %"]);

    var product = productKey ? safeStr(raw[productKey]) : "";
    if (!product.trim()) return null;

    var rawCat = catKey ? raw[catKey] : "";
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

  function onFileChange(evt) {
    var file = evt.target.files && evt.target.files[0];
    console.log("onFileChange fired ✅");
console.log("File:", file ? file.name : "(none)", "size:", file ? file.size : "(n/a)");
    
    if (!file) return;

    setStatus("running", "JS status: RUNNING ✅ (reading XLSX...)");

    var reader = new FileReader();
    reader.onload = function (e) {
      console.log("FileReader onload ✅ bytes:", e.target.result.byteLength);
      try {
        var bytes = new Uint8Array(e.target.result);
        var wb = XLSX.read(bytes, { type: "array" });
console.log("Workbook sheets:", wb.SheetNames);
        var sheetName = pickFirstNonEmptySheet(wb);
        console.log("Selected sheet:", sheetName);
        var ws = wb.Sheets[sheetName];

// --- Auto-detect the header row (Dutchie exports often have title rows) ---
var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }); // array-of-arrays
var headerRow = -1;

function normCell(x) { return String(x || "").trim().toLowerCase(); }

for (var r = 0; r < Math.min(aoa.length, 50); r++) {
  var row = aoa[r].map(normCell);

  var hasProduct = row.indexOf("product") >= 0;
  var hasLocation = row.indexOf("location") >= 0;
  var hasRoom = row.indexOf("room") >= 0;
  var hasCategory = row.indexOf("category") >= 0 || row.indexOf("product type") >= 0;

  if (hasProduct && (hasLocation || hasRoom || hasCategory)) {
    headerRow = r;
    break;
  }
}

if (headerRow === -1) {
  console.log("Header row not found. First 10 rows:", aoa.slice(0, 10));
  setStatus("error", "JS ERROR: Could not find header row (Product/Location/Category) in first 50 rows.");
  return;
}

// Parse again starting at the header row so keys become real column names
var rawRows = XLSX.utils.sheet_to_json(ws, { defval: "", range: headerRow });
console.log("Detected header row:", headerRow, "RAW ROWS:", rawRows.length);
console.log("FIRST ROW KEYS:", rawRows[0] ? Object.keys(rawRows[0]) : "(none)");console.log("RAW ROWS:", rawRows.length);
console.log("FIRST ROW:", rawRows[0] || "(none)");
console.log("FIRST ROW KEYS:", rawRows[0] ? Object.keys(rawRows[0]) : "(none)");
        var normalized = [];
        for (var i = 0; i < rawRows.length; i++) {
          var n = normalizeRow(rawRows[i]);
          if (n) normalized.push(n);
        }

        allRows = normalized;
console.log("NORMALIZED ROWS:", allRows.length);
        // Reset UI controls
        categorySelect.value = "Flower";
        searchInput.value = "";

        setStatus("running", "JS status: RUNNING ✅ (loaded rows: " + allRows.length + ")");
        render();
      } catch (err) {
        console.error(err);
        setStatus("error", "JS ERROR: " + err.message);
      }
    };

    reader.onerror = function () {
      setStatus("error", "JS ERROR: failed to read file");
    };

    reader.readAsArrayBuffer(file);
  }

  // -------------------------
  // Init
  // -------------------------
  function init() {
    statusEl = document.getElementById("jsStatus");
    fileInput = document.getElementById("fileInput");
    categorySelect = document.getElementById("categorySelect");
    searchInput = document.getElementById("searchInput");

    // If HTML shell isn't present, do nothing
    if (!statusEl || !fileInput || !categorySelect || !searchInput) return;

    if (typeof XLSX === "undefined") {
      setStatus("error", "JS ERROR: XLSX library not loaded. Check /vendor/xlsx.full.min.js");
      return;
    }

    buildHeader();
    initCategoryDropdown();

    categorySelect.addEventListener("change", render);
    searchInput.addEventListener("input", onSearchInput);
    fileInput.addEventListener("change", onFileChange);

    setStatus("running", "JS status: RUNNING ✅ (ready for XLSX)");
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
