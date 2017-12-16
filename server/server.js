var express = require('express')
var bodyParser = require('body-parser')
var url = require('url')

var myPythonScriptPath = './calculate_best_path_3.py';
var PythonShell = require('python-shell');

var Collector = require('./main');

var app = express()

app.use(bodyParser.json());

app.get('/', function (req, res) {
	console.log('A new request arrived with HTTP headers: ' + JSON.stringify(req.headers));
	
	res.send('Hello World!')
})

app.get('/route', function (req, res) {
	console.log('Request for entry: ' + JSON.stringify(req.query));

	var start = req.query.start
	var destination = req.query.destination
	var departure = req.query.departure

    // getRawData("Bad Homburg", "Neubrandenburg", "now").then(result => pretty(result)).catch(console.error)

    Collector.getRawData(start, destination, departure).then(result => {
        var pyshell = new PythonShell(myPythonScriptPath);
        pyshell.send(JSON.stringify(result));

        let bfr = ''
        pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
            bfr += message
        });
    
        // end the input stream and allow the process to exit
        pyshell.end(function (err) {
            if (err){
                console.log(err.message);
            };

            res.json(bfr)
    
            console.log('finished');
            // console.log(res);
        });
    }).catch(console.error);

    // console.log(result);
})

app.get('/query', function (req, res) {
	console.log('Request for entry: ' + JSON.stringify(req.query));

	var start = req.query.start
	var destination = req.query.destination
	var departure = req.query.departure

    // getRawData("Bad Homburg", "Neubrandenburg", "now").then(result => pretty(result)).catch(console.error)

    Collector.getRawData(start, destination, departure).then(result => {
        var pyshell = new PythonShell(myPythonScriptPath);
        pyshell.send(JSON.stringify(result));

        let bfr = ''
        pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
            bfr += message
        });
    
        // end the input stream and allow the process to exit
        pyshell.end(function (err) {
            if (err){
                console.log(err.message);
            };

            res.json(bfr)
    
            console.log('finished');
            // console.log(res);
        });
    }).catch(console.error);

    // console.log(result);
})

app.listen(8080, function () {
  console.log('Example app listening on port ' + 8080)
})
