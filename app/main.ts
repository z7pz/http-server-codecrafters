import * as net from "net";

const OK = "HTTP/1.1 200 OK\r\n\r\n"
const NOT_FOUND = "HTTP/1.1 404 Not Found\r\n\r\n"

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
	socket.write("HTTP/1.1 200 OK\r\n\r\n")
	socket.on("data", (data) => {
		const rawReq = data.toString();
		const path = rawReq.split(" ")[1];
		const res = path !== "/" ? OK : NOT_FOUND;
		socket.write(res);
		socket.end();
	})
	socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
