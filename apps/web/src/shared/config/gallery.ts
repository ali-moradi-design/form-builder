import type { FormDocument } from "@formcanvas/schema";
import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChartColumn,
  type LucideIcon,
  MessageSquareHeart,
} from "lucide-react";
import { feedbackTemplate } from "./templates";

const locales = { default: "en", supported: ["en", "fa"] } as const;
const opt = (value: string, en: string, fa: string) => ({ value, label: { en, fa } });

/** Job application: three steps, a repeater for past jobs and a CV upload. */
export const jobTemplate: FormDocument = {
  schemaVersion: 1,
  id: "job-application",
  title: { en: "Job application", fa: "درخواست همکاری" },
  locales,
  steps: [
    {
      key: "about",
      title: { en: "About you", fa: "دربارهٔ شما" },
      fields: [
        {
          type: "shortText",
          key: "fullName",
          label: { en: "Full name", fa: "نام و نام خانوادگی" },
          required: true,
          width: "half",
        },
        {
          type: "email",
          key: "email",
          label: { en: "Email", fa: "ایمیل" },
          required: true,
          width: "half",
        },
        { type: "phone", key: "phone", label: { en: "Phone", fa: "تلفن" } },
        {
          type: "select",
          key: "position",
          label: { en: "Position", fa: "موقعیت شغلی" },
          required: true,
          settings: {
            options: [
              opt("frontend", "Senior frontend engineer", "مهندس ارشد فرانت‌اند"),
              opt("backend", "Backend engineer", "مهندس بک‌اند"),
              opt("designer", "Product designer", "طراح محصول"),
            ],
          },
        },
        {
          type: "radio",
          key: "source",
          label: { en: "Where did you hear about us?", fa: "از کجا با ما آشنا شدید؟" },
          settings: {
            options: [
              opt("linkedin", "LinkedIn", "لینکدین"),
              opt("friend", "Friend", "دوستان"),
              opt("board", "Job board", "سایت کاریابی"),
              opt("other", "Other", "سایر"),
            ],
          },
        },
      ],
    },
    {
      key: "experience",
      title: { en: "Experience", fa: "سوابق کاری" },
      fields: [
        {
          type: "number",
          key: "years",
          label: { en: "Years of experience", fa: "سال‌های سابقه" },
          required: true,
          settings: { min: 0, max: 50, integer: true },
          width: "half",
        },
        {
          type: "repeater",
          key: "jobs",
          label: { en: "Past jobs", fa: "شغل‌های قبلی" },
          settings: { minRows: 0, maxRows: 5, rowLabel: { en: "Job", fa: "شغل" } },
          fields: [
            {
              type: "shortText",
              key: "company",
              label: { en: "Company", fa: "شرکت" },
              required: true,
              width: "half",
            },
            {
              type: "shortText",
              key: "role",
              label: { en: "Role", fa: "سمت" },
              required: true,
              width: "half",
            },
            {
              type: "dateRange",
              key: "period",
              label: { en: "Period", fa: "بازهٔ زمانی" },
            },
          ],
        },
        { type: "tags", key: "skills", label: { en: "Skills", fa: "مهارت‌ها" } },
      ],
    },
    {
      key: "documents",
      title: { en: "Documents", fa: "مدارک" },
      fields: [
        {
          type: "file",
          key: "cv",
          label: { en: "CV", fa: "رزومه" },
          help: { en: "PDF, up to 10 MB.", fa: "فایل پی‌دی‌اف، حداکثر ۱۰ مگابایت." },
          required: true,
          settings: { accept: ["application/pdf"], maxFiles: 1 },
        },
        { type: "url", key: "portfolio", label: { en: "Portfolio link", fa: "پیوند نمونه‌کار" } },
        {
          type: "longText",
          key: "coverLetter",
          label: { en: "Why do you want to join?", fa: "چرا می‌خواهید به ما بپیوندید؟" },
          settings: { maxLength: 2000 },
        },
      ],
    },
  ],
};

