import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "F:/Dev Factory/BhaiFreakin - Universal/unreal-bs";
const OUT = path.join(ROOT, "deliverables/knowledge-base");
const BUILD = path.join(OUT, ".build");
const RENDERED = path.join(BUILD, "artifact-rendered");
const PPTX = path.join(OUT, "UNREAL-BS-Complete-Feature-Knowledge-Base-BN.pptx");
const FONT = "Nirmala UI";

const C = {
  bg: "#07090E", panel: "#11151E", panel2: "#171C27", white: "#F6F7FB",
  muted: "#A8B0BF", gold: "#F5B942", violet: "#9B7BFF", cyan: "#4DD7FA",
  green: "#39D98A", red: "#FF6B6B", line: "#293142", ink: "#0B0E14",
};

const statusMap = {
  "লাইভ": { color: C.green, label: "লাইভ" },
  "নিয়ন্ত্রিত": { color: C.cyan, label: "নিয়ন্ত্রিত" },
  "ডার্ক": { color: C.gold, label: "ডার্ক / বন্ধ" },
  "ভবিষ্যৎ": { color: C.violet, label: "ভবিষ্যৎ" },
  "ব্লকড": { color: C.red, label: "চালু নয়" },
};

const sections = {
  ghl: { no: "০১", title: "HighLevel-চালিত গ্রাহক ও অপারেশন", accent: C.violet, blurb: "Lead থেকে customer, inbox, pipeline, site ও agent—একই business context-এ।" },
  money: { no: "০২", title: "নিজস্ব টাকা, সেবা ও অপারেশন", accent: C.gold, blurb: "Wallet, deposit, credit, udhar, card এবং 400-service catalog—UNREAL BS-এর নিজস্ব layer।" },
  ai: { no: "০৩", title: "AI ব্যবহার ও সফটওয়্যার নির্মাণ", accent: C.cyan, blurb: "একাধিক AI provider, খরচ নিয়ন্ত্রণ, search grounding ও app prototyping।" },
  growth: { no: "০৪", title: "Advertising ও Commerce", accent: C.green, blurb: "Campaign operations, digital products, manual payment এবং consented Meta measurement।" },
  safety: { no: "০৫", title: "Admin, Security ও Launch Control", accent: C.red, blurb: "মানুষের অনুমোদন, audit trail, session safety, health checks এবং dark launch।" },
};

