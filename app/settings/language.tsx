import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Check, Globe } from 'lucide-react-native';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { currentLanguage, supportedLanguages, changeLanguage, t } = useLanguage();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const southAfricanLanguages = supportedLanguages.filter(lang => 
    ['en', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 've', 'ts', 'nr', 'nso'].includes(lang.code)
  );

  const internationalLanguages = supportedLanguages.filter(lang => 
    ['es', 'fr', 'pt', 'ar', 'hi', 'zh'].includes(lang.code)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>{t('languages.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={24} color={Colors.primary[600]} />
            <Text style={styles.sectionTitle}>{t('languages.southAfricanLanguages')}</Text>
          </View>
          
          <View style={styles.languageList}>
            {southAfricanLanguages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.selectedLanguageItem,
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    currentLanguage === language.code && styles.selectedLanguageName,
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageEnglishName,
                    currentLanguage === language.code && styles.selectedLanguageEnglishName,
                  ]}>
                    {language.name}
                  </Text>
                  {!language.aiSupported && (
                    <Text style={styles.limitedSupportText}>
                      Limited AI support
                    </Text>
                  )}
                </View>
                
                {currentLanguage === language.code && (
                  <Check size={20} color={Colors.primary[600]} />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={24} color={Colors.secondary[600]} />
            <Text style={styles.sectionTitle}>{t('languages.internationalLanguages')}</Text>
          </View>
          
          <View style={styles.languageList}>
            {internationalLanguages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code && styles.selectedLanguageItem,
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    currentLanguage === language.code && styles.selectedLanguageName,
                    language.rtl && styles.rtlText,
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageEnglishName,
                    currentLanguage === language.code && styles.selectedLanguageEnglishName,
                  ]}>
                    {language.name}
                  </Text>
                  {language.rtl && (
                    <Text style={styles.rtlIndicator}>
                      Right-to-left script
                    </Text>
                  )}
                </View>
                
                {currentLanguage === language.code && (
                  <Check size={20} color={Colors.primary[600]} />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.infoSection}>
          <Text style={styles.infoTitle}>Language Support Information</Text>
          <Text style={styles.infoText}>
            • All languages support basic app navigation and interface
          </Text>
          <Text style={styles.infoText}>
            • AI features (plant identification, chat assistant) have full support for English, Afrikaans, Zulu, Spanish, French, Portuguese, Arabic, Hindi, and Chinese
          </Text>
          <Text style={styles.infoText}>
            • Other South African languages have limited AI support but full interface translation
          </Text>
          <Text style={styles.infoText}>
            • Community features support all languages with automatic translation options
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  languageList: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  selectedLanguageItem: {
    backgroundColor: Colors.primary[50],
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: Colors.primary[700],
  },
  languageEnglishName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 2,
  },
  selectedLanguageEnglishName: {
    color: Colors.primary[600],
  },
  limitedSupportText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.status.warning,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlIndicator: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.secondary[600],
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
});