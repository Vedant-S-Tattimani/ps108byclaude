import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const HI: Record<string, string> = {
  "Find standards": "मानक खोजें",
  "Spec audit": "विनिर्देश जाँच",
  "Standards library": "मानक पुस्तकालय",
  "Portal API": "पोर्टल API",
  "Back to top": "ऊपर जाएँ",
  "Tell us what you are buying": "बताइए आप क्या खरीद रहे हैं",
  "Notesheet · describe the item": "नोटशीट · वस्तु का विवरण",
  "Product description, technical spec or tender text": "उत्पाद विवरण, तकनीकी विनिर्देश या निविदा पाठ",
  "Upload a tender document": "निविदा दस्तावेज़ अपलोड करें",
  "PDF, DOCX or TXT up to 5 MB · we also audit it": "PDF, DOCX या TXT, 5 MB तक · हम इसकी जाँच भी करते हैं",
  "Try an example": "उदाहरण आज़माएँ",
  "Recommended standards": "अनुशंसित मानक",
  "Certification to demand": "आवश्यक प्रमाणन",
  "Allied standards": "संबद्ध मानक",
  "Draft tender clause": "निविदा खंड का प्रारूप",
  "Spec completeness": "विनिर्देश पूर्णता",
  "Waiting for your indent": "आपके मांग-पत्र की प्रतीक्षा",
  "Was this the right standard?": "क्या यह सही मानक था?",
  "Copy clause": "खंड कॉपी करें",
  "Compliance sheet": "अनुपालन तालिका",
  "Watch for changes": "बदलाव पर नज़र रखें",
  "Watching": "नज़र में",
  "Open on BIS": "BIS पर खोलें",
  "What changed": "क्या बदला",
  "Verify a certificate number": "प्रमाणपत्र संख्या जाँचें",
};

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => undefined });

function initialLang(): Lang {
  try {
    return window.localStorage.getItem("specsetu.lang") === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem("specsetu.lang", lang);
    } catch {
      /* storage unavailable: language resets on reload */
    }
  }, [lang]);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Translate an English UI string; falls back to English when no Hindi string exists. */
export function useT(): (english: string) => string {
  const { lang } = useLang();
  return (english) => (lang === "hi" ? HI[english] ?? english : english);
}
