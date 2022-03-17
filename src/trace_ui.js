require('dotenv').config();

// View.
function createTableHeadStart() {
  return `<style>
  table {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 30%;
  }

  td,
  th {
    border: 1px solid #ddd;
    padding: 8px;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  tr:hover {
    background-color: #ddd;
  }

  th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #f4fAfD;
    color: black;
  }
  </style><table><thead>`;
}

function createTableHeadEnd() {
  return '</table>';
}

function createModelTableHead(data) {
  var header = createTableHeadStart();
  header += `<th>${data}</th></thead>`;
  return header;
}

function createTableHead(data, modelName, linkInfo) {
  var header = createTableHeadStart();
  header += createRowWithLink(data, modelName, linkInfo) + '</thead>';
  return header;
}


function createRows(data) {
  var rows = '';
  for (let element of data) {
    rows += createRow(element);
  }
  return rows;
}

function createRow(data) {
  let tr = '<tr>';
  for (key in data) {
    tr += `<td>${data[key]}</td>`;
  }
  tr += '</tr>';
  return tr;
}

function getParaFromLinkInfo(linkInfo) {
  let linkStr = '';
  for (const property in linkInfo) {
    linkStr += `&${property}=${linkInfo[property]}`;
  }
  return linkStr;
}

// linkinfo:  {date: 2022, gpufreq: 192000}
function createRowWithLink(data, modelName, linkInfo) {
  let tr = '<tr>';
  const lintStr = getParaFromLinkInfo(linkInfo);
  const rawTimestamp =
      process.env.IS_RAW_TIMESTAMP != 'false' ? '' : '&rawtimestamp=false';
  for (key in data) {
    if (data[key] != 'name') {
      const gpuDataFile = `${modelName}-${key}`;
      console.log(
          modelName + ',,,' + key + ',,,' +
          `${key}` +
          ',,,,' + gpuDataFile)
      tr += `<td><a href="./../../timeline.html?${lintStr}&${
          rawTimestamp}&gpufile=${modelName}-${key}">${data[key]}</a></td>`;
    } else {
      tr += `<td>${data[key]}</td>`;
    }
  }
  tr += '</tr>';
  return tr;
}

module.exports = {
  createTableHead: createTableHead,
  createModelTableHead: createModelTableHead,
  createTableHeadEnd: createTableHeadEnd,
  createRow: createRow,
  createRows: createRows
};