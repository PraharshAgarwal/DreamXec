import { useState } from 'react';
import { submitMentorApplication, MentorApplicationData } from '../services/mentorService';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FormErrors {
  [key: string]: string;
}

/* ─────────────────────────────────────────
   CSS — DreamXec Brutalist Style
───────────────────────────────────────── */
const CSS = `
  .mf-wrap {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    font-family: 'Poppins', sans-serif;
    color: #0F534A;
    background: #FCFBF7;
  }

  /* ── PROGRESS BAR ── */
  .mf-progress-wrap {
    position: sticky;
    top: 0;
    z-index: 50;
    background: #FCFBF7;
    border-bottom: 3px solid #121316;
    padding: 0.75rem 0;
    margin-bottom: 2.5rem;
  }
  .mf-progress-label {
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #0F534A;
    margin-bottom: 0.4rem;
  }
  .mf-progress-track {
    height: 8px;
    background: #e8e0d4;
    border: 2px solid #121316;
    position: relative;
    overflow: hidden;
  }
  .mf-progress-fill {
    height: 100%;
    background: repeating-linear-gradient(
      -45deg,
      #FE4E1A 0px, #FE4E1A 6px,
      #0F534A 6px, #0F534A 12px
    );
    transition: width 0.4s cubic-bezier(.16,1,.3,1);
  }

  /* ── STATUS BANNERS ── */
  .mf-banner {
    border: 3px solid #121316;
    padding: 1rem 1.25rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }
  .mf-banner-success { background: #9EFC5F; color: #0F534A; box-shadow: 5px 5px 0 #121316; }
  .mf-banner-error   { background: #F4002C; color: #fff; box-shadow: 5px 5px 0 #121316; }
  .mf-banner-icon { font-size: 1.5rem; flex-shrink: 0; }
  .mf-banner-title { font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
  .mf-banner-msg { font-size: 0.88rem; font-weight: 600; margin-top: 0.2rem; opacity: 0.9; }

  /* ── SECTION ── */
  .mf-section {
    margin-bottom: 3rem;
    border: 3px solid #121316;
    background: #fff;
    box-shadow: 6px 6px 0 #FE4E1A;
  }
  .mf-section-elite { box-shadow: 6px 6px 0 #0F534A; }
  .mf-section-head {
    background: #0F534A;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .mf-section-num {
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #FE4E1A;
    background: rgba(254,78,26,0.15);
    border: 2px solid #FE4E1A;
    padding: 0.2rem 0.6rem;
    flex-shrink: 0;
  }
  .mf-section-num-green { color: #9EFC5F; border-color: #9EFC5F; background: rgba(158,252,95,0.15); }
  .mf-section-title {
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.3px;
    color: #fff;
    margin: 0;
  }
  .mf-section-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .mf-section-accent { height: 5px; background: #FE4E1A; }
  .mf-section-accent-green { background: #0F534A; }

  /* ── GRID ── */
  .mf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media(max-width: 600px) { .mf-grid-2 { grid-template-columns: 1fr; } }

  /* ── FIELD ── */
  .mf-field { display: flex; flex-direction: column; gap: 0.35rem; }
  .mf-label {
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #0F534A;
  }
  .mf-hint {
    font-size: 0.72rem;
    font-weight: 600;
    color: rgba(15,83,74,0.65);
    line-height: 1.5;
    margin-bottom: 0.2rem;
  }
  .mf-req { color: #FE4E1A; }

  /* ── INPUTS ── */
  .mf-input, .mf-textarea, .mf-select {
    background: #FCFBF7;
    border: 3px solid #121316;
    padding: 0.65rem 0.9rem;
    font-size: 0.92rem;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    color: #0F534A;
    outline: none;
    transition: box-shadow 0.15s, transform 0.15s;
    width: 100%;
    box-sizing: border-box;
    appearance: none;
  }
  .mf-input:focus, .mf-textarea:focus, .mf-select:focus {
    box-shadow: 4px 4px 0 #FE4E1A;
    transform: translate(-2px, -2px);
  }
  .mf-input::placeholder, .mf-textarea::placeholder {
    color: rgba(15,83,74,0.35);
    font-weight: 500;
  }
  .mf-textarea { resize: vertical; min-height: 110px; }
  .mf-input[type="number"]::-webkit-inner-spin-button { opacity: 1; }

  /* ── SELECT WRAP ── */
  .mf-select-wrap { position: relative; }
  .mf-select { cursor: pointer; padding-right: 2.5rem; }
  .mf-select-arrow {
    position: absolute; right: 0.9rem; top: 50%;
    transform: translateY(-50%);
    font-size: 0.85rem; color: #0F534A;
    pointer-events: none; font-weight: 900;
  }

  /* ── EXPERTISE CATEGORY LAYOUT ── */
  .mf-expertise-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  @media(max-width: 640px) { .mf-expertise-wrap { grid-template-columns: 1fr; } }

  .mf-expertise-category {
    border: 3px solid #121316;
    overflow: hidden;
  }
  .mf-expertise-cat-head {
    padding: 0.65rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-bottom: 3px solid #121316;
  }
  .mf-expertise-cat-head-stem    { background: #0F534A; }
  .mf-expertise-cat-head-nonstem { background: #0F534A; }
  .mf-expertise-cat-icon { font-size: 1.1rem; }
  .mf-expertise-cat-title {
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #fff;
  }
  .mf-expertise-cat-count {
    margin-left: auto;
    font-size: 0.6rem;
    font-weight: 900;
    color: #FE4E1A;
    background: rgba(254,78,26,0.2);
    border: 1px solid #FE4E1A;
    padding: 0.1rem 0.4rem;
    letter-spacing: 0.1em;
  }
  .mf-expertise-cat-count-green {
    color: #fff;
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.5);
  }
  .mf-expertise-cat-body {
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: #fff;
  }

  /* ── COMPACT CHECKBOX (expertise panels) ── */
  .mf-check-label-sm {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    border: 2px solid #e0d8cc;
    padding: 0.42rem 0.7rem;
    background: #FCFBF7;
    transition: background 0.12s, transform 0.12s, box-shadow 0.12s;
    font-size: 0.8rem;
    font-weight: 600;
    color: #0F534A;
    user-select: none;
  }
  .mf-check-label-sm:hover {
    background: #fff3e0;
    border-color: #121316;
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 #FE4E1A;
  }
  .mf-check-label-sm.checked {
    background: #FE4E1A;
    border-color: #121316;
    color: #fff;
    box-shadow: 2px 2px 0 #121316;
  }
  .mf-check-label-sm input[type="checkbox"] {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
  }
  .mf-check-box-sm {
    width: 13px; height: 13px; flex-shrink: 0;
    border: 2px solid currentColor;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.58rem; font-weight: 900;
  }

  /* ── OTHER EXPERTISE ── */
  .mf-other-wrap {
    border: 2px dashed #0F534A;
    padding: 0.9rem 1rem;
    background: #FCFBF7;
  }
  .mf-other-toggle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
  }
  .mf-other-toggle-box {
    width: 18px; height: 18px; flex-shrink: 0;
    border: 3px solid #121316;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; font-weight: 900;
    transition: background 0.12s;
  }
  .mf-other-toggle-box.on { background: #FE4E1A; }
  .mf-other-toggle-text {
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #0F534A;
  }
  .mf-other-badge {
    font-size: 0.58rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #fff;
    background: #FE4E1A;
    border: 2px solid #121316;
    padding: 0.1rem 0.45rem;
  }
  .mf-other-input-field {
    margin-top: 0.75rem;
    background: #fff;
    border: 3px solid #121316;
    padding: 0.6rem 0.9rem;
    font-size: 0.88rem;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    color: #0F534A;
    outline: none;
    transition: box-shadow 0.15s, transform 0.15s;
    width: 100%;
    box-sizing: border-box;
  }
  .mf-other-input-field:focus {
    box-shadow: 3px 3px 0 #FE4E1A;
    transform: translate(-1px, -1px);
  }
  .mf-other-input-field::placeholder { color: rgba(15,83,74,0.35); font-weight: 500; }

  /* ── STANDARD CHECKBOX ── */
  .mf-check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  @media(max-width: 560px) { .mf-check-grid { grid-template-columns: 1fr; } }

  .mf-check-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    border: 2px solid #121316;
    padding: 0.6rem 0.9rem;
    background: #FCFBF7;
    transition: background 0.12s, transform 0.12s, box-shadow 0.12s;
    font-size: 0.88rem;
    font-weight: 600;
    color: #0F534A;
    user-select: none;
  }
  .mf-check-label:hover {
    background: #fff3e0;
    transform: translate(-2px, -2px);
    box-shadow: 3px 3px 0 #FE4E1A;
  }
  .mf-check-label.checked {
    background: #FE4E1A;
    color: #fff;
    box-shadow: 3px 3px 0 #121316;
  }
  .mf-check-label input[type="checkbox"] {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
  }
  .mf-check-box {
    width: 16px; height: 16px; flex-shrink: 0;
    border: 2px solid currentColor;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 900;
  }

  /* ── RADIO ── */
  .mf-radio-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .mf-radio-label {
    display: flex; align-items: center; gap: 0.6rem;
    cursor: pointer;
    border: 3px solid #121316;
    padding: 0.55rem 1.25rem;
    background: #FCFBF7;
    font-size: 0.82rem; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.1em;
    transition: background 0.12s, transform 0.12s, box-shadow 0.12s;
    color: #0F534A;
    user-select: none;
  }
  .mf-radio-label:hover { transform: translate(-2px,-2px); box-shadow: 3px 3px 0 #FE4E1A; }
  .mf-radio-label.selected { background: #0F534A; color: #FFDD33; box-shadow: 3px 3px 0 #FE4E1A; }
  .mf-radio-label input[type="radio"] {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
  }

  /* ── TOGGLE (public feature) ── */
  .mf-toggle-wrap {
    display: flex; align-items: flex-start; gap: 1rem;
    border: 3px solid #121316; padding: 1rem 1.25rem;
    background: #FCFBF7; cursor: pointer;
    transition: background 0.12s, transform 0.12s, box-shadow 0.12s;
  }
  .mf-toggle-wrap:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 #FE4E1A; }
  .mf-toggle-wrap.checked { background: #0F534A; box-shadow: 4px 4px 0 #FE4E1A; }
  .mf-toggle-wrap.checked .mf-toggle-title { color: #FFDD33; }
  .mf-toggle-wrap.checked .mf-toggle-sub { color: rgba(255,255,255,0.8); }
  .mf-toggle-box {
    width: 24px; height: 24px; flex-shrink: 0;
    border: 3px solid currentColor;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; font-weight: 900; margin-top: 0.1rem; color: #0F534A;
  }
  .mf-toggle-wrap.checked .mf-toggle-box { color: #FFDD33; }
  .mf-toggle-title { font-size: 0.88rem; font-weight: 900; color: #0F534A; }
  .mf-toggle-sub { font-size: 0.75rem; font-weight: 600; color: rgba(15,83,74,0.65); margin-top: 0.25rem; line-height: 1.5; }
  .mf-toggle-wrap input { display: none; }

  /* ── SUBMIT ── */
  .mf-submit-area {
    display: flex; flex-direction: column; gap: 1rem;
    align-items: flex-end; padding-top: 1rem;
    border-top: 4px solid #121316; margin-top: 1rem;
  }
  .mf-required-note {
    font-size: 0.7rem; font-weight: 700;
    color: rgba(15,83,74,0.65);
    text-transform: uppercase; letter-spacing: 0.12em;
    align-self: flex-start;
  }
  .mf-submit-btn {
    padding: 1.1rem 3rem;
    font-size: clamp(0.85rem, 1.5vw, 1rem);
    font-weight: 900; text-transform: uppercase; letter-spacing: 2px;
    color: #121316; background: #FFDD33;
    border: 4px solid #121316; box-shadow: 7px 7px 0 #FE4E1A;
    cursor: pointer; font-family: 'Poppins', sans-serif;
    transition: transform 0.15s, box-shadow 0.15s;
    display: flex; align-items: center; gap: 0.6rem;
  }
  .mf-submit-btn:hover:not(:disabled) { transform: translate(-3px, -3px); box-shadow: 10px 10px 0 #121316; }
  .mf-submit-btn:disabled { background: #ccc; box-shadow: 4px 4px 0 #999; cursor: not-allowed; }
  .mf-submit-btn.submitted { background: #9EFC5F; color: #0F534A; box-shadow: 7px 7px 0 #121316; }
  .mf-spinner {
    width: 16px; height: 16px;
    border: 3px solid #121316; border-top-color: transparent;
    border-radius: 50%; animation: mf-spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes mf-spin { to { transform: rotate(360deg) } }

  /* ── STRIPE ── */
  .mf-stripe {
    height: 10px;
    background: repeating-linear-gradient(-45deg, #0F534A 0px, #0F534A 8px, #FE4E1A 8px, #FE4E1A 16px);
    border-top: 3px solid #121316; border-bottom: 3px solid #121316;
    margin: 2rem 0;
  }
`;

