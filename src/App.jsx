import React, { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronDown, Database, Edit3, Eye, EyeOff, Heart, Instagram, MapPin, Menu, MessageCircle, Phone, RotateCcw, ShieldCheck, Sparkles, Star, Truck, X, Plus, Trash2, RefreshCw } from "lucide-react";
import { IMAGES, img1, img2, img3, logoUrl } from "./data/images";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, TESTIMONIALS, FAQS } from "./data/defaults";
import { api } from "./lib/api";
import { waLink, instaLink } from "./lib/helpers";
import Reveal from "./components/Reveal";
import HeroCanvas from "./components/HeroCanvas";
import LoomCanvas from "./components/LoomCanvas";

// Admin credentials come from .env (VITE_ADMIN_USER / VITE_ADMIN_PASS).
// The fallbacks keep the built-in demo login working if .env is missing.
const ADMIN_USER = (import.meta.env.VITE_ADMIN_USER || "vinay_m").trim().toLowerCase();
const ADMIN_PASS = (import.meta.env.VITE_ADMIN_PASS || "Vinay@#123").trim();

export default function App() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [settingsId, setSettingsId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [backendStatus, setBackendStatus] = useState("checking");
    const [products, setProducts] = useState(DEFAULT_PRODUCTS);
    const [orders, setOrders] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [visits, setVisits] = useState(0);
    const [filter, setFilter] = useState("All");
    const [selected, setSelected] = useState(null);
    const [mobileNav, setMobileNav] = useState(false);
    const [testi, setTesti] = useState(0);
    const [openFaq, setOpenFaq] = useState(0);
    const [form, setForm] = useState({ name: "", phone: "", colour: "", fabric: "Silk Cotton", quantity: "1", message: "" });
    const [orderBusy, setOrderBusy] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [notice, setNotice] = useState(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [isOwner, setIsOwner] = useState(() => {
        try { return sessionStorage.getItem("mnlooms:admin") === "owner"; }
        catch { return false; }
    });
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState(null);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [loginToast, setLoginToast] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [pendingAdminTab, setPendingAdminTab] = useState("dashboard");
    const [adminTab, setAdminTab] = useState("dashboard");
    const [adminNotice, setAdminNotice] = useState(null);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);
    const [productDrafts, setProductDrafts] = useState({});
    const [savingProduct, setSavingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", fabric: "Silk Cotton", colour: "", tag: "Handloom", imgKey: "img1", desc: "" });
    const [addingProduct, setAddingProduct] = useState(false);
    const [testOrderBusy, setTestOrderBusy] = useState(false);
    async function reloadSettings() {
        const data = await api("records.list", { collection: "site_settings" });
        const rec = data?.records?.[0];
        if (rec?.value) {
            const v = rec.value;
            const useValue = (value, fallback) => {
                const text = typeof value === "string" ? value.trim() : "";
                return !text || text.includes("PASTE_") || text.startsWith("Add your") ? fallback : text;
            };
            const clean = {
                businessName: useValue(v.businessName, DEFAULT_SETTINGS.businessName),
                tagline: useValue(v.tagline, DEFAULT_SETTINGS.tagline),
                whatsapp: useValue(v.whatsapp, DEFAULT_SETTINGS.whatsapp),
                instagram: useValue(v.instagram, DEFAULT_SETTINGS.instagram),
                phone: useValue(v.phone, DEFAULT_SETTINGS.phone),
                location: useValue(v.location, DEFAULT_SETTINGS.location),
                about: useValue(v.about, DEFAULT_SETTINGS.about)
            };
            setSettings(clean);
            setDraftSettings(clean);
            setSettingsId(rec.id);
        }
    }
    async function reloadProducts() {
        const data = await api("records.list", { collection: "products" });
        const recs = data?.records || [];
        if (recs.length === 0) {
            for (const p of DEFAULT_PRODUCTS) {
                try {
                    await api("records.create", { collection: "products", value: { id: p.id, name: p.name, fabric: p.fabric, colour: p.colour, price: p.price, tag: p.tag, cats: p.cats, imgKey: p.imgKey, pos: p.pos, desc: p.desc }, idempotency_key: `product-seed-${p.id}` });
                }
                catch (e) { }
            }
            const again = await api("records.list", { collection: "products" });
            const recs2 = again?.records || [];
            if (recs2.length) {
                mapProducts(recs2);
                return;
            }
            return;
        }
        mapProducts(recs);
    }
    function mapProducts(recs) {
        const list = recs.map((r) => ({ ...r.value, recordId: r.id })).sort((a, b) => a.id - b.id);
        setProducts(list);
        const drafts = {};
        list.forEach(p => { if (p.recordId)
            drafts[p.recordId] = { ...p }; });
        setProductDrafts(drafts);
    }
    async function reloadOrders() {
        const data = await api("records.list", { collection: "custom_orders" });
        const recs = data?.records || [];
        const list = recs.map((r) => ({ recordId: r.id, name: r.value?.name || "", phone: r.value?.phone || "", colour: r.value?.colour || "", fabric: r.value?.fabric || "", quantity: Number(r.value?.quantity) || 1, message: r.value?.message || "", status: r.value?.status || "new", createdAt: r.value?.createdAt || r.created_at || "" })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setOrders(list);
    }
    async function reloadEnquiries() {
        const data = await api("records.list", { collection: "enquiries" });
        const recs = data?.records || [];
        const list = recs.map((r) => ({ recordId: r.id, productName: r.value?.productName || "", createdAt: r.value?.createdAt || r.created_at || "", source: r.value?.source || "WhatsApp" })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setEnquiries(list);
    }
    async function reloadAll() { await reloadSettings(); await reloadProducts(); await reloadOrders(); await reloadEnquiries(); }
    async function recordVisit() {
        try {
            const data = await api("records.list", { collection: "site_visits" });
            const rec = data?.records?.[0];
            if (rec) {
                const next = (Number(rec.value?.count) || 0) + 1;
                await api("records.replace", { collection: "site_visits", id: rec.id, value: { count: next } });
                setVisits(next);
            }
            else {
                await api("records.create", { collection: "site_visits", value: { count: 1 }, idempotency_key: `site-visit-first` });
                setVisits(1);
            }
        }
        catch (e) { }
    }
    useEffect(() => { (async () => { try {
        await reloadAll();
        await recordVisit();
        setBackendStatus("connected");
    }
    catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
        setBackendStatus("unavailable");
    }
    finally {
        setLoading(false);
    } })(); }, []);
    useEffect(() => { const t = setInterval(() => setTesti(v => (v + 1) % TESTIMONIALS.length), 5200); return () => clearInterval(t); }, []);
    useEffect(() => { document.title = "MN Looms Handloom • With Pride"; }, []);
    const filtered = filter === "All" ? products : products.filter(p => p.cats.includes(filter));
    const wa = waLink(settings, "Hi MN Looms! I would like to enquire about your handloom sarees.");
    const ig = instaLink(settings);
    function openAdmin(tab) {
        if (!isOwner) {
            setPendingAdminTab(tab);
            setLoginError(null);
            setLoginSuccess(false);
            setLoginOpen(true);
            setMobileNav(false);
            return;
        }
        setAdminTab(tab);
        setAdminNotice(null);
        setAdminOpen(true);
        setMobileNav(false);
    }
    function openEdit() { openAdmin("settings"); }
    function openLogin() { setLoginError(null); setLoginSuccess(false); setLoginOpen(true); setMobileNav(false); }
    function closeLogin() { setLoginOpen(false); setLoginError(null); setLoginSuccess(false); }
    function handleLogin(e) {
        e?.preventDefault();
        const enteredUser = loginUsername.trim().toLowerCase();
        const enteredPassword = loginPassword.trim();
        if (!enteredUser || !enteredPassword) {
            setLoginError("Please enter username and password.");
            setLoginSuccess(false);
            return;
        }
        if (ADMIN_USER && ADMIN_PASS && enteredUser === ADMIN_USER && enteredPassword === ADMIN_PASS) {
            setIsOwner(true);
            try { sessionStorage.setItem("mnlooms:admin", "owner"); } catch { }
            setLoginError(null);
            setLoginSuccess(true);
            setLoginPassword("");
            setShowPassword(false);
            setLoginOpen(false);
            setAdminTab(pendingAdminTab);
            setAdminNotice(null);
            setAdminOpen(true);
            setLoginToast("Login successful - Welcome back");
            window.setTimeout(() => setLoginToast(null), 5000);
        }
        else {
            setLoginError("Invalid username or password. Please check and try again.");
            setLoginSuccess(false);
        }
    }
    function continueToAdmin() {
        setLoginOpen(false);
        setLoginSuccess(false);
        setLoginUsername("");
        setLoginPassword("");
        setAdminTab(pendingAdminTab);
        setAdminNotice(null);
        setAdminOpen(true);
    }
    function handleLogout() { setIsOwner(false); try { sessionStorage.removeItem("mnlooms:admin"); } catch { } setAdminOpen(false); setLoginOpen(false); setLoginSuccess(false); setLoginUsername(""); setLoginPassword(""); setAdminNotice(null); }
    async function saveSettings() {
        setSavingSettings(true);
        setAdminNotice(null);
        try {
            if (settingsId)
                await api("records.replace", { collection: "site_settings", id: settingsId, value: draftSettings });
            else {
                const created = await api("records.create", { collection: "site_settings", value: draftSettings, idempotency_key: `site-settings-main` });
                if (created?.id)
                    setSettingsId(created.id);
            }
            await reloadSettings();
            await reloadProducts();
            const now = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
            setLastSavedAt(now);
            setAdminNotice(`Saved ✓ — ${now}`);
            setSettings(draftSettings);
            setBackendStatus("connected");
        }
        catch (e) {
            setAdminNotice(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
            setBackendStatus("unavailable");
        }
        finally {
            setSavingSettings(false);
        }
    }
    function resetDraft() { setDraftSettings(DEFAULT_SETTINGS); setAdminNotice("Defaults loaded. Press Save to apply them to the database."); }
    async function logEnquiry(productName, waUrl, source = "Product card") {
        try {
            await api("records.create", { collection: "enquiries", value: { productName, createdAt: new Date().toISOString(), source }, idempotency_key: `enquiry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
            await reloadEnquiries();
        }
        catch (e) { }
        if (waUrl)
            window.open(waUrl, "_blank", "noopener");
        else
            openAdmin("settings");
    }
    async function submitOrder(e) {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.colour.trim()) {
            setNotice("Please add your name, phone and colour choice.");
            return;
        }
        setOrderBusy(true);
        setNotice(null);
        setOrderResult(null);
        setOrderSuccess(null);
        const row = { ...form, quantity: Number(form.quantity) || 1, status: "new", createdAt: new Date().toISOString() };
        let saved = 0;
        let error = null;
        let createdId = "";
        try {
            const created = await api("records.create", { collection: "custom_orders", value: row, idempotency_key: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
            saved = 1;
            createdId = created?.id || "";
        }
        catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }
        let reloadError = null;
        try {
            await reloadOrders();
        }
        catch (err) {
            reloadError = err instanceof Error ? err.message : String(err);
        }
        setOrderResult({ saved, remaining: 1 - saved, error, reloadError });
        if (saved === 1)
            setOrderSuccess(`Order request saved. We will confirm colour, fabric and timeline on WhatsApp.`);
        setOrderBusy(false);
    }
    const orderWa = waLink(settings, `Hi MN Looms! I would like a custom saree. Name: ${form.name}, Phone: ${form.phone}, Colour: ${form.colour}, Fabric: ${form.fabric}, Quantity: ${form.quantity}. Message: ${form.message}`);
    async function addTestOrder() {
        setTestOrderBusy(true);
        setAdminNotice(null);
        try {
            await api("records.create", { collection: "custom_orders", value: { name: "Test Customer", phone: "919999999999", colour: "Pista Green + Purple", fabric: "Silk Cotton", quantity: 1, message: "This is a demo order to show the backend working.", status: "new", createdAt: new Date().toISOString() }, idempotency_key: `test-order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
            await reloadOrders();
            setAdminNotice("Test order saved ✓ — see the Orders table below.");
            setAdminTab("orders");
        }
        catch (e) {
            setAdminNotice(`Could not add test order: ${e instanceof Error ? e.message : String(e)}`);
        }
        finally {
            setTestOrderBusy(false);
        }
    }
    async function changeOrderStatus(order, newStatus) {
        try {
            await api("records.replace", { collection: "custom_orders", id: order.recordId, value: { name: order.name, phone: order.phone, colour: order.colour, fabric: order.fabric, quantity: order.quantity, message: order.message, status: newStatus, createdAt: order.createdAt } });
            await reloadOrders();
            setAdminNotice(`Order status saved to database: ${newStatus}.`);
        }
        catch (e) {
            setAdminNotice(`Could not update status: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async function deleteOrder(order) {
        try {
            await api("records.delete", { collection: "custom_orders", id: order.recordId });
            await reloadOrders();
            setAdminNotice("Order deleted.");
        }
        catch (e) {
            setAdminNotice(`Could not delete: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async function saveProduct(p) {
        const draft = productDrafts[p.recordId || ""] || p;
        setSavingProduct(p.recordId || "");
        try {
            await api("records.replace", { collection: "products", id: p.recordId, value: { id: draft.id, name: draft.name, fabric: draft.fabric, colour: draft.colour, price: Number(draft.price) || 0, tag: draft.tag, cats: draft.cats, imgKey: draft.imgKey, pos: draft.pos, desc: draft.desc } });
            await reloadProducts();
            setAdminNotice(`Product “${draft.name}” saved to storage ✓ — storefront updated instantly.`);
            setLastSavedAt(new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }));
        }
        catch (e) {
            setAdminNotice(`Could not save product: ${e instanceof Error ? e.message : String(e)}`);
        }
        finally {
            setSavingProduct(null);
        }
    }
    async function deleteProduct(p) {
        if (!p.recordId)
            return;
        try {
            await api("records.delete", { collection: "products", id: p.recordId });
            await reloadProducts();
            setAdminNotice("Product deleted.");
        }
        catch (e) {
            setAdminNotice(`Could not delete product: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async function addNewProduct(e) {
        e.preventDefault();
        if (!newProduct.name.trim() || !newProduct.price) {
            setAdminNotice("Add a product name and price.");
            return;
        }
        setAddingProduct(true);
        const nextId = Math.max(0, ...products.map(p => p.id)) + 1;
        try {
            await api("records.create", { collection: "products", value: { id: nextId, name: newProduct.name.trim(), fabric: newProduct.fabric, colour: newProduct.colour || "Made To Order", price: Number(newProduct.price) || 0, tag: newProduct.tag, cats: ["Silk"], imgKey: newProduct.imgKey, pos: "center 40%", desc: newProduct.desc || "New handloom saree — ask us on WhatsApp for details." }, idempotency_key: `product-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
            await reloadProducts();
            setNewProduct({ name: "", price: "", fabric: "Silk Cotton", colour: "", tag: "Handloom", imgKey: "img1", desc: "" });
            setAdminNotice(`New product “${newProduct.name}” saved to storage ✓ — it now appears in the Collection.`);
        }
        catch (err) {
            setAdminNotice(`Could not add product: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            setAddingProduct(false);
        }
    }
    const nav = [["Collection", "#collection"], ["Our Story", "#story"], ["Custom Order", "#custom"], ["Gallery", "#gallery"], ["FAQ", "#faq"], ["Contact", "#contact"]];
    const marqueeItems = ["PURE SILK", "COTTON", "HANDLOOM", "CUSTOM COLOURS", "DIRECT FROM WEAVER", "WOVEN WITH PRIDE"];
    return (<div style={{ boxSizing: "border-box" }} className="min-h-screen bg-[#FFF9F0] text-[#1A1230] overflow-x-clip">
      <header style={{ top: 0 }} className="sticky z-40 border-b border-[#D8D3E6] glass shadow-[0_8px_30px_rgba(26,11,46,.08)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 min-w-0 shrink-0" aria-label="MN Looms Handloom • With Pride">
            <img src={logoUrl} alt="MN Looms logo — deep purple letter M with a purple and pista green handloom saree with gold border draped over it" className="h-12 w-12 shrink-0 object-contain" style={{ filter: "drop-shadow(0 6px 12px rgba(26,11,46,.25))" }}/>
            <span className="leading-tight min-w-0"><span className="font-serif-d block text-[19px] sm:text-[22px] font-bold text-[#2D1B4E] truncate">MN Looms</span><span className="block text-[11px] tracking-[.14em] uppercase text-[#8A6D1F] font-bold">Handloom • With Pride</span></span>
          </a>
          <nav className="hidden lg:flex items-center gap-6 text-[15px] font-semibold text-[#1A1230]">
            {nav.map(([label, href]) => <a key={href} href={href} className="hover:text-[#4B2A85] hover:underline underline-offset-4">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            {wa ? <a href={wa} target="_blank" rel="noopener" className="btn-purple hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px]"><MessageCircle size={15}/> WhatsApp</a> : <button onClick={() => openAdmin("settings")} className="btn-purple hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px]"><MessageCircle size={15}/> Set WhatsApp</button>}
            <button onClick={() => setMobileNav(v => !v)} className="lg:hidden p-2.5 rounded-full border-2 border-[#D8D3E6] bg-white text-[#1A1230]" aria-label="Toggle menu">{mobileNav ? <X size={18}/> : <Menu size={18}/>}</button>
          </div>
        </div>
        {mobileNav && <div className="lg:hidden border-t border-[#D8D3E6] px-4 py-3 flex flex-col gap-1 bg-white">{nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMobileNav(false)} className="py-2 font-semibold text-[#1A1230]">{label}</a>)}</div>}
      </header>

      <main id="top">
        {/* HERO — dark, animated canvas + gradient overlay, white text */}
        <section className="relative overflow-hidden bg-[#1A0B2E]">
          <HeroCanvas />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0B2E]/95 via-[#2D1B4E]/82 to-[#1A0B2E]/55" aria-hidden="true"/>
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-16 lg:pb-20">
            <div className="fade-up">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-3 py-2 text-[12px] font-bold tracking-wide text-white"><Sparkles size={14}/> MN Looms Handloom • With Pride</p>
              <h1 className="font-serif-d mt-5 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.98] font-semibold text-white [text-shadow:0_4px_24px_rgba(0,0,0,.55)]">Handwoven<br />With Heart.<br /><span className="italic text-[#F2D98A]">Worn With Pride.</span></h1>
              <p className="mt-5 max-w-xl text-[16px] sm:text-[18px] leading-[1.7] text-[#F5EFFF] font-medium [overflow-wrap:anywhere] [text-shadow:0_2px_12px_rgba(0,0,0,.45)]">{settings.tagline} We weave every saree ourselves — no middlemen, no machine copies. Just yarn, loom and patience.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#collection" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3.5">Shop Collection <ArrowRight size={17}/></a>
                {wa ? <a href={wa} target="_blank" rel="noopener" className="btn-outline-light inline-flex items-center gap-2 rounded-full px-6 py-3.5"><MessageCircle size={18}/> Order on WhatsApp</a> : <button onClick={() => openAdmin("settings")} className="btn-outline-light inline-flex items-center gap-2 rounded-full px-6 py-3.5"><MessageCircle size={18}/> Add WhatsApp Number</button>}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {[["100% Handloom", ShieldCheck], ["Direct From Weaver", Heart], ["Pan-India Delivery", Truck]].map(([t, Icon]) => <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 py-2 text-[12px] font-bold text-white"><Icon size={14} className="text-[#F2D98A]"/>{t}</span>)}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[20px] bg-[#DCE8B5] rotate-2"/>
              <div className="relative overflow-hidden rounded-[20px] shadow-2xl border-4 border-white aspect-[4/5] max-h-[620px] w-full bg-white">
                <img src={img1} alt="Neeli Pista Checks handloom saree in purple and pista green" className="hero-zoom h-full w-full object-cover"/>
                <div className="absolute left-4 top-4 grid h-16 w-16 place-items-center rounded-full bg-white shadow-xl" aria-hidden="true"><img src={logoUrl} alt="" className="h-12 w-12 object-contain" style={{ filter: "drop-shadow(0 4px 8px rgba(26,11,46,.25))" }}/></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow"><p className="text-[11px] font-bold tracking-widest text-[#4B2A85]">FEATURED</p><p className="font-serif-d text-lg font-bold text-[#1A1230]">Neeli Pista Checks</p><p className="text-sm text-[#574B73] font-medium">Rs. 2,499 • Silk Cotton</p></div>
                  <span className="shrink-0 rounded-full bg-[#C9A24B] px-3 py-2 text-xs font-bold text-[#1A1230]">HANDLOOM</span>
                </div>
              </div>
              <div className="float-soft absolute -top-3 -right-1 sm:right-4 rounded-2xl bg-[#4B2A85] px-4 py-3 text-white shadow-xl rotate-3"><p className="font-serif-d text-2xl font-bold leading-none text-white">7.0m</p><p className="text-[11px] text-[#F5EFFF] font-semibold">with blouse piece</p></div>
            </div>
          </div>
          <div className="stripe-bar relative h-2.5"/>
        </section>

        <div className="overflow-hidden bg-[#4B2A85] py-3.5 text-white" aria-label="Highlights">
          <div className="marquee-track flex gap-8 text-sm font-bold tracking-[.18em]">{[...marqueeItems, ...marqueeItems].map((t, i) => <span key={i} className="flex items-center gap-8 text-white whitespace-nowrap">{t}<span className="text-[#C9A24B]">•</span></span>)}</div>
        </div>

        {/* STORY — ivory, dark text, animated loom canvas */}
        <section id="story" className="bg-[#FFF9F0] mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal className="relative order-2 lg:order-1">
              <div className="check-bg absolute -inset-3 rounded-[20px]"/>
              <div className="relative overflow-hidden rounded-[20px] border border-[#D8D3E6] bg-white shadow-[0_20px_44px_rgba(26,11,46,.12)]">
                <div className="relative h-[220px] bg-gradient-to-br from-[#E9E2F5] via-white to-[#FFF6D9]"><LoomCanvas /><p className="absolute left-4 top-4 rounded-full bg-[#1A0B2E] px-3 py-1.5 text-[11px] font-bold text-white">THE LOOM • ROTATING WEAVE</p></div>
                <img src={img2} alt="Close view of handloom saree checks and woven border" className="aspect-[4/3] w-full object-cover"/>
              </div>
              <div className="absolute -bottom-5 left-5 rounded-2xl bg-white border border-[#D8D3E6] p-4 shadow-xl"><p className="font-serif-d text-3xl font-bold text-[#4B2A85]">12+</p><p className="text-sm text-[#574B73] font-medium">Years on the loom</p></div>
            </Reveal>
            <Reveal className="order-1 lg:order-2">
              <p className="text-xs font-bold tracking-[.22em] text-[#8A6D1F]">OUR STORY</p>
              <h2 className="font-serif-d mt-2 text-[clamp(1.9rem,5vw,3rem)] leading-tight text-[#2D1B4E]">A family, a loom,<br />and a promise.</h2>
              <p className="mt-4 leading-[1.7] text-[16px] text-[#1A1230] [overflow-wrap:anywhere]">{settings.about}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["12+", "Years on Loom"], ["2,400+", "Sarees Woven"], ["1,800+", "Happy Customers"], ["350+", "Custom Orders"]].map(([n, l]) => <div key={l} className="rounded-[20px] border border-[#D8D3E6] bg-white p-4 text-center shadow-sm"><p className="font-serif-d text-2xl font-bold text-[#4B2A85]">{n}</p><p className="mt-1 text-[12px] font-semibold text-[#574B73]">{l}</p></div>)}
              </div>
              <p className="mt-5 text-sm font-medium text-[#574B73]">Loom process: yarn selection → dyeing → warp setting → hand weaving → finishing &amp; quality check.</p>
            </Reveal>
          </div>
        </section>

        {/* COLLECTION — white */}
        <section id="collection" className="bg-white py-14 lg:py-20 border-y border-[#D8D3E6]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs font-bold tracking-[.22em] text-[#8A6D1F]">THE COLLECTION</p><h2 className="font-serif-d mt-2 text-[clamp(1.9rem,5vw,3rem)] text-[#2D1B4E]">Woven to be worn, loved &amp; kept.</h2><p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#DCE8B5] px-3 py-1.5 text-[12px] font-bold text-[#1A1230]">Handwoven in small batches — each saree is checked before it ships.</p></div>
              <p className="max-w-sm text-[15px] leading-relaxed text-[#1A1230]">Tap a filter, then View Details. Every saree is woven to order or ready to ship — ask us on WhatsApp.</p>
            </Reveal>
            <div className="mt-7 flex flex-wrap gap-2">{["All", "Silk", "Cotton", "Checks", "Custom"].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-5 py-2.5 text-sm font-bold border-2 ${filter === f ? "bg-[#4B2A85] text-white border-[#4B2A85]" : "bg-[#FFF9F0] text-[#1A1230] border-[#D8D3E6]"}`}>{f}</button>)}</div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(p => (<article key={p.recordId || p.id} className="card-hover overflow-hidden rounded-[20px] border border-[#D8D3E6] bg-[#FFF9F0] shadow-[0_12px_30px_rgba(26,11,46,.08)]">
                  <div className="relative aspect-[4/3] overflow-hidden"><div role="img" aria-label={p.name} style={{ backgroundImage: `url(${IMAGES[p.imgKey] || img1})`, backgroundPosition: p.pos, backgroundSize: "cover" }} className="h-full w-full"/><span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#4B2A85]">HANDLOOM</span><span className="absolute right-3 top-3 rounded-full bg-[#C9A24B] px-3 py-1 text-[11px] font-bold text-[#1A1230]">{p.tag}</span></div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-serif-d text-xl font-bold leading-tight text-[#1A1230] [overflow-wrap:anywhere]">{p.name}</h3><p className="font-serif-d text-xl font-bold text-[#4B2A85] whitespace-nowrap">Rs. {p.price.toLocaleString("en-IN")}</p></div>
                    <p className="mt-1 text-sm font-medium text-[#574B73]">{p.fabric} • {p.colour}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#1A1230] [overflow-wrap:anywhere]">{p.desc}</p>
                    <div className="mt-4 flex gap-2"><button onClick={() => setSelected(p)} className="btn-purple flex-1 rounded-full px-4 py-2.5 text-sm">View Details</button>{wa ? <button onClick={() => logEnquiry(p.name, waLink(settings, `Hi MN Looms! I want to enquire about ${p.name} (Rs. ${p.price}). Is it available?`), "Product card")} className="btn-outline-dark flex-1 rounded-full px-3 py-2.5 text-center text-sm">Enquire on WhatsApp</button> : <button onClick={() => openAdmin("settings")} className="btn-outline-dark flex-1 rounded-full px-3 py-2.5 text-sm">Set WhatsApp</button>}</div>
                  </div>
                </article>))}
            </div>
            {filtered.length === 0 && <p className="mt-8 rounded-[20px] bg-[#FFF9F0] border border-[#D8D3E6] p-6 text-center text-[#1A1230] font-medium">No sarees in this filter yet — try All.</p>}
          </div>
        </section>

        <section className="bg-[#FFF9F0] mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <Reveal><p className="text-center text-xs font-bold tracking-[.22em] text-[#8A6D1F]">HOW IT WORKS</p><h2 className="font-serif-d mt-2 text-center text-[clamp(1.9rem,5vw,3rem)] text-[#2D1B4E]">From your choice to your doorstep</h2></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["01", "Choose Design", "Browse the collection or send a colour you love."], ["02", "We Weave It", "Your saree is woven by hand on our loom."], ["03", "Quality Check", "We check every thread, border and finish."], ["04", "Delivered To You", "Carefully packed and shipped across India."]].map(([n, t, d]) => <div key={n} className="card-hover rounded-[20px] border border-[#D8D3E6] bg-white p-6 shadow-sm"><p className="font-serif-d text-4xl font-bold text-[#D8D3E6]">{n}</p><h3 className="font-serif-d mt-3 text-xl font-bold text-[#1A1230]">{t}</h3><p className="mt-2 text-[15px] leading-relaxed text-[#1A1230]">{d}</p></div>)}
          </div>
        </section>

        {/* CUSTOM — lavender */}
        <section id="custom" className="bg-[#E9E2F5] py-14 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr]">
            <Reveal>
              <p className="text-xs font-bold tracking-[.22em] text-[#8A6D1F]">CUSTOM ORDER</p><h2 className="font-serif-d mt-2 text-[clamp(1.9rem,5vw,3rem)] leading-tight text-[#2D1B4E]">Your colour.<br />Your weave.</h2>
              <p className="mt-4 leading-[1.7] text-[16px] text-[#1A1230]">Tell us the shade you are dreaming of. We will confirm the colour, fabric and timeline before we begin.</p>
              <div className="mt-6 rounded-[20px] bg-[#DCE8B5] border border-[#B9D07A] p-5"><p className="font-bold text-[#1A1230]">We weave custom colours on order in 7–12 days.</p><p className="mt-1 text-sm font-medium text-[#2D1B4E]">Share a photo reference on WhatsApp for the closest match.</p></div>
              <img src={img3} alt="Handloom saree in soft lavender and purple tones" className="mt-6 aspect-[16/9] w-full rounded-[20px] object-cover shadow-lg border-4 border-white"/>
            </Reveal>
            <Reveal>
            <form onSubmit={submitOrder} className="rounded-[20px] border border-[#D8D3E6] bg-white p-5 sm:p-7 shadow-[0_20px_44px_rgba(26,11,46,.12)]">
              <h3 className="font-serif-d text-2xl font-bold text-[#1A1230]">Start your custom weave</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="field-label">Name</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field mt-1" placeholder="Your full name"/></label>
                <label className="block"><span className="field-label">Phone</span><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="field mt-1" placeholder="WhatsApp / phone"/></label>
                <label className="block"><span className="field-label">Colour Choice</span><input required value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} className="field mt-1" placeholder="e.g. pista green + purple"/></label>
                <label className="block"><span className="field-label">Fabric</span><select value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} className="field mt-1"><option>Silk Cotton</option><option>Silk</option><option>Cotton</option><option>Your suggestion</option></select></label>
                <label className="block"><span className="field-label">Quantity</span><input type="number" min="1" max="20" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="field mt-1"/></label>
                <label className="block sm:col-span-2"><span className="field-label">Message</span><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} className="field mt-1" placeholder="Occasion, blouse preference, delivery city…"/></label>
              </div>
              {notice && <p role="alert" className="mt-3 rounded-xl bg-[#FFF1D6] border border-[#C9A24B] p-3 text-sm font-semibold text-[#1A1230]">{notice}</p>}
              {orderSuccess && <div className="mt-3 rounded-xl border border-green-300 bg-green-50 p-4"><p className="font-bold text-[#1A1230] [overflow-wrap:anywhere]">{orderSuccess}</p>{orderWa && <a href={orderWa} target="_blank" rel="noopener" className="btn-purple mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"><MessageCircle size={15}/> Continue on WhatsApp</a>}</div>}
              <button disabled={orderBusy} className="btn-gold mt-5 w-full rounded-full py-3.5 disabled:opacity-60">{orderBusy ? "Saving your request…" : "Send Custom Order Request"}</button>
              <p className="mt-3 text-center text-xs font-medium text-[#574B73]">No payment here. We confirm details on WhatsApp first.</p>
            </form>
            </Reveal>
          </div>
        </section>

        <section className="bg-[#FFF9F0] mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <Reveal><p className="text-center text-xs font-bold tracking-[.22em] text-[#8A6D1F]">LOVED BY CUSTOMERS</p><h2 className="font-serif-d mt-2 text-center text-[clamp(1.9rem,5vw,3rem)] text-[#2D1B4E]">Draped with love</h2></Reveal>
          <div className="relative mt-8 overflow-hidden rounded-[20px] bg-[#1A0B2E] p-7 text-white sm:p-10 shadow-xl">
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} className="fill-[#C9A24B] text-[#C9A24B]"/>)}</div>
            <blockquote key={testi} className="testi-fade mt-4 font-serif-d text-[clamp(1.25rem,3.5vw,1.9rem)] leading-snug text-white [overflow-wrap:anywhere]">“{TESTIMONIALS[testi].quote}”</blockquote>
            <p className="mt-5 font-bold text-white">{TESTIMONIALS[testi].name} <span className="font-normal text-[#F5EFFF]">• {TESTIMONIALS[testi].place}</span></p>
            <div className="mt-6 flex gap-2">{TESTIMONIALS.map((_, i) => <button key={i} onClick={() => setTesti(i)} aria-label={`Show testimonial ${i + 1}`} className={`h-2 rounded-full transition-all ${i === testi ? "w-8 bg-[#C9A24B]" : "w-2 bg-white/50"}`}/>)}</div>
          </div>
        </section>

        <section id="gallery" className="bg-white py-14 border-y border-[#D8D3E6]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.22em] text-[#8A6D1F]">GALLERY</p><h2 className="font-serif-d mt-2 text-[clamp(1.9rem,5vw,3rem)] text-[#2D1B4E]">Up close with the weave</h2></div><p className="hidden sm:block text-sm font-medium text-[#574B73]">Swipe →</p></div>
          <div className="no-scrollbar mt-7 flex gap-4 overflow-x-auto pb-2 snap-x">
            {[{ img: img1, label: "Neeli Pista Checks", pos: "center 30%" }, { img: img2, label: "Pallu Detail", pos: "center 45%" }, { img: img3, label: "Lavender Light", pos: "center 30%" }, { img: img2, label: "Woven Checks", pos: "center 68%" }, { img: img1, label: "Border Story", pos: "center 72%" }].map((g, i) => <figure key={i} className="card-hover w-[78vw] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-[#D8D3E6] bg-white"><div role="img" aria-label={`${g.label} — handloom saree gallery`} style={{ backgroundImage: `url(${g.img})`, backgroundPosition: g.pos, backgroundSize: "cover" }} className="aspect-[4/5] w-full"/><figcaption className="bg-[#FFF9F0] px-4 py-3 text-sm font-bold text-[#1A1230]">{g.label}</figcaption></figure>)}
          </div></div>
        </section>

        <section id="faq" className="bg-[#FFF9F0] mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-center text-xs font-bold tracking-[.22em] text-[#8A6D1F]">QUESTIONS</p><h2 className="font-serif-d mt-2 text-center text-[clamp(1.9rem,5vw,3rem)] text-[#2D1B4E]">Good to know</h2>
          <div className="mt-8 space-y-3">{FAQS.map((f, i) => (<div key={f.q} className="overflow-hidden rounded-[20px] border border-[#D8D3E6] bg-white shadow-sm"><button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-bold text-[#1A1230]">{f.q}<ChevronDown size={18} className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}/></button>{openFaq === i && <p className="px-5 pb-5 text-[15px] leading-relaxed text-[#1A1230] [overflow-wrap:anywhere]">{f.a}</p>}</div>))}</div>
        </section>

        <footer id="contact" className="bg-[#1A0B2E] text-white">
          <div className="stripe-bar h-2.5"/>
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="grid gap-10 md:grid-cols-[1.2fr_.8fr]">
              <div>
                <div className="flex items-center gap-3" aria-label="MN Looms Handloom • With Pride">
                  <img src={logoUrl} alt="MN Looms logo — deep purple letter M with a purple and pista green handloom saree with gold border draped over it" className="h-[72px] w-[72px] shrink-0 object-contain" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,.45))" }}/>
                  <span className="leading-tight"><span className="font-serif-d block text-[26px] font-bold text-white">MN Looms</span><span className="block text-[12px] tracking-[.14em] uppercase text-[#F2D98A] font-bold">Handloom • With Pride</span></span>
                </div>
                <h2 className="font-serif-d mt-6 text-[clamp(2rem,5vw,3.2rem)] leading-tight text-white">Let’s weave<br />something for you.</h2><p className="mt-3 max-w-md text-[#F5EFFF] font-medium [overflow-wrap:anywhere]">{settings.tagline}</p>
              {ig ? <a href={ig} target="_blank" rel="noopener" className="btn-gold mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5"><Instagram size={18}/> Follow on Instagram</a> : <button onClick={() => openAdmin("settings")} className="btn-gold mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5"><Instagram size={18}/> Add Instagram Link</button>}
              </div>
              <div className="space-y-4 text-[15px] text-white">
                <p className="flex gap-3"><Phone size={18} className="shrink-0 text-[#C9A24B]"/><span className="text-white"><b className="text-white">Phone</b><br /><span className="text-[#F5EFFF] [overflow-wrap:anywhere]">{settings.phone}</span></span></p>
                <p className="flex gap-3"><MessageCircle size={18} className="shrink-0 text-[#C9A24B]"/><span className="text-white"><b className="text-white">WhatsApp</b><br /><span className="text-[#F5EFFF] [overflow-wrap:anywhere]">{settings.whatsapp}</span></span></p>
                <p className="flex gap-3"><Instagram size={18} className="shrink-0 text-[#C9A24B]"/><span className="text-white"><b className="text-white">Instagram</b><br /><span className="text-[#F5EFFF] [overflow-wrap:anywhere]">{settings.instagram}</span></span></p>
                <p className="flex gap-3"><MapPin size={18} className="shrink-0 text-[#C9A24B]"/><span className="text-white"><b className="text-white">Location</b><br /><span className="text-[#F5EFFF] [overflow-wrap:anywhere]">{settings.location}</span></span></p>
                <p className="text-white"><b className="text-white">Timing</b><br /><span className="text-[#F5EFFF]">Monday – Saturday • 9 AM – 7 PM</span></p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[#D8D3E6]">© {new Date().getFullYear()} {settings.businessName}. Handloom, woven with pride.</span><span className="flex items-center gap-3">{isOwner ? <button onClick={handleLogout} className="text-[11px] text-[#9A93A8] hover:text-white">Logout</button> : null}<button onClick={isOwner ? () => openAdmin("dashboard") : openLogin} aria-label="Admin" className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20"><ShieldCheck size={14}/> Admin</button></span></div>
            {loadError && <p className="mt-4 text-xs text-amber-200">Saved site details could not be loaded: {loadError}. You can still browse and edit.</p>}
            {loading && <p className="mt-4 text-xs text-[#D8D3E6]">Loading saved site details…</p>}
          </div>
        </footer>
      </main>

      {loginToast && <div role="status" className="fixed left-1/2 top-20 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-bold text-white shadow-xl">{loginToast}</div>}
      {isOwner && <button onClick={() => openAdmin("dashboard")} className="fixed bottom-5 left-5 z-40 rounded-full bg-[#1A0B2E] px-4 py-2 text-[12px] font-bold text-white shadow-xl">Admin</button>}
      {wa ? <a href={wa} target="_blank" rel="noopener" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl"><MessageCircle size={26}/></a> : <button onClick={() => openAdmin("settings")} aria-label="Set WhatsApp number" className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl"><MessageCircle size={26}/></button>}

      {selected && (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 pt-[max(1rem,env(safe-area-inset-top))]" onClick={() => setSelected(null)}>
          <div className="min-h-full flex items-center justify-center"><div className="w-full max-w-3xl overflow-hidden rounded-[20px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="grid sm:grid-cols-2"><div role="img" aria-label={selected.name} style={{ backgroundImage: `url(${IMAGES[selected.imgKey] || img1})`, backgroundPosition: selected.pos, backgroundSize: "cover" }} className="aspect-square w-full sm:aspect-auto sm:min-h-[380px]"/><div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="font-serif-d text-3xl font-bold text-[#1A1230] [overflow-wrap:anywhere]">{selected.name}</h3><button onClick={() => setSelected(null)} aria-label="Close details" className="rounded-full border-2 border-[#D8D3E6] bg-white p-2 text-[#1A1230]"><X size={18}/></button></div><p className="mt-2 font-serif-d text-2xl font-bold text-[#4B2A85]">Rs. {selected.price.toLocaleString("en-IN")}</p><p className="mt-3 text-sm leading-relaxed text-[#1A1230]">{selected.desc}</p><div className="mt-4 flex flex-wrap gap-2">{["Purple", "Pista Green", "Gold", "Lavender"].map(c => <span key={c} className="rounded-full border border-[#D8D3E6] bg-[#FFF9F0] px-3 py-1 text-xs font-bold text-[#1A1230]">{c}</span>)}</div><dl className="mt-5 space-y-2 text-sm"><div className="flex justify-between border-b border-[#D8D3E6] pb-2"><dt className="text-[#574B73] font-medium">Fabric</dt><dd className="font-bold text-[#1A1230]">{selected.fabric}</dd></div><div className="flex justify-between border-b border-[#D8D3E6] pb-2"><dt className="text-[#574B73] font-medium">Length</dt><dd className="font-bold text-[#1A1230]">7.0m with blouse piece</dd></div><div className="flex justify-between border-b border-[#D8D3E6] pb-2"><dt className="text-[#574B73] font-medium">Care</dt><dd className="font-bold text-[#1A1230]">Dry clean recommended</dd></div><div className="flex justify-between"><dt className="text-[#574B73] font-medium">Weave</dt><dd className="font-bold text-[#1A1230]">100% Handloom</dd></div></dl>{wa ? <button onClick={() => logEnquiry(selected.name, waLink(settings, `Hi! I want to enquire about ${selected.name} (Rs. ${selected.price}).`), "Quick view")} className="btn-purple mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5"><MessageCircle size={18}/> Enquire on WhatsApp</button> : <button onClick={() => openAdmin("settings")} className="btn-purple mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5"><MessageCircle size={18}/> Add WhatsApp to Enquire</button>}</div></div>
          </div></div>
        </div>)}

      {adminOpen && isOwner && (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-h-full flex items-start justify-center p-2 sm:p-4">
            <div className="w-full max-w-6xl rounded-[20px] bg-[#FFF9F0] shadow-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A0B2E] p-4 sm:p-5 text-white">
                <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-white/15"><Database size={22}/></span><div><h2 className="font-serif-d text-xl sm:text-2xl font-bold text-white">MN Looms Admin Dashboard</h2><p className="text-xs font-semibold text-[#F5EFFF]">Orders, Products &amp; Enquiries — saved in this browser</p></div></div>
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-300/40 px-3 py-1.5 text-[12px] font-bold text-white"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/> STORAGE: THIS BROWSER</span><button onClick={() => setAdminTab("settings")} className="inline-flex items-center gap-1 rounded-full bg-[#C9A24B] px-3 py-2 text-xs font-bold text-[#1A1230]"><Edit3 size={13}/> Edit Site</button><button onClick={() => { reloadAll(); setAdminNotice("Dashboard refreshed."); }} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white"><RefreshCw size={13}/> Refresh</button><button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">Logout</button><button onClick={() => setAdminOpen(false)} aria-label="Close backend dashboard" className="rounded-full bg-white/15 p-2 text-white"><X size={18}/></button></div>
              </div>
              <div className="flex gap-1 overflow-x-auto border-b border-[#D8D3E6] bg-white px-2 sm:px-4">
                {["dashboard", "orders", "products", "settings", "enquiries"].map(t => <button key={t} onClick={() => setAdminTab(t)} className={`whitespace-nowrap px-4 py-3 text-sm font-bold capitalize border-b-2 ${adminTab === t ? "border-[#4B2A85] text-[#4B2A85]" : "border-transparent text-[#574B73]"}`}>{t}{t === "orders" ? ` (${orders.length})` : t === "products" ? ` (${products.length})` : t === "enquiries" ? ` (${enquiries.length})` : ""}</button>)}
              </div>
              <div className="p-4 sm:p-6">
                {adminNotice && <p role="status" className="mb-4 rounded-xl bg-[#DCE8B5] border border-[#B9D07A] p-3 text-sm font-bold text-[#1A1230]">{adminNotice}</p>}
                {lastSavedAt && <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[12px] font-bold text-[#1A1230]"><BadgeCheck size={15}/> Saved ✓ — Last saved: {lastSavedAt}</p>}

                {adminTab === "dashboard" && (<div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[["Total Orders", orders.length, "Custom orders received"], ["Total Products", products.length, "Products in the store"], ["Total Enquiries", enquiries.length, "WhatsApp enquiries logged"], ["Site Visits", visits, "Stored count — increments on each visit"]].map(([label, val, sub]) => <div key={label} className="rounded-[20px] border border-[#D8D3E6] bg-white p-5 shadow-sm"><p className="text-xs font-bold tracking-widest text-[#574B73]">{label}</p><p className="font-serif-d mt-2 text-4xl font-bold text-[#4B2A85]">{val}</p><p className="mt-1 text-xs font-medium text-[#574B73]">{sub}</p></div>)}
                    </div>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[20px] border border-[#D8D3E6] bg-white p-5"><h3 className="font-bold text-[#1A1230]">Try it — add a test order</h3><p className="mt-1 text-sm text-[#1A1230]">Add a test order, then watch the count and Orders table update. No refresh needed.</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={testOrderBusy} onClick={addTestOrder} className="btn-purple rounded-full px-5 py-2.5 text-sm disabled:opacity-60"><Plus size={15} className="inline mr-1"/>{testOrderBusy ? "Adding…" : "Add Test Order"}</button><button onClick={() => setAdminTab("orders")} className="btn-outline-dark rounded-full px-5 py-2.5 text-sm">View Orders →</button><button onClick={() => setAdminTab("products")} className="rounded-full border-2 border-[#D8D3E6] bg-white px-5 py-2.5 text-sm font-bold text-[#1A1230]">Edit Products →</button></div></div>
                      <div className="rounded-[20px] border border-[#D8D3E6] bg-white p-5"><h3 className="font-bold text-[#1A1230]">Latest orders</h3>{orders.length === 0 ? <p className="mt-2 text-sm text-[#574B73]">No orders yet. Submit the Custom Order form or add a test order.</p> : <ul className="mt-3 space-y-2">{orders.slice(0, 3).map(o => <li key={o.recordId} className="flex justify-between gap-3 border-b border-[#D8D3E6] pb-2 text-sm"><span className="font-bold text-[#1A1230] [overflow-wrap:anywhere]">{o.name} — {o.colour}</span><span className="shrink-0 rounded-full bg-[#E9E2F5] px-2 py-0.5 text-xs font-bold capitalize text-[#1A1230]">{o.status}</span></li>)}</ul>}</div>
                    </div>
                    <p className="mt-4 text-xs font-medium text-[#574B73]">How it works: every Custom Order form submit, product edit, settings save and WhatsApp enquiry writes a record to storage. This dashboard reads those same records — so what you see here is what is stored.</p>
                  </div>)}

                {adminTab === "orders" && (<div>
                    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-serif-d text-xl font-bold text-[#1A1230]">Orders — {orders.length} saved</h3><button disabled={testOrderBusy} onClick={addTestOrder} className="btn-purple inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-60"><Plus size={15}/> Add Test Order</button></div>
                    {orders.length === 0 ? <p className="mt-4 rounded-[20px] bg-white border border-[#D8D3E6] p-6 text-center text-sm text-[#574B73]">No orders yet. Use “Add Test Order” or submit the Custom Order form on the storefront.</p> : (<div className="mt-4 overflow-x-auto rounded-[20px] border border-[#D8D3E6] bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b bg-[#FFF9F0] text-xs"><th className="px-4 py-3 text-[#1A1230]">Name</th><th className="px-4 py-3 text-[#1A1230]">Phone</th><th className="px-4 py-3 text-[#1A1230]">Colour</th><th className="px-4 py-3 text-[#1A1230]">Fabric</th><th className="px-4 py-3 text-[#1A1230]">Qty</th><th className="px-4 py-3 text-[#1A1230]">Message</th><th className="px-4 py-3 text-[#1A1230]">Date</th><th className="px-4 py-3 text-[#1A1230]">Status</th><th className="px-4 py-3 text-[#1A1230]">Delete</th></tr></thead><tbody>{orders.map(o => <tr key={o.recordId} className="border-b align-top"><td className="px-4 py-3 font-bold text-[#1A1230] [overflow-wrap:anywhere]">{o.name}<div className="text-[11px] font-normal text-[#574B73] [overflow-wrap:anywhere]">ID #{o.recordId.slice(0, 8)}</div></td><td className="px-4 py-3 text-[#1A1230] [overflow-wrap:anywhere]">{o.phone}</td><td className="px-4 py-3 text-[#1A1230] [overflow-wrap:anywhere]">{o.colour}</td><td className="px-4 py-3 text-[#1A1230]">{o.fabric}</td><td className="px-4 py-3 text-[#1A1230]">{o.quantity}</td><td className="px-4 py-3 max-w-[180px] text-[#1A1230] [overflow-wrap:anywhere]">{o.message || "—"}</td><td className="px-4 py-3 whitespace-nowrap text-[#1A1230]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td><td className="px-4 py-3"><select value={o.status} onChange={e => changeOrderStatus(o, e.target.value)} className="field !w-auto capitalize"><option value="new">New</option><option value="weaving">Weaving</option><option value="shipped">Shipped</option></select></td><td className="px-4 py-3"><button onClick={() => deleteOrder(o)} aria-label={`Delete order from ${o.name}`} className="rounded-full border-2 border-red-200 bg-white p-2 text-red-600"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>)}
                  </div>)}

                {adminTab === "products" && (<div>
                    <h3 className="font-serif-d text-xl font-bold text-[#1A1230]">Products — {products.length} in store</h3><p className="mt-1 text-sm text-[#1A1230]">Edit Name, Price or Fabric inline, then Save. The storefront Collection updates instantly.</p>
                    <div className="mt-4 space-y-3">{products.map(p => {
                    const d = productDrafts[p.recordId || ""] || p;
                    return (<div key={p.recordId || p.id} className="grid gap-3 rounded-[20px] border border-[#D8D3E6] bg-white p-4 sm:grid-cols-[64px_1fr_120px_1fr_auto] sm:items-center">
                        <div role="img" aria-label={p.name} style={{ backgroundImage: `url(${IMAGES[p.imgKey] || img1})`, backgroundPosition: "center", backgroundSize: "cover" }} className="h-14 w-14 shrink-0 rounded-xl"/>
                        <label className="block"><span className="field-label">Name</span><input value={d.name} onChange={e => { if (p.recordId)
                        setProductDrafts(prev => ({ ...prev, [p.recordId]: { ...d, name: e.target.value } })); }} className="field mt-1"/></label>
                        <label className="block"><span className="field-label">Price (Rs.)</span><input type="number" min="0" value={d.price} onChange={e => { if (p.recordId)
                        setProductDrafts(prev => ({ ...prev, [p.recordId]: { ...d, price: Number(e.target.value) || 0 } })); }} className="field mt-1"/></label>
                        <label className="block"><span className="field-label">Fabric</span><select value={d.fabric} onChange={e => { if (p.recordId)
                        setProductDrafts(prev => ({ ...prev, [p.recordId]: { ...d, fabric: e.target.value } })); }} className="field mt-1"><option>Silk Cotton</option><option>Silk</option><option>Cotton</option><option>Your Choice</option></select></label>
                        <div className="flex gap-2"><button disabled={savingProduct === p.recordId} onClick={() => saveProduct(p)} className="btn-purple rounded-full px-4 py-2.5 text-sm disabled:opacity-60">{savingProduct === p.recordId ? "Saving…" : "Save"}</button><button onClick={() => deleteProduct(p)} aria-label={`Delete product ${p.name}`} className="rounded-full border-2 border-red-200 bg-white p-2.5 text-red-600"><Trash2 size={16}/></button></div>
                      </div>);
                })}
                    </div>
                    <form onSubmit={addNewProduct} className="mt-6 rounded-[20px] border border-[#D8D3E6] bg-white p-5 shadow-sm">
                      <h4 className="font-bold flex items-center gap-2 text-[#1A1230]"><Plus size={17}/> Add New Product</h4>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block"><span className="field-label">Name</span><input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="field mt-1" placeholder="e.g. Mint Checks"/></label>
                        <label className="block"><span className="field-label">Price (Rs.)</span><input required type="number" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="field mt-1" placeholder="2499"/></label>
                        <label className="block"><span className="field-label">Fabric</span><select value={newProduct.fabric} onChange={e => setNewProduct({ ...newProduct, fabric: e.target.value })} className="field mt-1"><option>Silk Cotton</option><option>Silk</option><option>Cotton</option><option>Your Choice</option></select></label>
                        <label className="block"><span className="field-label">Colour</span><input value={newProduct.colour} onChange={e => setNewProduct({ ...newProduct, colour: e.target.value })} className="field mt-1" placeholder="Purple + Gold"/></label>
                        <label className="block"><span className="field-label">Photo</span><select value={newProduct.imgKey} onChange={e => setNewProduct({ ...newProduct, imgKey: e.target.value })} className="field mt-1"><option value="img1">Photo 1 — Purple / Pista</option><option value="img2">Photo 2 — Pallu Detail</option><option value="img3">Photo 3 — Lavender</option></select></label>
                        <label className="block sm:col-span-2 lg:col-span-1"><span className="field-label">Short description</span><input value={newProduct.desc} onChange={e => setNewProduct({ ...newProduct, desc: e.target.value })} className="field mt-1" placeholder="Handwoven…"/></label>
                      </div>
                      <button disabled={addingProduct} className="btn-gold mt-4 rounded-full px-6 py-3 disabled:opacity-60">{addingProduct ? "Saving…" : "Add Product"}</button>
                      <p className="mt-2 text-xs font-medium text-[#574B73]">Products use existing uploaded photos only.</p>
                    </form>
                  </div>)}

                {adminTab === "settings" && (<div>
                    <h3 className="font-serif-d text-xl font-bold text-[#1A1230]">Settings — saved to storage</h3><p className="mt-1 text-sm font-medium text-[#1A1230]">Paste your Instagram / WhatsApp links here — they update all buttons instantly after you press Save.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="block"><span className="field-label">Business Name</span><input value={draftSettings.businessName} onChange={e => setDraftSettings({ ...draftSettings, businessName: e.target.value })} className="field mt-1" placeholder="MN Looms"/></label>
                      <label className="block"><span className="field-label">Tagline</span><textarea value={draftSettings.tagline} onChange={e => setDraftSettings({ ...draftSettings, tagline: e.target.value })} rows={2} className="field mt-1" placeholder="From our loom to your drape…"/></label>
                      <label className="block"><span className="field-label">WhatsApp Number <span className="font-medium text-[#574B73]">(digits only, with country code)</span></span><input value={draftSettings.whatsapp} onChange={e => setDraftSettings({ ...draftSettings, whatsapp: e.target.value })} className="field mt-1" placeholder="919999999999"/></label>
                      <label className="block"><span className="field-label">Instagram Link</span><input value={draftSettings.instagram} onChange={e => setDraftSettings({ ...draftSettings, instagram: e.target.value })} className="field mt-1" placeholder="https://instagram.com/yourshop"/></label>
                      <label className="block"><span className="field-label">Phone</span><input value={draftSettings.phone} onChange={e => setDraftSettings({ ...draftSettings, phone: e.target.value })} className="field mt-1" placeholder="Your phone number"/></label>
                      <label className="block"><span className="field-label">Location</span><input value={draftSettings.location} onChange={e => setDraftSettings({ ...draftSettings, location: e.target.value })} className="field mt-1" placeholder="Your weaving location"/></label>
                      <label className="block sm:col-span-2"><span className="field-label">About Text</span><textarea value={draftSettings.about} onChange={e => setDraftSettings({ ...draftSettings, about: e.target.value })} rows={4} className="field mt-1" placeholder="Tell your story…"/></label>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2"><button onClick={saveSettings} disabled={savingSettings} className="btn-gold rounded-full px-6 py-3 disabled:opacity-60">{savingSettings ? "Saving…" : "Save Changes"}</button><button onClick={resetDraft} className="inline-flex items-center gap-1 rounded-full border-2 border-[#D8D3E6] bg-white px-4 py-3 text-sm font-bold text-[#1A1230]"><RotateCcw size={15}/> Reset</button></div>
                    <p className="mt-3 text-xs font-medium text-[#574B73]">Changes are saved to the site’s records and will be visible to visitors. Image and file uploads are not supported yet.</p>
                  </div>)}

                {adminTab === "enquiries" && (<div>
                    <h3 className="font-serif-d text-xl font-bold text-[#1A1230]">Enquiries — {enquiries.length} logged</h3><p className="mt-1 text-sm text-[#1A1230]">Every time someone clicks “Enquire on WhatsApp” for a product, a record is saved here with product name + time.</p>
                    {enquiries.length === 0 ? <p className="mt-4 rounded-[20px] bg-white border border-[#D8D3E6] p-6 text-center text-sm text-[#574B73]">No enquiries yet. Click “Enquire on WhatsApp” on any product in the Collection to log one.</p> : (<div className="mt-4 overflow-x-auto rounded-[20px] border border-[#D8D3E6] bg-white"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b bg-[#FFF9F0] text-xs"><th className="px-4 py-3 text-[#1A1230]">Product</th><th className="px-4 py-3 text-[#1A1230]">Source</th><th className="px-4 py-3 text-[#1A1230]">Time</th><th className="px-4 py-3 text-[#1A1230]">Enquiry ID</th></tr></thead><tbody>{enquiries.map(en => <tr key={en.recordId} className="border-b"><td className="px-4 py-3 font-bold text-[#1A1230] [overflow-wrap:anywhere]">{en.productName}</td><td className="px-4 py-3 text-[#1A1230]">{en.source}</td><td className="px-4 py-3 text-[#1A1230]">{en.createdAt ? new Date(en.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"}</td><td className="px-4 py-3 text-[#574B73]">#{en.recordId.slice(0, 8)}</td></tr>)}</tbody></table></div>)}
                  </div>)}
              </div>
              <div className="border-t border-[#D8D3E6] bg-white px-4 py-3 text-center text-xs font-medium text-[#574B73] sm:px-6">MN Looms Admin — data is stored in this browser (localStorage). Connect a backend to share it across devices.</div>
            </div>
          </div>
        </div>)}

      {loginOpen && (<div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 pt-[max(1rem,env(safe-area-inset-top))]" onClick={closeLogin}>
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <img src={logoUrl} alt="MN Looms logo — deep purple letter M with a purple and pista green handloom saree with gold border draped over it" className="h-16 w-16 object-contain" style={{ filter: "drop-shadow(0 6px 12px rgba(26,11,46,.25))" }}/>
                <p className="mt-2 text-[11px] font-bold tracking-[.14em] uppercase text-[#8A6D1F]">MN Looms Handloom • With Pride</p>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3"><h2 className="font-serif-d text-2xl font-bold text-[#1A1230]">Admin Login</h2><button onClick={closeLogin} aria-label="Close login" className="rounded-full border-2 border-[#D8D3E6] bg-white p-2 text-[#1A1230]"><X size={16}/></button></div>
              {loginSuccess ? (<div><p role="status" className="mt-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-bold text-[#14532d]">Welcome back, Owner</p><button onClick={continueToAdmin} className="btn-gold mt-4 w-full rounded-full py-3">Continue to Admin</button><button onClick={closeLogin} className="mt-2 w-full rounded-full border-2 border-[#D8D3E6] bg-white py-3 text-sm font-bold text-[#1A1230]">Close</button></div>) : (<div className="mt-4 space-y-4" onKeyDown={e => { if (e.key === "Enter") {
                e.preventDefault();
                handleLogin(e);
            } }}>
                  <label className="block"><span className="field-label">Username</span><input autoComplete="username" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="field mt-1" placeholder="Username"/></label>
                  <label className="block"><span className="field-label">Password</span><span className="relative mt-1 block"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="field !pr-12" placeholder="Password"/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#4B2A85]">{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></span></label>
                  {loginError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{loginError}</p>}
                  <button type="button" onClick={handleLogin} className="btn-gold w-full rounded-full py-3">Login</button>
                  <button type="button" onClick={closeLogin} className="w-full rounded-full border-2 border-[#D8D3E6] bg-white py-3 text-sm font-bold text-[#1A1230]">Cancel</button>
                </div>)}
            </div>
          </div>
        </div>)}
    </div>);
}

