// Run after `expo prebuild`: switches the Android release build from the debug
// key to the keystore Codemagic provides via android_signing (CM_KEYSTORE_*).
const fs = require('fs');

const file = 'android/app/build.gradle';
let gradle = fs.readFileSync(file, 'utf8');

const releaseConfig = `
        release {
            storeFile file(System.getenv("CM_KEYSTORE_PATH"))
            storePassword System.getenv("CM_KEYSTORE_PASSWORD")
            keyAlias System.getenv("CM_KEY_ALIAS")
            keyPassword System.getenv("CM_KEY_PASSWORD")
        }`;

if (!gradle.includes('CM_KEYSTORE_PATH')) {
  gradle = gradle.replace(/signingConfigs\s*\{/, (m) => m + releaseConfig);
  gradle = gradle.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.release');
  fs.writeFileSync(file, gradle);
}

if (!gradle.includes('signingConfig signingConfigs.release')) {
  console.error('Could not switch the release build to the release keystore');
  process.exit(1);
}
console.log('Android release build now signed with the Codemagic keystore');
