import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      <div className="flex items-center justify-between">
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
      </div>

      {showAddForm && (
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
      )}

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
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-ink-500 dark:border-ink-800 dark:text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium text-ink-900 dark:text-white">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{c.email}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{c.company ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={c.subscribed ? "success" : "neutral"}>
                        {c.subscribed ? "Subscribed" : "Unsubscribed"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
