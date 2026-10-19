# SecureIncident — sürətli MVP

## Layihədə nə var?
- Public ana səhifə + insident qeydiyyat forması
- Admin / HR / IT Support üçün demo rol seçimi
- Supabase PostgreSQL-ə yazma/oxuma/status yeniləmə
- Brauzerdə Web Crypto API ilə AES-256-GCM fayl şifrələmə/açma
- Responsive qaranlıq dizayn

## 1. Lokal işə sal
VS Code ilə qovluğu aç. `index.html` faylını Live Server ilə aç. Şifrələmə üçün localhost/HTTPS istifadə et (file:// rejimində Web Crypto işləməyə bilər).

## 2. Cloud bağlantısı
1. https://supabase.com aç, hesab yarat və yeni project yarat.
2. Project-in SQL Editor bölməsinə gir, `schema.sql` faylının içindəkiləri yapışdır və Run et.
3. Project Settings → API-dən Project URL və publishable/anon key götür.
4. `app.js` başlanğıcında `SUPABASE_URL` və `SUPABASE_ANON_KEY` boş sətirlərinə yerləşdir.
5. Səhifəni yenilə. “Supabase cloud bağlantısı aktiv” yazısı görünməlidir; yeni insident yarat və Supabase Table Editor-də `incidents` cədvəlini yoxla.

**Vacib:** `service_role` açarını heç vaxt brauzer koduna yazma. SQL siyasətləri açıq demo üçündür; real məlumat üçün təhlükəsiz deyil. Real istifadədə Auth, dar RLS siyasətləri və server tərəfli rol yoxlaması lazımdır.

## 3. Public URL
Ən sürətli yol: GitHub-a repository yarat, bu faylları push et, sonra https://app.netlify.com/ və ya https://vercel.com/ üzərindən GitHub repository-ni import et. Bu layihə statik saytdır. HTTPS avtomatik verilə bilər. Deploydan sonra canlı URL-i açıb formu sına.

## 4. Kriptoqrafiya nümayişi
1. `Kriptoqrafiya laboratoriyası` bölməsində fayl seç.
2. Parol yaz (ən azı 8 simvol; təqdimat üçün daha uzun parol seç).
3. `Faylı şifrələ və endir` düyməsini bas — `.enc` faylı yaranır.
4. Parolu daxil saxlayıb ` .enc faylını aç` düyməsi ilə həmin faylı seç; orijinal fayl geri endirilir.
5. Səhv parolla da sına: fayl açılmamalıdır.

Açar paroldan PBKDF2 (SHA-256, 250000 iterasiya) ilə törədilir; AES-GCM 256-bit açar, təsadüfi salt və IV istifadə olunur. Faylın məzmunu brauzerdə şifrələnir. Bu MVP şifrələnmiş faylı cloud-a yükləmir; əsas cloud hissəsi insident verilənləridir. İstəsən növbəti mərhələdə Supabase Storage-a `.enc` yükləmə əlavə oluna bilər.

## 5. Təqdimatda deyəcəyin
- Public layer: HTML/CSS/JavaScript
- Cloud layer: Supabase PostgreSQL — insidentlər cloud DB-də saxlanılır
- Security: AES-256-GCM file encryption, PBKDF2 key derivation
- Teams: Admin, HR, IT Support
- Məhdudiyyət: rol seçimi bu MVP-də demonstrativdir; real icazə nəzarəti üçün Authentication + RLS siyasətləri qurulmalıdır.