/* ─────────────────────────────────────────
   COUNTRY → STATE/CITY DATA
───────────────────────────────────────── */
const COUNTRIES_STATES: Record<string, string[]> = {
  "India": ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi (NCT)", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Washington D.C."],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  "Australia": ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
  "Germany": ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"],
  "France": ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"],
  "China": ["Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan", "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin", "Tibet", "Xinjiang", "Yunnan", "Zhejiang"],
  "Japan": ["Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka", "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa", "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano", "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka", "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi", "Tokushima", "Tokyo", "Tottori", "Toyama", "Wakayama", "Yamagata", "Yamaguchi", "Yamanashi"],
  "Brazil": ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"],
  "Singapore": ["Central Region", "East Region", "North Region", "North-East Region", "West Region"],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
  "Saudi Arabia": ["Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Tabuk", "Hail", "Northern Borders", "Jazan", "Najran", "Al Bahah", "Al Jawf", "Qassim"],
  "South Africa": ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"],
  "Nigeria": ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega"],
  "Pakistan": ["Balochistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Azad Kashmir", "Gilgit-Baltistan", "Islamabad Capital Territory"],
  "Bangladesh": ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"],
  "Sri Lanka": ["Central", "Eastern", "Northern", "North Central", "North Western", "Sabaragamuwa", "Southern", "Uva", "Western"],
  "Nepal": ["Bagmati", "Gandaki", "Karnali", "Lumbini", "Madhesh", "Province No. 1", "Sudurpashchim"],
  "Indonesia": ["Aceh", "Bali", "Bangka Belitung", "Banten", "Bengkulu", "Central Java", "Central Kalimantan", "Central Sulawesi", "East Java", "East Kalimantan", "East Nusa Tenggara", "Gorontalo", "Jakarta", "Jambi", "Lampung", "Maluku", "North Kalimantan", "North Maluku", "North Sulawesi", "North Sumatra", "Papua", "Riau", "Riau Islands", "South Kalimantan", "South Sulawesi", "South Sumatra", "Southeast Sulawesi", "West Java", "West Kalimantan", "West Nusa Tenggara", "West Papua", "West Sulawesi", "West Sumatra", "Yogyakarta"],
  "Malaysia": ["Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"],
  "Philippines": ["Luzon", "Visayas", "Mindanao", "Metro Manila", "Cebu", "Davao"],
  "South Korea": ["Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong", "Gyeonggi", "Gangwon", "North Chungcheong", "South Chungcheong", "North Jeolla", "South Jeolla", "North Gyeongsang", "South Gyeongsang", "Jeju"],
  "Taiwan": ["Taipei", "New Taipei", "Taoyuan", "Taichung", "Tainan", "Kaohsiung", "Keelung", "Hsinchu", "Chiayi", "Yilan", "Hualien", "Taitung", "Penghu", "Kinmen", "Matsu"],
  "New Zealand": ["Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatu-Wanganui", "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman", "Waikato", "Wellington", "West Coast"],
  "Ireland": ["Connacht", "Leinster", "Munster", "Ulster"],
  "Netherlands": ["Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland"],
  "Sweden": ["Blekinge", "Dalarna", "Gävleborg", "Gotland", "Halland", "Jämtland", "Jönköping", "Kalmar", "Kronoberg", "Norrbotten", "Örebro", "Östergötland", "Skåne", "Södermanland", "Stockholm", "Uppsala", "Värmland", "Västerbotten", "Västernorrland", "Västmanland", "Västra Götaland"],
  "Switzerland": ["Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura", "Lucerne", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zurich"],
  "Israel": ["Central", "Haifa", "Jerusalem", "Northern", "Southern", "Tel Aviv"],
  "Turkey": ["Adana", "Ankara", "Antalya", "Bursa", "Eskisehir", "Gaziantep", "Istanbul", "Izmir", "Kayseri", "Konya", "Mersin", "Trabzon"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Voronezh", "Perm", "Volgograd"],
  "Mexico": ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Mexico City", "Mexico State", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"],
  "Argentina": ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"],
  "Colombia": ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"],
  "Egypt": ["Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia", "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr el-Sheikh", "Luxor", "Matruh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez"],
  "Ethiopia": ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "South Ethiopia", "Southwest Ethiopia", "Tigray", "Central Ethiopia"],
  "Ghana": ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"],
  "Other": ["Please specify your region"],
};

