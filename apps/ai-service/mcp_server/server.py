"""believe.ai MCP tool server. Run with: python -m mcp_server.server

Exposes the same agents as the REST API (api/routes/*) as MCP tools, so any
MCP-compatible client (Claude Desktop, an agent framework, ...) can call
believe.ai's AI capabilities directly. No separate logic — each tool in
mcp_server/tools/ just adapts a tool call onto the shared agent function.
"""

from core.logging import configure_logging
from mcp_server.registry import server

# Imported for their tool-registration side effect.
from mcp_server.tools import (  # noqa: F401
    campaign_tools,
    career_tools,
    improve_tools,
    insights_tools,
    interview_tools,
    jobs_tools,
    personalize_tools,
    resumes_tools,
    writer_tools,
)

configure_logging()

if __name__ == "__main__":
    server.run()
