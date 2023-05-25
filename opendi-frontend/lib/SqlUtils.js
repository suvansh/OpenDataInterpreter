import initSqlJs from 'sql.js';

export function inferTypes(csvData) {
    let types = {};
    let headers = csvData[0];
    let firstRow = csvData[1];
    console.log(firstRow);

    // zip headers and first row together
    for (let i = 0; i < headers.length; i++) {
      let value = firstRow[i];
      let inferredType;
  
      // Check if the value can be parsed as a number
      if (!isNaN(value) && isFinite(value)) {
        // Distinguish between integers and floats
        inferredType = value.indexOf('.') === -1 ? 'INT' : 'FLOAT';
      } else if (new Date(value).toString() !== 'Invalid Date') {
        // Check if the value can be parsed as a date
        inferredType = 'DATE';
      } else {
        // If it can't be parsed as a number or a date, assume it's a string
        inferredType = 'STRING';
      }
  
      types[headers[i]] = inferredType;
    }
  
    return types;
  }

  export async function createSqlJsTable(data) {
    const types = inferTypes(data);
    console.log(types);
    let sqlCreateTable = `CREATE TABLE mytable (`;
    for (let key in types) {
      sqlCreateTable += `\`${key}\` ${types[key]},`;
    }
    sqlCreateTable = sqlCreateTable.slice(0, -1); // Remove the trailing comma
    sqlCreateTable += `);`;

    // Initialize the SQL.js library
    const SQL = await initSqlJs({locateFile: file => "https://sql.js.org/dist/sql-wasm.wasm"});
  
    // Create a database
    const db = new SQL.Database();
  
    // Execute the create table and insert data queries
    db.exec(sqlCreateTable);

  
    // // Create insert query
    // let sqlInsert = `INSERT INTO mytable (\`${Object.keys(types).join('`, `')}\`) VALUES `;
    // data.slice(1).forEach(row => {
    //   if ((row.length === 0) || (row[0].trim() === '')) return; // Skip empty rows
    //   let values = Object.values(row).map(val => 
    //     isNaN(val) ? `'${val.replace(/'/g, "''")}'` : val  // Escape single quotes in string values
    //   ).join(', ');
    
    //   sqlInsert += `(${values}), `;
    // });

    // sqlInsert = sqlInsert.slice(0, -2); // Remove the trailing comma and space
    // sqlInsert += ';';

    // // Execute the insert query
    // db.exec(sqlInsert);

    let batchSize = 10;
    let keys = `(\`${Object.keys(types).join('`, `')}\`)`;

    for (let i = 1; i < data.length; i += batchSize) {
        let sqlInsert = `INSERT INTO mytable ${keys} VALUES `;

        for (let j = i; j < i + batchSize && j < data.length; j++) {
            let row = data[j];
            if ((row.length === 0) || (row[0].trim() === '')) continue; // Skip empty rows
            let values = Object.values(row).map(val => 
                isNaN(val) ? `'${val.replace(/'/g, "''")}'` : val  // Escape single quotes in string values
            ).join(', ');

            sqlInsert += `(${values}), `;
        }

        sqlInsert = sqlInsert.slice(0, -2); // Remove the trailing comma and space
        sqlInsert += ';';

        try {
            db.exec(sqlInsert);
        } catch (err) {
            console.log(`Error executing SQL for batch starting at row ${i}:`, err);
            throw err; // Rethrow the error so that execution stops
        }
    }
  
    return db;  // Return the database for further use
  }