const company = { op: "eq", args: [{ var: "accountType" }, "company"] } as const;

/** Customer onboarding: company-only steps, an address and a shareholder repeater. */
export const onboardingTemplate: FormDocument = {
  schemaVersion: 1,
  id: "customer-onboarding",
  title: { en: "Customer onboarding", fa: "ثبت‌نام مشتری" },
  locales,
  steps: [
    {
      key: "account",
      title: { en: "Account", fa: "نوع حساب" },
      fields: [
        {
          type: "radio",
          key: "accountType",
          label: { en: "Who is the account for?", fa: "حساب برای چه کسی است؟" },
          required: true,
          settings: {
            options: [opt("person", "Myself", "خودم"), opt("company", "A company", "یک شرکت")],
          },
        },
      ],
    },
    {
      key: "company",
      title: { en: "Company", fa: "شرکت" },
      visibleWhen: company,
      fields: [
        {
          type: "shortText",
          key: "companyName",
          label: { en: "Company name", fa: "نام شرکت" },
          required: true,
          width: "half",
        },
        {
          type: "shortText",
          key: "registrationNo",
          label: { en: "Registration number", fa: "شمارهٔ ثبت" },
          required: true,
          width: "half",
        },
        { type: "url", key: "website", label: { en: "Website", fa: "وب‌سایت" } },
        {
          type: "address",
          key: "address",
          label: { en: "Registered address", fa: "نشانی ثبتی" },
          required: true,
          settings: { requiredParts: ["city", "country"] },
        },
      ],
    },
    {
      key: "owners",
      title: { en: "Shareholders", fa: "سهام‌داران" },
      visibleWhen: company,
      fields: [
        {
          type: "repeater",
          key: "shareholders",
          label: { en: "Shareholders", fa: "سهام‌داران" },
          help: {
            en: "Everyone who owns 10% or more.",
            fa: "همهٔ کسانی که ۱۰ درصد یا بیشتر سهم دارند.",
          },
          settings: { minRows: 1, maxRows: 10, rowLabel: { en: "Shareholder", fa: "سهام‌دار" } },
          fields: [
            {
              type: "shortText",
              key: "holderName",
              label: { en: "Name", fa: "نام" },
              required: true,
              width: "half",
            },
            {
              type: "number",
              key: "share",
              label: { en: "Share (%)", fa: "سهم (درصد)" },
              required: true,
              settings: { min: 10, max: 100 },
              width: "half",
            },
          ],
        },
      ],
    },
    {
      key: "contact",
      title: { en: "Contact", fa: "اطلاعات تماس" },
      fields: [
        {
          type: "shortText",
          key: "contactName",
          label: { en: "Your name", fa: "نام شما" },
          required: true,
          width: "half",
        },
        {
          type: "email",
          key: "contactEmail",
          label: { en: "Email", fa: "ایمیل" },
          required: true,
          width: "half",
        },
        { type: "phone", key: "contactPhone", label: { en: "Phone", fa: "تلفن" } },
        {
          type: "switch",
          key: "terms",
          label: { en: "I accept the terms of service", fa: "شرایط استفاده را می‌پذیرم" },
          required: true,
        },
      ],
    },
  ],
};

const ticket = { var: "ticket" } as const;

