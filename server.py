#!/usr/bin/env python3
"""
Simple HTTP server for Kina Resort project with visual indicators
"""
import http.server
import socketserver
import sys
from datetime import datetime

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to customize log format"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def main():
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("\n" + "="*60)
            print("🚀 KINA RESORT SERVER IS RUNNING")
            print("="*60)
            print(f"📍 Server URL:     http://localhost:{PORT}")
            print(f"📍 Network URL:    http://0.0.0.0:{PORT}")
            print(f"📁 Serving from:   {sys.path[0]}")
            print("="*60)
            print("✅ Server is ready! Press Ctrl+C to stop.")
            print("="*60 + "\n")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n" + "="*60)
        print("🛑 Server stopped by user")
        print("="*60 + "\n")
        sys.exit(0)
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"\n❌ ERROR: Port {PORT} is already in use!")
            print(f"   Please stop the other server or use a different port.\n")
        else:
            print(f"\n❌ ERROR: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()

