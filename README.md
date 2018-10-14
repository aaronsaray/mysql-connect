# MySQL Connection Scanner

This script scans your local wifi connection, looks for default MySQL installs and tries to connect on port 3306 with `root` and no password. It logs it to CLI.

## Usage

Install the dependencies:

`npm install`

Run the script:

`npm start`

Note: It is hard coded to `en0` as the wifi connection. Yours may be different.

## Rational / Reason

I was sitting in a coffee house and I noticed a few other web developers. I wondered how many of them were running local MySQL connections serving everything out to the world. So, I decided to write a quick script - just for curiosity sake.
