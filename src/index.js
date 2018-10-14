/**
 * The main scanning service
 *
 * All this does is try to connect to port 3306 with default username root and no password
 */

const evilscan = require("evilscan");
const mysql = require("mysql");
const Table = require("cli-table");

const STATUS_TIMEOUT = "Time out";
const STATUS_REFUSED = "Refused";
const STATUS_OPEN = "Open";
const STATUS_UNREACHABLE = "Unreachable";
const STATUS_AUTHENTICATED = "Authenticated";

const MYSQL_PORT = "3306";

/**
 * Runs the scan
 *
 * Returns a promise of the scan results
 * that will have all the results by type in an array
 */
function portScan() {
  let results = [];

  return new Promise((resolve, reject) => {
    let options = {
      target: "127.0.0.1",
      port: MYSQL_PORT,
      status: "TROU"
    };

    let scanner = new evilscan(options);

    scanner.on("error", err => {
      reject(err);
    });

    scanner.on("done", () => {
      resolve(results);
    });

    scanner.on("result", data => {
      let type;

      if (data.status.match(/timeout/i)) {
        type = STATUS_TIMEOUT;
      } else if (data.status.match(/refuse/i)) {
        type = STATUS_REFUSED;
      } else if (data.status.match(/unreachable/i)) {
        type = STATUS_UNREACHABLE;
      } else {
        type = STATUS_OPEN;
      }

      results.push({
        type,
        ip: data.ip
      });
    });

    scanner.run();
  });
}

function checkConnectMysql(result) {
  return new Promise((resolve, reject) => {
    if (result.type == STATUS_OPEN) {
      let connection = mysql.createConnection({
        host: result.ip,
        port: MYSQL_PORT,
        user: "root",
        connectTimeout: 1500
      });

      connection.connect(err => {
        if (err) {
          reject(err);
        }
        connection.destroy();
        result.type = STATUS_AUTHENTICATED;
        resolve(result);
      });
    } else {
      resolve(result);
    }
  });
}

portScan()
  .then(results => {
    let promises = [];

    results.forEach(result => {
      promises.push(checkConnectMysql(result));
    });

    return Promise.all(promises);
  })
  .then(items => {
    let table = new Table({
      head: ["IP", "Port", "Status"]
    });
    items.forEach(result => {
      table.push([result.ip, MYSQL_PORT, result.type]);
    });
    console.log(table.toString());
  });
