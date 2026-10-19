// SecureIncident MVP. Cloud mode requires a Supabase project and table from schema.sql.
const SUPABASE_URL = ""; // Add Project URL from Supabase -> Project Settings -> API
const SUPABASE_ANON_KEY = ""; // Add publishable/anon key. NEVER put service_role key here.
const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = cloudEnabled ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const demoSeed = [
  {id:"demo-1",title:"Şübhəli e-poçt",department:"IT Support",priority:"Kritik",status:"Araşdırılır",description:"İstifadəçi fişinqə bənzər e-poçt alıb."},
  {id:"demo-2",title:"Yeni əməkdaş hesabı",department:"HR",priority:"Orta",status:"Açıq",description:"Yeni hesabın yaradılması tələb olunur."},
  {id:"demo-3",title:"Giriş problemi",department:"IT Support",priority:"Aşağı",status:"Həll olunub",description:"İstifadəçi giriş problemi həll edilib."}
];
let incidents = [...demoSeed];
const $ = (id) => document.getElementById(id);
const roleDescriptions = {
  "Admin":"Admin: bütün insidentlərə baxır, məsul komandanı və statusu dəyişir.",
  "HR":"HR: HR komandasına aid qeydləri izləyir. Bu prototipdə rol seçimi nümayiş üçündür; real icazələr serverdə/RLS-də qurulmalıdır.",
  "IT Support":"IT Support: texniki insidentləri izləyir. Bu prototipdə rol seçimi nümayiş üçündür; real icazələr serverdə/RLS-də qurulmalıdır."
};
$("role").addEventListener("change", () => { $("roleInfo").textContent = roleDescriptions[$("role").value]; render(); });
$("refreshBtn").addEventListener("click", loadIncidents);
$("incidentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const item = {
    title: $("title").value.trim(),
    department: $("department").value,
    priority: $("priority").value,
    status: "Açıq",
    description: $("description").value.trim()
  };
  if (!item.title || !item.description) return;
  if (cloudEnabled) {
    const { error } = await db.from("incidents").insert(item);
    if (error) { alert("Cloud-a yazmaq alınmadı: " + error.message); return; }
    await loadIncidents();
  } else {
    item.id = crypto.randomUUID();
    incidents.unshift(item);
    render();
  }
  e.target.reset();
});
async function loadIncidents() {
  if (cloudEnabled) {
    const { data, error } = await db.from("incidents").select("*").order("created_at", {ascending:false});
    if (error) {
      $("cloudState").textContent = "Cloud bağlantı xətası";
      console.error(error);
      alert("Cloud məlumatları oxunmadı. Supabase cədvəli və RLS siyasətlərini yoxla.");
      return;
    }
    incidents = data || [];
    $("cloudState").textContent = "Supabase cloud bağlantısı aktiv";
  } else {
    $("cloudState").textContent = "Demo / lokal rejim";
  }
  render();
}
async function updateStatus(id, status) {
  if (cloudEnabled) {
    const { error } = await db.from("incidents").update({status}).eq("id", id);
    if (error) { alert("Status dəyişmədi: " + error.message); return; }
    await loadIncidents();
  } else {
    incidents = incidents.map(x => x.id === id ? {...x, status} : x);
    render();
  }
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function render() {
  const role = $("role").value;
  const visible = role === "Admin" ? incidents : incidents.filter(x => x.department === role);
  $("incidentRows").innerHTML = visible.map(x => {
    const priorityClass = x.priority === "Kritik" ? "critical" : x.priority === "Aşağı" ? "low" : "medium";
    const options = ["Açıq","Araşdırılır","Həll olunub"].map(s => `<option ${x.status===s?"selected":""}>${s}</option>`).join("");
    return `<tr><td><strong>${esc(x.title)}</strong><br><span class="hint">${esc(x.description)}</span></td><td>${esc(x.department)}</td><td><span class="priority ${priorityClass}">${esc(x.priority)}</span></td><td><select class="state-select" data-id="${esc(x.id)}" ${role==="HR" && x.department!=="HR" ? "disabled":""}>${options}</select></td><td><button class="secondary" data-view="${esc(x.id)}">Bax</button></td></tr>`;
  }).join("") || `<tr><td colspan="5">Bu rol üçün insident yoxdur.</td></tr>`;
  document.querySelectorAll("[data-id]").forEach(el => el.addEventListener("change", () => updateStatus(el.dataset.id, el.value)));
  document.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", () => {
    const item = incidents.find(x => x.id === el.dataset.view);
    if (item) alert(`${item.title}\nKomanda: ${item.department}\nPrioritet: ${item.priority}\nStatus: ${item.status}\n\n${item.description}`);
  }));
  $("totalCount").textContent = String(incidents.length).padStart(2,"0");
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:250000, hash:"SHA-256"}, material, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
}
$("encryptBtn").addEventListener("click", async () => {
  const file = $("fileInput").files[0], password = $("cryptoPassword").value;
  if (!file || password.length < 8) { $("cryptoMessage").textContent = "Fayl seç və ən azı 8 simvolluq parol daxil et."; return; }
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const plain = await file.arrayBuffer();
    const encrypted = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, plain);
    const nameBytes = new TextEncoder().encode(file.name);
    const header = new Uint8Array(4 + salt.length + iv.length + 2 + nameBytes.length);
    header.set([83,73,69,49],0); // "SIE1" file format marker
    header.set(salt,4); header.set(iv,20);
    new DataView(header.buffer).setUint16(32, nameBytes.length, false);
    header.set(nameBytes,34);
    const out = new Uint8Array(header.length + encrypted.byteLength); out.set(header); out.set(new Uint8Array(encrypted), header.length);
    downloadBlob(new Blob([out], {type:"application/octet-stream"}), file.name + ".enc");
    $("cryptoMessage").textContent = "Fayl AES-256-GCM ilə şifrələndi və .enc faylı endirildi.";
  } catch (err) { console.error(err); $("cryptoMessage").textContent = "Şifrələmə xətası: " + err.message; }
});
$("decryptBtn").addEventListener("click", () => $("encryptedInput").click());
$("encryptedInput").addEventListener("change", async () => {
  const file = $("encryptedInput").files[0], password = $("cryptoPassword").value;
  if (!file || !password) { $("cryptoMessage").textContent = "Şifrələmə parolunu daxil et."; return; }
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.length < 34 || String.fromCharCode(...buf.slice(0,4)) !== "SIE1") throw new Error("Bu, SecureIncident .enc faylı deyil.");
    const salt = buf.slice(4,20), iv = buf.slice(20,32), nameLen = new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint16(32,false);
    const name = new TextDecoder().decode(buf.slice(34,34+nameLen));
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv}, key, buf.slice(34+nameLen));
    downloadBlob(new Blob([plain]), name || "decrypted-file");
    $("cryptoMessage").textContent = "Fayl açıldı. Parol səhvdirsə, açma əməliyyatı uğursuz olacaq.";
  } catch (err) { $("cryptoMessage").textContent = "Açılmadı: parolu və faylı yoxla."; }
});
loadIncidents();