var http = require('http');
var https = require('https');
var config = require("./configproxy");
var url = require("url");
const express = require('express');
const router = express.Router();
var request = require("request");

http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

var publicAddressFinder = require("public-address");
var publicIP;

// Get our public IP address
publicAddressFinder(function (err, data) {
    if (!err && data) {
        publicIP = data.address;
    }
});

function addCORSHeaders(req, res) {
    if (req.method.toUpperCase() === "OPTIONS") {
        if (req.headers["access-control-request-headers"]) {
            res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
        }

        if (req.headers["access-control-request-method"]) {
            res.setHeader("Access-Control-Allow-Methods", req.headers["access-control-request-method"]);
        }
    }

    if (req.headers["origin"]) {
        res.setHeader("Access-Control-Allow-Origin", req.headers["origin"]);
    }
    else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
}

function writeResponse(res, httpCode, body) {
    res.statusCode = httpCode;
    res.end(body);
}

function sendInvalidURLResponse(res) {
    return writeResponse(res, 404, "url must be in the form of /fetch?csurl={some_url_here}");
}

function sendTooBigResponse(res) {
    return writeResponse(res, 413, "the content in the request or response cannot exceed " + config.max_request_length + " characters.");
}

function getClientAddress(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0]
        || req.connection.remoteAddress;
}

function processRequest(req, res) {
        var clientIP = getClientAddress(req);

        req.clientIP = clientIP;

    addCORSHeaders(req, res);

    // Return options pre-flight requests right away
    if (req.method.toUpperCase() === "OPTIONS") {
        return writeResponse(res, 204);
    }

    var result = config.fetch_regex.exec(req.url);

    if (result && result.length == 2 && result[1]) {

        var remoteURL;

        try {
            remoteURL = url.parse(decodeURI(result[1]));
        }
        catch (e) {
            return sendInvalidURLResponse(res);
        }
        // We don't support relative links
        if (!remoteURL.host) {
            return writeResponse(res, 404, "relative URLS are not supported");
        }

        // Naughty, naughty— deny requests to blacklisted hosts
        if (config.blacklist_hostname_regex.test(remoteURL.hostname)) {
            return writeResponse(res, 400, "naughty, naughty...");
        }

        // We only support http and https
        if (remoteURL.protocol != "http:" && remoteURL.protocol !== "https:") {
            return writeResponse(res, 400, "only http and https are supported");
        }

        if (publicIP) {
            // Add an X-Forwarded-For header
            if (req.headers["x-forwarded-for"]) {
                req.headers["x-forwarded-for"] += ", " + publicIP;
            }
            else {
                req.headers["x-forwarded-for"] = req.clientIP + ", " + publicIP;
            }
        }

        // Make sure the host header is to the URL we're requesting, not thingproxy
        if (req.headers["host"]) {
            req.headers["host"] = remoteURL.host;
        }

        // Remove origin and referer headers. TODO: This is a bit naughty, we should remove at some point.
        delete req.headers["origin"];
        delete req.headers["referer"];

        var proxyRequest = request({
            url: remoteURL,
            headers: req.headers,
            method: req.method,
            timeout: config.proxy_request_timeout_ms,
            strictSSL: false
        });

        proxyRequest.on('error', function (err) {

            if (err.code === "ENOTFOUND") {
                return writeResponse(res, 502, "Host for " + url.format(remoteURL) + " cannot be found.")
            }
            else {
                console.log("Proxy Request Error (" + url.format(remoteURL) + "): " + err.toString());
                return writeResponse(res, 500);
            }

        });

        var requestSize = 0;
        var proxyResponseSize = 0;

        req.pipe(proxyRequest).on('data', function (data) {

            requestSize += data.length;

            if (requestSize >= config.max_request_length) {
                proxyRequest.end();
                return sendTooBigResponse(res);
            }
        }).on('error', function (err) {
            writeResponse(res, 500, "Stream Error");
        });

        proxyRequest.pipe(res).on('data', function (data) {

            proxyResponseSize += data.length;

            if (proxyResponseSize >= config.max_request_length) {
                proxyRequest.end();
                return sendTooBigResponse(res);
            }
        }).on('error', function (err) {
            writeResponse(res, 500, "Stream Error");
        });
    }
    else {
        return sendInvalidURLResponse(res);
    }
}
/* GET quotes listing. */
router.get('/', async function (req, res, next) {
    try {
        //res.json(await processRequest(req, res));
        await processRequest(req, res);
    } catch (err) {
        console.error(`Error while getting proxy `, err.message);
        next(err);
    }
});

/* POST quotes */
router.post('/', async function (req, res, next) {
    try {
        res.json(await quotes.create(req.body));
    } catch (err) {
        console.error(`Error while posting quotes `, err.message);
        next(err);
    }
});

module.exports = router;

/*
if (cluster.isMaster) {
    for (var i = 0; i < config.cluster_process_count; i++) {
        cluster.fork();
    }
}
else {
    http.createServer(function (req, res) {

        // Process AWS health checks
        if (req.url === "/health") {
            return writeResponse(res, 200);
        }

        var clientIP = getClientAddress(req);

        req.clientIP = clientIP;

        // Log our request
        if (config.enable_logging) {
            console.log("%s %s %s", (new Date()).toJSON(), clientIP, req.method, req.url);
        }

        if (config.enable_rate_limiting) {
            throttle.rateLimit(clientIP, function (err, limited) {
                if (limited) {
                    return writeResponse(res, 429, "enhance your calm");
                }

                processRequest(req, res);
            })
        }
        else {
            processRequest(req, res);
        }

    }).listen(config.port);

    console.log("thingproxy.freeboard.io process started (PID " + process.pid + ")");
}*/