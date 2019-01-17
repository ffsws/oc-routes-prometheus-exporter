
const http = require('http');
const request = require('request-promise-native');

const log = require('./lib/logger');
const routes = require('./lib/routes');
const prometheus = require('./lib/prometheus');

const baseUrl = 'https://http-observatory.security.mozilla.org/api/v1/analyze';

let hosts = [];

async function triggerScan (hostname) {
  const options = {
    method: 'POST',
    uri: `${baseUrl}?host=${hostname}&rescan=true&hidden=true`
  };

  log.info(`Triggering scan for ${hostname}`);
  request(options);
}

async function receiveScanResult (hostname) {
  const options = {
    method: 'GET',
    uri: `${baseUrl}?host=${hostname}`,
    json: true
  };

  const response = await request(options);
  response.url = hostname;
  prometheus.addMetric(response);
}

async function init (hostname) {
  log.info('Start reading route information.');
  // read routes
  routes.list().then(routes => {
    // reset hosts
    hosts = [];
    log.info('Start triggering scan.');
    // reread hosts from route info
    routes.forEach((route) => {
      const hostname = route.spec.host;
      hosts.push(hostname);
      log.info(`Triggering scan for ${hostname}`);
      triggerScan(hostname);

      // defer read results
      setTimeout(() => {
        log.info(`Receiving results for ${hosts.length} configured hosts.`);
        hosts.forEach((hostname) => {
          log.info(`Reading scan results for ${hostname}`);
          receiveScanResult(hostname);
        });
      }, 20000);
    });
  }, log.error);
}

init();

// start http server
function exporter () {
  const server = http.createServer((req, res) => {
    switch (req.url) {
      case '/':
        return res.end(prometheus.renderMetrics());
      default:
        return res.end('404');
    }
  });

  const port = 9000; // TODO move to arg

  server.listen(port);
  log.info(`prometheus-exporter listening at ${port}`);
}

exporter();
