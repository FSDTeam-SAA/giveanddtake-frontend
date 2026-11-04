# Production app link configuration

The website exposes these public endpoints without login or redirects:

- `https://evpitch.com/.well-known/assetlinks.json`
- `https://evpitch.com/.well-known/apple-app-site-association`
- `https://evpitch.com/apple-app-site-association`

All successful responses use `application/json`. Android uses the real Play signing
fingerprint supplied by the app owner on 4 November 2026, recorded in
`lib/android-app-links.json`. Invalid overrides return HTTP 503 with `no-store`;
do not publish invented or debug certificates to make verification appear successful.

## Android

In Play Console, open the production app's **Protected with Play → Play Store
protection → Manage Play app signing** page (formerly App integrity → App signing).
Copy the Digital Asset Links JSON containing the **App signing key certificate**
SHA-256, not just the upload certificate. Update `lib/android-app-links.json`, or
override it with the server-only environment variable `ANDROID_APP_LINKS_JSON`
containing that entire JSON array. Restart the website after changing the environment.

The current Flutter application ID is `com.evpitchrecruitment.careers`. Its activity
class still uses `com.pooelcentral.giveandtake.MainActivity`; an activity's namespace
is not necessarily the package name needed for association. Confirm the published
app's ID in Play Console. Retain all required Play signing certificates when keys
have been rotated. Multiple Android app statements are supported if necessary.

The mobile manifest and link handler accept HTTP and HTTPS links on `evpitch.com`
for `/pages/{slug}` and `/alljobs/{id}`. Other web pages stay outside the filters.
Jobs load through the existing API and retain the existing sign-in/apply checks.

After deployment, check the endpoint's status, JSON, package and signing certificate;
then use **Recheck verification** in Play Console. On an Android 12+ device with
the Play-installed app, run:

```sh
adb shell pm verify-app-links --re-verify com.evpitchrecruitment.careers
adb shell pm get-app-links com.evpitchrecruitment.careers
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://evpitch.com/pages/REPLACE_WITH_EXISTING_SLUG"
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://evpitch.com/alljobs/REPLACE_WITH_EXISTING_JOB_ID"
```

Allow time for verification before reading its result. Test links with the app
closed and already open, signed out and signed in. Existing releases with a correct
`/pages/` intent filter may recover after server correction and re-verification;
the new `/alljobs/` support requires an updated mobile release. A debug APK is not
proof that a Play-signed release verifies.

## iOS

The default association ID, `3XK4GQ9A6R.com.pooelcentral.giveandtake`, comes from
the Flutter Xcode project's team and bundle identifier. Before production release,
compare it with the signed app's `application-identifier` entitlement; a legacy App
ID prefix can differ from the Team ID. If different, set `IOS_APP_LINKS_APP_IDS`
to the exact identifier (comma-separated if more than one signed app is supported).
The association only claims `/pages/*` and `/alljobs/*`.

Build/sign on macOS and verify Universal Links on a physical iPhone after the
website files are live. The existing app declares `applinks:evpitch.com`. This
configuration does not diagnose or resolve an unrelated App Review rejection.

## Release versions

The fetched Flutter branch `origin/Test_All` at `e160d5b` includes version changes
from `6c91c8f` dated 2 November 2026: active Android `1.0.10+17`, with iOS
`1.0.11+2` commented out. The screenshots show Android `1.0.11` build 18 and refer
to TestFlight `1.0.11 (4)`, so do not submit the checkout's default version blindly.
Confirm the latest uploaded versions in each console and use explicit
`--build-name` and `--build-number` overrides for the next authorized release.
Fetching the Git history does not identify who uploaded a binary to either store.

References: [Android website association requirements](https://developer.android.com/training/app-links/configure-assetlinks),
[Apple associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains).
