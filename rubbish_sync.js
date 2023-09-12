/*


*/

const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const util = require('util');

//const writeFile = util.promisify(fs.writeFile);
//const readFile = util.promisify(fs.readFile);

(async () => {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    console.log('browser.newPage');

    // Set a user agent to mimic a real web browser
    await page.setUserAgent('Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0');

    // Navigate to the URL
    await page.goto('https://ekosystem.wroc.pl/gospodarowanie-odpadami/harmonogram-wywozu-odpadow/?lokalizacja=32030&ulica=1127');
    console.log('page.goto');

    // Wait for any dynamic content to load (you might need to adjust the timeout)
    await page.waitForTimeout(5000); // Wait for 5 seconds (adjust as needed)

    // Wait for a specific element with a CSS selector to appear on the page
    // await page.waitForSelector('.tableRWD.waste-disposal-form__result.schedule-table table');
    //await page.waitForSelector('.thirdStepContainer waste-disposal-form__download');

    /* // Wait for a specific event or condition using waitForFunction
    await page.waitForFunction(() => {
        // Define your condition here; return true when the content you need is ready
        const table = document.querySelector('.tableRWD.waste-disposal-form__result.schedule-table table');
        return table && table.textContent.trim().length > 0; // Example condition: Check if the table is not empty
    }); */

    // Capture the page content
    const content = await page.content();

    // Save the content to a file
    
    fs.writeFile('test3.html', content);

    // Close the browser
    await browser.close();
    console.log('browser.close');

    /*
    // Parse the captured HTML content into a 2D array using jsdom
    const dom = new JSDOM(content);
    const table = dom.window.document.querySelector('.tableRWD.waste-disposal-form__result.schedule-table table');
    const tableData = [];

    // Extract column names from the table header
    const columnNames = [];
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach((headerCell) => {
        columnNames.push(headerCell.textContent.trim());
    });
    tableData.push(columnNames);

    // Iterate through the table rows and extract data
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const rowData = [];

        // Iterate through the row cells
        const cells = row.querySelectorAll('td');
        cells.forEach((cell) => {
            rowData.push(cell.textContent.trim()); // Store cell content in the array
        });

        // Push the row data array to the 2D array
        tableData.push(rowData);
    });

    // Define a function to format and print the table
    function printTable(data) {
        // Determine column widths based on the longest content in each column
        const columnWidths = data[0].map((_, colIndex) => {
            const columnData = data.map((row) => row[colIndex]);
            const maxLength = Math.max(...columnData.map((cell) => cell.length));
            return maxLength + 2; // Add 2 for padding
        });

        // Create a separator line
        const separator = columnWidths.map((width) => '-'.repeat(width)).join('+');

        // Print the header row
        console.log(separator);
        console.log(`| ${data[0].map((cell, colIndex) => cell.padEnd(columnWidths[colIndex])).join(' | ')} |`);
        console.log(separator);

        // Print the data rows
        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
            console.log(`| ${data[rowIndex].map((cell, colIndex) => cell.padEnd(columnWidths[colIndex])).join(' | ')} |`);
        }

        console.log(separator);
    }

    printTable(tableData);
    */

    // Parse the captured HTML content into a single key-value pair list
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(content);
    const table = dom.window.document.querySelector('.tableRWD.waste-disposal-form__result.schedule-table table');
    const tableData = [];

    // Extract column names from the table header
    const headerCells = table.querySelectorAll('thead th');
    const columnNames = Array.from(headerCells).map((headerCell) => headerCell.textContent.trim());

    // Iterate through the table rows and concatenate key-value pairs
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        // Iterate through the row cells and add key-value pairs to tableData
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            const cellContent = cell.textContent.trim();
            if (cellContent !== '') { // Exclude empty cells
                const key = columnNames[index];
                const keyValue = `${key}: ${cellContent}`;
                tableData.push(keyValue);
            }
        });
    });

    // Now, tableData contains a list of key-value pairs for the entire table excluding empty cells
    console.log('tableData');
    console.log(tableData);

    // Define the file path
    const filePath = 'tableData.json';

    // Read the existing data from the file (if any)
    let existingData = [];
    //try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
        console.log('existingData');
        console.log(existingData);
    //} catch (err) {
    //    // File doesn't exist or is empty; no need to handle this error
    //    console.log('err read existing file');
    //}

    // Create a Set to track existing key-value pairs
    const existingKeyValueSet = new Set(existingData);

    // Filter tableData to include only new key-value pairs and count them
    const newKeyPairs = tableData.filter((keyValue) => {
        if (!existingKeyValueSet.has(keyValue)) {
            console.log('new: ', keyValue);
            return true; // Include only new key-value pairs
        }
        return false; // Exclude existing key-value pairs
    });

    console.log('All new pairs: ', newKeyPairs);
    
    // Append the new data to the existing data
    existingData = existingData.concat(newKeyPairs);

    // Write the combined data back to the file
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Data has been written to the file:', filePath);
            console.log('Count of new key-value pairs:', newKeyPairs.length);
        }
    });

})();
