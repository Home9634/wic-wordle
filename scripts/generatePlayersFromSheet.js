#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { playerColumnMap, numericFields, undefinedFields } from "./playerColumnMap.js";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SHEET_ID = "173HgGcjya-4LdC21KcSuLjMEAchVmoudO2z3mcZykek";
const SHEET_NAME = "Player Info";
const OUTPUT_FILE = path.join(__dirname, "../src/data/players.js");
const CREDENTIALS_PATH = path.join(__dirname, "../.credentials/service-account-key.json");
const multiValueFields = new Set(["bestGame", "bestGameRetired"]);

/**
 * Load and validate service account credentials
 */
async function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Service account key not found at ${CREDENTIALS_PATH}\n` +
      `Please save your GCP service account JSON key to this location.`
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  return credentials;
}

/**
 * Authenticate and get Google Sheets API client
 */
async function getAuthenticatedClient(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Fetch data from Google Sheet
 */
async function fetchSheetData(sheets) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_NAME}'`
    });

    return response.data.values;
  } catch (error) {
    throw new Error(`Failed to fetch sheet data: ${error.message}`);
  }
}

/**
 * Parse aliases field (comma-separated string -> array)
 */
function parseAliases(aliasesStr) {
  if (!aliasesStr || aliasesStr.trim() === "") return undefined;
  return aliasesStr.split(",").map(a => a.trim());
}

/**
 * Parse comma-separated game values into an array when needed
 */
function parseGameValues(gameStr) {
  if (!gameStr || gameStr.trim() === "") return undefined;

  const values = gameStr
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  return values;
}

/**
 * Transform sheet row to player object
 */
function transformRow(headers, row) {
  const player = {};

  Object.entries(playerColumnMap).forEach(([sheetCol, playerKey]) => {
    const colIndex = headers.indexOf(sheetCol);
    if (colIndex === -1) return; // Column not found, skip

    let value = row[colIndex] ?? "";

    // Handle empty values
    if (value === "") {
      if (undefinedFields.has(playerKey)) {
        player[playerKey] = undefined;
      } else if (numericFields.has(playerKey)) {
        player[playerKey] = 0;
      }
      return;
    }

    // Convert to number if needed
    if (numericFields.has(playerKey)) {
      player[playerKey] = parseInt(value, 10);
      if (isNaN(player[playerKey])) {
        console.warn(`Warning: Could not parse "${value}" as number for ${playerKey}`);
        player[playerKey] = 0;
      }
      return;
    }

    // Parse aliases
    if (playerKey === "aliases") {
      player[playerKey] = parseAliases(value);
      return;
    }

    // Parse multi-game fields
    if (multiValueFields.has(playerKey)) {
      player[playerKey] = parseGameValues(value);
      return;
    }

    // Keep as string
    player[playerKey] = String(value).replace(/\r?\n+/g, " ").trim();
  });

  return player;
}

/**
 * Generate JavaScript export code
 */
function generatePlayersJS(players) {
  const playerObjects = players
    .map(player => {
      const lines = [];
      lines.push("  {");

      Object.entries(player).forEach(([key, value]) => {
        if (value === undefined) {
          lines.push(`    ${key}: undefined,`);
        } else if (typeof value === "string") {
          lines.push(`    ${key}: ${JSON.stringify(value)},`);
        } else if (Array.isArray(value)) {
          const aliasStr = value.map(a => `"${a}"`).join(", ");
          lines.push(`    ${key}: [${aliasStr}],`);
        } else {
          lines.push(`    ${key}: ${value},`);
        }
      });

      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1); // Remove trailing comma
      lines.push("  }");
      return lines.join("\n");
    })
    .join(",\n");

  return `export const players = [\n${playerObjects}\n];\n`;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("🔐 Loading credentials...");
    const credentials = await loadCredentials();

    console.log("🔑 Authenticating with Google Sheets API...");
    const sheets = await getAuthenticatedClient(credentials);

    console.log(`📊 Fetching data from sheet "${SHEET_NAME}"...`);
    const values = await fetchSheetData(sheets);

    if (!values || values.length === 0) {
      throw new Error("No data found in sheet");
    }

    const headers = values[0];
    const rows = values.slice(1);

    console.log(`📝 Processing ${rows.length} players...`);
    const players = rows
      .filter(row => row[0]) // Filter out empty rows
      .map(row => transformRow(headers, row));

    console.log(`✍️  Generating players.js with ${players.length} players...`);
    const jsCode = generatePlayersJS(players);

    fs.writeFileSync(OUTPUT_FILE, jsCode);
    console.log(`✅ Successfully generated ${OUTPUT_FILE}`);
    console.log(`   Players: ${players.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
