"""Shared FastMCP server instance. Tool modules under mcp_server/tools import
this and register themselves — server.py imports every tool module (for its
registration side effect) and then runs the server.
"""

from mcp.server.fastmcp import FastMCP

server = FastMCP("believe-ai")
