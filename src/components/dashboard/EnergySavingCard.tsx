import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Icon, IconCircle } from '@/components/ui';
import { makeStyles, radius, spacing, useTheme, withAlpha } from '@/theme';

interface Tip {
  title: string;
  tip: string;
  savingBs: number;
}

const TIPS: Tip[] = [
  {
    title: 'Ducha eléctrica',
    tip: 'Bajar 5 minutos al baño diario puede ahorrar hasta 12 kWh al mes.',
    savingBs: 25,
  },
  {
    title: 'Focos LED',
    tip: 'Reemplazar 3 focos comunes por LED de bajo consumo reduce tu gasto mensual.',
    savingBs: 18,
  },
  {
    title: 'Consumo fantasma',
    tip: 'Desconectar cargadores y artefactos en modo espera evita consumos innecesarios.',
    savingBs: 12,
  },
  {
    title: 'Refrigerador',
    tip: 'Mantener limpios los sellos de goma de la puerta evita que el motor trabaje de más.',
    savingBs: 15,
  },
];

export function EnergySavingCard() {
  const [index, setIndex] = useState(0);
  const { colors } = useTheme();
  const styles = useStyles();

  const current = TIPS[index];

  const nextTip = () => {
    setIndex((prev) => (prev + 1) % TIPS.length);
  };

  return (
    <Card style={styles.card} testID="energy-saving-card">
      <View style={styles.header}>
        <IconCircle
          name="lightbulb-on-outline"
          color={colors.warning}
          background={withAlpha(colors.warning, 0.12)}
          size={36}
        />
        <View style={styles.headerText}>
          <AppText variant="title">Tip de Ahorro Familiar</AppText>
          <AppText variant="caption" tone="secondary">
            {current.title} · Ahorro estimado: ~Bs {current.savingBs}/mes
          </AppText>
        </View>
        <Pressable
          onPress={nextTip}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Ver otro consejo de ahorro"
          hitSlop={8}
        >
          <Icon name="refresh" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.contentBox}>
        <AppText variant="small" tone="default">
          {current.tip}
        </AppText>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  contentBox: {
    backgroundColor: withAlpha(theme.colors.warning, 0.08),
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
}));
