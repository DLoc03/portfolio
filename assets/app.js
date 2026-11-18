/* dailoc.dev — Giai đoạn 1: nạp data/profile.json, dựng ô Giới thiệu + ô Đồng hồ */
(function () {
  "use strict";

  var DEFAULT_TZ = "Asia/Ho_Chi_Minh";
  var clockTimer = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function startClock(tz) {
    var hh = document.getElementById("clockHH");
    var mm = document.getElementById("clockMM");
    if (!hh || !mm) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      });
    } catch (e) {
      fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    }
    function tick() {
      var parts = fmt.formatToParts(new Date());
      var h = "--", m = "--";
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === "hour") h = parts[i].value;
        if (parts[i].type === "minute") m = parts[i].value;
      }
      hh.textContent = h;
      mm.textContent = m;
    }
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  }

  function renderIntro(profile, contact) {
    var cell = document.getElementById("introCell");
    if (!cell) return;
    var avatarHtml = profile.avatar
      ? '<div class="avatar"><img src="' + esc(profile.avatar) + '" alt="' + esc(profile.fullName) + '"></div>'
      : '<div class="avatar" aria-hidden="true">' + esc(profile.initial || "") + "</div>";
    var actions = "";
    if (profile.cvUrl) {
      actions += '<a class="btn btn-dark" href="' + esc(profile.cvUrl) + '" download>Tải CV</a>';
    }
    if (contact.linkedin) {
      actions += '<a class="btn btn-light" href="' + esc(contact.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>';
    }
    cell.innerHTML =
      avatarHtml +
      '<h1 class="intro-title">Xin chào, tôi là ' + esc(profile.shortName) + ".</h1>" +
      (profile.bio ? '<p class="intro-bio">' + esc(profile.bio) + "</p>" : "") +
      (actions ? '<div class="intro-actions">' + actions + "</div>" : "");
  }

  function render(data) {
    var site = data.site || {};
    var profile = data.profile || {};
    var contact = data.contact || {};

    if (site.accent) {
      document.documentElement.style.setProperty("--accent", site.accent);
    }
    if (site.domain) {
      document.getElementById("siteDomain").textContent = site.domain;
    }
    if (site.status) {
      document.getElementById("siteStatus").textContent = site.status;
    }
    if (profile.shortName && profile.title) {
      document.title = site.domain + " · " + profile.shortName + " — " + profile.title;
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", profile.shortName + " — " + profile.title);
    }
    if (profile.bio) {
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", profile.bio);
    }

    renderIntro(profile, contact);

    var sub = document.getElementById("clockSub");
    if (sub && profile.location) sub.textContent = profile.location;
    startClock(site.timezone || DEFAULT_TZ);
  }

  function showNotice() {
    var n = document.getElementById("dataNotice");
    if (!n) return;
    n.hidden = false;
    n.textContent = "Chưa đọc được data/profile.json. Trang cần chạy qua máy chủ tĩnh thay vì mở trực tiếp bằng file:// — hãy mở terminal tại thư mục này, chạy: python3 -m http.server 8000, rồi truy cập http://localhost:8000.";
  }

  // Đồng hồ chạy ngay cả khi JSON lỗi (dùng múi giờ mặc định).
  startClock(DEFAULT_TZ);

  /* ---- Đốm sáng theo chuột cho mọi ô; ô nhỏ (.tilt) nghiêng nhẹ theo hướng chuột ----
     Tắt hẳn trên thiết bị cảm ứng (hover: none / pointer thô) và khi prefers-reduced-motion. */
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canHover && !reducedMotion) {
    var cells = document.querySelectorAll(".cell");
    Array.prototype.forEach.call(cells, function (cell) {
      var isTilt = cell.classList.contains("tilt");
      var rafId = null, px = 0, py = 0, w = 0, h = 0;
      function apply() {
        rafId = null;
        if (!w || !h) return;
        cell.style.setProperty("--mx", px + "px");
        cell.style.setProperty("--my", py + "px");
        if (isTilt) {
          var rx = (0.5 - py / h) * 3; /* tối đa ±1.5deg */
          var ry = (px / w - 0.5) * 3;
          cell.style.setProperty("--rx", rx.toFixed(2) + "deg");
          cell.style.setProperty("--ry", ry.toFixed(2) + "deg");
        }
      }
      cell.addEventListener("pointermove", function (e) {
        var rect = cell.getBoundingClientRect();
        px = e.clientX - rect.left;
        py = e.clientY - rect.top;
        w = rect.width;
        h = rect.height;
        if (rafId === null) rafId = requestAnimationFrame(apply);
      });
      cell.addEventListener("pointerleave", function () {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        if (isTilt) {
          cell.style.setProperty("--rx", "0deg");
          cell.style.setProperty("--ry", "0deg");
        }
      });
    });
  }

  if (window.fetch) {
    fetch("data/profile.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(render)
      .catch(showNotice);
  } else {
    showNotice();
  }
})();
