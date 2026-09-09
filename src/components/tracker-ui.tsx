import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardPaste, ExternalLink, FileImage, ImagePlus, LogOut, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchMonthPosts, fetchSession, logoutAdmin, savePost } from "@/lib/api";
import { formatLongDate, monthBounds, parseDateKey, toDateKey } from "@/lib/date-utils";
import { calculateStats, getDaySummary, groupPosts, isTodayKey } from "@/lib/statistics";
import { getPlatform, PLATFORMS, type PlatformKey, type SocialPost } from "@/lib/platforms";

export function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span>R</span></div>;
}

export function AppHeader({ admin = false, onLogout }: { admin?: boolean; onLogout?: () => void }) {
  return <header className="app-header"><Link to="/" className="brand-lockup"><BrandMark /><span><strong>Raktsankalp</strong><small>Socials tracker</small></span></Link><div className="header-actions">{admin ? <><span className="admin-chip"><ShieldCheck size={14} /> Admin mode</span><Button variant="ghost" size="sm" onClick={onLogout}><LogOut size={15} /> Log out</Button></> : <Link to="/login" className="admin-link">Admin login <ArrowRight size={14} /></Link>}</div></header>;
}

export function PageShell({ children, admin, onLogout }: { children: React.ReactNode; admin?: boolean; onLogout?: () => void }) {
  return <div className="app-shell"><AppHeader admin={admin} onLogout={onLogout} />{children}<footer className="app-footer"><span>Raktsankalp Social Media Tracker</span><span>Built for consistent impact</span></footer></div>;
}

export function StatsStrip({ posts, month }: { posts: SocialPost[]; month: Date }) {
  const stats = calculateStats(posts, month);
  const statsCards = [{ label: "Completed days", value: `${stats.completedDays}`, note: `of ${stats.daysInMonth} days` }, { label: "Platform posts", value: `${stats.completedPlatforms}`, note: "this month" }, { label: "Completion rate", value: `${stats.rate}%`, note: "all platforms" }, { label: "Current streak", value: `${stats.streak}`, note: stats.streak === 1 ? "day" : "days" }];
  return <section className="stats-strip">{statsCards.map((card, index) => <div className={`stat-card stat-card-${index}`} key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small></div>)}</section>;
}

export function TodayWidget({ posts, admin = false }: { posts: SocialPost[]; admin?: boolean }) {
  const today = toDateKey(new Date());
  const summary = getDaySummary(today, groupPosts(posts));
  return <section className="today-widget"><div className="today-heading"><div><span className="eyebrow">Today&apos;s progress</span><h2>{format(new Date(), "EEEE, MMMM d")}</h2></div><strong>{summary.completed} <span>/ 5</span></strong></div><div className="today-platforms">{PLATFORMS.map(({ key, shortLabel, label }) => { const posted = summary.posts.some((post) => post.platform === key && post.posted); return <span key={key} className={posted ? "is-posted" : ""}><i>{posted ? <Check size={13} /> : "○"}</i>{shortLabel}<b>{label}</b></span>; })}</div>{admin && <Link to={`/day/${today}`} className="today-action"><Plus size={16} /> Complete today&apos;s posts</Link>}</section>;
}

export function Calendar({ month, posts, onMonthChange, admin = false }: { month: Date; posts: SocialPost[]; onMonthChange: (date: Date) => void; admin?: boolean }) {
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const grouped = groupPosts(posts);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = (getDay(days[0] ?? startOfMonth(month)) + 6) % 7;
  const visibleDays = days.filter((day) => { const summary = getDaySummary(toDateKey(day), grouped); return filter === "all" || (filter === "complete" ? summary.completed === 5 : summary.completed < 5); });
  const displayDays = filter === "all" ? days : visibleDays;
  return <section className="calendar-section"><div className="calendar-toolbar"><div><span className="eyebrow">Content calendar</span><h2>{format(month, "MMMM yyyy")}</h2></div><div className="calendar-nav"><Button variant="outline" size="icon" aria-label="Previous month" onClick={() => onMonthChange(subMonths(month, 1))}><ChevronLeft /></Button><Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>Today</Button><Button variant="outline" size="icon" aria-label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}><ChevronRight /></Button></div></div><div className="calendar-filters" role="tablist" aria-label="Calendar filters">{[["all", "All days"], ["complete", "Completed"], ["incomplete", "In progress"]].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} onClick={() => setFilter(value as typeof filter)}>{label}</Button>)}</div><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{filter === "all" && Array.from({ length: leading }).map((_, index) => <span className="calendar-blank" key={`blank-${index}`} />)}{displayDays.map((day) => <CalendarDay key={toDateKey(day)} date={day} posts={grouped[toDateKey(day)] ?? []} currentMonth={month} admin={admin} />)}</div>{filter !== "all" && displayDays.length === 0 && <div className="empty-filter">No matching days in this month.</div>}</section>;
}

