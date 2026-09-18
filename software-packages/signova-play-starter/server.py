from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

print("Signova Play Starter: http://localhost:8080")
ThreadingHTTPServer(("localhost", 8080), SimpleHTTPRequestHandler).serve_forever()
