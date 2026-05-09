import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteMessageAsAdmin,
  listRecentMessagesForAdmin,
  listSubscriptionsForAdmin,
  listUsersForAdmin,
  setUserBlocked,
  setUserChatDisabled,
  type AdminMessageRow,
  type AdminSubscriptionRow,
  type AdminUserRow,
} from "@/lib/admin";

const Admin = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([]);
  const [msgs, setMsgs] = useState<AdminMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [u, s, m] = await Promise.all([
      listUsersForAdmin(),
      listSubscriptionsForAdmin(),
      listRecentMessagesForAdmin(80),
    ]);
    setUsers(u);
    setSubs(s);
    setMsgs(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleBlocked = async (userId: string, next: boolean) => {
    const res = await setUserBlocked(userId, next);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update block status.");
      return;
    }
    toast.success(next ? "User blocked." : "User unblocked.");
    void load();
  };

  const toggleChat = async (userId: string, next: boolean) => {
    const res = await setUserChatDisabled(userId, next);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update chat access.");
      return;
    }
    toast.success(next ? "Chat disabled for user." : "Chat enabled for user.");
    void load();
  };

  const removeMessage = async (messageId: string) => {
    const res = await deleteMessageAsAdmin(messageId);
    if (!res.ok) {
      toast.error(res.error ?? "Could not delete message.");
      return;
    }
    toast.success("Message removed.");
    void load();
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in pb-24">
      <header className="px-5 pt-8 pb-4 border-b border-border/60 flex items-center gap-3">
        <Link to="/app" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl leading-none">Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">Moderation & subscriptions</p>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-10 max-w-lg mx-auto">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && (
          <>
            <section>
              <h2 className="font-serif text-xl mb-3">Users</h2>
              <div className="space-y-3">
                {users.length === 0 && <p className="text-sm text-muted-foreground">No users.</p>}
                {users.map((u) => (
                  <div key={u.id} className="glass-card rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-medium truncate">{u.email}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{u.id}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant={u.is_blocked ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void toggleBlocked(u.id, !u.is_blocked)}
                      >
                        {u.is_blocked ? "Unblock" : "Block"}
                      </Button>
                      <Button
                        type="button"
                        variant={u.chat_disabled ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void toggleChat(u.id, !u.chat_disabled)}
                      >
                        {u.chat_disabled ? "Enable chat" : "Disable chat"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl mb-3">Subscriptions</h2>
              <div className="space-y-2">
                {subs.length === 0 && <p className="text-sm text-muted-foreground">No subscriptions.</p>}
                {subs.map((s) => (
                  <div key={s.id} className="glass-card rounded-xl p-3 flex justify-between gap-2 text-sm">
                    <span className="font-mono text-[11px] truncate">{s.user_id}</span>
                    <span className="shrink-0">
                      {s.plan} · {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl mb-3">Recent messages</h2>
              <div className="space-y-3">
                {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
                {msgs.map((m) => (
                  <div key={m.id} className="glass-card rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{m.id}</p>
                    <p className="text-xs text-muted-foreground">chat {m.chat_id}</p>
                    <p className="text-sm leading-snug">{m.content}</p>
                    <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={() => void removeMessage(m.id)}>
                      Delete message
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