const COUNTRY_LIST = Object.keys(COUNTRIES_STATES).sort();

/* ─────────────────────────────────────────
   EXPERTISE DATA
───────────────────────────────────────── */
const STEM_OPTIONS = [
  'Artificial Intelligence & Machine Learning',
  'Software Engineering & Development',
  'Data Science & Analytics',
  'Cybersecurity & Information Security',
  'Blockchain & Web3',
  'Robotics & Embedded Systems',
  'Biotech & Life Sciences',
  'Environmental Science & Sustainability',
  'Mathematics & Statistics',
  'Electronics & Electrical Engineering',
];

const NON_STEM_OPTIONS = [
  'Product Management & Strategy',
  'Startup Building & Entrepreneurship',
  'Finance, VC & Investment',
  'Marketing & Growth',
  'Design & User Experience',
  'Law, Policy & Governance',
  'Social Impact & Development',
  'Education & Pedagogy',
  'Writing, Media & Communication',
  'Business Operations & Management',
];

/* ─────────────────────────────────────────
   SECTION COMPONENT
───────────────────────────────────────── */
interface SectionProps {
  num: string;
  title: string;
  elite?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ num, title, elite = false, children }) => (
  <div className={`mf-section${elite ? ' mf-section-elite' : ''}`}>
    <div className="mf-section-head">
      <span className={`mf-section-num${elite ? ' mf-section-num-green' : ''}`}>{num}</span>
      <h2 className="mf-section-title">{title}</h2>
    </div>
    <div className="mf-section-body">{children}</div>
    <div className={`mf-section-accent${elite ? ' mf-section-accent-green' : ''}`} />
  </div>
);

