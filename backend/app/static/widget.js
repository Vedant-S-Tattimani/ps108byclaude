/*!
 * SpecSetu portal widget.
 * Add to any procurement portal page:
 *   <script src="https://<specsetu-host>/widget.js" defer></script>
 *   <textarea data-specsetu>...</textarea>
 * A "Suggest Indian Standards" button appears under every marked textarea. It shows the
 * applicable standards, certification and an "Insert clause" action. No dependencies.
 */
(function () {
  "use strict";
  var script = document.currentScript;
  var API = script ? new URL(script.src).origin : "";
  var STYLE =
    ".ss-bar{display:flex;gap:8px;margin-top:6px;font:13px/1.4 system-ui,sans-serif}" +
    ".ss-btn{border:0;border-radius:8px;padding:8px 12px;background:#171717;color:#fff;font-weight:600;cursor:pointer}" +
    ".ss-btn.alt{background:#ff8a1f;color:#1c0e02}.ss-btn:disabled{opacity:.5;cursor:wait}" +
    ".ss-panel{margin-top:8px;border:2px solid #171717;border-radius:12px;padding:12px;background:#fffdf7;font:13px/1.45 system-ui,sans-serif;color:#171717}" +
    ".ss-row{padding:8px 0;border-top:1px dashed #d8d1c2}.ss-row:first-child{border-top:0}" +
    ".ss-is{font:600 13px ui-monospace,monospace}.ss-tag{display:inline-block;margin:4px 4px 0 0;padding:2px 8px;border-radius:99px;background:#ffe6cf;color:#8a4300;font-weight:700;font-size:11.5px}" +
    ".ss-muted{color:#6b6b6b;font-size:12px}.ss-err{color:#c2262b;font-weight:600}";

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function render(panel, data, textarea) {
    panel.textContent = "";
    data.recommendations.slice(0, 3).forEach(function (r) {
      var row = el("div", "ss-row");
      row.appendChild(el("div", "ss-is", r.designation + " · " + r.confidence + "% match"));
      row.appendChild(el("div", null, r.title));
      if (r.certification && r.certification.mandatory) {
        row.appendChild(el("span", "ss-tag", r.certification.scheme + " mandatory"));
      }
      panel.appendChild(row);
    });
    if (data.low_confidence) panel.appendChild(el("div", "ss-muted", "No confident match - add material, rating or use."));
    var actions = el("div", "ss-bar");
    var insert = el("button", "ss-btn alt", "Insert clause");
    insert.type = "button";
    insert.addEventListener("click", function () {
      textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + data.clause;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    actions.appendChild(insert);
    actions.appendChild(el("span", "ss-muted", "Powered by SpecSetu · verify on the BIS portal"));
    panel.appendChild(actions);
  }

  function attach(textarea) {
    if (textarea.dataset.specsetuReady) return;
    textarea.dataset.specsetuReady = "1";
    var bar = el("div", "ss-bar");
    var button = el("button", "ss-btn", "Suggest Indian Standards");
    button.type = "button";
    var panel = el("div", "ss-panel");
    panel.hidden = true;
    panel.setAttribute("aria-live", "polite");
    bar.appendChild(button);
    textarea.insertAdjacentElement("afterend", panel);
    textarea.insertAdjacentElement("afterend", bar);
    button.addEventListener("click", function () {
      var query = textarea.value.trim();
      panel.hidden = false;
      if (query.length < 2) {
        panel.textContent = "";
        panel.appendChild(el("div", "ss-err", "Describe the item first."));
        return;
      }
      button.disabled = true;
      panel.textContent = "Finding standards…";
      fetch(API + "/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query, top_k: 3 }) })
        .then(function (r) { return r.json(); })
        .then(function (body) {
          if (!body.success) throw new Error(body.error || "Request failed");
          render(panel, body.data, textarea);
        })
        .catch(function (e) {
          panel.textContent = "";
          panel.appendChild(el("div", "ss-err", "SpecSetu is unavailable: " + e.message));
        })
        .finally(function () { button.disabled = false; });
    });
  }

  function init() {
    var style = el("style");
    style.textContent = STYLE;
    document.head.appendChild(style);
    document.querySelectorAll("textarea[data-specsetu]").forEach(attach);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
