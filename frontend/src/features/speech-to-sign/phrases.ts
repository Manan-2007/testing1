/**
 * Suggested phrases. Each one was run through the grammar engine against the
 * 239-sign library and glosses with every token signed (no token `missing`) and a sensible ISL order
 * (e.g. "Where is the pain?" -> PAIN WHERE). Re-check when the library changes.
 */
export const PHRASE_GROUPS = [
  {
    label: "Clinic",
    phrases: [
      "Where is the pain?",
      "Do you have a fever?",
      "Take this medicine in the morning.",
      "Do you want water?",
      "Do you want an interpreter?",
    ],
  },
  {
    label: "Everyday",
    phrases: ["Good morning, welcome.", "What is your name?", "Please sit down.", "Please wait here.", "Thank you."],
  },
] as const;
