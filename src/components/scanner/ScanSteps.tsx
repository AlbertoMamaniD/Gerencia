import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';

const STEPS = [
  'Enfoca de cerca los números del visor, evitando reflejos del sol o sombras.',
  'En medidores de rodillos, el último número rojo se calcula como decimal.',
  'En medidores digitales, espera a que la pantalla marque kWh (no fecha u hora).',
];

export function ScanSteps() {
  const styles = useStyles();
  return (
    <View style={styles.list} accessibilityRole="list">
      {STEPS.map((step, i) => (
        <View key={step} style={styles.item}>
          <View style={styles.number}>
            <AppText variant="caption" tone="primary">
              {i + 1}
            </AppText>
          </View>
          <AppText variant="small" tone="secondary" style={styles.text}>
            {step}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  text: {
    flex: 1,
  },
}));
