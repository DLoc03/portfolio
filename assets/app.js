/* dailoc.dev — Giai đoạn 1: nạp data/profile.json, dựng ô Giới thiệu + ô Đồng hồ */
(function () {
  "use strict";

  var DEFAULT_TZ = "Asia/Ho_Chi_Minh";
  var clockTimer = null;
  var glowEl = document.querySelector(".cursor-glow");

  function glowColorFromHex(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + ",.18)";
  }

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

  /* Tô màu cú pháp tối giản cho ô Đang code: chuỗi '...' xanh dương, biến $... hồng */
  function highlightLine(line) {
    var parts = String(line == null ? "" : line).split(/('[^']*')/g);
    return parts.map(function (p) {
      if (p.charAt(0) === "'") return '<span class="tok-str">' + esc(p) + "</span>";
      return esc(p).replace(/\$[A-Za-z_]\w*/g, '<span class="tok-var">$&</span>');
    }).join("");
  }

  function renderCoding(coding) {
    var cell = document.getElementById("codingCell");
    if (!cell) return;
    if (!coding || !coding.lines || !coding.lines.length) { cell.hidden = true; return; }
    var lines = coding.lines.map(highlightLine);
    lines[lines.length - 1] += '<span class="code-caret" aria-hidden="true"></span>';
    cell.innerHTML =
      '<div class="code-label">Đang code</div>' +
      '<div class="code-box">' + lines.join("\n") + "</div>" +
      (coding.label ? '<div class="code-foot">' + esc(coding.label) + "</div>" : "");
  }

  function renderFocus(focus) {
    var cell = document.getElementById("focusCell");
    if (!cell) return;
    if (!focus || !focus.title) { cell.hidden = true; return; }
    cell.innerHTML =
      '<div class="focus-ring" aria-hidden="true"></div>' +
      "<div>" +
      (focus.label ? '<div class="cell-label">' + esc(focus.label) + "</div>" : "") +
      '<div class="focus-title">' + esc(focus.title) + "</div>" +
      (focus.subtitle ? '<div class="focus-sub">' + esc(focus.subtitle) + "</div>" : "") +
      "</div>";
  }

  /* Icon dạng nét cho badge dự án (khóa icon khai trong profile.json; thiếu icon thì dùng chữ mark) */
  var PROJECT_ICONS = {
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    book: '<path d="M12 6.5C10.2 4.9 7.9 4.3 4 4.3v14.4c3.9 0 6.2.6 8 2.2 1.8-1.6 4.1-2.2 8-2.2V4.3c-3.9 0-6.2.6-8 2.2z"/><path d="M12 6.5v14.4"/>',
    crown: '<path d="M3 8.5 7.5 12 12 5.5 16.5 12 21 8.5 19.6 18H4.4L3 8.5z"/><path d="M5 21h14"/>'
  };

  function projectGlyph(p) {
    if (p.icon && PROJECT_ICONS[p.icon]) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PROJECT_ICONS[p.icon] + "</svg>";
    }
    return esc(p.mark || "");
  }

  function renderProjects(projects) {
    var cell = document.getElementById("projectsCell");
    if (!cell) return;
    var featured = (projects || []).filter(function (p) { return p && p.featured; }).slice(0, 4);
    if (!featured.length) { cell.hidden = true; return; }
    var cards = featured.map(function (p) {
      var inner =
        '<div class="feat-mark" style="background:' + esc(p.color || "#7B61FF") + '">' + projectGlyph(p) + "</div>" +
        '<div class="feat-name">' + esc(p.name) + "</div>" +
        (p.description ? '<div class="feat-desc">' + esc(p.description) + "</div>" : "") +
        (p.link ? '<div class="feat-link">Truy cập <span aria-hidden="true">↗</span></div>' : "");
      if (p.link) return '<a class="feat-card" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + inner + "</a>";
      return '<article class="feat-card">' + inner + "</article>";
    }).join("");
    cell.innerHTML =
      '<div class="proj-head"><h2 class="proj-title">Dự án tiêu biểu</h2><span class="proj-count">' + featured.length + " dự án</span></div>" +
      '<div class="feat-grid">' + cards + "</div>";
  }

  function renderSkills(skills) {
    var cell = document.getElementById("skillsCell");
    if (!cell) return;
    if (!skills || !skills.length) { cell.hidden = true; return; }
    cell.innerHTML =
      '<div class="cell-label">Kỹ năng</div>' +
      '<div class="skill-chips">' +
      skills.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join("") +
      "</div>";
  }

  function renderExperience(experience) {
    var cell = document.getElementById("expCell");
    if (!cell) return;
    var items = (experience || []).filter(function (e) { return e && (e.role || e.org); });
    if (!items.length) { cell.hidden = true; return; }
    var rows = items.map(function (e) {
      var org = e.link
        ? '<a class="exp-org" href="' + esc(e.link) + '" target="_blank" rel="noopener">' + esc(e.org) + "</a>"
        : esc(e.org || "");
      var head = (e.role ? esc(e.role) : "") + (e.role && e.org ? " · " : "") + org;
      return '<div class="exp-item">' +
        '<div class="exp-top"><span class="exp-head">' + head + "</span>" +
        (e.time ? '<span class="exp-time' + (e.current ? " is-current" : "") + '">' + esc(e.time) + "</span>" : "") +
        "</div>" +
        (e.desc ? '<p class="exp-desc">' + esc(e.desc) + "</p>" : "") +
        "</div>";
    }).join("");
    cell.innerHTML = '<div class="cell-label">Kinh nghiệm</div><div class="exp-list">' + rows + "</div>";
  }

  function renderContact(contact) {
    var cell = document.getElementById("contactCell");
    if (!cell) return;
    contact = contact || {};
    if (!contact.email && !contact.linkedin && !contact.github && !contact.phone && !contact.blog) { cell.hidden = true; return; }
    var actions = "";
    if (contact.linkedin) {
      actions += '<a class="btn btn-linkedin" href="' + esc(contact.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>';
    }
    if (contact.github) {
      actions += '<a class="btn btn-light" href="' + esc(contact.github) + '" target="_blank" rel="noopener">GitHub</a>';
    }
    if (contact.blog) {
      actions += '<a class="btn btn-light" href="' + esc(contact.blog) + '" target="_blank" rel="noopener">Blog nhật ký Bạc Xỉu</a>';
    }
    if (contact.phone) {
      actions += '<a class="btn btn-light" href="tel:' + esc(contact.phone.replace(/[\s.]/g, "")) + '">' + esc(contact.phone) + "</a>";
    }
    cell.innerHTML =
      '<div class="cell-label">Liên hệ</div>' +
      (contact.email ? '<a class="contact-email" href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + "</a>" : "") +
      (actions ? '<div class="contact-actions">' + actions + "</div>" : "");
  }

  function renderHobbies(list) {
    var cell = document.getElementById("hobbiesCell");
    if (!cell) return;
    list = Array.isArray(list) ? list.filter(Boolean) : [];
    if (!list.length) { cell.hidden = true; return; }
    cell.innerHTML =
      '<div class="cell-label">Sở thích</div><div class="skill-chips">' +
      list.map(function (h) { return '<span class="chip">' + esc(h) + "</span>"; }).join("") +
      "</div>";
  }

  function setupReveal(scope) {
    var cards = scope.querySelectorAll(".p-card");
    if (!("IntersectionObserver" in window)) {
      cards.forEach(function (c) { c.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { io.observe(c); });
  }

  function renderPersonalProjects(list) {
    var section = document.getElementById("personalSection");
    var grid = document.getElementById("personalGrid");
    if (!section || !grid) return;
    list = Array.isArray(list) ? list : [];
    if (!list.length) { section.hidden = true; return; }
    grid.innerHTML = list.map(function (p) {
      var tags = (p.tags || []).map(function (t) { return '<span class="p-tag">' + esc(t) + "</span>"; }).join("");
      var foot = "";
      if (p.link) {
        foot = '<a class="p-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkText || "Truy cập") + ' <span aria-hidden="true">↗</span></a>';
        if (p.repo) {
          foot += '<a class="p-link p-link-repo" href="' + esc(p.repo) + '" target="_blank" rel="noopener">' + esc(p.repoText || "Mã nguồn") + ' <span aria-hidden="true">↗</span></a>';
        }
      } else if (p.note) {
        foot = '<span class="p-note">' + esc(p.note) + "</span>";
      }
      return '<article class="p-card">' +
        '<div class="feat-mark" style="background:' + esc(p.color || "#7B61FF") + '">' + projectGlyph(p) + "</div>" +
        '<h3 class="p-name">' + esc(p.name) + "</h3>" +
        '<p class="p-desc">' + esc(p.description) + "</p>" +
        (tags ? '<div class="p-tags">' + tags + "</div>" : "") +
        (foot ? '<div class="p-foot">' + foot + "</div>" : "") +
        "</article>";
    }).join("");
    setupReveal(grid);
  }

  function renderFooter(data) {
    var footer = document.getElementById("siteFooter");
    if (!footer) return;
    var right = data.profile.title + (data.profile.company ? " · " + data.profile.company : "");
    footer.innerHTML =
      "<span>© " + new Date().getFullYear() + " " + esc(data.profile.fullName) + "</span>" +
      "<span>" + esc(right) + "</span>";
  }

  function render(data) {
    var site = data.site || {};
    var profile = data.profile || {};
    var contact = data.contact || {};

    if (site.accent) {
      document.documentElement.style.setProperty("--accent", site.accent);
      var gc = glowColorFromHex(site.accent);
      if (gc && glowEl) glowEl.style.setProperty("--glow-color", gc);
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
    renderCoding(data.coding);
    renderFocus(data.currentFocus);
    renderProjects(data.projects);
    renderSkills(data.skills);
    renderExperience(data.experience);
    renderContact(contact);
    renderHobbies(data.hobbies);
    renderPersonalProjects(data.personalProjects);
    renderFooter(data);

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
          var rx = (0.5 - py / h) * 2; /* tối đa ±1deg */
          var ry = (px / w - 0.5) * 2;
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
          /* Gỡ hẳn biến góc nghiêng để transform trả về none, không treo rotate(0deg) */
          cell.style.removeProperty("--rx");
          cell.style.removeProperty("--ry");
        }
      });
    });
  }

  /* ---- Quầng sáng nền đuổi theo con trỏ (lerp 0.12 mỗi khung hình cho mềm) ----
     Chuột rời cửa sổ → bỏ lớp .on, quầng sáng mờ dần trong 0.6s (transition ở CSS). */
  if (glowEl && canHover && !reducedMotion) {
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var gx = tx, gy = ty, glowRaf = null;
    function glowStep() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glowEl.style.setProperty("--cx", gx.toFixed(1) + "px");
      glowEl.style.setProperty("--cy", gy.toFixed(1) + "px");
      if (Math.abs(tx - gx) > 0.1 || Math.abs(ty - gy) > 0.1) {
        glowRaf = requestAnimationFrame(glowStep);
      } else {
        glowRaf = null;
      }
    }
    function glowKick() { if (glowRaf === null) glowRaf = requestAnimationFrame(glowStep); }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      glowEl.classList.add("on");
      glowKick();
    }, { passive: true });
    document.addEventListener("mouseleave", function () { glowEl.classList.remove("on"); });
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget) glowEl.classList.remove("on");
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
