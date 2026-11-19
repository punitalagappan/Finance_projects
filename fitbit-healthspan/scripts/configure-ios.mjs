// Idempotently applies release settings to the generated Xcode project (run after `npx cap add ios` / before sync):
//  • Info.plist: display name, Google OAuth URL scheme, portrait-only iPhone, dark UI, export-compliance flag
//  • project.pbxproj: iPhone-only, version numbers, bundle ID, PrivacyInfo.xcprivacy in the app target
//  • PrivacyInfo.xcprivacy: no tracking, no collected data, required-reason API declarations
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { APP, iosRedirect } = await import(pathToFileURL(path.join(root, 'public/app.config.js')).href);
const appDir = path.join(root, 'ios/App/App');
const pbxPath = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');

// ---------------------------------------------------------------- Info.plist
const plistPath = path.join(appDir, 'Info.plist');
let plist = await fs.readFile(plistPath, 'utf8');

function setKey(key, valueXml) {
  const re = new RegExp(`(<key>${key}</key>\\s*)(<string>[^<]*</string>|<true/>|<false/>|<array>[\\s\\S]*?</array>|<dict>[\\s\\S]*?</dict>)`);
  if (re.test(plist)) plist = plist.replace(re, `$1${valueXml}`);
  else plist = plist.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${key}</key>\n\t${valueXml}\n</dict>\n</plist>\n`);
}

setKey('CFBundleDisplayName', `<string>${APP.name}</string>`);
setKey('ITSAppUsesNonExemptEncryption', '<false/>');
setKey('NSHealthShareUsageDescription', `<string>${APP.name} reads heart rate, HRV, sleep, breathing, blood oxygen, wrist temperature, steps, workouts, VO₂ max and body composition from Apple Health to calculate your Recovery, Strain, Sleep and Body Age on this iPhone. Your data never leaves your device.</string>`);
setKey('NSHealthUpdateUsageDescription', `<string>${APP.name} does not write to Apple Health. This permission is never requested.</string>`);
setKey('UIUserInterfaceStyle', '<string>Dark</string>');
setKey('UIRequiredDeviceCapabilities', '<array>\n\t\t<string>arm64</string>\n\t</array>');
setKey('UISupportedInterfaceOrientations', '<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>');
const redirect = iosRedirect();
if (redirect) {
  setKey('CFBundleURLTypes', `<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLName</key>\n\t\t\t<string>google-oauth</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${redirect.scheme}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>`);
} else {
  console.warn('⚠ APP.googleIosClientId is empty: Fitbit/Google sign-in is disabled in this build (Apple Health, import and demo still work).');
}
await fs.writeFile(plistPath, plist);

// ---------------------------------------------------------------- Privacy manifest
const privacy = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSPrivacyTracking</key>
	<false/>
	<key>NSPrivacyTrackingDomains</key>
	<array/>
	<key>NSPrivacyCollectedDataTypes</key>
	<array/>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
			</array>
		</dict>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>C617.1</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
`;
await fs.writeFile(path.join(appDir, 'PrivacyInfo.xcprivacy'), privacy);

// ---------------------------------------------------------------- HealthKit entitlement (read-only)
const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.developer.healthkit</key>
	<true/>
	<key>com.apple.developer.healthkit.access</key>
	<array/>
</dict>
</plist>
`;
await fs.writeFile(path.join(appDir, 'App.entitlements'), entitlements);

// ---------------------------------------------------------------- project.pbxproj
let pbx = await fs.readFile(pbxPath, 'utf8');
const FILE_REF = 'A10000000000000000000001';
const BUILD_FILE = 'A10000000000000000000002';
if (!pbx.includes(FILE_REF)) {
  pbx = pbx.replace('/* Begin PBXBuildFile section */\n',
    `/* Begin PBXBuildFile section */\n\t\t${BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${FILE_REF} /* PrivacyInfo.xcprivacy */; };\n`);
  pbx = pbx.replace('/* Begin PBXFileReference section */\n',
    `/* Begin PBXFileReference section */\n\t\t${FILE_REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n`);
  // Add to the App group (next to capacitor.config.json) and to the Resources build phase.
  pbx = pbx.replace(/(\n(\t+)50379B222058CBB4000EE86E \/\* capacitor\.config\.json \*\/,)/, `$1\n$2${FILE_REF} /* PrivacyInfo.xcprivacy */,`);
  pbx = pbx.replace(/(\n(\t+)50379B232058CBB4000EE86E \/\* capacitor\.config\.json in Resources \*\/,)/, `$1\n$2${BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */,`);
  if ((pbx.match(new RegExp(FILE_REF, 'g')) || []).length !== 3) throw new Error('Could not register PrivacyInfo.xcprivacy in project.pbxproj');
}
const ENT_REF = 'A10000000000000000000003';
if (!pbx.includes(ENT_REF)) {
  pbx = pbx.replace('/* Begin PBXFileReference section */\n',
    `/* Begin PBXFileReference section */\n\t\t${ENT_REF} /* App.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = "<group>"; };\n`);
  pbx = pbx.replace(/(\n(\t+)A10000000000000000000001 \/\* PrivacyInfo\.xcprivacy \*\/,)/, `$1\n$2${ENT_REF} /* App.entitlements */,`);
  pbx = pbx.replace(/(\t+)INFOPLIST_FILE = App\/Info\.plist;/g, '$1CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n$1INFOPLIST_FILE = App/Info.plist;');
  pbx = pbx.replace(/(504EC3031FED79650016851F = \{\n(\t+)CreatedOnToolsVersion = 9\.2;)/, '$1\n$2SystemCapabilities = {\n$2\tcom.apple.HealthKit = {\n$2\t\tenabled = 1;\n$2\t};\n$2};');
  if ((pbx.match(new RegExp(ENT_REF, 'g')) || []).length !== 2 || (pbx.match(/CODE_SIGN_ENTITLEMENTS/g) || []).length !== 2) {
    throw new Error('Could not wire App.entitlements into project.pbxproj');
  }
}
pbx = pbx
  .replace(/TARGETED_DEVICE_FAMILY = "1,2";/g, 'TARGETED_DEVICE_FAMILY = 1;')
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${APP.version};`)
  .replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${APP.bundleId};`);
await fs.writeFile(pbxPath, pbx);

console.log(`Configured iOS project for ${APP.name} ${APP.version} (${APP.bundleId})${redirect ? ` with OAuth scheme ${redirect.scheme}` : ''}`);
