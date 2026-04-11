type LanguageConfig = {
  code: string;
  name: string;
  htmlLang: string;
  scriptName: string;
  guidelines: string[];
  ui: {
    siteTitle: string;
    siteDescription: string;
    heroText: string;
    suggestionsHeading: string;
    generatingText: string;
    proposeButton: string;
    proposeHeading: string;
    proposePlaceholder: string;
    submitPlaceholder: string;
    submitPageDescription: string;
    loginFooter: string;
  };
};

const LANGUAGES: Record<string, LanguageConfig> = {
  ka: {
    code: "ka",
    name: "Georgian",
    htmlLang: "ka",
    scriptName: "Georgian (Mkhedruli)",
    guidelines: [
      "Use existing Georgian roots, prefixes, and suffixes where possible",
      "Draw from Old Georgian, literary Georgian, or dialectal forms when appropriate",
      "Consider compound words (like German does) using Georgian word-building patterns",
    ],
    ui: {
      siteTitle: "Word Factory - Georgian Neologism Platform",
      siteDescription:
        "Submit foreign words lacking Georgian equivalents, get AI-generated neologisms, and vote on the best suggestions.",
      heroText:
        "Help build the Georgian lexicon. Submit foreign words that lack native equivalents, and let AI propose elegant Georgian neologisms for the community to vote on.",
      suggestionsHeading: "Georgian Suggestions",
      generatingText: "AI models are generating Georgian neologisms...",
      proposeButton: "+ Propose your own Georgian word",
      proposeHeading: "Propose a Georgian Word",
      proposePlaceholder: "Georgian word (in Georgian script)",
      submitPlaceholder:
        "Describe the meaning of this word or concept that currently has no Georgian equivalent...",
      submitPageDescription:
        "Submit a foreign word or concept that lacks a Georgian equivalent. The community and AI will propose neologisms.",
      loginFooter: "By signing in, you agree to help build the Georgian lexicon",
    },
  },
  ta: {
    code: "ta",
    name: "Tamil",
    htmlLang: "ta",
    scriptName: "Tamil",
    guidelines: [
      "Use existing Tamil roots, prefixes, and suffixes where possible",
      "Draw from Classical Tamil (Sangam literature), literary Tamil, or dialectal forms when appropriate",
      "Consider compound words using Tamil word-building patterns (punarchi, thodar mozhi)",
      "Prefer Dravidian-origin roots over Sanskrit borrowings when natural alternatives exist",
    ],
    ui: {
      siteTitle: "Word Factory - Tamil Neologism Platform",
      siteDescription:
        "Submit foreign words lacking Tamil equivalents, get AI-generated neologisms, and vote on the best suggestions.",
      heroText:
        "Help build the Tamil lexicon. Submit foreign words that lack native equivalents, and let AI propose elegant Tamil neologisms for the community to vote on.",
      suggestionsHeading: "Tamil Suggestions",
      generatingText: "AI models are generating Tamil neologisms...",
      proposeButton: "+ Propose your own Tamil word",
      proposeHeading: "Propose a Tamil Word",
      proposePlaceholder: "Tamil word (in Tamil script)",
      submitPlaceholder:
        "Describe the meaning of this word or concept that currently has no Tamil equivalent...",
      submitPageDescription:
        "Submit a foreign word or concept that lacks a Tamil equivalent. The community and AI will propose neologisms.",
      loginFooter: "By signing in, you agree to help build the Tamil lexicon",
    },
  },
};

const langCode = process.env.NEXT_PUBLIC_TARGET_LANGUAGE || "ka";
export const TARGET_LANG: LanguageConfig = LANGUAGES[langCode] ?? LANGUAGES.ka;
