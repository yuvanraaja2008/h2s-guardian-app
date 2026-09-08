import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export interface ParsedSensorData {
  temperature: number;
  humidity: number;
}

/**
 * Holds active device ID for cleanup if not explicitly passed
 */
let activeDeviceId: string | null = null;

/**
 * Parses ESP32 BLE notification string formatted as: TEMP:28.9,HUM:71.7
 * Returns null if malformed or invalid numbers.
 * Supports decimal values and optional spacing.
 */
export function parseBleSensorData(data: string): ParsedSensorData | null {
  if (!data || typeof data !== 'string') return null;

  // Expected format: TEMP:28.9,HUM:71.7
  const tempMatch = data.match(/TEMP:\s*([+-]?\d+(?:\.\d+)?)/i);
  const humMatch = data.match(/HUM:\s*([+-]?\d+(?:\.\d+)?)/i);

  if (!tempMatch || !humMatch) return null;

  const temperature = parseFloat(tempMatch[1]);
  const humidity = parseFloat(humMatch[1]);

  if (isNaN(temperature) || isNaN(humidity)) return null;

  return { temperature, humidity };
}

/**
 * Connects to the H2S Guardian ESP32 via BLE and subscribes to DHT11 notifications.
 * Handles Bluetooth availability, scanning, connection, and data parsing.
 */
export async function connectToH2SGuardian(
  onData: (temperature: number, humidity: number) => void,
  onDisconnect?: () => void
): Promise<BleDevice> {
  try {
    // 1. Initialize BLE subsystem & check status
    try {
      await BleClient.initialize();
      const enabled = await BleClient.isEnabled();
      if (!enabled) {
        throw new Error('Bluetooth is unavailable. Please enable Bluetooth and try again.');
      }
    } catch (err: any) {
      if (err?.message?.includes('Bluetooth is unavailable')) {
        throw err;
      }
      console.warn('BLE initialization check failed:', err);
      throw new Error('Bluetooth is unavailable. Please enable Bluetooth and try again.');
    }

    // 2. Request / scan for peripheral device advertising SERVICE_UUID
    let device: BleDevice;
    try {
      device = await BleClient.requestDevice({
        services: [SERVICE_UUID],
      });
    } catch (err: any) {
      console.warn('BLE requestDevice error:', err);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('unavailable') || msg.includes('not supported') || msg.includes('disabled')) {
        throw new Error('Bluetooth is unavailable. Please enable Bluetooth and try again.');
      }
      throw new Error('ESP32 sensor not found. Make sure H2S_GUARDIAN is powered on.');
    }

    if (!device || !device.deviceId) {
      throw new Error('ESP32 sensor not found. Make sure H2S_GUARDIAN is powered on.');
    }

    activeDeviceId = device.deviceId;

    // 3. Connect to peripheral with disconnect listener
    try {
      await BleClient.connect(device.deviceId, (disconnectedDeviceId) => {
        if (activeDeviceId === disconnectedDeviceId) {
          activeDeviceId = null;
        }
        if (onDisconnect) {
          onDisconnect();
        }
      });
    } catch (err: any) {
      console.error('BLE connect error:', err);
      activeDeviceId = null;
      throw new Error('Unable to connect to environmental sensor.');
    }

    // 4. Subscribe to DHT11 characteristic notifications
    try {
      await BleClient.startNotifications(
        device.deviceId,
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (value: DataView) => {
          try {
            const decoder = new TextDecoder();
            const raw = decoder.decode(
              new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
            );
            const parsed = parseBleSensorData(raw);

            if (parsed) {
              onData(parsed.temperature, parsed.humidity);
            }
          } catch (decodeErr) {
            console.warn('BLE notification decode error:', decodeErr);
          }
        }
      );
    } catch (err: any) {
      console.error('BLE startNotifications error:', err);
      try {
        await BleClient.disconnect(device.deviceId);
      } catch (_) {}
      activeDeviceId = null;
      throw new Error('Unable to connect to environmental sensor.');
    }

    return device;
  } catch (error: any) {
    activeDeviceId = null;
    throw error;
  }
}

/**
 * Disconnects from H2S Guardian peripheral and stops notifications.
 */
export async function disconnectFromH2SGuardian(deviceId?: string): Promise<void> {
  const targetId = deviceId || activeDeviceId;
  if (!targetId) return;

  try {
    await BleClient.stopNotifications(targetId, SERVICE_UUID, CHARACTERISTIC_UUID);
  } catch (e) {
    // Ignore error if notifications were not active or already disconnected
  }

  try {
    await BleClient.disconnect(targetId);
  } catch (e) {
    // Ignore error if already disconnected
  }

  if (activeDeviceId === targetId) {
    activeDeviceId = null;
  }
}

/**
 * Returns current connected device ID if any
 */
export function getActiveBleDeviceId(): string | null {
  return activeDeviceId;
}