function CalendarDay({ date, posts, currentMonth, admin }: { date: Date; posts: SocialPost[]; currentMonth: Date; admin: boolean }) {
  const dateKey = toDateKey(date); const summary = getDaySummary(dateKey, { [dateKey]: posts }); const complete = summary.completed === 5; const isToday = isTodayKey(dateKey); const inactive = !isSameMonth(date, currentMonth);
  return <Link to={`/day/${dateKey}`} className={`calendar-day ${complete ? "is-complete" : ""} ${isToday ? "is-today" : ""} ${inactive ? "is-muted" : ""}`}><div className="day-top"><b>{format(date, "d")}</b>{isToday && <span>Today</span>}</div><div className="day-status"><strong>{summary.completed}<small>/5</small></strong><span>{complete ? "Complete" : summary.completed ? "In progress" : "No activity"}</span></div><div className="day-dots">{PLATFORMS.map(({ key, shortLabel }) => <i className={posts.some((post) => post.platform === key && post.posted) ? "posted" : ""} key={key} title={shortLabel}>{posts.some((post) => post.platform === key && post.posted) ? <Check size={11} /> : ""}</i>)}</div>{admin && <span className="edit-hint">Edit <ArrowRight size={12} /></span>}</Link>;
}

export function PlatformBars({ posts, month }: { posts: SocialPost[]; month: Date }) {
  const stats = calculateStats(posts, month);
  return <section className="platform-bars"><div className="section-heading"><div><span className="eyebrow">Platform performance</span><h2>Monthly output</h2></div><span className="muted-label">Posted days</span></div>{PLATFORMS.map(({ key, label }) => { const count = stats.platformCounts[key]; const percent = Math.round((count / stats.daysInMonth) * 100); return <div className="platform-bar" key={key}><div><span>{label}</span><b>{count}/{stats.daysInMonth}</b></div><div className="bar-track"><span style={{ width: `${percent}%` }} /></div></div>; })}</section>;
}

