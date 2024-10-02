import { fetch } from 'undici';
import fs from 'fs';
import dotenv from 'dotenv';

const MAX_ROW = 200;

const getSpreadsheet = async (url) => {
    const res = await fetch(url);
    if(!res.ok) throw new Error(`http error while getting spreadsheet: ${res.status}, error: ${res.statusText}`);
    const spreadsheet = await res.json();
    return spreadsheet;
}

const getSheetNames = (spreadsheet) => {
    return spreadsheet.sheets.map(sheet => sheet.properties.title);
}

const getSheetData = async (url) => {
    const spreadsheet = await getSpreadsheet(url);
    const sheet = spreadsheet.sheets[0];
    console.log(`data for sheet: ${sheet.properties.title}`)
    const gridData = sheet.data[0];
    let id = 1;
    const allRows = [];
    for (let i=1; i<MAX_ROW; i++, id++) {
        const rowData = gridData.rowData[i];
        // skip if the first col of the row is null or empty 
        if(
            rowData == null ||
            rowData.values == null || 
            rowData.values[0] == null ||
            rowData.values[0].formattedValue == null || 
            rowData.values[0].formattedValue === "" ||
            rowData.values[1] == null ||
            rowData.values[1].formattedValue == null ||
            rowData.values[1].formattedValue === "") {
            continue;
        }

        const q = rowData.values[0].formattedValue;
        const a = rowData.values[1].formattedValue;
        const p = rowData.values[2]==null || rowData.values[2].formattedValue === "" ? "" : rowData.values[2].formattedValue;

        const row = {id : id, question: q, answer: a, pic: p};
        allRows.push(row);
    }
    console.log(`fetching data for sheet ${sheet.properties.title} completed. total rows: ${allRows.length}`);
    return allRows;
}

const getTimeInIST = () => {
    return new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZoneName: 'short'
    });
}

const generateJson = async (id, key, saveToFile) => {
    try {
        dotenv.config();
        const spreadsheetID = id;
        const apiKey = key;
        const serviceEndpoint = `https://sheets.googleapis.com`;
        const sheetNamesUrl = `${serviceEndpoint}/v4/spreadsheets/${spreadsheetID}?key=${apiKey}`;
        console.log(sheetNamesUrl);
        
        const spreadsheet = await getSpreadsheet(sheetNamesUrl);
        const sheetNames = getSheetNames(spreadsheet);
        console.log(`sheetNames: ${sheetNames}`);

        // fetch data for each sheet
        const categoryPromises = sheetNames.map(async (sheetName) => {
            const sheetDataUrl = `${serviceEndpoint}/v4/spreadsheets/${spreadsheetID}?key=${apiKey}&includeGridData=true&ranges=${sheetName}!A1:C${MAX_ROW}`;
            console.log(`getting data from: ${sheetDataUrl}`);
            const sheetData = await getSheetData(sheetDataUrl);
            return {[sheetName]: sheetData};
        });

        const categories = await Promise.all(categoryPromises);

        const lastUpdated = getTimeInIST();

        const data = { 
            status: 200,
            lastUpdated: lastUpdated,
            categories_size: sheetNames.length, 
            categories_list: sheetNames,
            categories: Object.assign({}, ...categories)
        };

        if(saveToFile) {
            const jsonString = JSON.stringify(data, null, 2);
            fs.writeFileSync('content/data.json', jsonString);
            console.log('file saved');
        }
        
        return data;
    } catch (error) {
        console.error(`Error generating JSON: ${error}`);
        return {
            status: 500,
            message: `failed to generate data. ${error}`
        };
    }
}

export default async function handler(req, context) {
    try {
        const spreadsheetId = Netlify.env.get("GOOGLE_SHEETS_SPREADSHEET_ID");
        const apiKey = Netlify.env.get("GOOGLE_SHEETS_API_KEY");
        const jsonData = await generateJson(spreadsheetId, apiKey, true);
        return new Response(JSON.stringify(jsonData), {
            headers: {
                "content-type": "text/event-stream"
            }
        });
        // res.status(200).json(jsonData);
    } catch (error) {
        return new Response(context);
        // res.status(500).json({ message: `Failed to generate data, ${error}`});
    }
}

export const config = {
    path: "/refresh-data"
};