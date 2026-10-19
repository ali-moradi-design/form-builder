import {
  acceptsFile,
  type FileRef,
  type FileSettings,
  type ImageUploadSettings,
} from "@formweave/engine/fields";
import { formatNumber } from "@formweave/engine/i18n";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { defineRenderer, type FieldRenderer, type FieldRendererProps } from "../renderers.js";
import { FieldShell } from "./shell.js";

const WORDS = {
  en: {
    drop: "Drop files here or",
    choose: "choose files",
    chooseOne: "Choose a photo",
    anotherPhoto: "Choose another",
    usePhoto: "Use this photo",
    rotate: "Rotate",
    zoom: "Zoom",
    remove: "Remove",
    clear: "Clear",
    sign: "Sign with your mouse, finger or pen",
    typeInstead: "Type your name instead",
    drawInstead: "Draw instead",
    typed: "Your name",
    off: "Uploads are not available in this form.",
    failed: "The upload failed. Try again.",
    tooBig: "is too big.",
    wrongType: "is not an allowed type.",
    upTo: "up to {n} files",
    each: "{size} each",
    saved: "Saved",
  },
  fa: {
    drop: "فایل‌ها را اینجا رها کنید یا",
    choose: "انتخاب کنید",
    chooseOne: "انتخاب عکس",
    anotherPhoto: "عکس دیگر",
    usePhoto: "همین عکس",
    rotate: "چرخش",
    zoom: "بزرگ‌نمایی",
    remove: "حذف",
    clear: "پاک کردن",
    sign: "با ماوس، انگشت یا قلم امضا کنید",
    typeInstead: "به جای امضا نامتان را بنویسید",
    drawInstead: "امضا با دست",
    typed: "نام شما",
    off: "بارگذاری فایل در این فرم فعال نیست.",
    failed: "بارگذاری انجام نشد. دوباره امتحان کنید.",
    tooBig: "بیش از حد مجاز است.",
    wrongType: "از نوع مجاز نیست.",
    upTo: "حداکثر {n} فایل",
    each: "هر کدام تا {size}",
    saved: "ذخیره شد",
  },
} as const;

type Words = Readonly<Record<keyof (typeof WORDS)["en"], string>>;
const words = (locale: string): Words => (locale.startsWith("fa") ? WORDS.fa : WORDS.en);

/** "1.2 MB" in the reader's digits. */
const size = (bytes: number, locale: string): string => {
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  return `${formatNumber(Math.round(n * 10) / 10, locale)} ${units[u] ?? "B"}`;
};

const isRef = (v: unknown): v is FileRef =>
  v !== null && typeof v === "object" && typeof (v as FileRef).id === "string";

interface Pending {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  readonly progress: number;
  readonly error?: string | undefined;
}

