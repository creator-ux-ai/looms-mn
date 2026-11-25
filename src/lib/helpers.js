export function digitsOnly(v) { return (v || "").replace(/\D/g, ""); }
export function waLink(settings, text) {
    const d = digitsOnly(settings.whatsapp);
    if (d.length < 10)
        return null;
    return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
export function instaLink(settings) {
    const v = (settings.instagram || "").trim();
    if (!v || v.includes("PASTE_"))
        return null;
    return v.startsWith("http") ? v : `https://${v}`;
}
