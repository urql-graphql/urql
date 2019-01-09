/* eslint-disable max-len */
export default {
  code: (code, lang) => {
    const escape = html =>
      html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    if (!lang) {
      return `<pre><code>${escape(code)}</code></pre>`;
    }

    if (lang === "playground" || lang === "playground_norender") {
      return `<pre style="line-height: 0">
            <div class="lang-${escape(lang)}">
                <span class="ecologyCode" style="display:none;">${escape(
                  code
                )}</span>
                <div class="Interactive">
                    <div style="display: flex;flex-direction: column;flex-wrap: nowrap;margin-left: -20px;padding: 0;">
                        <div style="display: flex;flex: 0 0 150px;margin: 0;">
                        </div>
                        <div style="display: flex;flex: 0 0 150px;margin: 0;padding: 0;background-color: #222;">
                            <div class="ReactCodeMirror playgroundStage"></div>
                        </div>
                    </div>
                </div>
            </div>
        </pre>`;
    }

    return `<pre><code class="lang-${escape(lang)}">${escape(
      code
    )}</code></pre>`;
  }
};
