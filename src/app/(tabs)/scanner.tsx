import { View } from 'react-native';
import { CaptureHistory } from '@/components/scanner/CaptureHistory';
import { ReadingReviewCard } from '@/components/scanner/ReadingReviewCard';
import { ScanSteps } from '@/components/scanner/ScanSteps';
import { Viewfinder } from '@/components/scanner/Viewfinder';
import { ConnectionPill } from '@/components/layout/ConnectionPill';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Banner, Button, Card } from '@/components/ui';
import { useMeterScan } from '@/hooks/useMeterScan';
import { useEnergyStore } from '@/store/useEnergyStore';
import { makeStyles, spacing } from '@/theme';

export default function ScannerScreen() {
  const styles = useStyles();
  const captures = useEnergyStore((s) => s.captures);
  const meterKWh = useEnergyStore((s) => s.ledger.meterKWh);
  const ratePerKWh = useEnergyStore((s) => s.budget.ratePerKWh);
  const { state, pick, startManualEntry, discard, confirm, openSettings, clearFeedback } = useMeterScan();

  const busy = state.phase === 'processing' || state.phase === 'saving';
  const reviewing = state.phase === 'review' || state.phase === 'saving';

  return (
    <Screen
      testID="scanner-screen"
      header={<ScreenHeader title="Escanear medidor" subtitle="Calibración con foto" trailing={<ConnectionPill />} />}
    >
      {state.feedback ? (
        <View style={styles.feedback}>
          <Banner
            tone={state.feedback.tone}
            title={state.feedback.title}
            message={state.feedback.message}
            onDismiss={clearFeedback}
          />
          {state.feedback.action === 'open-settings' ? (
            <Button label="Abrir ajustes del teléfono" variant="secondary" icon="cog-outline" onPress={openSettings} />
          ) : null}
        </View>
      ) : null}

      <Card style={styles.card}>
        <Viewfinder imageUri={state.imageUri} processing={state.phase === 'processing'} />
        {reviewing ? null : (
          <>
            <ScanSteps />
            <View style={styles.actions}>
              <Button
                label="Tomar foto"
                icon="camera"
                onPress={() => void pick('camera')}
                disabled={busy}
                style={styles.flexButton}
                testID="take-photo"
              />
              <Button
                label="Galería"
                icon="image-outline"
                variant="secondary"
                onPress={() => void pick('library')}
                disabled={busy}
                style={styles.flexButton}
              />
            </View>
            <Button
              label="Ingresar lectura a mano"
              icon="pencil-outline"
              variant="ghost"
              onPress={startManualEntry}
              disabled={busy}
              testID="manual-entry"
            />
          </>
        )}
      </Card>

      {reviewing ? (
        <ReadingReviewCard
          key={`${state.imageUri ?? 'manual'}-${state.result?.detectedKWh ?? 'none'}`}
          result={state.result}
          currentMeterKWh={meterKWh}
          ratePerKWh={ratePerKWh}
          saving={state.phase === 'saving'}
          onConfirm={(value) => void confirm(value)}
          onDiscard={discard}
        />
      ) : null}

      <CaptureHistory captures={captures} />
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  feedback: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flexButton: {
    flexGrow: 1,
    flexBasis: 140,
  },
}));