/* ─────────────────────────────────────────
   COMPACT CHECKBOX
───────────────────────────────────────── */
interface SmallCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SmallCheckbox: React.FC<SmallCheckboxProps> = ({ label, checked, onChange }) => (
  <label className={`mf-check-label-sm${checked ? ' checked' : ''}`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="mf-check-box-sm">{checked ? '✓' : ''}</span>
    {label}
  </label>
);

/* ─────────────────────────────────────────
   STANDARD CHECKBOX
───────────────────────────────────────── */
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className={`mf-check-label${checked ? ' checked' : ''}`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="mf-check-box">{checked ? '✓' : ''}</span>
    {label}
  </label>
);

/* ─────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────── */
interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, hint, children }) => (
  <div className="mf-field">
    <label className="mf-label">
      {label} {required && <span className="mf-req">*</span>}
    </label>
    {hint && <p className="mf-hint">{hint}</p>}
    {children}
  </div>
);

/* ─────────────────────────────────────────
   EXTENDED FORM DATA
───────────────────────────────────────── */
interface ExtendedFormData extends MentorApplicationData {
  stemExpertise: string[];
  nonStemExpertise: string[];
  otherExpertiseEnabled: boolean;
  otherExpertiseText: string;
  mentorshipTools: string;
  stateProvince: string;
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export const MentorshipLeadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<ExtendedFormData>({
    name: '', email: '', linkedin: '', role: '', organization: '',
    country: '', city: '', yearsOfExperience: 0,
    expertiseAreas: [],
    stemExpertise: [], nonStemExpertise: [],
    otherExpertiseEnabled: false, otherExpertiseText: '',
    achievement: '', mentoringExperience: 'No', mentoringDescription: '',
    projectsOrResearch: '', mentorshipIntent: '', scenarioResponse: '',
    mentorshipTools: '',
    monthlyCommitment: '2-3 hours', mentorshipFormat: [], studentPreference: [],
    portfolioLinks: '', innovationImpactView: '', studentMistakeObservation: '',
    thirtyDayBuildPlan: '', publicMentorFeature: false, mentorReferral: '',
    stateProvince: '',
  });

