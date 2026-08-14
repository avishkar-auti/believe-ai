import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { askResume, deleteResume, fetchResume, uploadResume, type ResumeChatMessage } from "./resumeApi.js";

export function ResumePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ResumeChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const { data: resume, isLoading } = useQuery({ queryKey: ["resume"], queryFn: fetchResume });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => {
      queryClient.setQueryData(["resume"], data);
      setMessages([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.setQueryData(["resume"], null);
      setMessages([]);
    },
  });

  const chatMutation = useMutation({
    mutationFn: (history: ResumeChatMessage[]) => askResume(question, history),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setQuestion("");
      setChatError(null);
    },
    onError: () => setChatError("Couldn't get an answer — try again in a moment."),
  });

  function handleAsk() {
    if (!question.trim() || chatMutation.isPending) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    chatMutation.mutate(history);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-ink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <MessageCircle className="h-5 w-5 text-brand-500" /> Ask My Resume
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Upload your resume once, then ask it questions — answers are grounded in what it actually says.
        </p>
      </div>

      {!resume ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No resume uploaded yet"
              description="PDF only, up to 4 MB. We extract the text and never store anything you didn't upload."
              action={
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? "Uploading…" : "Choose a PDF"}
                  </Button>
                  {uploadMutation.isError && (
                    <p className="mt-2 text-sm text-red-600">Couldn't read that PDF — try another file.</p>
                  )}
                </div>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-white">
                <FileText className="h-4 w-4 text-ink-400" /> {resume.fileName}
              </span>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardBody className="space-y-3">
              <Badge tone={resume.embeddingReady ? "success" : "warning"}>
                {resume.embeddingReady ? "Ready for chat" : "Processing…"}
              </Badge>
              <p className="text-xs text-ink-400">{resume.chunks.length} sections indexed</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              />
              <Button variant="secondary" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                Replace resume
              </Button>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardBody className="flex h-[28rem] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    Try: "What's my most recent role?" or "Do I have any Python experience?"
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                        m.role === "user"
                          ? "ml-auto bg-brand-500 text-white"
                          : "bg-ink-50 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-ink-400">
                    <Spinner className="h-3.5 w-3.5" /> Thinking…
                  </div>
                )}
              </div>
              {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
              <div className="mt-3 flex gap-2">
                <input
                  className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                  placeholder="Ask about your resume…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  disabled={!resume.embeddingReady}
                />
                <Button onClick={handleAsk} disabled={!resume.embeddingReady || !question.trim() || chatMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
