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

  function out(lab, name, text) { var el = lab.querySelector('[data-o="' + name + '"]'); if (el) el.textContent = text; }

  // Meeting problem lab
  document.querySelectorAll('[data-lab="meeting"]').forEach(function (lab) {
    var input = lab.querySelector('[data-k="w"]');
    function draw() {
      var w = +input.value, d = (w / 60) * 200, S = 200;
      lab.querySelector('[data-p="band"]').setAttribute("points", [[0, 0], [d, 0], [S, S - d], [S, S], [S - d, S], [0, d]].map(function (p) { return p.join(","); }).join(" "));
      out(lab, "w", w);
      out(lab, "p", (1 - Math.pow(1 - w / 60, 2)).toFixed(4));
    }
    lab.addEventListener("input", draw);
    draw();
  });

  // Convolution lab: the overlap of two unit bands is the density of U[0,1] + U[0,1].
  document.querySelectorAll('[data-lab="conv"]').forEach(function (lab) {
    var input = lab.querySelector('[data-k="a"]'), W = 320, lo = -1.2, hi = 3.2, BASE = 180, H = 90;
    function X(v) { return ((v - lo) / (hi - lo)) * W; }
    function band(name, from, to) {
      var r = lab.querySelector('[data-r="' + name + '"]');
      r.setAttribute("x", X(from)); r.setAttribute("width", Math.max(X(to) - X(from), 0));
    }
    lab.querySelector('[data-p="tri"]').setAttribute("points", [[lo, 0], [0, 0], [1, 1], [2, 0], [hi, 0]].map(function (p) { return X(p[0]).toFixed(1) + "," + (BASE - p[1] * H); }).join(" "));
    [["x0", 0], ["x1", 1], ["x2", 2]].forEach(function (t) { lab.querySelector('[data-t="' + t[0] + '"]').setAttribute("x", X(t[1])); });
    function draw() {
      var a = +input.value, from = Math.max(0, a - 1), to = Math.min(1, a), f = Math.max(to - from, 0);
      band("fixed", 0, 1); band("moving", a - 1, a); band("overlap", from, from + f);
      var dot = lab.querySelector('[data-c="dot"]');
      dot.setAttribute("cx", X(a)); dot.setAttribute("cy", BASE - f * H);
      out(lab, "a", a.toFixed(2)); out(lab, "f", f.toFixed(2));
    }
    lab.addEventListener("input", draw);
    draw();
  });

  // Binomial vs Poisson lab. Works with logarithms so large n cannot overflow.
  var NS = "http://www.w3.org/2000/svg";
  var logFact = [0];
  function lf(n) { for (var i = logFact.length; i <= n; i++) logFact[i] = logFact[i - 1] + Math.log(i); return logFact[n]; }
  document.querySelectorAll('[data-lab="pmf"]').forEach(function (lab) {
    var W = 320, H = 160, bars = lab.querySelector('[data-g="bars"]'), dots = lab.querySelector('[data-g="dots"]');
    function draw() {
      var n = +lab.querySelector('[data-k="n"]').value, p = +lab.querySelector('[data-k="p"]').value, q = 1 - p, l = n * p;
      out(lab, "n", n); out(lab, "p", p.toFixed(2));
      function bin(k) { return Math.exp(lf(n) - lf(k) - lf(n - k) + k * Math.log(p) + (n - k) * Math.log(q)); }
      function poi(k) { return Math.exp(-l + k * Math.log(l) - lf(k)); }
      var far = Math.max(n, Math.ceil(l + 12 * Math.sqrt(l) + 12)), tv = 0, k;
      for (k = 0; k <= far; k++) tv += Math.abs((k <= n ? bin(k) : 0) - poi(k));
      out(lab, "tv", (tv / 2).toFixed(4));
      out(lab, "e", l.toFixed(2)); out(lab, "v", (l * q).toFixed(2));
      var sd = Math.sqrt(Math.max(l, l * q));
      var lo = Math.max(0, Math.floor(l - 4 * sd - 1)), hi = Math.min(far, Math.ceil(l + 4 * sd + 2)), top = 0;
      for (k = lo; k <= hi; k++) top = Math.max(top, k <= n ? bin(k) : 0, poi(k));
      var step = W / (hi - lo + 1);
      bars.textContent = ""; dots.textContent = "";
      for (k = lo; k <= hi; k++) {
        var x = (k - lo) * step;
        if (k <= n) {
          var h = (bin(k) / top) * (H - 6), r = document.createElementNS(NS, "rect");
          r.setAttribute("x", x + step * 0.1); r.setAttribute("width", Math.max(step * 0.8, 0.5)); r.setAttribute("y", H - h); r.setAttribute("height", h); r.setAttribute("class", "r-leg");
          bars.appendChild(r);
        }
        var c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", x + step / 2); c.setAttribute("cy", H - (poi(k) / top) * (H - 6)); c.setAttribute("r", Math.min(3, Math.max(1.3, step * 0.28))); c.setAttribute("class", "dot");
        dots.appendChild(c);
      }
      lab.querySelector('[data-t="lo"]').textContent = lo;
      lab.querySelector('[data-t="hi"]').textContent = hi;
    }
    lab.addEventListener("input", draw);
    draw();
  });

  // Density lab. Areas come from exact CDFs (regularized incomplete gamma and beta), because numeric integration fails at unbounded densities.
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015, i;
    t -= (x + 0.5) * Math.log(t);
    for (i = 0; i < 6; i++) s += c[i] / ++y;
    return -t + Math.log((2.5066282746310005 * s) / x);
  }
  function pgamma(a, x) {
    if (x <= 0) return 0;
    var i, term, sum, c, d, h, an, b;
    if (x < a + 1) {
      term = sum = 1 / a;
      for (i = 1; i < 500; i++) { term *= x / (a + i); sum += term; if (Math.abs(term) < Math.abs(sum) * 1e-14) break; }
      return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    b = x + 1 - a; c = 1e300; d = 1 / b; h = d;
    for (i = 1; i < 500; i++) {
      an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-14) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function betacf(a, b, x) {
    var c = 1, d = 1 - ((a + b) * x) / (a + 1), h, m, aa, del;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d; h = d;
    for (m = 1; m < 500; m++) {
      aa = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-14) break;
    }
    return h;
  }
  function pbeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (front * betacf(a, b, x)) / a : 1 - (front * betacf(b, a, 1 - x)) / b;
  }
  var LAWS = {
    unif: { p: [["Ліва межа відрізка a", -5, 5, 0.1, 0], ["Довжина b − a", 0.2, 10, 0.1, 4]],
      f: function (x, a, L) { return x >= a && x <= a + L ? 1 / L : 0; },
      F: function (x, a, L) { return Math.min(1, Math.max(0, (x - a) / L)); },
      range: function (a, L) { return [a - L * 0.25, a + L * 1.25]; }, e: function (a, L) { return a + L / 2; }, v: function (a, L) { return (L * L) / 12; } },
    exp: { p: [["Інтенсивність λ", 0.1, 3, 0.05, 1]], f: function (x, l) { return x < 0 ? 0 : l * Math.exp(-l * x); },
      F: function (x, l) { return x <= 0 ? 0 : 1 - Math.exp(-l * x); },
      range: function (l) { return [0, 6 / l]; }, e: function (l) { return 1 / l; }, v: function (l) { return 1 / (l * l); } },
    gamma: { p: [["Форма α", 0.5, 12, 0.1, 3], ["Інтенсивність λ", 0.1, 4, 0.05, 1]],
      f: function (x, a, l) { return x <= 0 ? 0 : Math.exp(a * Math.log(l) + (a - 1) * Math.log(x) - l * x - lgamma(a)); },
      F: function (x, a, l) { return pgamma(a, l * x); },
      range: function (a, l) { return [0, (a + 5 * Math.sqrt(a) + 1) / l]; }, e: function (a, l) { return a / l; }, v: function (a, l) { return a / (l * l); } },
    beta: { p: [["Форма α", 0.25, 8, 0.05, 2], ["Форма β", 0.25, 8, 0.05, 4]],
      f: function (x, a, b) { return x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + lgamma(a + b) - lgamma(a) - lgamma(b)); },
      F: function (x, a, b) { return pbeta(a, b, x); },
      range: function () { return [0, 1]; }, e: function (a, b) { return a / (a + b); }, v: function (a, b) { return (a * b) / ((a + b) * (a + b) * (a + b + 1)); } },
    norm: { p: [["Сподівання μ", -5, 5, 0.1, 0], ["Стандартне відхилення σ", 0.2, 4, 0.05, 1]],
      f: function (x, m, s) { return Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); },
      F: function (x, m, s) { var z = (x - m) / s, h = 0.5 * pgamma(0.5, (z * z) / 2); return z < 0 ? 0.5 - h : 0.5 + h; },
      range: function (m, s) { return [m - 4 * s, m + 4 * s]; }, e: function (m) { return m; }, v: function (m, s) { return s * s; } },
  };
  function fmt(v) { return Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2); }
  document.querySelectorAll('[data-lab="density"]').forEach(function (lab) {
    var W = 320, BASE = 150, TOP = 8, N = 240, select = lab.querySelector("[data-law]"), p1 = lab.querySelector('[data-k="p1"]'), p2 = lab.querySelector('[data-k="p2"]'), A = lab.querySelector('[data-k="a"]'), B = lab.querySelector('[data-k="b"]');
    function configure() {
      var law = LAWS[select.value];
      [p1, p2].forEach(function (input, i) {
        var spec = law.p[i], row = input.closest("label");
        row.hidden = !spec;
        if (!spec) return;
        input.min = spec[1]; input.max = spec[2]; input.step = spec[3]; input.value = spec[4];
        lab.querySelector('[data-l="p' + (i + 1) + '"]').textContent = spec[0];
      });
      draw();
    }
    function draw() {
      var law = LAWS[select.value], a1 = +p1.value, a2 = +p2.value;
      function f(x) { return law.f(x, a1, a2); }
      out(lab, "p1", fmt(a1)); out(lab, "p2", fmt(a2));
      var r = law.range(a1, a2), lo = r[0], hi = r[1], dx = (hi - lo) / N, i, x, peak = 0, ys = [];
      for (i = 0; i <= N; i++) { x = lo + i * dx; ys[i] = f(x); if (isFinite(ys[i]) && ys[i] > peak) peak = ys[i]; }
      // Unbounded densities (shape below 1) must not flatten the whole picture.
      var inner = ys.slice(4, N - 3).reduce(function (m, y) { return isFinite(y) && y > m ? y : m; }, 0);
      var scale = Math.min(peak, inner * 1.6) || 1;
      function X(v) { return ((v - lo) / (hi - lo)) * W; }
      function Y(y) { return BASE - Math.min(y / scale, 1) * (BASE - TOP); }
      var left = Math.min(+A.value, +B.value), right = Math.max(+A.value, +B.value), a = lo + left * (hi - lo), b = lo + right * (hi - lo);
      var d = "";
      for (i = 0; i <= N; i++) d += (i ? "L" : "M") + (i / N * W).toFixed(1) + " " + Y(isFinite(ys[i]) ? ys[i] : scale).toFixed(1);
      lab.querySelector('[data-p="curve"]').setAttribute("d", d);
      var M = 100, h = (b - a) / M, area = "M" + X(a).toFixed(1) + " " + BASE;
      for (i = 0; i <= M; i++) {
        x = a + i * h;
        // The formula can blow up at the end of an open support, so step just inside it.
        var y = f(x); if (!isFinite(y)) y = f(x + h * 1e-3 * (i === 0 ? 1 : -1)); if (!isFinite(y)) y = 0;
        area += "L" + X(x).toFixed(1) + " " + Y(y).toFixed(1);
      }
      area += "L" + X(b).toFixed(1) + " " + BASE + "Z";
      lab.querySelector('[data-p="area"]').setAttribute("d", area);
      out(lab, "a", fmt(a)); out(lab, "b", fmt(b));
      out(lab, "prob", (law.F(b, a1, a2) - law.F(a, a1, a2)).toFixed(4));
      out(lab, "e", fmt(law.e(a1, a2))); out(lab, "v", fmt(law.v(a1, a2)));
      out(lab, "max", peak > scale ? "поза графіком (необмежена)" : fmt(peak));
      lab.querySelector('[data-t="lo"]').textContent = fmt(lo);
      lab.querySelector('[data-t="hi"]').textContent = fmt(hi);
    }
    select.addEventListener("change", configure);
    lab.addEventListener("input", function (e) { if (e.target !== select) draw(); });
    configure();
  });
})();
