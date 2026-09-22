// Shared pre-call lookup. Serves every agent in datatable xQoeAdJAp7DTlnkc.
// Adding an agent is one datatable row - never a new workflow, never a per-client
// branch in this file.
//
// Pre-call must answer { call_inbound: { dynamic_variables: {...} } }. Retell
// ignores any other shape without raising an error.
//
// ---- ONE NAME PER FACT ----------------------------------------------------
// The GHL field key IS the variable name. No prefix, no renaming, no mapping
// table. A custom field with fieldKey `what_type_of_boiler_do_you_have` arrives
// in the prompt as {{what_type_of_boiler_do_you_have}}. Standard contact fields
// keep their GHL names: first_name, last_name, name, email, phone, address1,
// city, postal_code, tags.
//
// This is deliberate. The old build prefixed everything with customer_, which
// meant the same fact had one name in GHL, another in n8n and a third in the
// prompt - and every hop was somewhere it could be mapped wrong.

const cfg = $('Config OK?').first().json;
const raw = $input.first().json || {};

// /contacts/search/duplicate answers { contact: {...} }; a 404/401 arrives here
// as an { error: ... } object because onError is continueRegularOutput.
const c = raw.contact || (raw.id ? raw : null);
const lookup_failed = !!raw.error;

const name = c ? (c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || '') : '';
const first_name = c ? String(c.firstName || String(name).split(' ')[0] || '').trim() : '';
const last_name = c ? String(c.lastName || '').trim() : '';
const email = c ? (c.email || '') : '';
const phone = c ? (c.phone || '') : '';
const city = c ? (c.city || '') : '';
const tags = c ? (c.tags || []).join(', ') : '';

// Address and postcode are STANDARD contact fields, not custom ones, so they
// never appear in the customFields loop below.
let address1 = c ? (c.address1 || '') : '';
let postal_code = c ? (c.postalCode || '') : '';
const reason = c ? 'ok' : (lookup_failed ? 'lookup_failed' : 'not_found');

// ---- custom fields, named from the live GHL field map ---------------------
// Fully generic, no per-client configuration. Every FILLED contact custom field
// goes out twice:
//
//   <fieldKey>      the exact GHL key, so the prompt can name it directly
//   known_details   one readable block, "Label: value" per line
//
// known_details is what makes this work. A prompt can only read a variable it
// names, and no prompt can name a form field somebody adds next month. The
// roll-up carries everything the CRM holds whether the prompt knows the key or
// not - the presence principle: a line that is there is a real answer, anything
// absent is a question nobody has answered.
//
// Empty values are dropped. Sending "" would make an unanswered question look
// answered, and the agent would skip asking it.
const NULLISH = new Set(['', 'n/a', 'na', 'none', 'null', 'undefined', 'not applicable',
                         'not mentioned', 'not established', '-', '--']);

// ---- NEVER feed the agent its own previous output -------------------------
// Post-call analysis writes call_outcome, call_summery, caller_type and the rest
// back into contact custom fields. Those are fields like any other, so without
// this guard the pre-call lookup harvests them and hands the agent a summary of
// its OWN last call as if a customer had said it. It compounds every call.
//
// These keys are excluded from known_details and from the per-field variables.
// Anything genuinely useful here (postcode, property address) already ships as
// its own standard variable, so nothing is lost.
const AGENT_OUTPUT = new Set([
  'call_outcome', 'caller_type', 'service_and_job_type',
  'call_summery', 'call_summary', 'conversation_summary',
  'next_action', 'callback_number', 'issue_reported',
  'ai_new_boiler_quote_form', 'is_emergency', 'emergency',
  'bot_automate', 'message_history',
]);
// Belt and braces: anything whose key looks like agent bookkeeping rather than a
// customer answer.
const AGENT_OUTPUT_RX = /^(ai_|voice_)|_summary$|_summery$|call_outcome|next_action|bot_automate/i;
const fields = {};    // fieldKey -> value
const labelled = [];  // "Label: value"