const features = [
  { section:"ghl", title:"Public Funnel ও Application", status:"লাইভ", plain:"নতুন মানুষ /unreal-bs পেজ থেকে অফার বুঝে /apply ফর্মে আসে। সফল আবেদন HighLevel-এ contact হিসেবে তৈরি বা update হয়—অভ্যন্তরীণ contact ID বাইরে দেখানো হয় না।", who:"সম্ভাব্য গ্রাহক ও sales team", outcome:"একটি পরিচ্ছন্ন lead entry point এবং follow-up-এর জন্য CRM record।", steps:["ভিজিটর অফার দেখে","ফর্ম + Turnstile পূরণ","GHL contact upsert","success message"], remember:["Form field সীমাবদ্ধ","Meta attribution গ্রহণ করতে পারে","spam control শুধু /apply-তে"], sources:["app/(marketing)/unreal-bs/page.tsx","app/(marketing)/apply/page.tsx","app/api/applications/route.ts"] },
  { section:"ghl", title:"Registration, Login ও Tenant Isolation", status:"লাইভ", plain:"প্রতিটি account একটি নির্দিষ্ট HighLevel location-এর সঙ্গে যুক্ত। ভুল বা অনির্ধারিত location থাকলে user অন্য ব্যবসার data দেখতে পারে না; disconnected state পায়।", who:"Platform user ও account operator", outcome:"একই platform-এ বহু business নিরাপদে আলাদা রাখা।", steps:["account তৈরি","secure login","location resolve","নিজস্ব dashboard"], remember:["৮ ঘণ্টা session","server-side permission","cross-tenant data বন্ধ"], sources:["auth.ts","proxy.ts","lib/tenancy.ts","app/api/auth"] },
  { section:"ghl", title:"Control Room Dashboard", status:"লাইভ", plain:"এক নজরে HighLevel-এর contacts, conversations ও opportunities-এর সঙ্গে UNREAL BS wallet এবং Udhar অবস্থাও দেখা যায়। এটি daily operations-এর শুরুর জায়গা।", who:"Business owner ও operator", outcome:"বিভিন্ন system খুলে না ঘুরে গুরুত্বপূর্ণ signal এক screen-এ পাওয়া।", steps:["GHL data load","wallet summary","udhar summary","action shortcut"], remember:["live integration data","empty/error state আছে","পুরোনো screenshot কেবল reference"], sources:["app/(dashboard)/control-room/page.tsx","components/control-room","lib/ghl"] },
  { section:"ghl", title:"Customers / CRM Contacts", status:"লাইভ", plain:"HighLevel contact list দেখা, খোঁজা, নতুন contact তৈরি এবং detail context খোলা যায়। Customer relationship-এর source of truth HighLevel-ই থাকে।", who:"Sales ও customer-success team", outcome:"Lead ও customer record দ্রুত খুঁজে কাজ শুরু করা।", steps:["contact list","search/filter","create contact","detail open"], remember:["GHL data source","tenant-bound request","validation সহ create"], sources:["app/(dashboard)/customers/page.tsx","components/customers","lib/ghl/contacts.ts"] },
  { section:"ghl", title:"Inbox ও Customer Messages", status:"লাইভ", plain:"HighLevel conversations এবং message history platform থেকেই দেখা যায়; operator একই context থেকে reply পাঠাতে পারে।", who:"Support ও sales operator", outcome:"আলাদা inbox না খুলে customer conversation চালানো।", steps:["conversation list","thread নির্বাচন","history পড়া","reply পাঠানো"], remember:["message failure দেখায়","tenant scope বজায়","reply live GHL-এ যায়"], sources:["app/(dashboard)/inbox/page.tsx","components/inbox","lib/ghl/conversations.ts"] },
  { section:"ghl", title:"Sales Pipeline ও Workflows", status:"নিয়ন্ত্রিত", plain:"HighLevel-এর opportunity pipeline ও workflows পড়া যায়। Risky status toggle সরাসরি live automation বদলায় না; local draft বা deep-link ভিত্তিক controlled action রাখা হয়েছে।", who:"Sales manager ও automation operator", outcome:"Pipeline বুঝে পরিবর্তনের আগে নিরাপদ সিদ্ধান্ত নেওয়া।", steps:["pipeline পড়া","workflow list","draft change","GHL-এ final control"], remember:["read-first design","fake success নেই","workflow mutation সীমিত"], sources:["app/(dashboard)/sales-pipeline/page.tsx","app/(dashboard)/workflows/page.tsx","lib/ghl/workflows.ts"] },
  { section:"ghl", title:"Sites ও Funnels", status:"নিয়ন্ত্রিত", plain:"HighLevel-এ থাকা funnel, page এবং step-এর inventory platform-এ দেখা যায়। Editing HighLevel-এর trusted surface-এ deep link দিয়ে করা হয়।", who:"Marketing ও funnel operator", outcome:"কোন funnel কোথায় আছে—সহজ inventory ও দ্রুত navigation।", steps:["funnel fetch","step count","status context","GHL editor open"], remember:["read-only inventory","in-app fake editor নেই","GHL remains source"], sources:["app/(dashboard)/sites/page.tsx","lib/ghl/funnels.ts"] },
  { section:"ghl", title:"Brand Board", status:"নিয়ন্ত্রিত", plain:"Business name, logo এবং brand-related HighLevel তথ্য এক জায়গায় দেখায়। Logo download করা যায়; brand edit trusted HighLevel screen-এ হয়।", who:"Brand, marketing ও owner team", outcome:"সবার জন্য একই brand reference রাখা।", steps:["brand info load","logo preview","asset download","edit deep link"], remember:["asset reuse সহজ","editing controlled","brand data GHL-ভিত্তিক"], sources:["app/(dashboard)/brand-board/page.tsx","components/brand-board","lib/ghl/business.ts"] },
  { section:"ghl", title:"Agent Studio", status:"নিয়ন্ত্রিত", plain:"HighLevel AI/Voice agent inventory দেখা, metadata update এবং অনুমোদিত scope থাকলে controlled execution বা Voice AI creation করা যায়।", who:"AI operator ও support automation team", outcome:"Agent setup ও operation একই governance-এর মধ্যে রাখা।", steps:["agent inventory","capability check","metadata update","controlled execute"], remember:["scope ছাড়া create নয়","response validate হয়","operator context থাকে"], sources:["app/(dashboard)/agent-studio/page.tsx","app/api/agents","lib/ghl/agents.ts"] },
  { section:"ghl", title:"AI Agents Guidance", status:"নিয়ন্ত্রিত", plain:"HighLevel-এর relevant agent screen-এ যাওয়ার guided route দেয়। কোনো integration সত্যি চালু না থাকলে platform মিথ্যা connected বা enabled দেখায় না।", who:"নতুন operator ও setup team", outcome:"AI agent configuration-এর সঠিক জায়গা ও next step বোঝা।", steps:["agent type বোঝা","readiness দেখা","setup guidance","GHL deep link"], remember:["enablement দাবি করে না","human verification দরকার","guided workflow"], sources:["app/(dashboard)/ai-agents/page.tsx","components/ai-agents"] },
  { section:"ghl", title:"Integrations Directory", status:"নিয়ন্ত্রিত", plain:"Business-এ দরকারি integration-গুলোর উদ্দেশ্য, setup নির্দেশনা ও trusted destination দেখায়। In-app OAuth না থাকলে connected badge বানিয়ে দেখানো হয় না।", who:"Owner, admin ও implementation team", outcome:"কোন integration কেন লাগবে এবং কোথায় setup হবে তা স্পষ্ট করা।", steps:["integration বাছাই","উপকার বোঝা","requirement দেখা","official setup open"], remember:["fake connection নেই","secret browser-এ নয়","status সততার সঙ্গে"], sources:["app/(dashboard)/integrations/page.tsx","components/integrations"] },
  { section:"ghl", title:"Commerce Buyer Sync to GHL", status:"ডার্ক", plain:"Commerce চালু হলে paid buyer-কে tagged HighLevel contact হিসেবে sync করার boundary তৈরি আছে। Payment নিশ্চিত হওয়ার আগে buyer-কে paid customer ধরা হয় না।", who:"Sales, lifecycle ও support team", outcome:"Purchase-এর পর CRM follow-up এবং segmentation।", steps:["order paid","buyer normalize","GHL contact upsert","commerce tag"], remember:["payment-first rule","sync failure order নষ্ট করে না","feature flag বন্ধ"], sources:["lib/commerce/ghl-buyer-sync.ts","lib/commerce/orders.ts"] },

  { section:"money", title:"Wallet ও Ledger", status:"লাইভ", plain:"প্রতিটি user-এর balance এবং প্রতিটি credit/debit movement ledger-এ থাকে। Dashboard শুধু মোট টাকা নয়—কেন balance বদলেছে তার trace-ও রাখতে পারে।", who:"Platform user, finance operator", outcome:"AI, card ও service খরচের একটি auditable টাকা-কেন্দ্র।", steps:["balance দেখা","operation শুরু","ledger entry","updated balance"], remember:["database-backed","server calculation","history traceable"], sources:["app/(dashboard)/wallet/page.tsx","lib/wallet.ts","supabase/migrations"] },
  { section:"money", title:"Deposit Request ও Approval", status:"লাইভ", plain:"User টাকা যোগ করার request দেয়; operator payment evidence দেখে approve বা reject করে। Approval ছাড়া wallet balance বাড়ে না।", who:"User ও finance/admin operator", outcome:"Manual payment market-এ controlled wallet top-up।", steps:["request submit","evidence review","admin decision","ledger update"], remember:["human confirmation","duplicate control","audit event"], sources:["app/(dashboard)/wallet/deposit","app/api/deposits","app/admin/deposits"] },
  { section:"money", title:"Credit Bundles", status:"লাইভ", plain:"পূর্বনির্ধারিত credit package user-কে সহজে wallet value বাছতে সাহায্য করে। Price/rate admin control-এ থাকে; browser নিজে price নির্ধারণ করতে পারে না।", who:"Frequent AI/service user", outcome:"সহজ top-up choice এবং predictable usage budget।", steps:["bundle দেখা","package বাছাই","deposit flow","wallet credit"], remember:["admin-configured","server price source","bundle inventory"], sources:["app/(dashboard)/wallet/page.tsx","app/admin/bundles","lib/bundles.ts"] },
  { section:"money", title:"Udhar Khata", status:"লাইভ", plain:"কাকে কত টাকা দেওয়া বা নেওয়া বাকি, কবে payment হয়েছে এবং কীভাবে reminder দিতে হবে—এই ছোট ব্যবসার খাতা digitalভাবে রাখে।", who:"Bangladesh-এর small business owner", outcome:"কাগজের খাতা হারানো বা ভুল হিসাব কমানো।", steps:["debt entry","payment record","remaining হিসাব","reminder পাঠানো"], remember:["WhatsApp/phone shortcut","partial payment","wallet থেকে আলাদা হিসাব"], sources:["app/(dashboard)/udhar-khata/page.tsx","components/udhar","lib/udhar.ts"] },
  { section:"money", title:"Virtual Card Operations", status:"নিয়ন্ত্রিত", plain:"User virtual card request করতে পারে; operator card assign করে এবং প্রয়োজন হলে wallet charge নেয়। Sensitive card details দেখতে আবার password verify করতে হয়।", who:"Approved platform user ও card operator", outcome:"Controlled digital-payment access, casual credential exposure ছাড়া।", steps:["card request","operator review","assign + charge","step-up reveal"], remember:["encrypted credential","১০ মিনিট reverify","assignment audit"], sources:["app/(dashboard)/virtual-cards/page.tsx","app/api/cards","lib/cards","lib/security/step-up.ts"] },
  { section:"money", title:"400 Services Catalog", status:"লাইভ", plain:"বিভিন্ন business service একটি searchable catalog-এ সাজানো। Fulfilment manual/managed হওয়ায় user service বুঝে request করতে পারে, কিন্তু platform তাৎক্ষণিক automated delivery দাবি করে না।", who:"SME owner ও service buyer", outcome:"এক জায়গা থেকে প্রয়োজনীয় business capability খুঁজে পাওয়া।", steps:["category browse","service detail","request/interest","managed fulfilment"], remember:["400-item catalog","manual fulfilment","false automation নেই"], sources:["app/(dashboard)/services/page.tsx","data/services","components/services"] },
  { section:"money", title:"Settings, Upgrade ও Error Logs", status:"নিয়ন্ত্রিত", plain:"Account settings, plan/upgrade context এবং নিজের action-সংক্রান্ত error visibility দেয়। Sensitive configuration admin/server control-এ থাকে।", who:"User, owner ও support team", outcome:"নিজে basic account control এবং support troubleshooting সহজ করা।", steps:["settings দেখা","allowed change","upgrade context","error trace"], remember:["secret দেখায় না","user-scoped log","privileged config আলাদা"], sources:["app/(dashboard)/settings/page.tsx","app/(dashboard)/upgrade/page.tsx","app/(dashboard)/error-logs/page.tsx"] },

  { section:"ai", title:"AI Subscriptions ও Multi-provider Access", status:"লাইভ", plain:"একটি interface থেকে OpenAI, Anthropic, Google, Cerebras, Cloudflare, Hugging Face, Cohere, Moonshot ও OpenRouter-এর মতো provider adapter ব্যবহার করা যায়—যে provider configured ও available।", who:"AI user ও business team", outcome:"এক provider ব্যর্থ বা অনুপযুক্ত হলে controlled বিকল্প।", steps:["model/provider বাছাই","availability check","request পাঠানো","usage record"], remember:["real adapter boundary","unavailable state","server-held credentials"], sources:["app/(dashboard)/ai-subscriptions/page.tsx","lib/ai/providers","app/api/ai"] },
  { section:"ai", title:"AI Billing, Free Allowance ও Daily Cap", status:"লাইভ", plain:"Token/usage অনুযায়ী বাস্তব খরচ হিসাব হয়। Free daily allowance, wallet affordability check এবং daily spending cap user-কে অনিচ্ছাকৃত অতিরিক্ত খরচ থেকে বাঁচায়।", who:"AI user ও finance-conscious team", outcome:"AI ব্যবহারকে predictable এবং wallet-safe রাখা।", steps:["usage estimate","free quota check","wallet gate","cost ledger"], remember:["browser price নয়","daily cap","insufficient balance state"], sources:["lib/ai/billing.ts","lib/ai/pricing.ts","app/api/ai/route.ts"] },
  { section:"ai", title:"Search-grounded AI", status:"নিয়ন্ত্রিত", plain:"Tavily configured থাকলে AI answer-এর আগে web search context নিতে পারে। Search unavailable হলে পরিষ্কার fallback থাকে; fabricated live research claim করা হয় না।", who:"Research ও decision-support user", outcome:"সময়-সংবেদনশীল প্রশ্নে বেশি grounded উত্তর।", steps:["query নেওয়া","search eligibility","source context","AI synthesis"], remember:["optional integration","timeout/failure tolerant","source-aware response"], sources:["lib/ai/search.ts","app/api/ai/route.ts"] },
  { section:"ai", title:"BhaiFreakin AI", status:"লাইভ", plain:"General-purpose AI workspace যা Puter.js capability এবং OpenRouter free fallback ব্যবহার করতে পারে। Provider না থাকলে user-কে পরিষ্কার unavailable state দেখায়।", who:"দৈনন্দিন AI সহায়তা চাওয়া user", outcome:"লেখা, চিন্তা, বিশ্লেষণ ও সাধারণ কাজের দ্রুত সহায়তা।", steps:["prompt লেখা","provider resolve","response stream","result ব্যবহার"], remember:["fallback strategy","provider status honest","user prompt privacy"], sources:["app/(dashboard)/bhaifreakin-ai/page.tsx","components/bhaifreakin-ai","lib/ai"] },
  { section:"ai", title:"App Developer", status:"নিয়ন্ত্রিত", plain:"Idea থেকে prototype/code তৈরি, edit এবং preview করার assisted workspace। এটি production app auto-publish করে না; final security, database ও deployment review দরকার।", who:"Founder, maker ও developer", outcome:"Concept দ্রুত দেখানো এবং development starting point পাওয়া।", steps:["idea describe","AI scaffold","code edit","preview/review"], remember:["prototype ≠ production","human review","Puter-assisted tooling"], sources:["app/(dashboard)/app-developer/page.tsx","components/app-developer"] },

  { section:"growth", title:"Ads Launch Desk", status:"নিয়ন্ত্রিত", plain:"Campaign brief, budget, audience, creative, status ও result এক operational desk-এ রাখা হয়। Default হলো managed operator mode—সরাসরি ad publish নয়।", who:"Marketing owner ও ad operator", outcome:"Ad launch-এর input, approval ও reporting একই জায়গায় রাখা।", steps:["brief তৈরি","budget/audience","creative review","operator launch"], remember:["Supabase record","approval-led","advertising এখন blocked"], sources:["app/(dashboard)/ads-launch-desk/page.tsx","app/api/ads","lib/ads"] },
  { section:"growth", title:"Managed বনাম Direct Meta Publishing", status:"ব্লকড", plain:"Approved Meta access, credentials ও policy verification ছাড়া platform সরাসরি campaign publish করে না। Managed mode-এ operator final Meta action নেয়; direct mode future-controlled capability।", who:"Ad operator ও compliance owner", outcome:"ভুল credential বা unreviewed campaign দিয়ে live ad যাওয়ার ঝুঁকি কমানো।", steps:["campaign ready","credential check","policy approval","manual/direct decision"], remember:["no fake publish","direct mode gated","human ownership"], sources:["lib/ads/meta.ts","PRE_AD_LAUNCH_RUNBOOK.md","IMPLEMENTATION_STATUS.md"] },
  { section:"growth", title:"Digital Products", status:"ডার্ক", plain:"Course, download, service ও consultation-কে product হিসেবে তৈরি ও publish করার platform-owned commerce system প্রস্তুত। Seller marketplace launch-এ বন্ধ।", who:"Platform admin ও future buyer", outcome:"নিজস্ব digital offering এক controlled store থেকে বিক্রি।", steps:["admin product create","asset/lesson attach","review","publish flag"], remember:["admin-only ownership","seller payout বন্ধ","public store flag off"], sources:["lib/commerce/products.ts","app/admin/products","app/(storefront)","supabase/migrations/0013_commerce.sql"] },
  { section:"growth", title:"Manual Checkout ও Payment Lifecycle", status:"ডার্ক", plain:"bKash, Nagad বা Rocket-এ payment করে buyer reference দেয়। Operator transfer যাচাই না করা পর্যন্ত paid access হয় না; free product সঙ্গে সঙ্গে access পায়।", who:"Bangladesh buyer ও order operator", outcome:"Card gateway ছাড়াই নিরাপদ manual commerce flow।", steps:["pending payment","reference submitted","operator confirms","paid access"], remember:["unique payment ref","reject/refund state","৳৫০ canary required"], sources:["lib/commerce/orders.ts","app/api/checkout","app/admin/orders","PRE_AD_LAUNCH_RUNBOOK.md"] },
  { section:"growth", title:"Learning, Downloads ও Buyer Access", status:"ডার্ক", plain:"Paid buyer course lesson, video, asset বা download access পায়। Raw access token একবার দেওয়া হয়; database-এ শুধু SHA-256 hash থাকে এবং file link স্বল্পসময় valid থাকে।", who:"Digital product buyer", outcome:"Private content ও download-এর controlled delivery।", steps:["order paid","opaque token issue","token hash lookup","signed download"], remember:["private storage","short expiry","unsafe file type blocked"], sources:["lib/commerce/access.ts","lib/commerce/downloads.ts","app/(storefront)/learn","app/api/downloads"] },
  { section:"growth", title:"Meta Consent, Pixel ও Conversions API", status:"ডার্ক", plain:"Marketing consent না দিলে Meta script load হয় না। Consent দিলে browser Pixel ও server CAPI একই event ID ব্যবহার করে duplicate count আটকায়। Purchase শুধু operator paid করলে পাঠায়।", who:"Marketing, privacy ও analytics team", outcome:"Consent-aware attribution এবং বেশি নির্ভরযোগ্য conversion measurement।", steps:["consent নেওয়া","Pixel event","server CAPI","event-ID dedupe"], remember:["Lead after GHL success","Purchase after paid","token browser-এ নয়"], sources:["components/meta-consent","lib/meta","app/api/meta","app/(legal)/privacy"] },

  { section:"safety", title:"Admin Control Plane", status:"লাইভ", plain:"User/tenant assignment, rates, bundles, deposits, ad records, product/order/refund এবং card operations—privileged কাজগুলো central admin authorization-এর মাধ্যমে হয়।", who:"Trusted platform operator", outcome:"Sensitive operation সাধারণ user থেকে আলাদা এবং auditable রাখা।", steps:["admin login","permission check","step-up if needed","operation + audit"], remember:["central role check","reason required","client email compare নয়"], sources:["app/admin","lib/security/admin.ts","lib/audit.ts"] },
  { section:"safety", title:"Session ও Password Re-verification", status:"লাইভ", plain:"Login session সর্বোচ্চ ৮ ঘণ্টা। Card reveal, payment confirmation/refund বা payment-number change-এর আগে আবার password দিলে ১০ মিনিটের step-up cookie পাওয়া যায়। Logout সব step-up state মুছে দেয়।", who:"সব user ও privileged operator", outcome:"চুরি হওয়া খোলা session দিয়ে sensitive কাজের ঝুঁকি কমানো।", steps:["normal login","sensitive action","password reverify","১০ মিনিট অনুমতি"], remember:["HttpOnly cookie","SameSite protection","MFA future"], sources:["auth.ts","app/api/auth/reverify","lib/security/step-up.ts","proxy.ts"] },
  { section:"safety", title:"Public API ও Abuse Protection", status:"লাইভ", plain:"State-changing request-এ same-origin, JSON content type, body-size ও request-ID rule আছে। Login, registration, application, checkout ও money action আলাদা key-তে fail-closed throttle হয়।", who:"Platform owner ও security team", outcome:"Spam, brute force এবং malformed request-এর ক্ষতি কমানো।", steps:["request আসে","origin/body check","rate-limit check","handler চালায়"], remember:["fail-closed","operation-specific keys","safe error response"], sources:["lib/security/request.ts","lib/security/rate-limit.ts","proxy.ts"] },
  { section:"safety", title:"CSP, Upload ও Secret Safety", status:"নিয়ন্ত্রিত", plain:"Nonce-based Content Security Policy script source নিয়ন্ত্রণ করে। Upload-এ MIME, extension ও size allowlist আছে; HTML, SVG, executable ও scriptable file reject হয়। Secret client bundle বা log-এ রাখা হয় না।", who:"Security ও platform engineering", outcome:"XSS, malicious file এবং secret leakage-এর attack surface কমানো।", steps:["nonce তৈরি","source policy","file validation","forced download"], remember:["preview report-only first","approved types only","server secrets"], sources:["proxy.ts","lib/security/csp.ts","lib/commerce/uploads.ts","lib/env.ts"] },
  { section:"safety", title:"Health, Audit ও Log Redaction", status:"লাইভ", plain:"/api/health/live service alive কিনা বলে; /ready dependency capability দেখায়—secret/customer data নয়। Money/security action append-only audit event রাখে এবং log থেকে email, phone, token, payment reference ও provider payload redact হয়।", who:"Operator, support ও monitoring system", outcome:"সমস্যা দ্রুত ধরা, কিন্তু sensitive data leak না করা।", steps:["health probe","dependency status","structured event","redacted log"], remember:["capability boolean only","money audit","PII masking"], sources:["app/api/health/live/route.ts","app/api/health/ready/route.ts","lib/audit.ts","lib/logger.ts"] },
  { section:"safety", title:"Feature Flags ও Dark Launch", status:"লাইভ", plain:"Commerce, public store, marketplace seller এবং canary access আলাদা server flag-এ নিয়ন্ত্রিত। Code deploy করা যায়, কিন্তু feature 404/403 দিয়ে বন্ধ থাকে—তারপর সীমিত canary থেকে ধীরে চালু হয়।", who:"Release operator ও product owner", outcome:"Production database ব্যবহার করেও বিজ্ঞাপন-পূর্ব rollout নিরাপদ করা।", steps:["code dark deploy","additive migration","canary test","public enable"], remember:["rollback = flag first","seller routes 403","ads gate আলাদা"], sources:["lib/commerce/flags.ts","proxy.ts","PRE_AD_LAUNCH_RUNBOOK.md"] },
  { section:"safety", title:"Social Market", status:"ব্লকড", plain:"Social Market / Social Yo navigation concept আছে, কিন্তু verified social-network publishing API সংযুক্ত নয়। তাই platform automatic social posting বা campaign delivery দাবি করে না।", who:"Future social-commerce team", outcome:"Future module-এর boundary পরিষ্কার রাখা।", steps:["module entry","capability check","not connected state","future integration"], remember:["/social-yo redirects","no fake connection","launch scope নয়"], sources:["app/(dashboard)/social-market/page.tsx","app/(dashboard)/social-yo/page.tsx","IMPLEMENTATION_STATUS.md"] },
  { section:"safety", title:"Future Workspace Modules", status:"ভবিষ্যৎ", plain:"Agentic HQ, MeetAlly, Clan, Skills, Opportunities ও Credit Center navigation/product concepts হিসেবে আছে; বর্তমান launch-এ connected end-to-end feature হিসেবে ধরা যাবে না।", who:"Product roadmap ও investor audience", outcome:"ভবিষ্যৎ expansion বোঝা, current capability-এর সঙ্গে গুলিয়ে না ফেলা।", steps:["concept defined","UX entry","backend contract","future release"], remember:["coming-soon label","no revenue claim","separate acceptance needed"], sources:["app/(dashboard)","IMPLEMENTATION_STATUS.md","ARCHITECTURE.md"] },
];