/** Event registration: one step, choices and a calculated total. */
export const eventTemplate: FormDocument = {
  schemaVersion: 1,
  id: "event-registration",
  title: { en: "Event registration", fa: "ثبت‌نام رویداد" },
  locales,
  steps: [
    {
      key: "main",
      fields: [
        {
          type: "shortText",
          key: "attendee",
          label: { en: "Full name", fa: "نام و نام خانوادگی" },
          required: true,
          width: "half",
        },
        {
          type: "email",
          key: "email",
          label: { en: "Email", fa: "ایمیل" },
          required: true,
          width: "half",
        },
        {
          type: "radio",
          key: "ticket",
          label: { en: "Ticket", fa: "نوع بلیت" },
          required: true,
          settings: {
            options: [
              opt("standard", "Standard, $60", "عادی، ۶۰ دلار"),
              opt("student", "Student, $30", "دانشجویی، ۳۰ دلار"),
              opt("vip", "VIP, $120", "ویژه، ۱۲۰ دلار"),
            ],
          },
          width: "half",
        },
        {
          type: "number",
          key: "seats",
          label: { en: "Number of tickets", fa: "تعداد بلیت" },
          required: true,
          settings: { min: 1, max: 10, integer: true },
          width: "half",
        },
        {
          type: "calculated",
          key: "total",
          label: { en: "Total", fa: "جمع کل" },
          calculate: {
            op: "mul",
            args: [
              { var: "seats" },
              {
                op: "if",
                args: [
                  { op: "eq", args: [ticket, "vip"] },
                  120,
                  { op: "if", args: [{ op: "eq", args: [ticket, "student"] }, 30, 60] },
                ],
              },
            ],
          },
          settings: { format: "currency", currency: "USD" },
        },
        {
          type: "checkboxes",
          key: "sessions",
          label: { en: "Sessions you will join", fa: "جلسه‌هایی که شرکت می‌کنید" },
          settings: {
            minSelected: 1,
            options: [
              opt("keynote", "Keynote", "سخنرانی اصلی"),
              opt("workshop", "Workshop", "کارگاه"),
              opt("panel", "Panel", "میزگرد"),
            ],
          },
        },
        {
          type: "select",
          key: "diet",
          label: { en: "Dietary needs", fa: "رژیم غذایی" },
          settings: {
            options: [
              opt("none", "None", "ندارم"),
              opt("vegetarian", "Vegetarian", "گیاه‌خواری"),
              opt("vegan", "Vegan", "وگان"),
              opt("other", "Other", "سایر"),
            ],
          },
        },
        {
          type: "shortText",
          key: "dietOther",
          label: { en: "Tell us more", fa: "توضیح دهید" },
          visibleWhen: { op: "eq", args: [{ var: "diet" }, "other"] },
          requiredWhen: { op: "eq", args: [{ var: "diet" }, "other"] },
        },
      ],
    },
  ],
};

const chartType = { var: "chartType" } as const;

/** The settings panel of a dashboard chart widget, the engine-only use case. */
export const chartTemplate: FormDocument = {
  schemaVersion: 1,
  id: "chart-widget",
  title: { en: "Chart widget settings", fa: "تنظیمات ویجت نمودار" },
  locales,
  steps: [
    {
      key: "main",
      fields: [
        {
          type: "group",
          key: "data",
          label: { en: "Data", fa: "داده" },
          fields: [
            {
              type: "shortText",
              key: "widgetTitle",
              label: { en: "Title", fa: "عنوان" },
              required: true,
            },
            {
              type: "radio",
              key: "chartType",
              label: { en: "Chart type", fa: "نوع نمودار" },
              required: true,
              settings: {
                options: [
                  opt("bar", "Bar", "ستونی"),
                  opt("line", "Line", "خطی"),
                  opt("area", "Area", "سطحی"),
                  opt("pie", "Pie", "دایره‌ای"),
                ],
              },
            },
            {
              type: "select",
              key: "source",
              label: { en: "Data source", fa: "منبع داده" },
              required: true,
              settings: {
                options: [
                  opt("sales", "Sales", "فروش"),
                  opt("visits", "Visits", "بازدیدها"),
                  opt("signups", "Sign-ups", "ثبت‌نام‌ها"),
                ],
              },
              width: "half",
            },
            {
              type: "number",
              key: "refresh",
              label: { en: "Refresh every (seconds)", fa: "به‌روزرسانی هر چند ثانیه" },
              settings: { min: 10, max: 3600, integer: true },
              width: "half",
            },
          ],
        },
        {
          type: "group",
          key: "look",
          label: { en: "Appearance", fa: "ظاهر" },
          fields: [
            {
              type: "colorSet",
              key: "palette",
              label: { en: "Series colours", fa: "رنگ سری‌ها" },
              settings: { minColors: 1, maxColors: 6 },
            },
            { type: "switch", key: "legend", label: { en: "Show legend", fa: "نمایش راهنما" } },
            {
              type: "switch",
              key: "stacked",
              label: { en: "Stack series", fa: "سری‌ها روی هم" },
              visibleWhen: { op: "in", args: [chartType, "bar", "area"] },
            },
          ],
        },
        {
          type: "group",
          key: "axes",
          label: { en: "Axes", fa: "محورها" },
          visibleWhen: { op: "neq", args: [chartType, "pie"] },
          fields: [
            {
              type: "shortText",
              key: "xLabel",
              label: { en: "X axis label", fa: "عنوان محور افقی" },
              width: "half",
            },
            {
              type: "shortText",
              key: "yLabel",
              label: { en: "Y axis label", fa: "عنوان محور عمودی" },
              width: "half",
            },
            {
              type: "number",
              key: "yMin",
              label: { en: "Y minimum", fa: "کمینهٔ محور عمودی" },
              width: "half",
            },
            {
              type: "number",
              key: "yMax",
              label: { en: "Y maximum", fa: "بیشینهٔ محور عمودی" },
              width: "half",
            },
          ],
        },
      ],
    },
  ],
};

