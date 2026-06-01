'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { languages, LanguageCode, Direction } from './index';

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: (key: string) => string;
  direction: Direction;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LanguageCode>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('koko_lang') as LanguageCode | null;
    if (stored && languages[stored]) {
      setLangState(stored);
    } else {
      const browserLang = navigator.language.split('-')[0] as LanguageCode;
      if (languages[browserLang]) setLangState(browserLang);
    }
  }, []);

  const setLang = (code: LanguageCode) => {
    setLangState(code);
    localStorage.setItem('koko_lang', code);
    document.documentElement.lang = code;
    document.documentElement.dir = languages[code].direction;
  };

  const t = (key: string): string => {
    const translations = languages[lang].translations as Record<string, string>;
    return translations[key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang].direction;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, direction: languages[lang].direction }}>
      {children}
    </LanguageContext.Provider>
  );
};
