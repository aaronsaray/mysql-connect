/**
 * The main scanning service
 *
 * All this does is try to connect to port 3306 with default username root and no password
 */

const evilscan = require("evilscan");
const mysql = require("mysql");
const Table = require("cli-table");

/**
 * Now run it
 */
let results = {
  T: [],
  R: [],
  O: [],
  U: []
};

let options = {
  target: "127.0.0.1",
  port: "3306",
  status: "TROU", // Timeout, Refused, Open, Unreachable
  banner: true
};

let scanner = new evilscan(options);

scanner.on("result", function(data) {
  if (data.status.match(/timeout/i)) {
    results.T.push(data.ip);
  } else if (data.status.match(/refuse/i)) {
    results.R.push(data.ip);
  } else if (data.status.match(/unreachable/i)) {
    results.U.push(data.ip);
  } else {
    results.O.push(data.ip);
  }
});

scanner.on("error", function(err) {
  throw new Error(data.toString());
});

scanner.on("done", function() {
  console.log("The following IPs had port 3306 open.");
  console.log(results.O);
  let table = new Table({
    head: ["item"]
  });
  table.push(results.O);
  console.log(table.toString());
  // this is where we'd pass this on to a connection to mysql try
});

scanner.run();