function shape(slide, geometry, left, top, width, height, fill = "none", line = "none") {
  return slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
  });
}

function textBox(slide, text, left, top, width, height, size = 22, color = C.white, bold = false, align = "left", valign = "top") {
  const s = shape(slide, "rect", left, top, width, height, "none", "none");
  s.text = text;
  s.text.fontSize = size;
  s.text.color = color;
  s.text.bold = bold;
  s.text.typeface = FONT;
  s.text.alignment = align;
  s.text.verticalAlignment = valign;
  s.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  return s;
}

function addFooter(slide, n) {
  shape(slide, "rect", 64, 678, 1152, 1, C.line, "none");
  textBox(slide, "UNREAL BS  •  FEATURE KNOWLEDGE BASE", 64, 688, 570, 18, 11, C.muted, true);
  textBox(slide, String(n).padStart(2, "0"), 1150, 686, 66, 18, 12, C.muted, true, "right");
}

function addStatus(slide, status, left = 1010, top = 58) {
  const s = statusMap[status];
  shape(slide, "roundRect", left, top, 200, 34, C.panel2, s.color);
  shape(slide, "ellipse", left + 14, top + 11, 12, 12, s.color, "none");
  textBox(slide, `বর্তমান অবস্থা: ${s.label}`, left + 36, top + 7, 150, 20, 14, C.white, true);
}

