/**
 * SimpleTCP Examples
 * Basic Server/Client connection example
*/

var SimpleTCP = require('./../../SimpleTCP');
var net = require('net');

// Port & host to connect to
const port = 7070;
const host = '127.0.0.1';

// Create a client
var client = new SimpleTCP.Client(new net.Socket());

console.log("Connecting to server listening at " + host + " on port " + port);

// Start the server
client.connect(port, host).then(() => {

    console.log("Connected to the server successfully");
    console.log("Sending 3 consecutive test messages...");

    client.write("Hi from a client! How are you? :)");
    client.write("This is a second message, just so you know");
    client.write("Hope you have a great day!");

});