function Files(p: FieldRendererProps): ReactNode {
  const w = words(p.locale);
  const settings = p.field.settings as FileSettings;
  const max = settings.maxFiles ?? 1;
  const maxSize = settings.maxSize ?? 10 * 1024 * 1024;
  const saved = Array.isArray(p.value) ? p.value.filter(isRef) : [];
  const [pending, setPending] = useState<readonly Pending[]>([]);
  const [over, setOver] = useState(false);
  // Uploads finish one by one; keep the latest list to add to.
  const latest = useRef(saved);
  latest.current = saved;

  const take = (list: FileList | null) => {
    if (!list || !p.upload) return;
    const upload = p.upload;
    const room = max - latest.current.length - pending.filter((x) => !x.error).length;
    for (const f of [...list].slice(0, Math.max(0, room))) {
      const key = `${f.name}:${String(f.size)}:${String(Math.random())}`;
      const problem =
        f.size > maxSize
          ? `${f.name} ${w.tooBig}`
          : !acceptsFile(settings.accept, f)
            ? `${f.name} ${w.wrongType}`
            : undefined;
      setPending((x) => [...x, { key, name: f.name, size: f.size, progress: 0, error: problem }]);
      if (problem) continue;
      const set = (patch: Partial<Pending>) => {
        setPending((x) => x.map((it) => (it.key === key ? { ...it, ...patch } : it)));
      };
      upload(f, {
        field: p.name,
        onProgress: (done) => {
          set({ progress: done });
        },
      }).then(
        (ref) => {
          setPending((x) => x.filter((it) => it.key !== key));
          const next = [
            ...latest.current,
            { id: ref.id, name: ref.name, size: ref.size, type: ref.type },
          ];
          latest.current = next;
          p.onChange(next);
        },
        () => {
          set({ error: `${f.name}: ${w.failed}` });
        },
      );
    }
  };

  const hint = [
    settings.accept?.join(", "),
    max > 1 ? w.upTo.replace("{n}", formatNumber(max, p.locale)) : undefined,
    w.each.replace("{size}", size(maxSize, p.locale)),
  ]
    .filter(Boolean)
    .join(" · ");

  if (!p.upload) {
    return (
      <FieldShell props={p}>
        <p className="fw-help">{w.off}</p>
      </FieldShell>
    );
  }
  const full = saved.length + pending.filter((x) => !x.error).length >= max;
  return (
    <FieldShell props={p}>
      <label
        className="fw-drop"
        data-over={over ? "" : undefined}
        data-disabled={full || p.state.disabled ? "" : undefined}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setOver(false);
          if (!full && !p.state.disabled) take(e.dataTransfer.files);
        }}
      >
        <input
          id={p.id}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fw-visually-hidden"
          type="file"
          name={p.name}
          multiple={max > 1}
          accept={settings.accept?.join(",")}
          disabled={full || p.state.disabled}
          aria-describedby={p.describedBy}
          aria-invalid={p.error !== undefined}
          onBlur={p.onBlur}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = "";
          }}
        />
        <span>
          {w.drop} <u>{w.choose}</u>
        </span>
        <span className="fw-help">{hint}</span>
      </label>
      {(saved.length > 0 || pending.length > 0) && (
        <ul className="fw-files">
          {saved.map((f) => (
            <li key={f.id}>
              <span className="fw-file-name">
                {f.name}
                <span className="fw-help">
                  {size(f.size, p.locale)} · {w.saved}
                </span>
              </span>
              <button
                type="button"
                className="fw-row-tool"
                aria-label={`${w.remove}: ${f.name}`}
                disabled={p.state.disabled}
                onClick={() => {
                  p.onChange(saved.filter((x) => x.id !== f.id));
                }}
              >
                ×
              </button>
            </li>
          ))}
          {pending.map((f) => (
            <li key={f.key} data-error={f.error ? "" : undefined}>
              <span className="fw-file-name">
                {f.name}
                {f.error ? (
                  <span className="fw-error" role="alert">
                    {f.error}
                  </span>
                ) : (
                  <progress max={1} value={f.progress} aria-label={f.name} />
                )}
              </span>
              {f.error && (
                <button
                  type="button"
                  className="fw-row-tool"
                  aria-label={`${w.remove}: ${f.name}`}
                  onClick={() => {
                    setPending((x) => x.filter((it) => it.key !== f.key));
                  }}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
}

/**
 * Renderer for `file`: a drop area that is also a file button, with the
 * files' names, sizes and upload progress. Type and size are checked before
 * uploading; the server must check them again.
 *
 * @since 0.6.0
 */
export const fileRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer("file", Files);

const toBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Could not read the canvas."));
      },
      type,
      0.9,
    );
  });

function ImageUpload(p: FieldRendererProps): ReactNode {
  const w = words(p.locale);
  const settings = p.field.settings as ImageUploadSettings;
  const out = settings.size ?? 1024;
  const square = settings.crop !== "none";
  const [source, setSource] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0, turn: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const box = 240;

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url);
    },
    [source],
  );

  const open = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setSource({ url, img });
      setView({ zoom: 1, x: 0, y: 0, turn: 0 });
    };
    img.src = url;
  };

  // The picture fills the box at zoom 1; x/y move it in box pixels.
  const draw = (canvas: HTMLCanvasElement, side: number) => {
    if (!source) return;
    const { img } = source;
    const turned = view.turn % 2 === 1;
    const iw = turned ? img.height : img.width;
    const ih = turned ? img.width : img.height;
    const scale = Math.max(side / iw, side / ih) * view.zoom;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(
      canvas.width / 2 + (view.x * side) / box,
      canvas.height / 2 + (view.y * side) / box,
    );
    ctx.rotate((view.turn * Math.PI) / 2);
    ctx.drawImage(
      img,
      (-img.width * scale) / 2,
      (-img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    ctx.restore();
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, box);
  });

  const save = async () => {
    if (!source || !p.upload) return;
    setBusy(true);
    setFailed(false);
    try {
      const canvas = document.createElement("canvas");
      if (square) {
        canvas.width = out;
        canvas.height = out;
        draw(canvas, out);
      } else {
        const { img } = source;
        const k = Math.min(1, out / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * k);
        canvas.height = Math.round(img.height * k);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const blob = await toBlob(canvas, "image/jpeg");
      const file = Object.assign(blob, { name: "photo.jpg" });
      const ref = await p.upload(file, { field: p.name });
      setPreview(canvas.toDataURL("image/jpeg", 0.8));
      setSource(null);
      p.onChange({ id: ref.id, name: ref.name, size: ref.size, type: ref.type });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (!p.upload) {
    return (
      <FieldShell props={p}>
        <p className="fw-help">{w.off}</p>
      </FieldShell>
    );
  }
  const chooser = (label: string) => (
    <label className="fw-button">
      <input
        id={source ? undefined : p.id}
        ref={source ? undefined : (p.inputRef as Ref<HTMLInputElement>)}
        className="fw-visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={p.state.disabled}
        aria-describedby={p.describedBy}
        onBlur={p.onBlur}
        onChange={(e) => {
          open(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {label}
    </label>
  );
  const has = isRef(p.value);
  return (
    <FieldShell props={p}>
      {source ? (
        <div className="fw-crop">
          <canvas
            ref={canvasRef}
            width={box}
            height={box}
            data-round={square ? "" : undefined}
            onPointerDown={(e: PointerEvent<HTMLCanvasElement>) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX - view.x, y: e.clientY - view.y };
            }}
            onPointerMove={(e: PointerEvent<HTMLCanvasElement>) => {
              const d = drag.current;
              if (d) setView((v) => ({ ...v, x: e.clientX - d.x, y: e.clientY - d.y }));
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          />
          <div className="fw-crop-tools">
            <label className="fw-slider">
              <span className="fw-help">{w.zoom}</span>
              <input
                className="fw-range"
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={view.zoom}
                onChange={(e) => {
                  setView((v) => ({ ...v, zoom: Number(e.target.value) }));
                }}
              />
            </label>
            <div className="fw-tags">
              <button
                type="button"
                className="fw-button"
                onClick={() => {
                  setView((v) => ({ ...v, turn: (v.turn + 1) % 4 }));
                }}
              >
                ⟳ {w.rotate}
              </button>
              {chooser(w.anotherPhoto)}
              <button
                type="button"
                className="fw-button fw-button-primary"
                disabled={busy}
                onClick={() => {
                  void save();
                }}
              >
                {w.usePhoto}
              </button>
            </div>
            {failed && (
              <p className="fw-error" role="alert">
                {w.failed}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="fw-tags">
          {has && preview && (
            <img className="fw-photo" src={preview} alt="" data-round={square ? "" : undefined} />
          )}
          {chooser(has ? w.anotherPhoto : w.chooseOne)}
          {has && (
            <button
              type="button"
              className="fw-button"
              onClick={() => {
                setPreview(null);
                p.onChange(undefined);
              }}
            >
              {w.remove}
            </button>
          )}
        </div>
      )}
    </FieldShell>
  );
}

/**
 * Renderer for `imageUpload`: pick a photo, move and zoom it in a square
 * frame (or keep it whole), then it is scaled in the browser and uploaded.
 *
 * @since 0.6.0
 */
export const imageUploadRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "imageUpload",
  ImageUpload,
);

function Signature(p: FieldRendererProps): ReactNode {
  const w = words(p.locale);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);
  const width = 600;
  const height = 160;

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const pen = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return undefined;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#141a1c";
    ctx.fillStyle = "#141a1c";
    return ctx;
  };
  const clear = () => {
    const c = canvas.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };
  // Upload a moment after the last stroke, not after every one.
  const later = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const c = canvas.current;
      if (!c || !p.upload) return;
      const upload = p.upload;
      setFailed(false);
      toBlob(c, "image/png")
        .then((blob) => upload(Object.assign(blob, { name: "signature.png" }), { field: p.name }))
        .then(
          (ref) => {
            p.onChange({ id: ref.id, name: ref.name, size: ref.size, type: ref.type });
          },
          () => {
            setFailed(true);
          },
        );
    }, 700);
  };
  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * width,
      y: ((e.clientY - r.top) / r.height) * height,
    };
  };

  if (!p.upload) {
    return (
      <FieldShell props={p}>
        <p className="fw-help">{w.off}</p>
      </FieldShell>
    );
  }
  return (
    <FieldShell props={p}>
      {typing ? (
        <input
          id={p.id}
          ref={p.inputRef as Ref<HTMLInputElement>}
          className="fw-input fw-signature-typed"
          aria-describedby={p.describedBy}
          aria-invalid={p.error !== undefined}
          placeholder={w.typed}
          value={name}
          onBlur={p.onBlur}
          onChange={(e) => {
            const text = e.target.value;
            setName(text);
            clear();
            const ctx = pen();
            if (ctx && text.trim()) {
              ctx.font = "italic 48px 'Segoe Script', 'Brush Script MT', cursive";
              ctx.textBaseline = "middle";
              ctx.fillText(text, 24, height / 2, width - 48);
              later();
            } else {
              p.onChange(undefined);
            }
          }}
        />
      ) : null}
      <canvas
        ref={canvas}
        className="fw-signature"
        width={width}
        height={height}
        role="img"
        aria-label={w.sign}
        hidden={typing}
        onPointerDown={(e) => {
          if (p.state.disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = point(e);
          clearTimeout(timer.current);
        }}
        onPointerMove={(e) => {
          const from = last.current;
          const ctx = from ? pen() : undefined;
          if (!from || !ctx) return;
          const to = point(e);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          last.current = to;
        }}
        onPointerUp={() => {
          if (!last.current) return;
          last.current = null;
          later();
        }}
      />
      <div className="fw-tags">
        <span className="fw-help">{typing ? "" : w.sign}</span>
        <button
          type="button"
          className="fw-button"
          ref={typing ? undefined : (p.inputRef as Ref<HTMLButtonElement>)}
          onClick={() => {
            setTyping(!typing);
            setName("");
            clear();
            p.onChange(undefined);
          }}
        >
          {typing ? w.drawInstead : w.typeInstead}
        </button>
        <button
          type="button"
          className="fw-button"
          onClick={() => {
            clearTimeout(timer.current);
            clear();
            setName("");
            p.onChange(undefined);
          }}
        >
          {w.clear}
        </button>
      </div>
      {failed && (
        <p className="fw-error" role="alert">
          {w.failed}
        </p>
      )}
    </FieldShell>
  );
}

/**
 * Renderer for `signature`: a drawing pad for mouse, touch and pen, with a
 * typed-name option for people who cannot draw. The result is uploaded as a
 * PNG shortly after the last stroke.
 *
 * @since 0.6.0
 */
export const signatureRenderer: FieldRenderer = /*#__PURE__*/ defineRenderer(
  "signature",
  Signature,
);
