import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Badge } from "../../components/ui/Badge.js";
import { createContact, deleteContact, fetchContacts } from "./contactsApi.js";
import { ImportContactsDialog } from "./ImportContactsDialog.js";

export function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => fetchContacts({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setForm({ firstName: "", lastName: "", email: "", company: "" });
      setShowAddForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      company: form.company || null,
      tags: [],
    });
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Your outreach audience, in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add contact
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <Card>
              <CardBody>
                <form className="grid grid-cols-1 gap-3 sm:grid-cols-4" onSubmit={handleAddSubmit}>
                  <Input
                    placeholder="First name"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                  <Input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Company"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                  <Button type="submit" className="sm:col-span-4" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding…" : "Add contact"}
                  </Button>
                </form>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Input placeholder="Search contacts…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-brand-500" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No contacts yet."
          description="Add a contact manually or import a CSV to build your audience."
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {data.items.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-600 dark:text-brand-300">
                    {c.firstName.charAt(0).toUpperCase()}
                    {c.lastName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-900 dark:text-white">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="truncate text-xs text-ink-400">
                      {c.email}
                      {c.company ? ` · ${c.company}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={c.subscribed ? "success" : "neutral"}>
                    {c.subscribed ? "Subscribed" : "Unsubscribed"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      {showImport && (
        <ImportContactsDialog
          onClose={() => setShowImport(false)}
          onImported={() => void queryClient.invalidateQueries({ queryKey: ["contacts"] })}
        />
      )}
    </div>
  );
}
