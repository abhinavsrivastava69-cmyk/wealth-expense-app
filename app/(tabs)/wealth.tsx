import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/common/Card';
import { StatRow } from '@/components/common/StatRow';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Badge } from '@/components/common/Badge';
import { calculateBalanceSheet, formatINR, formatINRFull } from '@/lib/calculations';
import type { Asset, Liability } from '@/lib/types';

const assetClassLabel: Record<string, string> = {
  'market-linked': 'Market-Linked',
  commodity: 'Commodity',
  'fixed-income': 'Fixed Income',
  liquid: 'Liquid',
  custom: 'Custom',
};

const assetClassColor: Record<string, string> = {
  'market-linked': Colors.primary,
  commodity: Colors.warning,
  'fixed-income': Colors.success,
  liquid: Colors.info,
  custom: Colors.accent,
};

export default function WealthScreen() {
  const router = useRouter();
  const { assets, liabilities } = useStore();
  const [view, setView] = useState<'full' | 'liquid'>('full');

  const bs = calculateBalanceSheet(assets, liabilities);

  const displayedLiabilities =
    view === 'liquid'
      ? liabilities.filter(l => l.type === 'short-term')
      : liabilities;

  const displayedNetWorth =
    view === 'liquid' ? bs.liquidPosition : bs.netWorth;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* View Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'full' && styles.toggleActive]}
          onPress={() => setView('full')}
        >
          <Text style={[styles.toggleText, view === 'full' && styles.toggleTextActive]}>
            Full Balance Sheet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'liquid' && styles.toggleActive]}
          onPress={() => setView('liquid')}
        >
          <Text style={[styles.toggleText, view === 'liquid' && styles.toggleTextActive]}>
            Liquid View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Net Worth Hero */}
      <Card style={styles.heroCard}>
        <Text style={styles.heroLabel}>
          {view === 'full' ? 'Net Worth' : 'Liquid Position'}
        </Text>
        <Text style={[styles.heroValue, { color: displayedNetWorth >= 0 ? Colors.success : Colors.danger }]}>
          {formatINRFull(displayedNetWorth)}
        </Text>
        <Text style={styles.heroSubtext}>
          {view === 'full'
            ? 'Total assets minus all liabilities'
            : 'Total assets minus short-term liabilities only'}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Total Assets</Text>
            <Text style={[styles.heroStatValue, { color: Colors.success }]}>
              {formatINR(bs.totalAssets)}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Short-Term Liab.</Text>
            <Text style={[styles.heroStatValue, { color: Colors.warning }]}>
              {formatINR(bs.shortTermLiabilities)}
            </Text>
          </View>
          {view === 'full' && (
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Long-Term Liab.</Text>
              <Text style={[styles.heroStatValue, { color: Colors.danger }]}>
                {formatINR(bs.longTermLiabilities)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Assets */}
      <SectionHeader
        title="Assets"
        action="+ Add"
        onAction={() => router.push({ pathname: '/asset-form' })}
      />
      <Card>
        {assets.length === 0 && (
          <Text style={styles.emptyText}>No assets added yet.</Text>
        )}
        {assets.map((asset, i) => (
          <TouchableOpacity
            key={asset.id}
            onPress={() => router.push({ pathname: '/asset-form', params: { id: asset.id } })}
          >
            <View style={[styles.assetRow, i < assets.length - 1 && styles.bordered]}>
              <View style={[styles.assetDot, { backgroundColor: assetClassColor[asset.assetClass] + '33' }]}>
                <Ionicons name="bar-chart" size={14} color={assetClassColor[asset.assetClass]} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetPlatform}>{asset.platform}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.assetValue}>{formatINR(asset.value)}</Text>
                <Badge label={assetClassLabel[asset.assetClass]} variant="info" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {assets.length > 0 && (
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total Assets</Text>
            <Text style={[styles.totalValue, { color: Colors.success }]}>{formatINR(bs.totalAssets)}</Text>
          </View>
        )}
      </Card>

      {/* Liabilities */}
      <SectionHeader
        title={view === 'full' ? 'All Liabilities' : 'Short-Term Liabilities'}
        action="+ Add"
        onAction={() => router.push({ pathname: '/liability-form' })}
      />
      <Card>
        {displayedLiabilities.length === 0 && (
          <Text style={styles.emptyText}>No liabilities shown for this view.</Text>
        )}
        {displayedLiabilities.map((liability, i) => (
          <TouchableOpacity
            key={liability.id}
            onPress={() => router.push({ pathname: '/liability-form', params: { id: liability.id } })}
          >
            <View style={[styles.liabRow, i < displayedLiabilities.length - 1 && styles.bordered]}>
              <View style={{ flex: 1 }}>
                <View style={styles.liabHeader}>
                  <Text style={styles.liabName}>{liability.name}</Text>
                  <Badge
                    label={liability.type === 'long-term' ? 'Long-Term' : 'Short-Term'}
                    variant={liability.type === 'long-term' ? 'danger' : 'warning'}
                  />
                </View>
                <View style={styles.liabDetails}>
                  <Text style={styles.liabDetail}>
                    EMI: {formatINR(liability.emiAmount)}/mo
                  </Text>
                  {liability.tenureMonths > 0 && (
                    <Text style={styles.liabDetail}>
                      · {liability.tenureMonths} months left
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[styles.liabValue, { color: Colors.danger }]}>
                {formatINR(liability.principalRemaining)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {displayedLiabilities.length > 0 && (
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total Liabilities</Text>
            <Text style={[styles.totalValue, { color: Colors.danger }]}>
              {formatINR(displayedLiabilities.reduce((s, l) => s + l.principalRemaining, 0))}
            </Text>
          </View>
        )}
      </Card>

      {view === 'liquid' && bs.longTermLiabilities > 0 && (
        <Card elevated style={{ marginTop: 0 }}>
          <View style={styles.excludedNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.excludedText}>
              Long-term liabilities ({formatINR(bs.longTermLiabilities)}) are excluded from liquid view. They reduce net worth but don't impair short-term paying capacity.
            </Text>
          </View>
        </Card>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.textPrimary },
  heroCard: { marginBottom: 20, borderColor: Colors.successDim, borderWidth: 1.5 },
  heroLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  heroValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  heroSubtext: { fontSize: 12, color: Colors.textMuted, marginBottom: 16 },
  heroStats: { flexDirection: 'row', gap: 0 },
  heroStat: { flex: 1 },
  heroStatLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  heroStatValue: { fontSize: 15, fontWeight: '700' },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  bordered: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  assetDot: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assetName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  assetPlatform: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  assetValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 15, fontWeight: '800' },
  liabRow: { paddingVertical: 10 },
  liabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  liabName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  liabDetails: { flexDirection: 'row' },
  liabDetail: { fontSize: 12, color: Colors.textMuted },
  liabValue: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', padding: 16 },
  excludedNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  excludedText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
