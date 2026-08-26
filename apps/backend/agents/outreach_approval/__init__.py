"""Job Outreach's human-approval gate as a real LangGraph interrupt: generate()
starts this graph, which pauses at await_approval until a separate decide()
call — possibly hours or days later, across a process restart — resumes it
with the human's decision. See graph.py for the two-node pipeline and
core/checkpointer.py for the persistent (SQLite-backed) checkpointer that
makes that pause survive a restart.
"""