function addNotes(slide, sources, note = "") {
  const refs = sources.map((s) => `- ${ROOT}/${s}`).join("\n");
  slide.speakerNotes.textFrame.setText(`${note}${note ? "\n\n" : ""}[Sources]\n${refs}\n[/Sources]`);
  slide.speakerNotes.setVisible(true);
}

function coverSlide(p, logoBytes) {
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  shape(slide, "ellipse", 860, -210, 520, 520, "#15102A", "none");
  shape(slide, "ellipse", 970, 420, 390, 390, "#0B2A24", "none");
  shape(slide, "rect", 64, 74, 8, 510, C.gold, "none");
  slide.images.add({ blob: logoBytes, contentType: "image/png", alt: "UNREAL BS logo", fit: "contain", position: { left: 92, top: 62, width: 360, height: 145 } });
  textBox(slide, "সম্পূর্ণ ফিচার\nনলেজ বেস", 92, 226, 720, 170, 60, C.white, true);
  textBox(slide, "সাধারণ মানুষের ভাষায়—প্রতিটি ফিচার কী, কার জন্য, কীভাবে কাজ করে এবং এখন কোন অবস্থায় আছে", 94, 420, 740, 94, 23, C.muted);
  shape(slide, "roundRect", 94, 548, 486, 45, C.panel2, C.line);
  textBox(slide, "Investor • Operator • Sales • Support • Training", 116, 559, 444, 22, 15, C.gold, true);
  textBox(slide, "Repository-verified edition  •  August 2026", 94, 624, 500, 24, 14, C.muted);
  addNotes(slide, ["README.md", "ARCHITECTURE.md", "IMPLEMENTATION_STATUS.md", "public/logo.png"], "এই deck কোনো invented feature list নয়; repository ও takeover evidence থেকে তৈরি।");
}

