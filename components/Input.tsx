import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: typeof LucideIcon;
  style?: ViewStyle;
}

export default function Input({
  label,
  error,
  icon: Icon,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {Icon && (
          <Icon 
            size={20} 
            color={isFocused ? Colors.primary[600] : Colors.gray[400]} 
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, Icon && styles.inputWithIcon]}
          placeholderTextColor={Colors.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: Colors.status.error,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[900],
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.status.error,
    marginTop: 4,
  },
});