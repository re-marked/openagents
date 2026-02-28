import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { WebSocketServer } from "ws";

const PORT = 8080;
const SHELL = process.platform === "win32" ? "powershell.exe" : "bash";

const HTML = `<!DOCTYPE html><html><head>
<title>Terminal</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css">
<style>body{margin:0;background:#1e1e1e;overflow:hidden}#terminal{height:100vh}</style>
</head><body><div id="terminal"></div>
<script type="module">
import {Terminal} from "https://cdn.jsdelivr.net/npm/@xterm/xterm@5/+esm";
import {FitAddon} from "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0/+esm";
const t=new Terminal({cursorBlink:true,fontSize:14,theme:{background:"#1e1e1e"}});
const fit=new FitAddon();t.loadAddon(fit);
t.open(document.getElementById("terminal"));fit.fit();
const ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host+"/ws");
ws.onmessage=e=>t.write(e.data);
t.onData(d=>ws.send(d));
window.addEventListener("resize",()=>fit.fit());
</script></body></html>`;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(HTML);
});

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  const proc = spawn(SHELL, { stdio: ["pipe", "pipe", "pipe"], shell: false });
  proc.stdout.on("data", (d) => ws.send(d.toString()));
  proc.stderr.on("data", (d) => ws.send(d.toString()));
  ws.on("message", (msg) => proc.stdin.write(msg.toString()));
  ws.on("close", () => proc.kill());
  proc.on("exit", () => ws.close());
});

server.listen(PORT, () => console.log("Web terminal: http://localhost:" + PORT));