function readingSlide(p, n) {
  const slide = p.slides.add(); slide.background.fill = C.bg;
  textBox(slide, "এই নলেজ বেস কীভাবে পড়বেন", 64, 48, 760, 54, 38, C.white, true);
  textBox(slide, "প্রতিটি ফিচারের একই পাঁচটি প্রশ্নের উত্তর আছে", 64, 108, 700, 34, 20, C.muted);
  const items = [
    ["১", "কী?", "ফিচারটি সহজ ভাষায় কী করে"], ["২", "কার জন্য?", "কে ব্যবহার করবে"],
    ["৩", "কীভাবে?", "চার ধাপের কাজের পথ"], ["৪", "উপকার", "ব্যবসায় কী ফল দেয়"],
    ["৫", "অবস্থা", "লাইভ, নিয়ন্ত্রিত, ডার্ক বা ভবিষ্যৎ"],
  ];
  items.forEach((it, i) => {
    const x = 64 + (i % 3) * 384, y = 188 + Math.floor(i / 3) * 190;
    shape(slide, "ellipse", x, y, 58, 58, i === 4 ? C.gold : C.violet, "none");
    textBox(slide, it[0], x, y + 10, 58, 36, 23, C.ink, true, "center", "middle");
    textBox(slide, it[1], x + 78, y, 250, 34, 22, C.white, true);
    textBox(slide, it[2], x + 78, y + 42, 270, 58, 17, C.muted);
  });
  addFooter(slide, n); addNotes(slide, ["IMPLEMENTATION_STATUS.md", "QA_REPORT.md"]);
}

