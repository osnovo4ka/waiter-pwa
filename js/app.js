/* Основная логика приложения «Официант». */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");

  /* ---------- утилиты ---------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU") + " ₽";
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MONTHS_N = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const pad = (n) => String(n).padStart(2, "0");
  const dt = (iso) => new Date(iso);
  const hhmm = (iso) => { const d = dt(iso); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const dmy = (iso) => { const d = dt(iso); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); };
  const dayKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").trim();

  function toast(msg) {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .25s"; }, 1900);
    setTimeout(() => el.remove(), 2300);
  }

  /* ---------- UI-состояние (не сохраняется) ---------- */
  const ui = {
    tab: "tables",       // tables | menu | orders | shift | history
    zone: "main",
    orderId: null,       // открытый активный заказ
    modal: null,         // {type:'item'|'confirm'|'merge'|'detail', ...}
    search: "",
    category: null,
    stopMode: false,
    month: new Date().getFullYear() * 12 + new Date().getMonth(),
    day: null,
    detail: null,        // просмотр закрытого заказа
    screen: "start",     // start | main
  };

  /* ---------- селекторы данных ---------- */
  const S = () => Store.state;
  const orderById = (id) => (id ? S().orders[id] || null : null);
  const activeOrders = () => Object.values(S().orders).filter((o) => o.status === "open");
  const ordersOfShift = (shiftId) => Object.values(S().orders).filter((o) => o.shiftId === shiftId && o.status === "closed");
  const orderForTable = (tid) => activeOrders().find((o) => o.tableIds.includes(tid)) || null;
  const tableById = (id) => window.TABLES.find((t) => t.id === id);
  const isStopped = (menuItemId) => S().stopList.includes(menuItemId);
  const lineTotal = (l) => l.unitPrice * l.qty;
  const orderSum = (o) => (o.items || []).reduce((s, l) => s + lineTotal(l), 0);
  const orderCount = (o) => (o.items || []).reduce((s, l) => s + l.qty, 0);
  const orderLabel = (o) => {
    const ts = o.tableIds.map(tableById);
    if (ts.length === 1) return ts[0].label;
    const main = ts.filter((t) => t.zone === "main").sort((a, b) => parseInt(a.short, 10) - parseInt(b.short, 10));
    const vip = ts.filter((t) => t.zone === "vip").sort((a, b) => parseInt(a.short, 10) - parseInt(b.short, 10));
    if (!vip.length) return "Стол " + main.map((t) => t.short).join(" + ");
    if (!main.length) return "VIP " + vip.map((t) => t.short.replace("VIP ", "")).join(" + ");
    return ts.map((t) => t.label).join(" + ");
  };

  function shiftStats(shiftId) {
    const list = ordersOfShift(shiftId);
    const revenue = list.reduce((s, o) => s + orderSum(o), 0);
    const tips = list.reduce((s, o) => s + (o.tips || 0), 0);
    const tables = new Set();
    list.forEach((o) => o.tableIds.forEach((t) => tables.add(t)));
    return {
      orders: list.length,
      revenue,
      tips,
      tables: tables.size,
      avg: list.length ? revenue / list.length : 0,
      avgTip: list.length ? tips / list.length : 0,
      list,
    };
  }

  function popularItems(limit = 8) {
    const counts = {};
    Object.values(S().orders).forEach((o) => {
      if (o.status !== "closed") return;
      o.items.forEach((l) => {
        counts[l.menuItemId] = (counts[l.menuItemId] || 0) + l.qty;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, n]) => ({ item: window.MENU.items.find((m) => m.id === id), n }))
      .filter((x) => x.item);
  }

  const searchItems = (q) => {
    const n = norm(q);
    if (!n) return null;
    return window.MENU.items.filter((it) => {
      const cat = window.MENU.categories.find((c) => c.id === it.categoryId);
      const mods = (it.modifierGroups || [])
        .flatMap((g) => (window.MENU.groups[g] ? window.MENU.groups[g].options : []))
        .concat((it.extraGroups || []).flatMap((g) => g.options || []))
        .map((o) => o.name)
        .join(" ");
      const hay = norm([it.name, it.description, it.ingredients, cat && cat.name, mods].join(" "));
      return hay.includes(n);
    });
  };

  /* ---------- действия со сменой ---------- */
  async function startShift() {
    const shift = {
      id: Store.uid("shift"),
      startedAt: new Date().toISOString(),
      endedAt: null,
      closed: false,
    };
    S().activeShift = shift;
    await Store.save();
    ui.screen = "main";
    ui.tab = "tables";
    toast("Смена начата");
    render();
  }

  async function continueShift() {
    ui.screen = "main";
    ui.tab = "tables";
    render();
  }

  async function closeShift() {
    const st = shiftStats(S().activeShift.id);
    ui.modal = {
      type: "confirm",
      title: "Закрыть смену?",
      text:
        "Обслужено столов: " + st.tables + "\nЗаказов: " + st.orders + "\nСумма заказов: " + money(st.revenue) +
        "\nЧаевые: " + money(st.tips),
      dangerLabel: "Закрыть смену",
      onOk: async () => {
        const shift = S().activeShift;
        shift.closed = true;
        shift.endedAt = new Date().toISOString();
        S().shifts.push(shift);
        S().activeShift = null;
        S().orders = {};
        ui.orderId = null;
        ui.detail = shift.id;
        ui.tab = "history";
        ui.day = dayKey(new Date(shift.endedAt));
        await Store.save();
        toast("Смена закрыта");
        render();
      },
    };
    render();
  }

  /* ---------- действия со столами и заказами ---------- */
  async function openTable(tableId) {
    const existing = orderForTable(tableId);
    if (existing) {
      ui.orderId = existing.id;
      ui.tab = "tables";
      render();
      return;
    }
    if (!S().activeShift) {
      toast("Сначала начните смену");
      ui.screen = "start";
      render();
      return;
    }
    const order = {
      id: Store.uid("ord"),
      tableIds: [tableId],
      status: "open",
      shiftId: S().activeShift.id,
      openedAt: new Date().toISOString(),
      closedAt: null,
      items: [],
      tips: 0,
    };
    S().orders[order.id] = order;
    ui.orderId = order.id;
    await Store.save();
    render();
  }

  async function mergeTables(targetId, sourceId) {
    const a = orderById(targetId);
    const b = orderById(sourceId);
    if (!a || !b || a.id === b.id) return;
    a.items = a.items.concat(b.items);
    b.tableIds.forEach((t) => { if (!a.tableIds.includes(t)) a.tableIds.push(t); });
    delete S().orders[b.id];
    if (ui.orderId === b.id) ui.orderId = a.id;
    await Store.save();
    ui.modal = null;
    toast("Столы объединены: " + orderLabel(a));
    render();
  }

  function askDeleteLine(orderId, uid) {
    const o = orderById(orderId);
    const line = o.items.find((l) => l.uid === uid);
    if (!line) return;
    ui.modal = {
      type: "confirm",
      title: "Удалить " + line.name + " ×" + line.qty + "?",
      text: "Действие нельзя отменить.",
      okLabel: "Удалить",
      danger: true,
      onOk: async () => {
        o.items = o.items.filter((l) => l.uid !== uid);
        await Store.save();
        toast("Позиция удалена");
        ui.modal = null;
        render();
      },
    };
    render();
  }

  async function changeQty(orderId, uid, delta) {
    const o = orderById(orderId);
    const line = o.items.find((l) => l.uid === uid);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) {
      askDeleteLine(orderId, uid);
      return;
    }
    await Store.save();
    render();
  }

  /* ---------- модалка позиции ---------- */
  function getGroups(item, sel) {
    const groups = [];
    (item.modifierGroups || []).forEach((g) => groups.push(window.MENU.groups[g]));
    (item.extraGroups || []).forEach((g) => groups.push(g));
    return groups.filter((g) => {
      if (!g) return false;
      if (item.sauceWhen === "freeSauce" && g.id === "sauces") {
        // Соус показывается только когда выбранный объём даёт его бесплатно.
        const sizeGroups = (item.extraGroups || []).filter((x) => (x.options || []).some((o) => o.freeSauce));
        return sizeGroups.some((sg) => {
          const chosen = (sel[sg.id] || [])[0];
          const opt = sg.options.find((o) => o.id === chosen);
          return !!(opt && opt.freeSauce);
        });
      }
      return true;
    });
  }

  function openItemModal(menuItemId, editLine = null) {
    const item = window.MENU.items.find((m) => m.id === menuItemId);
    if (!item) return;
    if (!editLine && isStopped(item.id)) {
      toast("Нет в наличии");
      return;
    }
    const sel = {};
    const groups = getGroups(item, {});
    groups.forEach((g) => {
      if (g.options && g.options.length && (g.required || g.replacesPrice)) sel[g.id] = [g.options[0].id];
      else sel[g.id] = [];
    });
    if (editLine) {
      (editLine.mods || []).forEach((m) => {
        if (!sel[m.groupId]) sel[m.groupId] = [];
        if (!sel[m.groupId].includes(m.optId)) sel[m.groupId].push(m.optId);
      });
      const varMod = (editLine.mods || []).find((m) => m.variant);
      if (varMod) sel[varMod.groupId] = [varMod.optId];
    }
    ui.modal = {
      type: "item",
      itemId: item.id,
      editUid: editLine ? editLine.uid : null,
      qty: editLine ? editLine.qty : 1,
      sel,
      comment: editLine ? editLine.comment || "" : "",
      removed: editLine ? (editLine.removed || []).slice() : [],
    };
    render();
  }

  function computeLine(modal) {
    const item = window.MENU.items.find((m) => m.id === modal.itemId);
    const groups = getGroups(item, modal.sel);
    let base = item.price;
    let variantLabel = "";
    const mods = [];
    groups.forEach((g) => {
      (modal.sel[g.id] || []).forEach((oid) => {
        const opt = g.options.find((o) => o.id === oid);
        if (!opt) return;
        if (g.replacesPrice) {
          base = opt.price;
          variantLabel = opt.name;
        } else if (g.multi || g.free || opt.price > 0 || g.options.length > 1) {
          mods.push({ groupId: g.id, optId: opt.id, name: opt.name, price: opt.price || 0 });
        } else {
          mods.push({ groupId: g.id, optId: opt.id, name: opt.name, price: opt.price || 0 });
        }
      });
    });
    const modSum = mods.reduce((s, m) => s + m.price, 0);
    return {
      uid: modal.editUid || Store.uid("line"),
      menuItemId: item.id,
      name: variantLabel ? item.name + " · " + variantLabel : item.name,
      basePrice: base,
      qty: modal.qty,
      mods,
      modSum,
      removed: modal.removed.slice(),
      comment: modal.comment.trim(),
      unitPrice: base + modSum,
    };
  }

  async function addItemToOrder(modal) {
    const o = orderById(ui.orderId);
    if (!o || o.status !== "open") {
      toast("Откройте стол");
      ui.modal = null;
      ui.tab = "tables";
      render();
      return;
    }
    const line = computeLine(modal);
    if (modal.editUid) {
      const idx = o.items.findIndex((l) => l.uid === modal.editUid);
      if (idx >= 0) o.items[idx] = line;
      toast("Позиция обновлена");
    } else {
      o.items.push(line);
      const item = window.MENU.items.find((m) => m.id === line.menuItemId);
      toast(item.name + " добавлен");
    }
    await Store.save();
    ui.modal = null;
    render();
  }

  /* ---------- закрытие стола ---------- */
  async function payOrder(orderId, tips) {
    const o = orderById(orderId);
    if (!o) return;
    o.status = "closed";
    o.tips = Math.max(0, Number(tips) || 0);
    o.closedAt = new Date().toISOString();
    o.closedLabel = orderLabel(o);
    await Store.save();
    ui.modal = null;
    ui.orderId = null;
    ui.tab = "tables";
    toast("Стол закрыт · заказ сохранён");
    render();
  }

  /* ---------- стоп-лист ---------- */
  async function toggleStop(id) {
    const list = S().stopList;
    const i = list.indexOf(id);
    const item = window.MENU.items.find((m) => m.id === id);
    if (i >= 0) {
      list.splice(i, 1);
      toast(item.name + " — снова в наличии");
    } else {
      list.push(id);
      toast("«" + item.name + "» — нет в наличии");
    }
    await Store.save();
    render();
  }

  /* ---------- рендер ---------- */
  function render() {
    if (!S().activeShift && ui.screen !== "start") ui.screen = "start";
    if (ui.screen === "start") {
      app.innerHTML = renderStart();
    } else {
      app.innerHTML = renderShell();
    }
    bind();
  }

  function renderStart() {
    const active = S().activeShift;
    const n = activeOrders().length;
    const now = new Date();
    if (active) {
      const st = shiftStats(active.id);
      return `
      <div class="hero-start">
        <div class="brand"><div class="logo">ОФ</div><div><h1>Официант</h1><p>Цифровой блокнот</p></div></div>
        <div class="hero-mark">Смена<br><span>активна</span></div>
        <p class="hero-sub">Можно продолжить работу — все заказы на месте.</p>
        <div class="meta-row">
          <div class="chip">Дата: <b>${esc(dmy(active.startedAt))}</b></div>
          <div class="chip">Начало: <b>${hhmm(active.startedAt)}</b></div>
          <div class="chip">Столов: <b>${n}</b></div>
          <div class="chip">Чеков: <b>${st.orders}</b></div>
        </div>
        <button class="btn primary" data-act="continue">ПРОДОЛЖИТЬ СМЕНУ</button>
        <div style="height:8px"></div>
        <button class="btn ghost block" data-act="tab" data-tab="history">История смен</button>
      </div>`;
    }
    return `
      <div class="hero-start">
        <div class="brand"><div class="logo">ОФ</div><div><h1>Официант</h1><p>Цифровой блокнот</p></div></div>
        <div class="hero-mark">Быстрый<br><span>заказ</span></div>
        <p class="hero-sub">Стол → заказ → меню → итог → чаевые → закрыть → история.</p>
        <div class="meta-row">
          <div class="chip">Дата: <b>${dmy(now.toISOString())}</b></div>
          <div class="chip">Время: <b>${hhmm(now.toISOString())}</b></div>
          <div class="chip">Активных столов: <b>0</b></div>
        </div>
        <button class="btn primary" data-act="start">НАЧАТЬ СМЕНУ</button>
        <div style="height:8px"></div>
        <button class="btn ghost block" data-act="tab" data-tab="history">История смен</button>
      </div>`;
  }

  function nav() {
    const tabs = [
      ["tables", "🪑", "Столы"],
      ["menu", "🍴", "Меню"],
      ["orders", "📋", "Заказы"],
      ["shift", "📊", "Смена"],
      ["history", "🗓", "История"],
    ];
    return `<nav class="nav">${tabs
      .map(([id, ic, lb]) => `<button data-act="tab" data-tab="${id}" class="${ui.tab === id ? "on" : ""}"><span class="ic">${ic}</span>${lb}</button>`)
      .join("")}</nav>`;
  }

  function renderShell() {
    let body = "";
    if (ui.tab === "tables") body = ui.orderId && orderById(ui.orderId) ? screenOrder() : screenTables();
    else if (ui.tab === "menu") body = screenMenu();
    else if (ui.tab === "orders") body = screenOrders();
    else if (ui.tab === "shift") body = screenShift();
    else if (ui.tab === "history") body = screenHistory();
    return body + nav() + renderModal();
  }

  /* ---------- экран: столы ---------- */
  function screenTables() {
    const shift = S().activeShift;
    const st = shift ? shiftStats(shift.id) : null;
    const list = window.TABLES.filter((t) => t.zone === ui.zone);
    return `
    <section class="screen">
      <div class="topbar">
        <div>
          <h2>Столы</h2>
          <p class="muted">${shift ? "Смена · " + hhmm(shift.startedAt) + " · " + dmy(shift.startedAt) : "Смена не начата"}</p>
        </div>
        <button class="icon-btn" data-act="tab" data-tab="menu" title="Меню">🔍</button>
      </div>
      ${
        st
          ? `<div class="stats">
              <div class="stat"><div class="k">Обслужено столов</div><div class="v">${st.tables}</div></div>
              <div class="stat"><div class="k">Закрыто заказов</div><div class="v">${st.orders}</div></div>
              <div class="stat"><div class="k">Сумма заказов</div><div class="v lime">${money(st.revenue)}</div></div>
              <div class="stat"><div class="k">Чаевые</div><div class="v pink">${money(st.tips)}</div></div>
            </div>`
          : `<div class="line" style="margin-bottom:12px">
              <div class="head"><span>Смена не начата</span></div>
              <div class="sub">Столы откроются после начала смены</div>
              <div class="actions"><button class="btn primary" data-act="start" style="min-height:46px">НАЧАТЬ СМЕНУ</button></div>
            </div>`
      }
      <div class="zones">
        <button data-act="zone" data-zone="main" class="${ui.zone === "main" ? "on" : ""}">ОСНОВНАЯ ЗОНА</button>
        <button data-act="zone" data-zone="vip" class="${ui.zone === "vip" ? "on" : ""}">VIP</button>
      </div>
      <div class="grid">
        ${list.map((t, i) => {
          const o = orderForTable(t.id);
          const busy = !!o;
          return `<button class="table-card ${busy ? "busy" : ""}" style="animation-delay:${i * 12}ms" data-act="table" data-id="${t.id}">
            <div class="num">${esc(t.label)}</div>
            <div class="st">${busy ? "🟠 Обслуживается" : "🟢 Свободен"}</div>
            ${busy ? `<div class="sum">${money(orderSum(o))}</div><div class="cnt">${orderCount(o)} позиций · ${esc(orderLabel(o))}</div>` : ""}
          </button>`;
        }).join("")}
      </div>
    </section>`;
  }

  /* ---------- экран: активный заказ ---------- */
  function screenOrder() {
    const o = orderById(ui.orderId);
    if (!o) { ui.orderId = null; return screenTables(); }
    const sum = orderSum(o);
    return `
    <section class="screen">
      <div class="backline">
        <button class="icon-btn" data-act="back-tables">←</button>
        <div>
          <h2 style="margin:0;font-size:24px;letter-spacing:-.04em">${esc(orderLabel(o))}</h2>
          <p class="muted">открыт в ${hhmm(o.openedAt)} · ${esc(dmy(o.openedAt))}</p>
        </div>
      </div>
      <div class="section-title">Заказ</div>
      ${
        o.items.length
          ? o.items
              .map((l) => {
                const mods = (l.mods || []).filter((m) => m.price > 0).map((m) => "+ " + m.name + " " + money(m.price)).join(", ");
                const free = (l.mods || []).filter((m) => m.price === 0).map((m) => m.name).join(", ");
                const rem = (l.removed || []).length ? "Без: " + l.removed.join(", ") : "";
                return `<div class="line">
                  <div class="head">
                    <span>${esc(l.name)}</span>
                    <span>${money(lineTotal(l))}</span>
                  </div>
                  <div class="sub">${l.qty} × ${money(l.unitPrice)}${l.unitPrice !== l.basePrice ? " (цена " + money(l.basePrice) + " + допы)" : ""}</div>
                  ${mods ? `<div class="sub">${esc(mods)}</div>` : ""}
                  ${free ? `<div class="sub">${esc(free)}</div>` : ""}
                  ${rem ? `<div class="sub">${esc(rem)}</div>` : ""}
                  ${l.comment ? `<div class="sub" style="color:#ff8ab4">💬 ${esc(l.comment)}</div>` : ""}
                  <div class="actions">
                    <button class="mini" data-act="qty" data-uid="${l.uid}" data-d="-1">−</button>
                    <b>${l.qty}</b>
                    <button class="mini" data-act="qty" data-uid="${l.uid}" data-d="1">+</button>
                    <button class="mini" data-act="edit-line" data-uid="${l.uid}">Изменить</button>
                    <button class="mini" data-act="del-line" data-uid="${l.uid}" style="color:#ffb1a6">✕</button>
                  </div>
                </div>`;
              })
              .join("")
          : `<div class="empty">Заказ пуст.<br>Нажмите «+ Добавить», чтобы взять позиции из меню.</div>`
      }
      <div class="total-bar">
        <div class="row-price"><span>ИТОГО</span><b>${money(sum)}</b></div>
        <button class="btn primary" data-act="add">+ ДОБАВИТЬ</button>
        <div class="footer-actions">
          <button class="btn ghost" data-act="merge">Объединить</button>
          <button class="btn pink" data-act="close-table" ${o.items.length ? "" : "disabled"}>Закрыть стол</button>
        </div>
      </div>
    </section>`;
  }

  /* ---------- экран: меню ---------- */
  function screenMenu() {
    const res = searchItems(ui.search);
    const cats = window.MENU.categories;
    const cat = ui.category;
    const items = res ? res : cat ? window.MENU.items.filter((m) => m.categoryId === cat) : window.MENU.items;
    const pops = !res && !cat ? popularItems() : [];
    const target = ui.orderId && orderById(ui.orderId) ? orderLabel(orderById(ui.orderId)) : null;

    const listHtml = items.length
      ? items
          .map((it) => {
            const stopped = isStopped(it.id);
            return `<button class="item ${stopped ? "stop" : ""}" data-act="${ui.stopMode ? "stop-toggle" : "pick"}" data-id="${it.id}">
              <div class="info">
                <div class="name">${esc(it.name)}</div>
                <div class="desc">${esc(it.description || "")}</div>
                ${stopped ? `<span class="badge">НЕТ В НАЛИЧИИ</span>` : ""}
              </div>
              <div class="price">${money(it.price)}</div>
            </button>`;
          })
          .join("")
      : `<div class="empty">Ничего не найдено<br><span style="font-size:13px">Поиск идёт по названию, категории, составу и модификаторам</span></div>`;

    return `
    <section class="screen">
      <div class="topbar">
        <div>
          <h2>Меню</h2>
          <p class="muted">${target ? "Добавляем в " + esc(target) : ui.stopMode ? "Режим стоп-листа" : "Выберите стол, чтобы добавлять"}</p>
        </div>
        <button class="icon-btn" data-act="stop-mode" style="${ui.stopMode ? "background:#3a1612;color:#ffb1a6;border-color:#5a221b" : ""}" title="Стоп-лист">🚫</button>
      </div>
      <input class="search" id="q" placeholder="Поиск по всему меню…" value="${esc(ui.search)}" autocomplete="off" />
      ${pops.length ? `<div class="section-title">🔥 Популярное</div>
        <div class="popular">
          ${pops.map((p) => `<button class="pop" data-act="${ui.stopMode ? "stop-toggle" : "pick"}" data-id="${p.item.id}">
            <div class="name">${esc(p.item.name)}</div>
            <div class="price">${money(p.item.price)}</div>
            <div style="font-size:11px;color:#a3988c">заказывали ${p.n}×</div>
          </button>`).join("")}
        </div>` : ""}
      <div class="hscroll">
        <button class="pill ${!cat ? "on" : ""}" data-act="cat" data-cat="">Все</button>
        ${cats.map((c) => `<button class="pill ${cat === c.id ? "on" : ""}" data-act="cat" data-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join("")}
      </div>
      ${ui.stopMode ? `<div class="section-title">Отметьте блюдо как недоступное</div>` : ""}
      ${listHtml}
    </section>`;
  }

  /* ---------- экран: активные заказы ---------- */
  function screenOrders() {
    const list = activeOrders().sort((a, b) => a.openedAt.localeCompare(b.openedAt));
    return `
    <section class="screen">
      <div class="topbar"><div><h2>Заказы</h2><p class="muted">Активные столы</p></div></div>
      ${
        list.length
          ? list
              .map(
                (o) => `<button class="item order-card" data-act="open-order" data-id="${o.id}">
                  <div class="info">
                    <div class="name">🟠 ${esc(orderLabel(o))}</div>
                    <div class="desc">открыт ${hhmm(o.openedAt)} · ${orderCount(o)} позиций · ${o.tableIds.map((t) => tableById(t).label).join(", ")}</div>
                  </div>
                  <div class="price">${money(orderSum(o))}</div>
                </button>`
              )
              .join("")
          : `<div class="empty">Нет активных заказов</div>`
      }
    </section>`;
  }

  /* ---------- экран: смена ---------- */
  function screenShift() {
    const shift = S().activeShift;
    if (!shift) {
      return `<section class="screen">
        <div class="topbar"><div><h2>Смена</h2></div></div>
        <div class="empty">Смена не начата</div>
        <button class="btn primary" data-act="start">НАЧАТЬ СМЕНУ</button>
      </section>`;
    }
    const st = shiftStats(shift.id);
    return `
    <section class="screen">
      <div class="topbar"><div><h2>Смена</h2><p class="muted">с ${hhmm(shift.startedAt)} · ${dmy(shift.startedAt)}</p></div></div>
      <div class="stats">
        <div class="stat"><div class="k">Обслужено столов</div><div class="v">${st.tables}</div></div>
        <div class="stat"><div class="k">Закрыто заказов</div><div class="v">${st.orders}</div></div>
        <div class="stat"><div class="k">Сумма заказов</div><div class="v lime">${money(st.revenue)}</div></div>
        <div class="stat"><div class="k">Чаевые</div><div class="v pink">${money(st.tips)}</div></div>
        <div class="stat"><div class="k">Средний чек</div><div class="v">${money(st.avg)}</div></div>
        <div class="stat"><div class="k">Средние чаевые на стол</div><div class="v">${money(st.avgTip)}</div></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="k">Активных столов</div><div class="v">${activeOrders().length}</div></div>
        <div class="stat"><div class="k">Всего с чаевыми</div><div class="v lime">${money(st.revenue + st.tips)}</div></div>
      </div>
      <div class="section-title">Закрытые заказы смены</div>
      ${
        st.list.length
          ? st.list
              .slice()
              .reverse()
              .map(
                (o) => `<button class="item" data-act="detail" data-id="${o.id}">
                  <div class="info"><div class="name">${esc(o.closedLabel || orderLabel(o))}</div>
                  <div class="desc">${hhmm(o.openedAt)} → ${hhmm(o.closedAt)} · чаевые ${money(o.tips || 0)}</div></div>
                  <div class="price">${money(orderSum(o))}</div>
                </button>`
              )
              .join("")
          : `<div class="empty">Закрытых заказов пока нет</div>`
      }
      <div style="height:14px"></div>
      <button class="btn danger block" data-act="close-shift">ЗАКРЫТЬ СМЕНУ</button>
    </section>`;
  }

  /* ---------- экран: история ---------- */
  function screenHistory() {
    if (ui.detail) return historyDetail();
    const year = Math.floor(ui.month / 12);
    const month = ui.month % 12;
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const byDay = {};
    S().shifts.forEach((s) => {
      const k = dayKey(new Date(s.startedAt));
      (byDay[k] = byDay[k] || []).push(s);
    });
    if (S().activeShift) {
      const k = dayKey(new Date(S().activeShift.startedAt));
      (byDay[k] = byDay[k] || []).push(S().activeShift);
    }
    const dows = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    let cells = "";
    for (let i = 0; i < startDow; i++) cells += `<div></div>`;
    for (let d = 1; d <= days; d++) {
      const k = dayKey(new Date(year, month, d));
      const has = !!byDay[k];
      const on = ui.day === k;
      cells += `<button class="day ${has ? "has" : ""} ${on ? "on" : ""}" data-act="day" data-day="${k}">${d}</button>`;
    }
    const dayShifts = ui.day ? (byDay[ui.day] || []) : [];
    return `
    <section class="screen">
      <div class="topbar"><div><h2>История</h2><p class="muted">Закрытые смены</p></div></div>
      <div class="month-nav">
        <button class="icon-btn" data-act="month" data-d="-1">‹</button>
        <b>${MONTHS_N[month]} ${year}</b>
        <button class="icon-btn" data-act="month" data-d="1">›</button>
      </div>
      <div class="cal">
        ${dows.map((d) => `<div class="dow">${d}</div>`).join("")}
        ${cells}
      </div>
      ${
        ui.day
          ? `<div class="section-title">${dmy(ui.day + "T12:00:00")}</div>` +
            (dayShifts.length
              ? dayShifts
                  .map((s) => {
                    const st = shiftStats(s.id);
                    return `<div class="line">
                      <div class="head"><span>Смена ${hhmm(s.startedAt)} → ${s.endedAt ? hhmm(s.endedAt) : "—"}</span></div>
                      <div class="sub">Столов: ${st.tables} · Заказов: ${st.orders} · Средний чек: ${money(st.avg)}</div>
                      <div class="sub">Заказы: <b style="color:#c6f54a">${money(st.revenue)}</b> · Чаевые: <b style="color:#ff8ab4">${money(st.tips)}</b></div>
                      <div class="actions"><button class="mini" data-act="open-shift" data-id="${s.id}">Открыть заказы</button></div>
                    </div>`;
                  })
                  .join("")
              : `<div class="empty">В этот день смен не было</div>`)
          : `<div class="empty">Выберите дату</div>`
      }
    </section>`;
  }

  function historyDetail() {
    const shift = S().shifts.find((s) => s.id === ui.detail) || (S().activeShift && S().activeShift.id === ui.detail ? S().activeShift : null);
    if (!shift) { ui.detail = null; return screenHistory(); }
    const st = shiftStats(shift.id);
    const open = !shift.closed;
    return `
    <section class="screen">
      <div class="backline">
        <button class="icon-btn" data-act="back-history">←</button>
        <div><h2 style="margin:0;font-size:24px">${dmy(shift.startedAt)}</h2>
        <p class="muted">${hhmm(shift.startedAt)} → ${shift.endedAt ? hhmm(shift.endedAt) : "идёт"}</p></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="k">Обслужено столов</div><div class="v">${st.tables}</div></div>
        <div class="stat"><div class="k">Заказов</div><div class="v">${st.orders}</div></div>
        <div class="stat"><div class="k">Сумма заказов</div><div class="v lime">${money(st.revenue)}</div></div>
        <div class="stat"><div class="k">Чаевые</div><div class="v pink">${money(st.tips)}</div></div>
      </div>
      <div class="section-title">Закрытые заказы</div>
      ${
        st.list.length
          ? st.list
              .slice()
              .reverse()
              .map(
                (o) => `<button class="item" data-act="detail" data-id="${o.id}">
                  <div class="info"><div class="name">${esc(o.closedLabel || orderLabel(o))}</div>
                  <div class="desc">открыт ${hhmm(o.openedAt)} · закрыт ${o.closedAt ? hhmm(o.closedAt) : "—"} · чаевые ${money(o.tips || 0)}</div></div>
                  <div class="price">${money(orderSum(o))}</div>
                </button>`
              )
              .join("")
          : `<div class="empty">${open ? "Заказов ещё нет" : "Заказов не было"}</div>`
      }
      ${open ? `<div style="height:12px"></div><button class="btn primary" data-act="continue">ВЕРНУТЬСЯ К СМЕНЕ</button>` : ""}
    </section>`;
  }

  /* ---------- модальные окна ---------- */
  function renderModal() {
    const m = ui.modal;
    if (!m) return "";
    if (m.type === "confirm") {
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <h3>${esc(m.title)}</h3>
          <p class="muted" style="white-space:pre-line">${esc(m.text || "")}</p>
          <div class="confirm">
            <button class="btn ghost" data-act="close-modal">Отмена</button>
            <button class="btn ${m.danger ? "danger" : "primary"}" data-act="ok" style="width:100%">${esc(m.okLabel || "Да")}</button>
          </div>
        </div>
      </div>`;
    }
    if (m.type === "close") {
      const o = orderById(m.orderId);
      const sum = orderSum(o);
      const tips = Number(m.tips) || 0;
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <h3>${esc(orderLabel(o))}</h3>
          <p class="muted">Итог заказа · открыт ${hhmm(o.openedAt)}</p>
          <hr class="sep" />
          ${o.items
            .map(
              (l) => `<div class="line" style="margin-bottom:6px">
                <div class="head"><span>${esc(l.name)} ×${l.qty}</span><span>${money(lineTotal(l))}</span></div>
                ${l.comment ? `<div class="sub" style="color:#ff8ab4">💬 ${esc(l.comment)}</div>` : ""}
              </div>`
            )
            .join("")}
          <hr class="sep" />
          <div class="row-price"><span>ИТОГО</span><b>${money(sum)}</b></div>
          <div class="section-title">Чаевые</div>
          <input class="tips" id="tips" inputmode="numeric" placeholder="0 ₽" value="${tips ? tips : ""}" />
          <div class="quick">
            ${[100, 300, 500, 1000].map((v) => `<button data-act="tip" data-v="${v}">${v}</button>`).join("")}
            <button data-act="tip" data-v="0">0</button>
          </div>
          <div class="line">
            <div class="head"><span>Итого заказа</span><span>${money(sum)}</span></div>
            <div class="sub">Чаевые: ${money(tips)}</div>
            <div class="head" style="margin-top:6px;color:#c6f54a"><span>Всего</span><span>${money(sum + tips)}</span></div>
          </div>
          <div style="height:12px"></div>
          <button class="btn primary" data-act="pay" ${o.items.length ? "" : "disabled"}>ОПЛАЧЕНО</button>
        </div>
      </div>`;
    }
    if (m.type === "item") {
      const item = window.MENU.items.find((x) => x.id === m.itemId);
      const groups = getGroups(item, m.sel);
      const line = computeLine(m);
      const cats = window.MENU.categories.find((c) => c.id === item.categoryId);
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <div class="section-title" style="margin:0">${esc(cats ? cats.name : "")}</div>
          <h3>${esc(item.name)}</h3>
          <p class="muted">${esc(item.description || "")}</p>
          <div class="qty">
            <button data-act="mqty" data-d="-1">−</button>
            <span>${m.qty}</span>
            <button data-act="mqty" data-d="1">+</button>
          </div>
          ${groups
            .map((g) => {
              const sel = m.sel[g.id] || [];
              return `<div class="section-title">${esc(g.title || "Параметры")}</div>
              ${g.options
                .map((o) => {
                  const on = sel.includes(o.id);
                  const free = g.free || o.price === 0;
                  return `<button class="check ${on ? "on" : ""}" data-act="mod" data-g="${g.id}" data-o="${o.id}" data-multi="${g.multi ? 1 : 0}">
                    <span class="box">${on ? "✓" : ""}</span>
                    <span style="flex:1">${esc(o.name)}</span>
                    <span style="color:${free ? "#7d8a72" : "#c6f54a"};font-weight:750">${o.price ? "+" + money(o.price) : "бесплатно"}</span>
                  </button>`;
                })
                .join("")}`;
            })
            .join("")}
          ${
            item.remove && item.remove.length
              ? `<div class="section-title">Убрать ингредиент</div>
                 ${item.remove
                   .map(
                     (r) => `<button class="check ${m.removed.includes(r) ? "on" : ""}" data-act="rem" data-r="${esc(r)}">
                      <span class="box">${m.removed.includes(r) ? "✓" : ""}</span><span style="flex:1">${esc(r)}</span></button>`
                   )
                   .join("")}`
              : ""
          }
          <div class="section-title">Комментарий</div>
          <textarea class="note" id="note" placeholder="Например: без лука, соус отдельно">${esc(m.comment)}</textarea>
          <div class="row-price"><span>Стоимость</span><b>${money(line.unitPrice * line.qty)}</b></div>
          <button class="btn primary" data-act="add-to-order">${m.editUid ? "СОХРАНИТЬ" : "ДОБАВИТЬ В ЗАКАЗ"}</button>
        </div>
      </div>`;
    }
    if (m.type === "merge") {
      const cur = orderById(m.orderId);
      const candidates = activeOrders().filter((o) => o.id !== m.orderId);
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <h3>Объединить столы</h3>
          <p class="muted">Текущий: ${esc(orderLabel(cur))}. Выберите стол для объединения — физически новый стол не создаётся.</p>
          ${
            candidates.length
              ? candidates
                  .map(
                    (o) => `<button class="item" data-act="merge-pick" data-id="${o.id}">
                      <div class="info"><div class="name">${esc(orderLabel(o))}</div><div class="desc">${o.items.length} позиций · открыт ${hhmm(o.openedAt)}</div></div>
                      <div class="price">${money(orderSum(o))}</div>
                    </button>`
                  )
                  .join("")
              : `<div class="empty">Нет других активных заказов</div>`
          }
        </div>
      </div>`;
    }
    if (m.type === "tablepick") {
      const list = window.TABLES.filter((t) => t.zone === ui.zone);
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <h3>Добавить в стол</h3>
          <p class="muted">Выберите стол, в который добавить позицию.</p>
          <div class="grid">${list
            .map((t) => {
              const o = orderForTable(t.id);
              return `<button class="table-card ${o ? "busy" : ""}" data-act="pick-table" data-id="${t.id}">
                <div class="num">${esc(t.label)}</div>
                <div class="st">${o ? "🟠 " + money(orderSum(o)) : "🟢 Свободен"}</div>
              </button>`;
            })
            .join("")}</div>
        </div>
      </div>`;
    }
    if (m.type === "detail") {
      const o = orderById(m.id);
      if (!o) return "";
      return `<div class="sheet-back" data-act="close-modal">
        <div class="sheet" data-stop="1">
          <div class="handle"></div>
          <h3>${esc(o.closedLabel || orderLabel(o))}</h3>
          <p class="muted">открыт ${hhmm(o.openedAt)} · закрыт ${o.closedAt ? hhmm(o.closedAt) : "—"}<br>${esc(dmy(o.openedAt))}</p>
          <hr class="sep" />
          ${o.items
            .map((l) => {
              const mods = (l.mods || []).map((m2) => (m2.price ? "+" + m2.name : m2.name)).join(", ");
              const rem = (l.removed || []).length ? "Без: " + l.removed.join(", ") : "";
              return `<div class="line">
                <div class="head"><span>${esc(l.name)} ×${l.qty}</span><span>${money(lineTotal(l))}</span></div>
                <div class="sub">${l.qty} × ${money(l.unitPrice)}</div>
                ${mods ? `<div class="sub">${esc(mods)}</div>` : ""}
                ${rem ? `<div class="sub">${esc(rem)}</div>` : ""}
                ${l.comment ? `<div class="sub" style="color:#ff8ab4">💬 ${esc(l.comment)}</div>` : ""}
              </div>`;
            })
            .join("")}
          <hr class="sep" />
          <div class="row-price"><span>ИТОГО</span><b>${money(orderSum(o))}</b></div>
          <div class="line">
            <div class="head"><span>Чаевые</span><span>${money(o.tips || 0)}</span></div>
            <div class="head" style="color:#c6f54a"><span>Всего</span><span>${money(orderSum(o) + (o.tips || 0))}</span></div>
          </div>
          <div style="height:12px"></div>
          <button class="btn ghost block" data-act="close-modal">Закрыть</button>
        </div>
      </div>`;
    }
    return "";
  }

  /* ---------- обработчики ---------- */
  function bind() {
    const q = $("#q");
    if (q) {
      q.addEventListener("input", (e) => {
        ui.search = e.target.value;
        ui.category = null;
        render();
        const q2 = $("#q");
        if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
      });
    }
    const tips = $("#tips");
    if (tips) {
      tips.addEventListener("input", (e) => {
        const v = e.target.value.replace(/\D/g, "");
        ui.modal.tips = v;
        e.target.value = v;
        const o = orderById(ui.modal.orderId);
        const sum = orderSum(o);
        const totalEl = e.target.parentElement.querySelector(".row-price b");
        if (totalEl) totalEl.textContent = money(sum);
        const lines = e.target.parentElement.querySelectorAll(".line .sub");
        lines.forEach((l) => { if (l.textContent.startsWith("Чаевые")) l.textContent = "Чаевые: " + money(Number(v) || 0); });
        const heads = e.target.parentElement.querySelectorAll(".line .head");
        heads.forEach((h) => { if (h.textContent.includes("Всего")) h.lastElementChild.textContent = money(sum + (Number(v) || 0)); });
      });
    }
    const note = $("#note");
    if (note) note.addEventListener("input", (e) => { ui.modal.comment = e.target.value; });
  }

  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) {
      if (e.target.classList.contains("sheet-back")) { ui.modal = null; render(); }
      return;
    }
    const act = el.dataset.act;
    if (act === "close-modal") {
      ui.modal = null;
      render();
      return;
    }
    if (act === "start") return startShift();
    if (act === "continue") return continueShift();
    if (act === "tab") {
      ui.tab = el.dataset.tab;
      ui.screen = "main";
      ui.detail = null;
      ui.search = "";
      ui.category = null;
      if (ui.tab === "tables") ui.orderId = ui.orderId && orderById(ui.orderId) && orderById(ui.orderId).status === "open" ? ui.orderId : null;
      render();
      return;
    }
    if (act === "zone") { ui.zone = el.dataset.zone; render(); return; }
    if (act === "table") return openTable(el.dataset.id);
    if (act === "back-tables") { ui.orderId = null; render(); return; }
    if (act === "open-order") { ui.orderId = el.dataset.id; ui.tab = "tables"; render(); return; }
    if (act === "add") {
      const o = orderById(ui.orderId);
      if (!o.items.length) { ui.tab = "menu"; render(); return; }
      ui.tab = "menu";
      ui.search = "";
      render();
      return;
    }
    if (act === "cat") { ui.category = el.dataset.cat || null; ui.search = ""; render(); return; }
    if (act === "stop-mode") { ui.stopMode = !ui.stopMode; toast(ui.stopMode ? "Режим стоп-листа включён" : "Обычный режим"); render(); return; }
    if (act === "stop-toggle") return toggleStop(el.dataset.id);
    if (act === "pick") {
      const cur = ui.orderId && orderById(ui.orderId);
      if (cur && cur.status === "open") return openItemModal(el.dataset.id);
      ui.pickedItem = el.dataset.id;
      ui.orderId = null;
      ui.modal = { type: "tablepick" };
      render();
      return;
    }
    if (act === "pick-table") {
      const id = el.dataset.id;
      const picked = ui.pickedItem;
      ui.modal = null;
      ui.pickedItem = null;
      await openTable(id);
      if (picked) openItemModal(picked);
      else render();
      return;
    }
    if (act === "edit-line") {
      const o = orderById(ui.orderId);
      const line = o.items.find((l) => l.uid === el.dataset.uid);
      if (line) openItemModal(line.menuItemId, line);
      return;
    }
    if (act === "del-line") return askDeleteLine(ui.orderId, el.dataset.uid);
    if (act === "qty") return changeQty(ui.orderId, el.dataset.uid, Number(el.dataset.d));
    if (act === "merge") { ui.modal = { type: "merge", orderId: ui.orderId }; render(); return; }
    if (act === "merge-pick") return mergeTables(ui.orderId, el.dataset.id);
    if (act === "close-table") { ui.modal = { type: "close", orderId: ui.orderId, tips: 0 }; render(); return; }
    if (act === "mqty") {
      ui.modal.qty = Math.max(1, ui.modal.qty + Number(el.dataset.d));
      render();
      return;
    }
    if (act === "mod") {
      const g = el.dataset.g;
      const oid = el.dataset.o;
      const multi = el.dataset.multi === "1";
      const sel = ui.modal.sel[g] || [];
      if (multi) {
        ui.modal.sel[g] = sel.includes(oid) ? sel.filter((x) => x !== oid) : sel.concat([oid]);
      } else {
        ui.modal.sel[g] = [oid];
      }
      render();
      return;
    }
    if (act === "rem") {
      const r = el.dataset.r;
      const list = ui.modal.removed;
      ui.modal.removed = list.includes(r) ? list.filter((x) => x !== r) : list.concat([r]);
      render();
      return;
    }
    if (act === "add-to-order") return addItemToOrder(ui.modal);
    if (act === "tip") {
      ui.modal.tips = Number(el.dataset.v);
      render();
      return;
    }
    if (act === "pay") {
      const tips = Number(($("#tips") || {}).value) || ui.modal.tips || 0;
      return payOrder(ui.modal.orderId, tips);
    }
    if (act === "close-shift") return closeShift();
    if (act === "ok") {
      const fn = ui.modal.onOk;
      ui.modal = null;
      if (fn) await fn();
      else render();
      return;
    }
    if (act === "month") {
      ui.month += Number(el.dataset.d);
      ui.day = null;
      render();
      return;
    }
    if (act === "day") { ui.day = el.dataset.day; render(); return; }
    if (act === "open-shift") { ui.detail = el.dataset.id; render(); return; }
    if (act === "back-history") { ui.detail = null; render(); return; }
    if (act === "detail") { ui.modal = { type: "detail", id: el.dataset.id }; render(); return; }
  });

  /* ---------- запуск ---------- */
  (async function init() {
    await Store.load();
    ui.screen = "start";
    render();
  })();
})();
