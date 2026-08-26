import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 500 },   // Ramp up to 500 VUs over 20 seconds
    { duration: '30s', target: 1000 },  // Ramp up to 1,000 VUs over 30 seconds
    { duration: '30s', target: 2000 },  // Peak load: Reach 2,000 VUs over 30 seconds
    { duration: '20s', target: 2000 },  // Hold steady at 2,000 VUs for 20 seconds
    { duration: '20s', target: 0 },     // Scale down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow up to 2 seconds under heavy 2k load
    http_req_failed: ['rate<0.15'],   // Allow up to 15% drop rate if local CPU limits are hit
  },
};

export default function () {
  const res = http.get('http://127.0.0.1:5173/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  check(res, {
    'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
  });

  sleep(1); // Maintain a 1-second interval per virtual user to control request pacing
}