function mapSlide(p, n) {
  const slide = p.slides.add(); slide.background.fill = C.bg;
  textBox(slide, "UNREAL BS আসলে কী?", 64, 46, 620, 52, 38, C.white, true);
  textBox(slide, "একটি business operating layer—যেখানে HighLevel-এর customer engine-এর সঙ্গে নিজস্ব money, AI, service, commerce ও safety capability যুক্ত।", 64, 105, 1120, 62, 20, C.muted);
  const nodes = [
    ["HighLevel", "CRM • Inbox • Pipeline • Funnels", 90, 238, C.violet],
    ["UNREAL BS", "Wallet • AI • Services • Control", 486, 190, C.gold],
    ["Supabase", "Data • Ledger • Audit • Commerce", 882, 238, C.cyan],
    ["মানুষের অনুমোদন", "Payment • Cards • Ads • Refund", 486, 438, C.green],
  ];
  shape(slide, "rightArrow", 344, 286, 164, 46, C.line, "none");
  shape(slide, "rightArrow", 772, 286, 164, 46, C.line, "none");
  shape(slide, "downArrow", 610, 350, 48, 112, C.line, "none");
  nodes.forEach(([t, d, x, y, a]) => {
    shape(slide, "roundRect", x, y, 308, 126, C.panel, a);
    textBox(slide, t, x + 22, y + 18, 264, 34, 24, a, true, "center");
    textBox(slide, d, x + 20, y + 68, 268, 42, 16, C.white, false, "center");
  });
  addFooter(slide, n); addNotes(slide, ["ARCHITECTURE.md", "README.md"]);
}

