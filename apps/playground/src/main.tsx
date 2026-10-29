import { createRegistry } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { createRenderers, Form, type Values } from "@formcanvas/react";
import { basicRenderers } from "@formcanvas/react/fields";
import "@formcanvas/react/styles.css";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { feedbackForm } from "./sample.js";
import "./playground.css";

const registry = createRegistry(allFields);
const renderers = createRenderers(basicRenderers);

type Layout = "classic" | "focus";
type Lang = "en" | "fa";
type Theme = "light" | "dark";

function Toggle<T extends string>(p: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}): React.ReactNode {
  return (
    <div className="pg-toggle" role="group" aria-label={p.label}>
      {p.options.map(([value, text]) => (
        <button
          key={value}
          type="button"
          aria-pressed={p.value === value}
          onClick={() => {
            p.onChange(value);
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function App(): React.ReactNode {
  const [layout, setLayout] = useState<Layout>("classic");
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [submitted, setSubmitted] = useState<Values | null>(null);
  const key = `${layout}-${lang}`;
  return (
    <div className="pg" data-theme={theme}>
      <header className="pg-bar">
        <strong className="pg-brand">formcanvas playground</strong>
        <Toggle
          label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            ["classic", "Classic"],
            ["focus", "Focus"],
          ]}
        />
        <Toggle
          label="Language"
          value={lang}
          onChange={setLang}
          options={[
            ["en", "English"],
            ["fa", "فارسی"],
          ]}
        />
        <Toggle
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
        />
      </header>
      <main className="pg-main">
        <section className="pg-card" aria-label="Form">
          <Form
            key={key}
            schema={feedbackForm}
            registry={registry}
            renderers={renderers}
            locale={lang}
            layout={layout}
            onSubmit={(data) => {
              setSubmitted(data);
            }}
          />
        </section>
        <section className="pg-card pg-output" aria-label="Submitted data">
          <h2>Submitted data</h2>
          <pre data-testid="submitted">
            {submitted ? JSON.stringify(submitted, null, 2) : "Submit the form to see the data."}
          </pre>
        </section>
      </main>
      <footer className="pg-credit">Made with ♥ by Ali Moradi</footer>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
