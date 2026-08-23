# Pulse Sender Android App

Native Android companion app for the Pulse Dispatch test phase.

## What it does

- Registers an Android device against the backend
- Sends heartbeat updates
- Fetches queued SMS jobs
- Processes those jobs in either:
  - `simulate` mode for emulator and backend testing
  - live `SEND_SMS` mode for a real device

## Test-phase defaults

- Backend URL: `http://10.0.2.2:4000`
- User email: `pulak@example.com`
- Simulated sends: enabled

## Backend endpoints expected

- `POST /api/mobile/register`
- `POST /api/mobile/:deviceId/heartbeat`
- `GET /api/mobile/:deviceId/jobs`
- `POST /api/mobile/jobs/:deliveryId/result`

## Important note

Live SMS mode currently reports success when Android `SmsManager` accepts the send request. For production-grade delivery confirmation, we should add sent and delivered broadcast handling next.