/** Gallery categories, in filter order. */
export const TEMPLATE_CATEGORIES = [
  "feedback",
  "hiring",
  "business",
  "events",
  "developers",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/** Features shown as tags on a template card. */
export type TemplateFeature =
  | "rating"
  | "nps"
  | "logic"
  | "upload"
  | "repeater"
  | "address"
  | "choices"
  | "calculated"
  | "groups"
  | "colorSet";

/** One entry of the template gallery. */
export interface GalleryTemplate {
  readonly id: string;
  readonly category: TemplateCategory;
  readonly icon: LucideIcon;
  /** Tile colour of the card icon. */
  readonly tone: "teal" | "orange" | "plum" | "carmine";
  readonly features: readonly TemplateFeature[];
  readonly document: FormDocument;
}

/** The template gallery, in display order. */
export const TEMPLATES: readonly GalleryTemplate[] = [
  {
    id: "product-feedback",
    category: "feedback",
    icon: MessageSquareHeart,
    tone: "orange",
    features: ["rating", "nps", "logic"],
    document: feedbackTemplate,
  },
  {
    id: "job-application",
    category: "hiring",
    icon: BriefcaseBusiness,
    tone: "plum",
    features: ["upload", "repeater"],
    document: jobTemplate,
  },
  {
    id: "customer-onboarding",
    category: "business",
    icon: Building2,
    tone: "teal",
    features: ["address", "repeater", "logic"],
    document: onboardingTemplate,
  },
  {
    id: "event-registration",
    category: "events",
    icon: CalendarCheck,
    tone: "carmine",
    features: ["choices", "calculated", "logic"],
    document: eventTemplate,
  },
  {
    id: "chart-widget",
    category: "developers",
    icon: ChartColumn,
    tone: "teal",
    features: ["groups", "colorSet", "logic"],
    document: chartTemplate,
  },
];

/** Finds a gallery template by id. */
export const findTemplate = (id: string): GalleryTemplate | undefined =>
  TEMPLATES.find((t) => t.id === id);

/** Number of fields that take an answer, counting inside groups and repeaters. */
export const countInputs = (document: FormDocument): number => {
  const walk = (fields: FormDocument["steps"][number]["fields"]): number =>
    fields.reduce(
      (n, f) =>
        n +
        (f.fields ? walk(f.fields) : ["heading", "paragraph", "divider"].includes(f.type) ? 0 : 1),
      0,
    );
  return document.steps.reduce((n, s) => n + walk(s.fields), 0);
};
