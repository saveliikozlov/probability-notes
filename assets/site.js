(function () {
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  var doc = document.documentElement;

  // Theme
  var themeBtn = document.querySelector("[data-toggle]");
  function themeLabel() { themeBtn.textContent = doc.dataset.theme === "dark" ? "Світла тема" : "Темна тема"; }
  themeLabel();
  themeBtn.addEventListener("click", function () {
    doc.dataset.theme = doc.dataset.theme === "dark" ? "light" : "dark";
    store.set("theme", doc.dataset.theme);
    themeLabel();
  });

  // Mobile contents
  var side = document.getElementById("side");
  document.querySelector("[data-menu]").addEventListener("click", function () { side.classList.toggle("show"); });
  side.addEventListener("click", function (e) { if (e.target.closest("a")) side.classList.remove("show"); });

  // Solved tasks are remembered per browser
  document.querySelectorAll("[data-done]").forEach(function (box) {
    var key = "done:" + box.dataset.done, task = box.closest(".task");
    box.checked = store.get(key) === "1";
    task.classList.toggle("is-done", box.checked);
    box.addEventListener("change", function () {
      task.classList.toggle("is-done", box.checked);
      if (box.checked) store.set(key, "1"); else store.del(key);
    });
  });

  // A link to a task or to content inside a fold must show it
  function openTarget() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    while (el) { if (el.tagName === "DETAILS") el.open = true; el = el.parentElement; }
  }
  addEventListener("hashchange", openTarget);
  openTarget();
  addEventListener("beforeprint", function () { document.querySelectorAll("details").forEach(function (d) { d.open = true; }); });

  // Search
  var box = document.getElementById("searchBox"), input = document.getElementById("searchInput"), list = document.getElementById("searchResults");
  function show(q) {
    q = q.trim().toLowerCase();
    var hits = (window.SEARCH || []).filter(function (x) { return !q || x.t.toLowerCase().indexOf(q) !== -1; }).slice(0, 30);
    list.textContent = "";
    hits.forEach(function (h) {
      var li = document.createElement("li"), a = document.createElement("a"), s = document.createElement("small");
      a.href = h.u; a.textContent = h.t; s.textContent = h.c; a.appendChild(s); li.appendChild(a); list.appendChild(li);
    });
  }
  function openSearch() { box.hidden = false; input.value = ""; show(""); input.focus(); }
  function closeSearch() { box.hidden = true; }
  document.querySelectorAll("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  input.addEventListener("input", function () { show(input.value); });
  box.addEventListener("click", function (e) { if (e.target === box || e.target.closest("a")) closeSearch(); });
  addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    if (e.key === "Escape") closeSearch();
  });

  // Bayes lab
  document.querySelectorAll('[data-lab="bayes"]').forEach(function (lab) {
    var H = 146, W = 320, G = 4;
    function rect(n, x, y, w, h) {
      var el = lab.querySelector('[data-r="' + n + '"]');
      el.setAttribute("x", x); el.setAttribute("y", y); el.setAttribute("width", Math.max(w, 0)); el.setAttribute("height", Math.max(h, 0));
    }
    function draw() {
      var v = {};
      lab.querySelectorAll("input").forEach(function (i) {
        v[i.dataset.k] = +i.value;
        lab.querySelector('[data-o="' + i.dataset.k + '"]').textContent = (+i.value).toFixed(2);
      });
      var sw = (W - G) * v.p, lw = (W - G) * (1 - v.p);
      rect("sn", 0, 0, sw, H); rect("sy", 0, H * (1 - v.a), sw, H * v.a);
      rect("ln", sw + G, 0, lw, H); rect("ly", sw + G, H * (1 - v.b), lw, H * v.b);
      lab.querySelector('[data-t="s"]').setAttribute("x", Math.max(sw / 2, 16));
      lab.querySelector('[data-t="l"]').setAttribute("x", Math.min(sw + G + lw / 2, W - 24));
      var num = v.a * v.p, den = num + v.b * (1 - v.p);
      lab.querySelector('[data-o="post"]').textContent = ((100 * num) / den).toFixed(1) + "%";
    }
    lab.addEventListener("input", draw);
    draw();
  });
})();