function sectionSlide(p, section, n) {
  const s = sections[section]; const slide = p.slides.add(); slide.background.fill = C.bg;
  shape(slide, "rect", 0, 0, 24, 720, s.accent, "none");
  textBox(slide, s.no, 82, 82, 220, 128, 92, s.accent, true);
  textBox(slide, s.title, 82, 260, 1040, 110, 48, C.white, true);
  textBox(slide, s.blurb, 84, 398, 890, 88, 24, C.muted);
  const count = features.filter((f) => f.section === section).length;
  shape(slide, "roundRect", 84, 548, 310, 50, C.panel2, s.accent);
  textBox(slide, `${count.toLocaleString("bn-BD")}টি বিস্তারিত ফিচার`, 104, 561, 270, 24, 17, C.white, true);
  addFooter(slide, n); addNotes(slide, ["ARCHITECTURE.md", "IMPLEMENTATION_STATUS.md"]);
}

function featureSlide(p, f, n) {
  const sec = sections[f.section]; const slide = p.slides.add(); slide.background.fill = C.bg;
  shape(slide, "rect", 0, 0, 14, 720, sec.accent, "none");
  textBox(slide, `${sec.no}  •  ${sec.title}`, 64, 31, 820, 22, 12, sec.accent, true);
  textBox(slide, f.title, 64, 62, 820, 54, 35, C.white, true);
  addStatus(slide, f.status);

  textBox(slide, "সহজ ভাষায়", 64, 142, 190, 27, 17, sec.accent, true);
  textBox(slide, f.plain, 64, 178, 430, 198, 19, C.white);
  shape(slide, "roundRect", 64, 397, 430, 108, C.panel, C.line);
  textBox(slide, "কার জন্য", 84, 415, 100, 22, 14, C.muted, true);
  textBox(slide, f.who, 84, 447, 380, 38, 18, C.white, true);
  shape(slide, "roundRect", 64, 523, 430, 116, C.panel2, sec.accent);
  textBox(slide, "মূল উপকার", 84, 542, 120, 22, 14, sec.accent, true);
  textBox(slide, f.outcome, 84, 575, 380, 46, 18, C.white, true);

  textBox(slide, "কীভাবে কাজ করে", 548, 142, 250, 28, 17, sec.accent, true);
  const xs = [548, 716, 884, 1052];
  for (let i = 0; i < 3; i++) shape(slide, "rightArrow", xs[i] + 116, 214, 72, 28, C.line, "none");
  f.steps.forEach((st, i) => {
    shape(slide, "ellipse", xs[i], 194, 46, 46, sec.accent, "none");
    textBox(slide, String(i + 1).toLocaleString("bn-BD"), xs[i], 203, 46, 26, 18, C.ink, true, "center", "middle");
    textBox(slide, st, xs[i] - 4, 255, 154, 64, 16, C.white, true, "center");
  });

  textBox(slide, "মনে রাখুন", 548, 360, 180, 28, 17, sec.accent, true);
  f.remember.forEach((r, i) => {
    const y = 406 + i * 74;
    shape(slide, "ellipse", 552, y + 4, 22, 22, i === 2 ? C.gold : sec.accent, "none");
    textBox(slide, "✓", 552, y + 4, 22, 20, 13, C.ink, true, "center", "middle");
    textBox(slide, r, 590, y, 590, 36, 18, C.white, true);
    if (i < 2) shape(slide, "rect", 590, y + 48, 570, 1, C.line, "none");
  });
  addFooter(slide, n); addNotes(slide, f.sources, `Feature status: ${f.status}. Audience-facing summary; technical proof is in the cited repository files.`);
}

