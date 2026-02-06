document.addEventListener("DOMContentLoaded", function () {
  var statusEl = document.getElementById("jsStatus");
  if (!statusEl) return;

  statusEl.textContent = "JS status: RUNNING ✅ (app.js loaded)";
  statusEl.className = "status running";

  console.log("app/app.js loaded ✅");
});
