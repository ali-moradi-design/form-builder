/* global document, window */
/*
 * formweave embed. Put this where the form should appear:
 *   <script src="https://YOUR-APP/embed.js" data-form="SLUG" async></script>
 * It adds a frame with the hosted form that grows with its content.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-form");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;
  var origin = new URL(script.src).origin;
  var frame = document.createElement("iframe");
  frame.src = origin + "/f/" + slug + "?embed=1";
  frame.title = script.getAttribute("data-title") || "Form";
  frame.loading = "lazy";
  frame.allow = "clipboard-write";
  frame.style.cssText = "width:100%;border:0;display:block;min-height:320px;color-scheme:normal";
  script.parentNode.insertBefore(frame, script.nextSibling);
  window.addEventListener("message", function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    var data = event.data;
    if (!data || data.slug !== slug) return;
    if (data.type === "formweave:height" && typeof data.height === "number") {
      frame.style.height = Math.ceil(data.height) + "px";
    } else if (data.type === "formweave:submitted") {
      script.dispatchEvent(
        new CustomEvent("formweave:submitted", { bubbles: true, detail: { slug: slug } }),
      );
    }
  });
})();
