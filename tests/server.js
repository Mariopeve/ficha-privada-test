"use strict";
// Servidor estático de pruebas. Imita un hosting estático (sin cabeceras de seguridad propias)
// y registra cada petición recibida para poder comprobar que no viajan datos.
const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

function start(root, port = 0) {
  root = path.resolve(root);
  return new Promise((resolve) => {
    const log = [];
    const srv = http.createServer((req, res) => {
      log.push(`${req.method} ${req.url}`);
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "public, max-age=600"
      });
      res.end(fs.readFileSync(file));
    });
    srv.listen(port, "127.0.0.1", () => {
      const actual = srv.address().port;
      resolve({
        log,
        port: actual,
        base: `http://127.0.0.1:${actual}`,
        close: () => new Promise((r) => { srv.close(r); srv.closeAllConnections(); })
      });
    });
  });
}

module.exports = { start };
