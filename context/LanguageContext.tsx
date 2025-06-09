import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { LanguageSupport } from '@/types';
import { securityService } from '@/services/securityService';

interface LanguageContextType {
  currentLanguage: string;
  supportedLanguages: LanguageSupport[];
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES: LanguageSupport[] = [
  // South African Languages
  { code: 'en', name: 'English', nativeName: 'English', rtl: false, supported: true, aiSupported: true },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', rtl: false, supported: true, aiSupported: true },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', rtl: false, supported: true, aiSupported: true },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', rtl: false, supported: true, aiSupported: false },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho', rtl: false, supported: true, aiSupported: false },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', rtl: false, supported: true, aiSupported: false },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati', rtl: false, supported: true, aiSupported: false },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda', rtl: false, supported: true, aiSupported: false },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', rtl: false, supported: true, aiSupported: false },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', rtl: false, supported: true, aiSupported: false },
  { code: 'nso', name: 'Northern Sotho', nativeName: 'Sepedi', rtl: false, supported: true, aiSupported: false },
  
  // International Languages
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, supported: true, aiSupported: true },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, supported: true, aiSupported: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, supported: true, aiSupported: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, supported: true, aiSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, supported: true, aiSupported: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false, supported: true, aiSupported: true },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    // Load saved language preference
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await securityService.getSecureItem('preferred_language');
      if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
        await changeLanguage(savedLanguage);
      } else {
        // Use device language if supported
        const deviceLanguage = getDeviceLanguage();
        if (deviceLanguage !== currentLanguage) {
          await changeLanguage(deviceLanguage);
        }
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
    }
  };

  const getDeviceLanguage = (): string => {
    const locales = Localization.getLocales();
    const primaryLocale = locales[0];
    
    // Check if device language is supported
    const supportedLanguage = SUPPORTED_LANGUAGES.find(
      lang => lang.code === primaryLocale.languageCode
    );
    
    return supportedLanguage ? primaryLocale.languageCode : 'en';
  };

  const changeLanguage = async (languageCode: string) => {
    try {
      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      if (!language || !language.supported) {
        throw new Error(`Language ${languageCode} is not supported`);
      }

      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
      // Save language preference securely
      await securityService.setSecureItem('preferred_language', languageCode);
      
      // Update document direction for RTL languages
      if (typeof document !== 'undefined') {
        document.dir = language.rtl ? 'rtl' : 'ltr';
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      throw new Error('Failed to change language');
    }
  };

  const getCurrentLanguageInfo = (): LanguageSupport => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  const value = {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    t,
    isRTL: getCurrentLanguageInfo().rtl,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}