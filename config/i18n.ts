import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from '@/locales/en.json';
import af from '@/locales/af.json';
import zu from '@/locales/zu.json';
import xh from '@/locales/xh.json';
import st from '@/locales/st.json';
import tn from '@/locales/tn.json';
import ss from '@/locales/ss.json';
import ve from '@/locales/ve.json';
import ts from '@/locales/ts.json';
import nr from '@/locales/nr.json';
import nso from '@/locales/nso.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import pt from '@/locales/pt.json';
import ar from '@/locales/ar.json';
import hi from '@/locales/hi.json';
import zh from '@/locales/zh.json';

const resources = {
  en: { translation: en },
  af: { translation: af }, // Afrikaans
  zu: { translation: zu }, // Zulu
  xh: { translation: xh }, // Xhosa
  st: { translation: st }, // Sotho
  tn: { translation: tn }, // Tswana
  ss: { translation: ss }, // Swati
  ve: { translation: ve }, // Venda
  ts: { translation: ts }, // Tsonga
  nr: { translation: nr }, // Ndebele
  nso: { translation: nso }, // Northern Sotho
  es: { translation: es }, // Spanish
  fr: { translation: fr }, // French
  pt: { translation: pt }, // Portuguese
  ar: { translation: ar }, // Arabic
  hi: { translation: hi }, // Hindi
  zh: { translation: zh }, // Chinese
};

const getDeviceLanguage = () => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale.languageCode;
  
  // Check if we support the device language
  if (resources[languageCode as keyof typeof resources]) {
    return languageCode;
  }
  
  // Fallback to English
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage() || 'en',
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;