function statusSlide(p, n) {
  const slide = p.slides.add(); slide.background.fill = C.bg;
  textBox(slide, "বর্তমান launch অবস্থার সত্যচিত্র", 64, 46, 880, 52, 38, C.white, true);
  textBox(slide, "সব feature একই সঙ্গে public নয়—এটাই safe takeover-এর মূল নীতি।", 64, 108, 850, 34, 20, C.muted);
  const order = ["লাইভ", "নিয়ন্ত্রিত", "ডার্ক", "ব্লকড", "ভবিষ্যৎ"];
  const labels = {
    "লাইভ":"ব্যবহারযোগ্য connected flow", "নিয়ন্ত্রিত":"কিছু action operator বা trusted surface-এ",
    "ডার্ক":"code প্রস্তুত; public flag বন্ধ", "ব্লকড":"credential/approval/release gate বাকি", "ভবিষ্যৎ":"roadmap; completed feature নয়",
  };
  order.forEach((st, i) => {
    const y = 186 + i * 86, s = statusMap[st];
    shape(slide, "roundRect", 64, y, 232, 56, C.panel2, s.color);
    shape(slide, "ellipse", 84, y + 18, 18, 18, s.color, "none");
    textBox(slide, s.label, 120, y + 14, 150, 26, 18, C.white, true);
    textBox(slide, labels[st], 340, y + 13, 760, 30, 19, C.white);
  });
  shape(slide, "roundRect", 64, 626, 1120, 36, "#2A191B", C.red);
  textBox(slide, "বিজ্ঞাপন এখনো বন্ধ: production backup, paid/refund canary, Meta dedupe test এবং ২৪ ঘণ্টার soak gate পাস করতে হবে।", 84, 634, 1080, 20, 15, C.white, true);
  addFooter(slide, n); addNotes(slide, ["IMPLEMENTATION_STATUS.md", "QA_REPORT.md", "PRE_AD_LAUNCH_RUNBOOK.md"]);
}

function knowledgeSlide(p, n) {
  const slide = p.slides.add(); slide.background.fill = C.bg;
  textBox(slide, "এই deck-কে Knowledge Base হিসেবে ব্যবহার", 64, 46, 1020, 52, 38, C.white, true);
  textBox(slide, "একই verified feature truth—ভিন্ন audience-এর জন্য ভিন্নভাবে ব্যবহার করুন।", 64, 108, 930, 34, 20, C.muted);
  const rows = [
    ["Sales", "ফিচারের সহজ ভাষা + মূল উপকার", C.gold],
    ["Support", "চার ধাপের flow + মনে রাখুন", C.cyan],
    ["Training", "প্রতিটি slide = একটি lesson", C.violet],
    ["Investor", "platform map + capability/status truth", C.green],
    ["Operator", "status label + source note + runbook", C.red],
  ];
  rows.forEach((r, i) => {
    const y = 184 + i * 86;
    shape(slide, "roundRect", 64, y, 215, 56, C.panel2, r[2]);
    textBox(slide, r[0], 86, y + 13, 170, 28, 20, r[2], true);
    shape(slide, "rightArrow", 306, y + 12, 90, 32, C.line, "none");
    textBox(slide, r[1], 426, y + 12, 700, 32, 19, C.white, true);
  });
  addFooter(slide, n); addNotes(slide, ["README.md", "ARCHITECTURE.md", "IMPLEMENTATION_STATUS.md", "PRE_AD_LAUNCH_RUNBOOK.md"]);
}

function closingSlide(p, n) {
  const slide = p.slides.add(); slide.background.fill = C.bg;
  shape(slide, "ellipse", 820, -90, 580, 580, "#17102E", "none");
  shape(slide, "ellipse", 980, 420, 360, 360, "#0D2923", "none");
  textBox(slide, "একটি platform।\nপাঁচটি operating layer।\nএকটি verified truth.", 64, 96, 770, 220, 50, C.white, true);
  textBox(slide, "HighLevel customer engine + UNREAL BS money, AI, services, commerce and safety controls", 66, 348, 690, 74, 23, C.muted);
  shape(slide, "roundRect", 66, 480, 640, 84, C.panel2, C.gold);
  textBox(slide, "পরবর্তী ধাপ", 88, 497, 140, 22, 14, C.gold, true);
  textBox(slide, "এই deck থেকে role-based SOP, FAQ ও onboarding lesson তৈরি করুন।", 88, 529, 584, 28, 19, C.white, true);
  textBox(slide, "unreal-bs.shop", 66, 620, 330, 28, 18, C.green, true);
  addFooter(slide, n); addNotes(slide, ["README.md", "ARCHITECTURE.md", "PRE_AD_LAUNCH_RUNBOOK.md"]);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(RENDERED, { recursive: true });
  const logo = await fs.readFile(path.join(ROOT, "public/logo.png"));
  const logoBytes = logo.buffer.slice(logo.byteOffset, logo.byteOffset + logo.byteLength);
  const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  let n = 1;
  coverSlide(p, logoBytes); n++;
  readingSlide(p, n++);
  mapSlide(p, n++);
  for (const section of Object.keys(sections)) {
    sectionSlide(p, section, n++);
    for (const f of features.filter((x) => x.section === section)) featureSlide(p, f, n++);
  }
  statusSlide(p, n++);
  knowledgeSlide(p, n++);
  closingSlide(p, n++);

  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(PPTX);
  console.log(JSON.stringify({ pptx: PPTX, slides: p.slides.items.length }));
}

export { C, sections, features, statusMap };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
