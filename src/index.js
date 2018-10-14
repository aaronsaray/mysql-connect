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

let options = {
  target: "127.0.0.1",
  port: MYSQL_PORT,
  status: "TROU"
};

let results = [];

let scanner = new evilscan(options);

scanner.on("result", function(data) {
  let type;

  if (data.status.match(/timeout/i)) {
    type = STATUS_TIMEOUT;
  } else if (data.status.match(/refuse/i)) {
    type = STATUS_REFUSED;
  } else if (data.status.match(/unreachable/i)) {
    type = STATUS_UNREACHABLE;
  } else {
    type = STATUS_OPEN;

    let connection = mysql.createConnection({
      host: data.ip,
      port: MYSQL_PORT,
      user: "root",
      connectTimeout: 1500
    });

    connection.connect(err => {
      if (!err) {
        type = STATUS_AUTHENTICATED;
      }
      connection.destroy();
    });
  }

  results.push({
    type,
    ip: data.ip
  });
});

scanner.on("error", function(err) {
  throw new Error(data.toString());
});

scanner.on("done", function() {
  let table = new Table({
    head: ["IP", "Port", "Status"]
  });
  results.forEach(result => {
    table.push([result.ip, MYSQL_PORT, result.type]);
  });
  console.log(table.toString());
});

scanner.run();
