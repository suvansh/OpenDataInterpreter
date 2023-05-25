import React from 'react';

const SqlResultTable = ({ data }) => {
  return (
    <table className="text-black">
      <thead>
        <tr>
          {data.columns.map((column, index) => (
            <th key={index}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.values.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SqlResultTable;
