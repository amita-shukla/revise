const { fetch } = require('undici');
const fs = require('fs');
require('dotenv').config();

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

const generateJson = async () => {
    try {
        const spreadsheetID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
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
            categories_size: sheetNames.length, 
            categories_list: sheetNames,
            categories: Object.assign({}, ...categories),
            lastUpdated: lastUpdated
        };

        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync('content/data.json', jsonString);
        console.log('file saved');

    } catch (error) {
        console.error(`Error generating JSON: ${error}`);

    }
}

generateJson();

module.exports = { generateJson };