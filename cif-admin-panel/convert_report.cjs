const fs = require('fs');
const xml2js = require('xml2js');
const XLSX = require('xlsx');

async function generateExcel() {
  const xmlData = fs.readFileSync('test-results/junit-report.xml', 'utf-8');
  
  xml2js.parseString(xmlData, (err, result) => {
    if (err) {
      console.error("Error parsing XML:", err);
      return;
    }

    const testCases = [];
    const suites = result.testsuites.testsuite || [];

    suites.forEach(suite => {
      const cases = suite.testcase || [];
      cases.forEach(tc => {
        const name = tc.$.name;
        const classname = tc.$.classname;
        const time = tc.$.time;
        
        let status = 'Passed';
        let errorDetails = '';

        if (tc.failure) {
          status = 'Failed';
          errorDetails = tc.failure[0]._ || tc.failure[0];
        } else if (tc.skipped) {
          status = 'Skipped';
        }

        testCases.push({
          'Test Suite': classname,
          'Test Name': name,
          'Status': status,
          'Duration (s)': parseFloat(time),
          'Error Details': errorDetails ? errorDetails.trim() : ''
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(testCases);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Results');

    XLSX.writeFile(workbook, 'test-results/Playwright_Test_Report.xlsx');
    console.log('Excel report successfully generated at test-results/Playwright_Test_Report.xlsx!');
  });
}

generateExcel();