try {
  const fm = $('Fetch Field Map').first().json || {};
  const metaById = {};
  (fm.customFields || []).forEach(function (f) {
    if (f.model && f.model !== 'contact') return;      // skip opportunity fields
    if (!f.id || !f.fieldKey) return;
    metaById[f.id] = {
      key: String(f.fieldKey).replace(/^contact[.]/, ''),
      label: String(f.name || f.fieldKey || '').trim(),
    };
  });
  (c ? (c.customFields || []) : []).forEach(function (f) {
    const m = metaById[f.id];
    if (!m) return;
    let v = f.value;
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v = v.join(', ');
    const str = String(v).trim();
    if (NULLISH.has(str.toLowerCase())) return;
    if (AGENT_OUTPUT.has(m.key) || AGENT_OUTPUT_RX.test(m.key)) return;   // our own output
    fields[m.key] = str;
    labelled.push((m.label || m.key) + ': ' + str);
  });
} catch (e) { /* no field map - standard fields still returned */ }

// A custom field must never shadow a standard one. property_address is the
// exception: a GHL field of that name beats address1 + postalCode stitched.
const RESERVED = new Set([
  'first_name', 'last_name', 'name', 'email', 'phone', 'address1', 'city',
  'postal_code', 'tags', 'known_details', 'from_number', 'current_datetime',
  'found', 'is_existing', 'contact_id', 'reason', 'phone_source',
]);
Object.keys(fields).forEach(function (k) { if (RESERVED.has(k)) delete fields[k]; });

const known_details = labelled.join('\n');

// ---- address fallback -----------------------------------------------------
// Some accounts capture the address in a custom field rather than the standard
// one. "email_address" is excluded deliberately: it matches /address/ and isn't one.
function firstMatch(rx, exclude) {
  const keys = Object.keys(fields).sort();          // stable, not hash order
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (exclude && exclude.test(k)) continue;
    if (rx.test(k) && String(fields[k]).trim()) return String(fields[k]).trim();
  }
  return '';
}
if (!address1)    address1    = firstMatch(/address|premises|property_location/, /email|ip_address/);
if (!postal_code) postal_code = firstMatch(/post_?code|postal/, null);

// Retell leaves an UNSENT variable in the prompt as the literal "{{first_name}}",
// which the agent then speaks to the caller. Every key a prompt may read must
// exist on EVERY call, as an empty string when we have nothing.
const REQUIRED = [
  'first_name', 'last_name', 'name', 'email', 'phone',
  'address1', 'city', 'postal_code', 'property_address', 'tags',
  'known_details', 'from_number', 'current_datetime',
];

function buildVars() {
  // Base first, harvested custom fields over the top, so a real CRM value always
  // beats an empty placeholder.
  const v = Object.assign({
    first_name: String(first_name),
    last_name: String(last_name),
    name: String(name),
    email: String(email),
    phone: String(phone),
    address1: String(address1),
    city: String(city),
    postal_code: String(postal_code),
    tags: String(tags),
    known_details: String(known_details),

    // From the call and the clock, not the CRM, so still true on every failure path.
    from_number: String(cfg.phone || ''),
    current_datetime: String(cfg.london_time || ''),
  }, fields);

  if (address1)    v.address1    = String(address1);
  if (postal_code) v.postal_code = String(postal_code);

  // The address and postcode as ONE string, because the agent reads it back as
  // one line: "so that's a hundred and twenty Mayes Road, N22 6XJ".
  if (!String(v.property_address || '').trim()) {
    v.property_address = [v.address1, v.postal_code]
      .filter(function (s) { return s && String(s).trim(); })
      .join(', ');
  }

  // Every dynamic variable must be a STRING. A null or a number makes Retell
  // drop the whole variable, and the prompt then speaks the literal "{{...}}".
  REQUIRED.forEach(function (k) { if (typeof v[k] !== 'string') v[k] = ''; });
  Object.keys(v).forEach(function (k) { v[k] = String(v[k] == null ? '' : v[k]); });
  return v;
}

if (cfg.is_precall) {
  return [{ json: {
    call_inbound: {
      dynamic_variables: buildVars(),
      metadata: {
        contact_id: String(c ? (c.id || '') : ''),
        lookup_reason: reason,
        london_time: String(cfg.london_time || ''),
        custom_fields_found: String(labelled.length),
      },
    },
  } }];
}

return [{ json: Object.assign({
  found: !!c, is_existing: !!c,
  contact_id: c ? (c.id || '') : '',
  reason: reason,
  phone_source: cfg.phone_source,
}, buildVars()) }];
