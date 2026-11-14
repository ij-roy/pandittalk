#!/usr/bin/env node
/**
 * Use: npm run android   (from apps/mobile)
 *      npm run mobile:android   (from repo root)
 *
 * Do NOT use `npx expo run:android` directly — Expo may pick a dead
 * emulator (emulator-5554) and fail at install even when the build succeeds.
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const cxxDir = path.join(mobileRoot, 'android', 'app', '.cxx');
const debugApk = path.join(
  mobileRoot,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk',
);

function adbOutput(cmd) {
  try {
    return execSync(`adb ${cmd}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    }).trim();
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? '';
    const stderr = error.stderr?.toString?.() ?? '';
    return `${stdout}${stderr}`.trim();
  }
}

function adbSilent(cmd) {
  try {
    execSync(`adb ${cmd}`, { stdio: 'ignore', shell: true });
  } catch {
    /* ignore */
  }
}

function isWirelessSerial(id) {
  // e.g. 172.16.62.117:41825 (TCP/IP debugging)
  return /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(id);
}

function listDeviceEntries() {
  return adbOutput('devices')
    .split('\n')
    .slice(1)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2 || !parts[0]) return null;
      return { id: parts[0], state: parts[1] };
    })
    .filter(Boolean);
}

function refreshAdb() {
  // kill-server drops wireless (adb connect) sessions — remember them first.
  const wirelessBefore = listDeviceEntries()
    .filter((d) => isWirelessSerial(d.id))
    .map((d) => d.id);

  adbSilent('kill-server');
  adbSilent('start-server');

  for (const id of wirelessBefore) {
    console.log(`Reconnecting wireless device ${id}...`);
    adbSilent(`connect ${id}`);
  }

  // Common stale emulator from prior Android Studio sessions
  adbSilent('-s emulator-5554 emu kill');
  adbSilent('disconnect emulator-5554');

  for (const { id, state } of listDeviceEntries()) {
    if (id.startsWith('emulator-')) {
      const probe = adbOutput(`-s ${id} shell echo ok`);
      const alive = probe.includes('ok');
      if (!alive || state === 'offline' || state === 'unauthorized') {
        adbSilent(`-s ${id} emu kill`);
        adbSilent(`disconnect ${id}`);
      }
    } else if (state === 'offline' || state === 'unauthorized') {
      adbSilent(`disconnect ${id}`);
    }
  }
}

function listReadyDevices() {
  const lines = adbOutput('devices -l').split('\n').slice(1);
  return lines
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) return null;
      return { id: parts[0], state: parts[1] };
    })
    .filter((d) => d && d.state === 'device');
}

function pickDevice(devices) {
  if (devices.length === 0) return null;
  const physical = devices.find((d) => !d.id.startsWith('emulator-'));
  return physical ?? devices[0];
}

function maybeCleanCxx(userArgs) {
  const clean = userArgs.includes('--clean');
  const filtered = userArgs.filter((a) => a !== '--clean');
  if (clean && fs.existsSync(cxxDir)) {
    console.log('Cleaning Android CMake cache (.cxx)...');
    fs.rmSync(cxxDir, { recursive: true, force: true });
  }
  return filtered;
}

function installApk(deviceId) {
  if (!fs.existsSync(debugApk)) return false;
  console.log(`\nInstalling APK on ${deviceId}...`);
  try {
    execSync(`adb -s ${deviceId} install -r "${debugApk}"`, {
      stdio: 'inherit',
      shell: true,
    });
    return true;
  } catch {
    return false;
  }
}

function launchDevClient(deviceId) {
  const pkg = 'com.anonymous.PanditTalk';
  adbSilent(
    `-s ${deviceId} shell monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`,
  );
}

function main() {
  const userArgs = maybeCleanCxx(process.argv.slice(2));
  const installOnly = userArgs.includes('--no-build');
  const expoUserArgs = userArgs.filter((a) => a !== '--no-build');

  console.log('Refreshing ADB and removing stale emulators...');
  refreshAdb();

  const devices = listReadyDevices();
  const target = pickDevice(devices);

  if (!target) {
    console.error('\nNo Android device ready.');
    console.error('• Connect your phone with USB debugging enabled, or');
    console.error('• Start an emulator from Android Studio, then retry.');
    console.error('\nadb devices:');
    console.error(adbOutput('devices -l') || '(none)');
    process.exit(1);
  }

  console.log(`Using device: ${target.id}`);
  if (devices.length > 1) {
    console.log(`(${devices.length} devices connected)`);
  }

  if (installOnly) {
    if (!installApk(target.id)) {
      console.error('APK not found. Run npm run android first.');
      process.exit(1);
    }
    launchDevClient(target.id);
    process.exit(0);
  }

  // Do not pass the adb serial to `--device` — Expo matches by device *name*
  // (e.g. SM_S921E) and errors out before Gradle runs. ANDROID_SERIAL below
  // makes adb (and Gradle install tasks) target the right device.
  const expoArgs = ['expo', 'run:android', ...expoUserArgs];
  const result = spawnSync('npx', expoArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: mobileRoot,
    env: {
      ...process.env,
      ANDROID_SERIAL: target.id,
    },
  });

  if ((result.status ?? 1) === 0) {
    process.exit(0);
  }

  // Build often succeeds but Expo install step fails on ghost emulators — recover.
  if (fs.existsSync(debugApk) && installApk(target.id)) {
    console.log('\nRecovered: APK installed via adb (Expo install step had failed).');
    console.log('Start Metro with: npm run start:dev');
    launchDevClient(target.id);
    process.exit(0);
  }

  process.exit(result.status ?? 1);
}

main();
