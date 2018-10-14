/**
 * The main scanning service
 *
 * All this does is try to connect to port 3306 with default username root and no password
 */

const evilscan = require("evilscan");
const mysql = require("mysql");
const Table = require("cli-table");
const OS = require("os");
const chalk = require("chalk");

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
 *
 * Pass in the interface you want to scan on
 */
function portScan(interfaceName) {
  // this is very sloppy and does not handle errors very at all - but thats OK for now
  let interface = OS.networkInterfaces()[interfaceName].filter(iface => {
    return iface.family === "IPv4";
  })[0];

  let results = [];

  return new Promise((resolve, reject) => {
    let options = {
      target: interface.cidr,
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

/**
 * With this current row, if its an Open IP, try to connect
 */
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
          resolve(result);
          return;
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

/**
 * With all of our results, now launch a bunch of promises that attempt to scan for mysql by calling the checkConnectMysql command
 */
function queueUpMysqlScans(results) {
  let promises = [];

  results.forEach(result => {
    promises.push(checkConnectMysql(result));
  });

  return Promise.all(promises);
}

/**
 * Get all items and write as a table
 */
function writeTableOutput(items) {
  let table = new Table({
    head: ["IP", "Port", "Status"]
  });
  items.sort((a, b) => {
    let aPad = a.ip.split(".").map(x => {
      return x.padStart(3, "0");
    });
    let bPad = b.ip.split(".").map(x => {
      return x.padStart(3, "0");
    });
    if (aPad < bPad) return -1;
    if (aPad > bPad) return 1;
    return 0;
  });

  items.forEach(result => {
    let status = "";

    switch (result.type) {
      case STATUS_AUTHENTICATED:
        status = chalk.black.bgGreen(result.type);
        break;
      case STATUS_OPEN:
        status = chalk.green(result.type);
        break;
      case STATUS_REFUSED:
        status = chalk.red(result.type);
        break;
      case STATUS_TIMEOUT:
      case STATUS_UNREACHABLE:
        status = chalk.grey(result.type);
        break;
    }

    table.push([result.ip, MYSQL_PORT, status]);
  });

  console.log(table.toString());
}

/**
 * Process this
 */
portScan("en0")
  .then(queueUpMysqlScans)
  .then(writeTableOutput);
