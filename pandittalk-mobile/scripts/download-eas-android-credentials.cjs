const path = require('path');

const projectDir = path.join(__dirname, '..');

async function main() {
  const { createGraphqlClient } = require('eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient');
  const SessionManager = require('eas-cli/build/user/SessionManager').default;
  const { CredentialsContext } = require('eas-cli/build/credentials/context');
  const AndroidGraphqlClient = require('eas-cli/build/credentials/android/api/GraphqlClient');
  const { updateAndroidCredentialsAsync } = require('eas-cli/build/credentials/credentialsJson/update');
  const fs = require('fs-extra');

  const analytics = {
    setActor() {},
    logEvent() {},
  };

  const sessionManager = new SessionManager(analytics);
  const user = await sessionManager.getUserAsync();
  if (!user) {
    throw new Error('Not logged in to Expo. Run: npx eas-cli login');
  }

  const accessToken = sessionManager.getAccessToken();
  const sessionSecret = sessionManager.getSessionSecret();
  if (!accessToken && !sessionSecret) {
    throw new Error('Missing Expo auth session. Run: npx eas-cli login');
  }

  const graphqlClient = createGraphqlClient(
    accessToken
      ? { accessToken, sessionSecret: null }
      : { accessToken: null, sessionSecret }
  );

  const appLookupParams = {
    account: { name: 'pandittalk' },
    projectName: 'PanditTalk',
    androidApplicationIdentifier: 'com.pandittalk.mobile',
  };

  const buildCredentials = await AndroidGraphqlClient.getDefaultAndroidAppBuildCredentialsAsync(
    graphqlClient,
    appLookupParams
  );

  if (!buildCredentials?.androidKeystore) {
    throw new Error('No default Android keystore found on EAS for @pandittalk/PanditTalk');
  }

  const keystorePath = 'android/keystores/upload.jks';
  await fs.ensureDir(path.join(projectDir, 'android/keystores'));
  await fs.writeJson(
    path.join(projectDir, 'credentials.json'),
    {
      android: {
        keystore: {
          keystorePath,
        },
      },
    },
    { spaces: 2 }
  );

  const ctx = new CredentialsContext({
    projectDir,
    user,
    graphqlClient,
    analytics,
    vcsClient: {
      isFileUntrackedAsync: async () => true,
    },
    nonInteractive: true,
  });

  await updateAndroidCredentialsAsync(ctx, buildCredentials);

  const credentials = await fs.readJson(path.join(projectDir, 'credentials.json'));
  const keystore = credentials.android.keystore;
  const keystoreProperties = [
    `storeFile=keystores/upload.jks`,
    `storePassword=${keystore.keystorePassword}`,
    `keyAlias=${keystore.keyAlias}`,
    `keyPassword=${keystore.keyPassword ?? keystore.keystorePassword}`,
    '',
  ].join('\n');

  await fs.writeFile(path.join(projectDir, 'android/keystore.properties'), keystoreProperties, 'utf8');
  console.log('Downloaded EAS Android keystore to android/keystores/upload.jks');
  console.log('Wrote android/keystore.properties for Gradle release signing');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
