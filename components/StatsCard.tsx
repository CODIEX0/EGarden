import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { LucideIcon } from 'lucide-react-native';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: typeof LucideIcon;
  color: string;
}

export default function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  return (
    <View style={[styles.container, { flex: 1, minWidth: '47%' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray[900],
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[700],
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
});