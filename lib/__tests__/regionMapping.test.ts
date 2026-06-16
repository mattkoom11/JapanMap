import { prefectureToRegion } from '../regionMapping';

test('Tokyo maps to kanto', () => {
  expect(prefectureToRegion('Tokyo')).toBe('kanto');
});

test('Osaka maps to kinki', () => {
  expect(prefectureToRegion('Osaka')).toBe('kinki');
});

test('Hokkaido maps to hokkaido_tohoku', () => {
  expect(prefectureToRegion('Hokkaido')).toBe('hokkaido_tohoku');
});

test('Okinawa maps to okinawa', () => {
  expect(prefectureToRegion('Okinawa')).toBe('okinawa');
});
