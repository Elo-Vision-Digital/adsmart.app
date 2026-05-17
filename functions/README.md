# Functions — Development

## Running tests

Some tests require the Firebase emulators. Start them first:

```bash
firebase emulators:start --only firestore,auth --project adsmart-test
```

Then in another terminal:

```bash
npm test
```
