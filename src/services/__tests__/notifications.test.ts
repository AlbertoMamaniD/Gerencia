import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { __resetNotificationsForTests, ALERT_CHANNEL_ID, configureNotifications, notify } from '../notifications';

const mocked = Notifications as jest.Mocked<typeof Notifications>;
const originalOS = Platform.OS;

function setOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

beforeEach(() => {
  __resetNotificationsForTests();
  jest.clearAllMocks();
  setOS('android');
});

afterAll(() => setOS(originalOS));

describe('configureNotifications', () => {
  it('si Expo Go rechaza el canal, igual pide el permiso y usa el canal por defecto', async () => {
    // Mismo error que mostró Expo Go en Android.
    mocked.setNotificationChannelAsync.mockRejectedValueOnce(
      new Error("Call to function 'ExpoNotificationChannelManager.setNotificationChannelAsync' has been rejected.")
    );
    mocked.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as never);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await configureNotifications('#0E7490');

    expect(mocked.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();

    await expect(notify('t', 'm', 'warning')).resolves.toBe(true);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: null }));
    warn.mockRestore();
  });

  it('con el canal creado, las alertas usan el canal propio', async () => {
    await configureNotifications('#0E7490');
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled(); // ya concedido
    await notify('t', 'm', 'critical');
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { channelId: ALERT_CHANNEL_ID } })
    );
  });

  it('un fallo al pedir el permiso no rompe la app', async () => {
    mocked.getPermissionsAsync.mockRejectedValueOnce(new Error('no disponible'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(configureNotifications('#0E7490')).resolves.toBeUndefined();
    warn.mockRestore();
  });

  it('si el envío falla devuelve false', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('x'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(notify('t', 'm')).resolves.toBe(false);
    warn.mockRestore();
  });

  it('en web no hace nada', async () => {
    setOS('web');
    await configureNotifications('#000');
    expect(mocked.setNotificationHandler).not.toHaveBeenCalled();
    await expect(notify('t', 'm')).resolves.toBe(false);
  });
});
