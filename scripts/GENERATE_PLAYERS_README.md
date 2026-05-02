# Generate Players Data from Google Sheets

This script fetches player data from a Google Sheet and generates the `src/data/players.js` file.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Your Service Account Key

1. Download your GCP service account key JSON file
2. Create a `.credentials` folder in the project root:
   ```bash
   mkdir .credentials
   ```
3. Save your service account JSON file as `.credentials/service-account-key.json`
4. Share your Google Sheet with the service account email (`wic-scorer@homes-cloud.iam.gserviceaccount.com`)

### 3. Update Column Mapping (if needed)

Edit `scripts/playerColumnMap.js` to match your Google Sheet column headers:

```javascript
export const playerColumnMap = {
  "Your Sheet Column Name": "playerObjectKey",
  // ... other mappings
};
```

### 4. Run the Script

```bash
node scripts/generatePlayersFromSheet.js
```

This will:
- Fetch data from the Google Sheet
- Transform it using your column mappings
- Generate a new `src/data/players.js` file
- Print success/error messages

## Column Mapping

The `playerColumnMap.js` file defines how Google Sheet columns map to player object properties:

```javascript
playerColumnMap = {
  "Player": "name",
  "Debut Event": "debut",
  "Canon Finale Appearances": "canonFinale",
  // ... etc
}
```

**Make sure your Google Sheet column names exactly match the keys in this mapping**, or edit the mapping to match your columns.

## Field Types

- **Numeric fields** (auto-converted to numbers): `canonFinale`, `canonPlayed`, `canonWins`, etc.
- **Undefined fields** (empty cells → `undefined`): `favGame`, `region`, etc.
- **Array fields**: `aliases` (comma-separated values in sheet)

## Troubleshooting

- **"Service account key not found"**: Make sure you've saved the key to `.credentials/service-account-key.json`
- **"Failed to fetch sheet data"**: Check that:
  - The sheet ID is correct
  - The service account has access to the sheet
  - The sheet tab name matches (default: "Player Info")
- **Column not found errors**: Check that your column headers in `playerColumnMap.js` exactly match the sheet headers
