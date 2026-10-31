import { fireEvent, screen } from '@testing-library/react-native';
import { Banner, Button, Chip, ProgressBar, SegmentedControl, TextField } from '@/components/ui';
import { renderWithProviders } from '@/test-utils/render';

describe('Button', () => {
  it('es un botón accesible que responde al toque', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Guardar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado o cargando no ejecuta la acción', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <>
        <Button label="A" onPress={onPress} disabled />
        <Button label="B" onPress={onPress} loading />
      </>
    );
    await fireEvent.press(screen.getByRole('button', { name: 'A' }));
    await fireEvent.press(screen.getByRole('button', { name: 'B' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
  });
});

describe('TextField', () => {
  it('asocia la etiqueta y anuncia el error', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<TextField label="Tarifa" value="" onChangeText={onChangeText} error="Ingresa un número" />);
    const input = screen.getByLabelText('Tarifa');
    await fireEvent.changeText(input, '0,9');
    expect(onChangeText).toHaveBeenCalledWith('0,9');
    expect(screen.getByText('Ingresa un número')).toBeOnTheScreen();
  });

  it('muestra la ayuda cuando no hay error', async () => {
    await renderWithProviders(<TextField label="IP" value="" helperText="Misma red Wi-Fi" prefix="http://" suffix="x" />);
    expect(screen.getByText('Misma red Wi-Fi')).toBeOnTheScreen();
    await fireEvent(screen.getByLabelText('IP'), 'focus');
    await fireEvent(screen.getByLabelText('IP'), 'blur');
  });
});

describe('SegmentedControl y Chip', () => {
  it('expone el estado seleccionado y cambia de opción', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedControl
        accessibilityLabel="Tema"
        value="light"
        onChange={onChange}
        options={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Oscuro', icon: 'weather-night' },
        ]}
      />
    );
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Claro' }));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('chip seleccionable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Bs 100" selected={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Bs 100' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Banner y ProgressBar', () => {
  it('las alertas urgentes usan el rol alert y se pueden cerrar', async () => {
    const onDismiss = jest.fn();
    await renderWithProviders(<Banner tone="danger" title="Sobrecarga" message="Detalle" onDismiss={onDismiss} />);
    expect(screen.getByText('Sobrecarga')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar aviso: Sobrecarga' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('la barra de progreso se limita a 0..100', async () => {
    await renderWithProviders(<ProgressBar value={140} color="#000" trackColor="#fff" accessibilityLabel="Uso" />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 100, now: 100 });
  });
});
