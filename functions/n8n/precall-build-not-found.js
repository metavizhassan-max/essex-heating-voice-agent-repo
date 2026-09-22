// Retell waits on this HTTP response. If the workflow ends without one, the
// pre-call webhook retries 3x and then starts the call with NO variables at all
// - and the agent then speaks the literal "{{first_name}}" to the caller. So a
// config problem must still answer, as an unknown caller, which is a state every
// prompt already handles.
//
// This key list must stay identical to REQUIRED in Build Result. Empty strings,
// never omitted keys - an omitted key is what leaks braces onto a live call.

const cfg = $input.first().json || {};

const EMPTY = {
  first_name: '',
  last_name: '',
  name: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  postal_code: '',
  property_address: '',
  tags: '',
  known_details: '',

  // Still true even with no CRM: these come from the call and the clock.
  from_number: String(cfg.phone || ''),
  current_datetime: String(cfg.london_time || ''),
};

if (cfg.is_precall) {
  return [{ json: {
    call_inbound: {
      dynamic_variables: EMPTY,
      metadata: {
        contact_id: '',
        lookup_reason: cfg.reason || 'config_error',
        london_time: String(cfg.london_time || ''),
        custom_fields_found: '0',
      },
    },
  } }];
}

return [{ json: Object.assign({
  found: false, is_existing: false,
  contact_id: '',
  reason: cfg.reason || 'config_error',
  phone_source: cfg.phone_source || 'none',
}, EMPTY) }];