export function ScreenshotModal({ post, onClose }: { post: SocialPost | null; onClose: () => void }) {
  if (!post?.screenshot_path) return null;
  const platform = getPlatform(post.platform);
  return <Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}><DialogContent className="proof-modal"><DialogHeader><span className="eyebrow">Proof image</span><DialogTitle>{platform?.label} · {formatLongDate(post.date)}</DialogTitle><DialogDescription>{post.notes || "Screenshot proof for this social post."}</DialogDescription></DialogHeader><img src={`/api/media/${post.screenshot_path.replace("social-proof/", "")}`} alt={`${platform?.label} proof from ${post.date}`} className="proof-image" /><a className="modal-link" href={`/api/media/${post.screenshot_path.replace("social-proof/", "")}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open original</a></DialogContent></Dialog>;
}

export function PostEditor({ date, existing, onSaved }: { date: string; existing: SocialPost[]; onSaved: (post: SocialPost) => void }) {
  const [active, setActive] = useState<PlatformKey>("youtube");
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [removeScreenshot, setRemoveScreenshot] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = existing.find((post) => post.platform === active);
  const [posted, setPosted] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => { setPosted(current?.posted ?? false); setPostUrl(current?.post_url ?? ""); setNotes(current?.notes ?? ""); setFile(null); setRemoveScreenshot(false); }, [current?.id, active, current?.updated_at]);
  const platform = getPlatform(active); const Icon = platform?.icon ?? FileImage;
  async function handleSave() { setSaving(true); try { const result = await savePost({ date, platform: active, posted, postUrl, notes, screenshot: file, removeScreenshot }); onSaved(result.post); setFile(null); setRemoveScreenshot(false); toast.success(current ? "Post updated" : "Post saved successfully"); } catch (error) { toast.error(error instanceof Error ? error.message : "We couldn't save this post."); } finally { setSaving(false); } }
  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) { const image = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/")); if (image) { event.preventDefault(); setFile(image); toast.success("Screenshot pasted from clipboard"); } }
  return <div className="editor-layout"><div className="platform-tabs">{PLATFORMS.map(({ key, label, icon: PlatformIcon }) => { const item = existing.find((post) => post.platform === key); return <Button key={key} variant={active === key ? "secondary" : "ghost"} className={`platform-tab ${item?.posted ? "has-post" : ""}`} onClick={() => setActive(key)}><PlatformIcon size={17} /><span>{label}</span>{item?.posted && <Check size={14} />}</Button>; })}</div><div className="editor-card"><div className="editor-title"><div className={`platform-icon ${platform?.tint}`}><Icon size={22} /></div><div><span className="eyebrow">Edit record</span><h2>{platform?.label}</h2></div><span className={`status-pill ${posted ? "posted" : "pending"}`}>{posted ? <><Check size={13} /> Posted</> : "Not posted"}</span></div><label className="switch-row"><span><b>Posting status</b><small>Mark this platform as completed for the day.</small></span><input type="checkbox" checked={posted} onChange={(event) => setPosted(event.target.checked)} /></label><label className="field-label">Post URL <span>Optional</span><Input type="url" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} placeholder="https://..." /></label><div className="field-label"><span>Screenshot <em>Optional</em></span><div className="upload-zone" tabIndex={0} onPaste={handlePaste} onClick={() => fileRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter") fileRef.current?.click(); }}><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => setFile(event.target.files?.[0] ?? null)} />{file ? <div className="upload-preview"><img src={URL.createObjectURL(file)} alt="Selected screenshot preview" /><span>{file.name}</span><Button type="button" size="icon" variant="ghost" onClick={(event) => { event.stopPropagation(); setFile(null); }}><X size={15} /></Button></div> : current?.screenshot_path && !removeScreenshot ? <div className="upload-preview"><img src={`/api/media/${current.screenshot_path.replace("social-proof/", "")}`} alt="Current screenshot" /><span>Current screenshot</span><Button type="button" size="icon" variant="ghost" onClick={(event) => { event.stopPropagation(); setRemoveScreenshot(true); }}><Trash2 size={15} /></Button></div> : <div className="upload-empty"><ImagePlus size={22} /><span>Choose an image or paste from clipboard</span><small>JPG, PNG, or WEBP · up to 5 MB</small></div>}</div></div><label className="field-label">Notes <span>Optional</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a short note about this post..." rows={4} /></label><div className="editor-footer"><span>{current?.updated_at ? `Last updated ${format(new Date(current.updated_at), "MMM d, h:mm a")}` : "No record saved yet"}</span><Button onClick={handleSave} disabled={saving}>{saving ? <><RefreshCw className="spin" size={16} /> Saving...</> : <><Save size={16} /> Save {platform?.shortLabel}</>}</Button></div></div></div>;
}

export function AdminCalendarPage({ month, posts, onMonthChange, onRefresh }: { month: Date; posts: SocialPost[]; onMonthChange: (date: Date) => void; onRefresh: () => void }) {
  const navigate = useNavigate(); const today = toDateKey(new Date());
  return <><PageShell admin onLogout={async () => { await logoutAdmin(); navigate({ to: "/login" }); }}><main className="page-main admin-main"><div className="page-intro admin-intro"><div><span className="eyebrow">Workspace</span><h1>Admin dashboard</h1><p>Keep every channel accountable, one day at a time.</p></div><div className="admin-actions"><Button variant="outline" onClick={onRefresh}><RefreshCw size={16} /> Refresh</Button><Button onClick={() => navigate({ to: `/day/${today}` })}><Plus size={17} /> Add today&apos;s posts</Button></div></div><TodayWidget posts={posts} admin /><StatsStrip posts={posts} month={month} /><Calendar month={month} posts={posts} onMonthChange={onMonthChange} admin /><PlatformBars posts={posts} month={month} /></main></PageShell></>;
}

export function CalendarData({ month, children }: { month: Date; children: (state: { posts: SocialPost[]; loading: boolean; error: string | null; refresh: () => void }) => React.ReactNode }) { const [posts, setPosts] = useState<SocialPost[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const bounds = useMemo(() => monthBounds(month), [month]); const load = async () => { setLoading(true); setError(null); try { const result = await fetchMonthPosts(bounds.from, bounds.to); setPosts(result.posts); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load activity."); } finally { setLoading(false); } }; useEffect(() => { void load(); }, [bounds.from, bounds.to]); return children({ posts, loading, error, refresh: () => void load() }); }

export function AdminGate({ children }: { children: React.ReactNode }) { const [state, setState] = useState<"checking" | "allowed" | "denied">("checking"); const navigate = useNavigate(); useEffect(() => { void fetchSession().then((valid) => { setState(valid ? "allowed" : "denied"); if (!valid) navigate({ to: "/login" }); }); }, [navigate]); if (state === "checking") return <div className="loading-screen"><RefreshCw className="spin" /> Checking access...</div>; return state === "allowed" ? <>{children}</> : null; }

export function DayEditorPage({ date, initialPosts, admin }: { date: string; initialPosts: SocialPost[]; admin: boolean }) { const [posts, setPosts] = useState(initialPosts); const [screenshot, setScreenshot] = useState<SocialPost | null>(null); const navigate = useNavigate(); const updatePost = (post: SocialPost) => setPosts((current) => [...current.filter((item) => item.platform !== post.platform), post]); return <PageShell admin={admin} onLogout={async () => { await logoutAdmin(); navigate({ to: "/login" }); }}><main className="page-main day-main"><div className="back-row"><Link to={admin ? "/admin" : "/"}><ChevronLeft size={17} /> Back to calendar</Link></div><div className="day-heading"><div><span className="eyebrow">Daily activity</span><h1>{formatLongDate(date)}</h1><p>{admin ? "Update each channel's record, proof, and notes." : "A clear record of Raktsankalp's social impact for this day."}</p></div><div className="day-count"><strong>{posts.filter((post) => post.posted).length}<span>/5</span></strong><small>platforms posted</small></div></div>{admin ? <PostEditor date={date} existing={posts} onSaved={updatePost} /> : <PublicDayCards posts={posts} onScreenshot={setScreenshot} />}</main><ScreenshotModal post={screenshot} onClose={() => setScreenshot(null)} /></PageShell>; }

export function PublicDayCards({ posts, onScreenshot }: { posts: SocialPost[]; onScreenshot: (post: SocialPost) => void }) { return <div className="public-day-cards">{PLATFORMS.map(({ key, label, icon: Icon, tint }) => { const post = posts.find((item) => item.platform === key); return <article className="public-platform-card" key={key}><div className={`platform-icon ${tint}`}><Icon size={22} /></div><div className="public-platform-body"><div className="public-platform-heading"><div><h2>{label}</h2><span className={`status-pill ${post?.posted ? "posted" : "pending"}`}>{post?.posted ? <><Check size={13} /> Posted</> : "Not posted yet"}</span></div>{post?.updated_at && <time>{format(new Date(post.updated_at), "MMM d, yyyy · h:mm a")}</time>}</div>{post?.notes && <p>{post.notes}</p>}{(post?.post_url || post?.screenshot_path) && <div className="proof-actions">{post.post_url && <a href={post.post_url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View post</a>}{post.screenshot_path && <Button variant="outline" size="sm" onClick={() => onScreenshot(post)}><FileImage size={15} /> View proof</Button>}</div>}</div></article>; })}</div>; }
