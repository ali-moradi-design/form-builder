import type { FormDocument } from "@formweave/schema";

const team = { op: "in", args: [{ var: "plan" }, "team", "enterprise"] } as const;

/** Product feedback template, also used by the playground. */
export const feedbackTemplate: FormDocument = {
  schemaVersion: 1,
  id: "product-feedback",
  title: { en: "Product feedback", fa: "نظرسنجی محصول" },
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "you",
      title: { en: "About you", fa: "دربارهٔ شما" },
      fields: [
        {
          type: "shortText",
          key: "name",
          label: { en: "Your name", fa: "نام شما" },
          required: true,
          settings: { minLength: 2 },
          width: "half",
        },
        {
          type: "email",
          key: "email",
          label: { en: "Email for follow-up", fa: "ایمیل برای پیگیری" },
          help: {
            en: "Optional. We only use it to reply.",
            fa: "اختیاری است و فقط برای پاسخ به شما.",
          },
          width: "half",
        },
        {
          type: "radio",
          key: "plan",
          label: { en: "Which plan do you use?", fa: "از کدام طرح استفاده می‌کنید؟" },
          required: true,
          settings: {
            options: [
              { value: "free", label: { en: "Free", fa: "رایگان" } },
              { value: "team", label: { en: "Team", fa: "تیمی" } },
              { value: "enterprise", label: { en: "Enterprise", fa: "سازمانی" } },
            ],
          },
        },
        {
          type: "number",
          key: "seats",
          label: { en: "How many seats?", fa: "چند کاربر دارید؟" },
          visibleWhen: team,
          requiredWhen: team,
          settings: { min: 2, integer: true },
        },
      ],
    },
    {
      key: "taste",
      title: { en: "Your taste", fa: "سلیقهٔ شما" },
      fields: [
        {
          type: "checkboxes",
          key: "features",
          label: { en: "What do you use most?", fa: "از کدام بخش‌ها بیشتر استفاده می‌کنید؟" },
          settings: {
            maxSelected: 2,
            options: [
              { value: "builder", label: { en: "Builder", fa: "سازنده" } },
              { value: "logic", label: { en: "Logic", fa: "منطق شرطی" } },
              { value: "export", label: { en: "Export", fa: "خروجی گرفتن" } },
            ],
          },
        },
        {
          type: "longText",
          key: "comment",
          label: { en: "Anything else?", fa: "حرف دیگری دارید؟" },
          settings: { maxLength: 500 },
        },
        {
          type: "switch",
          key: "contact",
          label: {
            en: "You may contact me about my answers",
            fa: "می‌توانید دربارهٔ پاسخ‌هایم با من تماس بگیرید",
          },
        },
      ],
    },
  ],
};
