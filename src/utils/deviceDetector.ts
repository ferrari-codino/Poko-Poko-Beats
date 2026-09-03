import { DeviceMode } from '../types';

export interface ViewportDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  aspectRatio: number;
  deviceMode: DeviceMode;
}

export const detectInitialDeviceMode = (): DeviceMode => {
  if (typeof window === 'undefined') return 'tablet';

  // Check explicit manual preference first
  try {
    const saved = localStorage.getItem('pokopoko_preferred_device_mode');
    if (saved === 'smartphone' || saved === 'tablet') {
      return saved;
    }
  } catch {}

  const ua = navigator.userAgent || '';
  const isIPad =
    /iPad/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
  const isTabletUA = /Tablet/i.test(ua) || isIPad || isAndroidTablet;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // If width is >= 768px or it's an identified tablet device, use tablet mode
  if (isTabletUA || w >= 768) {
    return 'tablet';
  }

  // Small handheld screens (iPhone, Android phones)
  return 'smartphone';
};

export const savePreferredDeviceMode = (mode: DeviceMode) => {
  try {
    localStorage.setItem('pokopoko_preferred_device_mode', mode);
  } catch {}
};