  /* ── Progress ── */
  const filledFields = [
    formData.name, formData.email, formData.linkedin, formData.role,
    formData.organization, formData.country, formData.city,
    String(formData.yearsOfExperience || ''),
    formData.achievement, formData.mentorshipIntent, formData.scenarioResponse,
    formData.mentorshipTools, formData.innovationImpactView,
    formData.studentMistakeObservation, formData.portfolioLinks, formData.mentorReferral,
    formData.projectsOrResearch,
    (formData.stemExpertise.length + formData.nonStemExpertise.length > 0 ||
      (formData.otherExpertiseEnabled && formData.otherExpertiseText.trim())) ? 'x' : '',
    formData.mentorshipFormat.length > 0 ? 'x' : '',
    formData.studentPreference.length > 0 ? 'x' : '',
  ].filter(Boolean).length;
  const progress = Math.min(100, Math.round((filledFields / 20) * 100));

  /* ── Handlers ── */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStemChange = (value: string, checked: boolean) =>
    setFormData((prev) => ({
      ...prev,
      stemExpertise: checked ? [...prev.stemExpertise, value] : prev.stemExpertise.filter((i) => i !== value),
    }));

  const handleNonStemChange = (value: string, checked: boolean) =>
    setFormData((prev) => ({
      ...prev,
      nonStemExpertise: checked ? [...prev.nonStemExpertise, value] : prev.nonStemExpertise.filter((i) => i !== value),
    }));

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value, stateProvince: '', city: '' }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, stateProvince: e.target.value, city: '' }));
  };

  const handleArrayChange = (
    fieldName: 'mentorshipFormat' | 'studentPreference',
    value: string,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const arr = prev[fieldName] || [];
      return { ...prev, [fieldName]: checked ? [...arr, value] : arr.filter((i) => i !== value) } as typeof prev;
    });
  };

  const handleMentoringExperienceChange = (value: 'Yes' | 'No') =>
    setFormData((prev) => ({
      ...prev,
      mentoringExperience: value,
      mentoringDescription: value === 'No' ? '' : prev.mentoringDescription,
    }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    const combinedExpertise = [
      ...formData.stemExpertise,
      ...formData.nonStemExpertise,
      ...(formData.otherExpertiseEnabled && formData.otherExpertiseText.trim()
        ? [`Other: ${formData.otherExpertiseText.trim()}`] : []),
    ];

    try {
      await submitMentorApplication({ ...formData, expertiseAreas: combinedExpertise });
      setSubmitStatus('success');
      setSubmitMessage(
        `Your application has been submitted! We'll review it and get back to you at ${formData.email} within 5–7 business days.`
      );
      setTimeout(() => {
        setFormData({
          name: '', email: '', linkedin: '', role: '', organization: '',
          country: '', city: '', yearsOfExperience: 0,
          expertiseAreas: [], stemExpertise: [], nonStemExpertise: [],
          otherExpertiseEnabled: false, otherExpertiseText: '',
          achievement: '', mentoringExperience: 'No', mentoringDescription: '',
          projectsOrResearch: '', mentorshipIntent: '', scenarioResponse: '',
          mentorshipTools: '', monthlyCommitment: '2-3 hours',
          mentorshipFormat: [], studentPreference: [],
          portfolioLinks: '', innovationImpactView: '', studentMistakeObservation: '',
          thirtyDayBuildPlan: '', publicMentorFeature: false, mentorReferral: '',
          stateProvince: '',
        });
        setSubmitStatus('idle');
      }, 6000);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mentorshipFormatOptions = ['1:1 Mentorship', 'Group Mentorship', 'Project Guidance', 'Research Guidance', 'Workshops'];
  const studentPreferenceOptions = [
    'Undergraduates (B.Tech / BCA / BSc)',
    'Postgraduates (M.Tech / MBA / MSc)',
    'PhD & Research Scholars',
    'Early Career Professionals (0–2 yrs)',
    'First Project / Product Builders',
    'Startup Founders & Ideators',
    'Students Seeking Career Clarity',
    'Competitive Exam & Placement Aspirants',
    'Higher Studies Abroad (MS / MBA)',
    'Social Impact & NGO Projects',
    'Skill-Specific Learners',
  ]; const commitmentOptions = ['2-3 hours', '4-6 hours', '6-10 hours', '10+ hours'];

  const stemCount = formData.stemExpertise.length;
  const nonStemCount = formData.nonStemExpertise.length;
  const totalSelected = stemCount + nonStemCount + (formData.otherExpertiseEnabled && formData.otherExpertiseText.trim() ? 1 : 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="mf-wrap">

        {/* ── PROGRESS BAR ── */}
        <div className="mf-progress-wrap">
          <div className="mf-progress-label">Application Progress — {progress}% Complete</div>
          <div className="mf-progress-track">
            <div className="mf-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* ── STATUS BANNERS ── */}
        {submitStatus === 'success' && (
          <div className="mf-banner mf-banner-success">
            <span className="mf-banner-icon">✅</span>
            <div>
              <div className="mf-banner-title">Application Submitted!</div>
              <div className="mf-banner-msg">{submitMessage}</div>
            </div>
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="mf-banner mf-banner-error">
            <span className="mf-banner-icon">⚠️</span>
            <div>
              <div className="mf-banner-title">Submission Failed</div>
              <div className="mf-banner-msg">{submitMessage}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ══════════════ §1 BASIC INFORMATION ══════════════ */}
          <Section num="01" title="Basic Information">
            <div className="mf-grid-2">
              <Field label="Full Name" required>
                <input className="mf-input" type="text" name="name"
                  value={formData.name} onChange={handleInputChange}
                  placeholder="Your full name" required />
              </Field>
              <Field label="Email Address" required>
                <input className="mf-input" type="email" name="email"
                  value={formData.email} onChange={handleInputChange}
                  placeholder="your.email@example.com" required />
              </Field>
              <Field label="LinkedIn Profile" required>
                <input className="mf-input" type="url" name="linkedin"
                  value={formData.linkedin} onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile" required />
              </Field>
              <Field label="Current Role / Title" required>
                <input className="mf-input" type="text" name="role"
                  value={formData.role} onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer" required />
              </Field>
              <Field label="Organization / Company" required>
                <input className="mf-input" type="text" name="organization"
                  value={formData.organization} onChange={handleInputChange}
                  placeholder="e.g., Google, Startup, University" required />
              </Field>
              <Field label="Country" required>
                <div className="mf-select-wrap">
                  <select
                    className="mf-select"
                    name="country"
                    value={formData.country}
                    onChange={handleCountryChange}
                    required
                  >
                    <option value="">Select your country</option>
                    {COUNTRY_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="mf-select-arrow">▾</span>
                </div>
              </Field>
              <Field label="State / Province / Region" required>
                <div className="mf-select-wrap">
                  <select
                    className="mf-select"
                    name="stateProvince"
                    value={formData.stateProvince}
                    onChange={handleStateChange}
                    required
                    disabled={!formData.country}
                    style={{ opacity: formData.country ? 1 : 0.45, cursor: formData.country ? 'pointer' : 'not-allowed' }}
                  >
                    <option value="">
                      {formData.country ? 'Select state / province' : '← Select country first'}
                    </option>
                    {(COUNTRIES_STATES[formData.country] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="mf-select-arrow">▾</span>
                </div>
              </Field>
              <Field label="City" required>
                <input
                  className="mf-input"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder={formData.stateProvince ? `City in ${formData.stateProvince}` : 'Select state first'}
                  disabled={!formData.stateProvince}
                  style={{ opacity: formData.stateProvince ? 1 : 0.45 }}
                  required
                />
              </Field>
              <Field label="Years of Professional Experience" required>
                <input className="mf-input" type="number" name="yearsOfExperience"
                  value={formData.yearsOfExperience} onChange={handleInputChange}
                  min="0" max="70" placeholder="0" required />
              </Field>
            </div>
          </Section>

          {/* ══════════════ §2 AREA OF EXPERTISE ══════════════ */}
          <Section num="02" title="Area of Expertise">
            <Field
              label={`Select your areas of expertise${totalSelected > 0 ? ` — ${totalSelected} selected` : ''}`}
              required
              hint="Choose from STEM or Non-STEM fields (or both). Select at least one area. If your domain isn't listed, use the 'Other' option below."
            >
              {/* STEM + Non-STEM panels */}
              <div className="mf-expertise-wrap">

                {/* STEM Panel */}
                <div className="mf-expertise-category">
                  <div className="mf-expertise-cat-head mf-expertise-cat-head-stem">
                    <span className="mf-expertise-cat-icon">🔬</span>
                    <span className="mf-expertise-cat-title">STEM</span>
                    {stemCount > 0 && (
                      <span className="mf-expertise-cat-count">{stemCount} selected</span>
                    )}
                  </div>
                  <div className="mf-expertise-cat-body">
                    {STEM_OPTIONS.map((opt) => (
                      <SmallCheckbox
                        key={opt} label={opt}
                        checked={formData.stemExpertise.includes(opt)}
                        onChange={(checked) => handleStemChange(opt, checked)}
                      />
                    ))}
                  </div>
                </div>

                {/* Non-STEM Panel */}
                <div className="mf-expertise-category">
                  <div className="mf-expertise-cat-head mf-expertise-cat-head-nonstem">
                    <span className="mf-expertise-cat-icon">💡</span>
                    <span className="mf-expertise-cat-title">Non-STEM</span>
                    {nonStemCount > 0 && (
                      <span className="mf-expertise-cat-count mf-expertise-cat-count-green">
                        {nonStemCount} selected
                      </span>
                    )}
                  </div>
                  <div className="mf-expertise-cat-body">
                    {NON_STEM_OPTIONS.map((opt) => (
                      <SmallCheckbox
                        key={opt} label={opt}
                        checked={formData.nonStemExpertise.includes(opt)}
                        onChange={(checked) => handleNonStemChange(opt, checked)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Other Domain */}
              <div className="mf-other-wrap">
                <div
                  className="mf-other-toggle-row"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      otherExpertiseEnabled: !prev.otherExpertiseEnabled,
                      otherExpertiseText: prev.otherExpertiseEnabled ? '' : prev.otherExpertiseText,
                    }))
                  }
                >
                  <span className={`mf-other-toggle-box${formData.otherExpertiseEnabled ? ' on' : ''}`}>
                    {formData.otherExpertiseEnabled ? '✓' : ''}
                  </span>
                  <span className="mf-other-toggle-text">Other Domain</span>
                  <span className="mf-other-badge">Write your own</span>
                </div>
                {formData.otherExpertiseEnabled && (
                  <input
                    className="mf-other-input-field"
                    type="text"
                    placeholder="Describe your area of expertise (e.g., Performing Arts, Sports Science, Culinary Innovation...)"
                    value={formData.otherExpertiseText}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, otherExpertiseText: e.target.value }))
                    }
                    required
                    autoFocus
                  />
                )}
              </div>
            </Field>
          </Section>

          {/* ══════════════ §3 CREDIBILITY CHECK ══════════════ */}
          <Section num="03" title="Credibility Check">
            <Field
              label="What is your professional achievement?"
              required
              hint="Examples: Built a startup, Published research, Worked at a leading company, Built large-scale systems"
            >
              <textarea className="mf-textarea" name="achievement"
                value={formData.achievement} onChange={handleInputChange}
                placeholder="Describe your professional achievement..."
                rows={4} required />
            </Field>

            <Field label="Have you mentored students or professionals before?" required>
              <div className="mf-radio-row">
                {(['Yes', 'No'] as const).map((v) => (
                  <label key={v} className={`mf-radio-label${formData.mentoringExperience === v ? ' selected' : ''}`}>
                    <input type="radio" name="mentoringExperience" value={v}
                      checked={formData.mentoringExperience === v}
                      onChange={() => handleMentoringExperienceChange(v)} />
                    {v}
                  </label>
                ))}
              </div>
            </Field>

            {formData.mentoringExperience === 'Yes' && (
              <Field label="Briefly describe your mentoring experience" required>
                <textarea className="mf-textarea" name="mentoringDescription"
                  value={formData.mentoringDescription || ''} onChange={handleInputChange}
                  placeholder="Tell us about your mentoring experience..." rows={4} required />
              </Field>
            )}

            <Field
              label="What projects, companies, or research have you worked on that students could learn from?"
              required
            >
              <textarea className="mf-textarea" name="projectsOrResearch"
                value={formData.projectsOrResearch || ''} onChange={handleInputChange}
                placeholder="Describe projects or research that demonstrate your expertise..."
                rows={4} required />
            </Field>
          </Section>

          <div className="mf-stripe" />

          {/* ══════════════ §4 MENTORSHIP INTENT ══════════════ */}
          <Section num="04" title="Mentorship Intent">
            <Field
              label="Why do you want to mentor at DreamXec?"
              required
              hint="Good signals: Giving back to students, Helping innovation, Supporting research. Weak signals: Networking only, General exposure"
            >
              <textarea className="mf-textarea" name="mentorshipIntent"
                value={formData.mentorshipIntent} onChange={handleInputChange}
                placeholder="Share your motivation for mentoring at DreamXec..."
                rows={4} required />
            </Field>
          </Section>

          {/* ══════════════ §5 SCENARIO QUESTION ══════════════ */}
          <Section num="05" title="Scenario Question — Mentor Quality Filter">
            <Field
              label="A student has a great idea but no technical skills. How would you guide them?"
              required
              hint="This helps us evaluate your communication ability, mentorship mindset, and problem-solving approach"
            >
              <textarea className="mf-textarea" name="scenarioResponse"
                value={formData.scenarioResponse} onChange={handleInputChange}
                placeholder="Describe how you would mentor a student with a great idea but no technical skills..."
                rows={4} required />
            </Field>
          </Section>

          {/* ══════════════ §6 MENTORSHIP TOOLS & APPROACH ══════════════ */}
          <Section num="06" title="Mentorship Tools & Approach">
            <Field
              label="What tools, platforms, or AI-assisted resources do you use to deliver your mentorship?"
              required
              hint="Help us understand your mentorship methodology — this may include productivity tools, AI assistants (e.g. ChatGPT, Gemini), coaching frameworks, collaboration platforms, or any structured approach you apply to guide mentees effectively."
            >
              <textarea
                className="mf-textarea"
                name="mentorshipTools"
                value={formData.mentorshipTools}
                onChange={handleInputChange}
                placeholder="e.g., I use Notion for session planning and progress tracking, Loom for async video feedback, and ChatGPT to help mentees debug code or explore new concepts. I also apply the GROW coaching framework to structure goal-setting conversations and keep each session focused..."
                rows={5}
                required
              />
            </Field>
          </Section>

          {/* ══════════════ §7 COMMITMENT ══════════════ */}
          <Section num="07" title="Commitment">
            <Field label="How many hours per month can you commit to mentoring?" required>
              <div className="mf-select-wrap">
                <select className="mf-select" name="monthlyCommitment"
                  value={formData.monthlyCommitment} onChange={handleInputChange}>
                  {commitmentOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt} / month</option>
                  ))}
                </select>
                <span className="mf-select-arrow">▾</span>
              </div>
            </Field>

            <Field label="Preferred mentorship format — Select at least one" required>
              <div className="mf-check-grid">
                {mentorshipFormatOptions.map((opt) => (
                  <Checkbox key={opt} label={opt}
                    checked={formData.mentorshipFormat.includes(opt)}
                    onChange={(checked) => handleArrayChange('mentorshipFormat', opt, checked)}
                  />
                ))}
              </div>
            </Field>
          </Section>

          <div className="mf-stripe" />

          {/* ══════════════ §8 STUDENT IMPACT ══════════════ */}
          <Section num="08" title="Student Impact">
            <Field label="What kind of students do you prefer mentoring? — Select at least one" required>
              <div className="mf-check-grid">
                {studentPreferenceOptions.map((opt) => (
                  <Checkbox key={opt} label={opt}
                    checked={formData.studentPreference.includes(opt)}
                    onChange={(checked) => handleArrayChange('studentPreference', opt, checked)}
                  />
                ))}
              </div>
            </Field>
          </Section>

          {/* ══════════════ §9 PROOF OF WORK ══════════════ */}
          <Section num="09" title="Proof of Work">
            <Field label="Portfolio / GitHub / Publications / Website" required>
              <textarea className="mf-textarea" name="portfolioLinks"
                value={formData.portfolioLinks || ''} onChange={handleInputChange}
                placeholder="Paste links to your portfolio, GitHub, research papers, website, etc."
                rows={3} required />
            </Field>
          </Section>

          {/* ══════════════ §10 VALUES ALIGNMENT ══════════════ */}
          <Section num="10" title="Values Alignment">
            <Field label={'What does "innovation for impact" mean to you?'} required>
              <textarea className="mf-textarea" name="innovationImpactView"
                value={formData.innovationImpactView} onChange={handleInputChange}
                placeholder="Share your perspective on innovation for impact..."
                rows={4} required />
            </Field>
          </Section>

          {/* ══════════════ §11 FINAL FILTER ══════════════ */}
          <Section num="11" title="Extra Question">
            <Field
              label="What is one mistake most students make when building projects or startups?"
              required
            >
              <textarea className="mf-textarea" name="studentMistakeObservation"
                value={formData.studentMistakeObservation} onChange={handleInputChange}
                placeholder="Share your observation about common mistakes..."
                rows={4} required />
            </Field>
          </Section>

          <div className="mf-stripe" />

          {/* ══════════════ §12 ELITE FILTER (OPTIONAL) ══════════════ */}
          <Section num="12" title="Extra Question — Optional" elite>
            <Field
              label="If you had to mentor a student to build something meaningful in 30 days, what would you make them build?"
              hint="Strong mentors usually provide structured answers. This is optional but helps us identify exceptional mentors."
            >
              <textarea className="mf-textarea" name="thirtyDayBuildPlan"
                value={formData.thirtyDayBuildPlan || ''} onChange={handleInputChange}
                placeholder="Describe a 30-day build plan for a student..."
                rows={4} />
            </Field>
          </Section>

          {/* ══════════════ §13 PUBLIC MENTOR FEATURE ══════════════ */}
          <Section num="13" title="Public Mentor Feature">
            <div
              className={`mf-toggle-wrap${formData.publicMentorFeature ? ' checked' : ''}`}
              onClick={() => setFormData((prev) => ({ ...prev, publicMentorFeature: !prev.publicMentorFeature }))}
            >
              <input type="checkbox" name="publicMentorFeature"
                checked={formData.publicMentorFeature || false} onChange={() => { }} />
              <span className="mf-toggle-box">{formData.publicMentorFeature ? '✓' : ''}</span>
              <div>
                <div className="mf-toggle-title">I'm open to being featured publicly as a DreamXec mentor</div>
                <div className="mf-toggle-sub">Selected mentors will be featured on our website and social media channels.</div>
              </div>
            </div>
          </Section>

          {/* ══════════════ §14 NETWORK EXPANSION ══════════════ */}
          <Section num="14" title="Network Expansion">
            <Field
              label="Who is one person you recommend as a mentor for DreamXec?"
              required
              hint="Great mentors usually refer other strong mentors. This helps us expand our mentor network."
            >
              <textarea className="mf-textarea" name="mentorReferral"
                value={formData.mentorReferral || ''} onChange={handleInputChange}
                placeholder="Name and brief description of a person you'd recommend as a mentor..."
                rows={3} required />
            </Field>
          </Section>

          {/* ══════════════ SUBMIT ══════════════ */}
          <div className="mf-submit-area">
            <p className="mf-required-note">* All fields required unless marked optional · Reviewed within 5–7 business days</p>
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className={`mf-submit-btn${submitStatus === 'success' ? ' submitted' : ''}`}
            >
              {isSubmitting ? (
                <><span className="mf-spinner" /> Submitting...</>
              ) : submitStatus === 'success' ? (
                <>✓ Application Submitted</>
              ) : (
                <>🎓 Submit Application →</>
              )}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};