import net from "net";
import fs from "node:fs";
import zlib from 'zlib';


const OK = "HTTP/1.1 200 OK\r\n\r\n";
const CREATED = "HTTP/1.1 201 Created\r\n\r\n";
const NOT_FOUND = "HTTP/1.1 404 Not Found\r\n\r\n";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function textResponse(content: string) {
	return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
}
function econdingResponse(buff: Buffer, type: string) {

	return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: ${type}\r\nContent-Length: ${buff.length}\r\n\r\n`;
}

function octetStreamResponse(content: string) {
	return `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
}

const ALLOWED_ENCODING = ["gzip"];

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
	socket.on("data", (data) => {
		const rawReq = data.toString();
		const method = rawReq.split(" ")[0];
		const path = rawReq.split(" ")[1];
		if (path.startsWith("/echo")) {
			const query = path.split("/")[2];
			const acceptEncoding = rawReq
				.split("Accept-Encoding: ")[1]
				?.split("\r\n")[0]
				?.split(", ")  
				?.filter((accept) => ALLOWED_ENCODING.includes(accept));
			if (acceptEncoding && acceptEncoding.length !== 0) {
				console.log(query, acceptEncoding)
				const buffer = Buffer.from(query, 'utf-8');
				const zipped = zlib.gzipSync(new Uint8Array(buffer));
				socket.write(econdingResponse(zipped, "gzip"));
				socket.write(new Uint8Array(zipped));
			} else {
				socket.write(textResponse(query));
			}
		} else if (path.startsWith("/user-agent")) {
			const userAgent = rawReq.split("User-Agent: ")[1].split("\r\n")[0];
			socket.write(
				`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
			);
		} else if (path.startsWith("/files")) {
			const fileName = path.split("/").slice(2);
			const dir = process.argv.slice(3).join("/");
			try {
				const fullPath = `${dir}/${fileName}`;
				if (method == "POST") {
					const body = data.toString().split("\r\n\r\n")[1];
					fs.writeFileSync(fullPath, body, "utf8");
					socket.write(CREATED);
				} else {
					const data = fs.readFileSync(`${dir}/${fileName}`);
					socket.write(octetStreamResponse(data.toString()));
				}
			} catch (err) {
				socket.write(NOT_FOUND);
			}
		} else {
			const res = path == "/" ? OK : NOT_FOUND;
			socket.write(res);
		}
		socket.end();
	});
	socket.on("close", () => {
		socket.end();
	});
});

server.listen(4221, "localhost");
