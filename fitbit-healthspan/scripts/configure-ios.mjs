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
setKey('UIUserInterfaceStyle', '<string>Dark</string>');
setKey('UIRequiredDeviceCapabilities', '<array>\n\t\t<string>arm64</string>\n\t</array>');
setKey('UISupportedInterfaceOrientations', '<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>');
const redirect = iosRedirect();
if (redirect) {
  setKey('CFBundleURLTypes', `<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLName</key>\n\t\t\t<string>google-oauth</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${redirect.scheme}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>`);
} else {
  console.warn('⚠ APP.googleIosClientId is empty: the build will have demo + import only (no Google sign-in).');
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
pbx = pbx
  .replace(/TARGETED_DEVICE_FAMILY = "1,2";/g, 'TARGETED_DEVICE_FAMILY = 1;')
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${APP.version};`)
  .replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${APP.bundleId};`);
await fs.writeFile(pbxPath, pbx);

console.log(`Configured iOS project for ${APP.name} ${APP.version} (${APP.bundleId})${redirect ? ` with OAuth scheme ${redirect.scheme}` : ''}`);
