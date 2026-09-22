# Notification templates - Essex Heating Experts inbound ("Olivia")

Built to the house format from the Valleys Gas Heating & Renewables build. Which template fires for
which call is in [notification-and-link-routing.md](notification-and-link-routing.md).

**The intake automation itself is built by the client in GHL** - these templates and that matrix
are the reference for it, not a build spec for us.

---

## Merge fields used

**Standard GHL contact fields** - `{{contact.name}}`, `{{contact.first_name}}`,
`{{contact.last_name}}`, `{{contact.phone}}`, `{{contact.email}}`, `{{contact.full_address}}`.

**Custom fields.** Keys below are the convention, not confirmed values - GHL generates the key from
the field name and strips the colon, so **check the real key on each field after you create it** and
correct these before you paste them in. A wrong key renders as blank, silently.

| Field | Merge tag |
|---|---|
| Voice: Call Outcome | `{{contact.voice_call_outcome}}` |
| Voice: Caller Type | `{{contact.voice_caller_type}}` |
| Voice: Service And Job Type | `{{contact.voice_service_type}}` |
| Voice: Callback Number | `{{contact.voice_callback_number}}` |
| Voice: Town Or Postcode | `{{contact.voice_town_or_postcode}}` |
| Voice: In Service Area | `{{contact.voice_in_service_area}}` |
| Voice: Issue Reported | `{{contact.voice_issue_reported}}` |
| Voice: Fuel Type | `{{contact.voice_fuel_type}}` |
| Voice: Make And Model | `{{contact.voice_make_and_model}}` |
| Voice: Current Boiler Condition | `{{contact.boiler_condition}}` |
| Voice: Timeframe | `{{contact.timeline}}` |
| Voice: Brand Requested | `{{contact.voice_brand_requested}}` |
| Voice: Quote Form Status | `{{contact.voice_quote_form_status}}` |
| Voice: Asked About Finance | `{{contact.voice_finance_interest}}` |
| Voice: Urgency | `{{contact.voice_urgency}}` |
| Voice: Gas Safety Advice Given | `{{contact.voice_gas_safety_advice}}` |
| Voice: Vulnerable Person | `{{contact.voice_vulnerable_person}}` |
| Voice: Callback Preference | `{{contact.voice_callback_preference}}` |
| Voice: Out Of Scope Reason | `{{contact.voice_out_of_scope_reason}}` |
| Voice: Unanswered Question | `{{contact.voice_unanswered_question}}` |
| Voice: Next Action | `{{contact.next_action}}` |

### Confirmed keys - use these, not the convention above

The client checked the real field keys in LeadsHub. Where a row below disagrees with the table
above, **the row below is right** and the convention key renders blank.

| Field | Real key | Convention key it replaces |
|---|---|---|
| Service and job type | `{{contact.service_and_job_type}}` | `voice_service_type` |
| Callback number | `{{contact.callback_number}}` | `voice_callback_number` |
| Property address | `{{contact.property_address}}` | `full_address` |
| Best time to call | `{{contact.preferred_timecallback}}` | `voice_callback_preference` |
| Issue reported | `{{contact.issue_reported}}` | `voice_issue_reported` |
| Fuel | `{{contact.type_of_fuel}}` | `voice_fuel_type` |
| Make and model | `{{contact.appliance_make}}` | `voice_make_and_model` |
| Timeframe / how soon | `{{contact.timeline}}` | `voice_timeframe` |
| Next action | `{{contact.next_action}}` | `voice_next_action` |
| Current boiler condition | `{{contact.boiler_condition}}` | `voice_boiler_condition` |

`{{contact.name}}`, `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.phone}}` and
`{{contact.email}}` are standard GHL fields and are correct everywhere.

**Templates 7 and 8 below use the confirmed keys. The rest of this file does not yet** - it still
carries the convention keys, and every one of those that appears in the left column above will
render as an empty line until it is swapped. The remaining fields used elsewhere in this file
(`voice_call_outcome`, `voice_caller_type`, `voice_town_or_postcode`, `voice_in_service_area`,
`voice_brand_requested`, `voice_quote_form_status`, `voice_finance_interest`, `voice_urgency`,
`voice_gas_safety_advice`, `voice_vulnerable_person`, `voice_callback_preference` on templates
other than 7 and 8, `voice_out_of_scope_reason` and `voice_unanswered_question`) have not been
checked against LeadsHub at all.

**Three fields do not exist on the agent yet** - `next_action`, `voice_gas_safety_advice` and
`voice_unanswered_question` come from post-call analysis fields that were never pushed to Retell.
The field key being right in LeadsHub does not help while nothing writes a value into it, so every
template that uses one renders a blank line until the analysis fields are added.

**Two blanks are normal, not bugs.** `Ring instead` is only populated when the caller gave a
different number to the one they rang from, and `Best time to call` only when they asked for one.
GHL renders an unset merge field as nothing, so the label sits there with empty space after it -
same as `Best time to call` does on the Valleys template. Leave it.

---

## 1. Emergency or gas escape

**Subject:** `URGENT - emergency call - {{contact.first_name}} {{contact.last_name}} - {{contact.voice_town_or_postcode}}`

```
{{contact.name}} rang with an emergency and Olivia took the details. Ring them back now.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Address:    {{contact.full_address}}

THE EMERGENCY

What has happened:  {{contact.voice_issue_reported}}

Gas safety advice given:  {{contact.voice_gas_safety_advice}}

Vulnerable person at the property:  {{contact.voice_vulnerable_person}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

Nothing else goes in this one. It has to read in three seconds on a phone screen.

---

## 2. Complaint

**Subject:** `Complaint - {{contact.first_name}} {{contact.last_name}} - needs a call today`

```
{{contact.name}} rang to complain and Olivia took their account of it. They have been told somebody will get back to them as soon as possible.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Address:    {{contact.full_address}}

WHAT THEY SAID

{{contact.voice_issue_reported}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

The account is in the caller's own words and is not summarised or softened. Read it as written.

---

## 3. New boiler - details taken, no link sent

**Subject:** `New boiler enquiry - {{contact.first_name}} {{contact.last_name}} - {{contact.voice_town_or_postcode}}`

```
{{contact.name}} rang about a new boiler. Olivia took the details and they are expecting a call back from the team.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Area:       {{contact.voice_town_or_postcode}}

Best time to call:  {{contact.voice_callback_preference}}

THE ENQUIRY

Current boiler:  {{contact.boiler_condition}}

How soon:  {{contact.timeline}}

Brand asked about:  {{contact.voice_brand_requested}}

Asked about finance:  {{contact.voice_finance_interest}}

Quote form:  {{contact.voice_quote_form_status}}

Next action:  {{contact.next_action}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

0% finance is Worcester Bosch only. If `Asked about finance` says yes and the brand is anything
else, that is a conversation to have carefully.

---

## 3a. New boiler installation - built on confirmed keys

One template for every new boiler call, using only keys confirmed in LeadsHub. Templates 3 to 6
split the same call by what happened with the quote link and still carry unconfirmed keys; use this
one until those are checked.

**Subject:** `New boiler - {{contact.first_name}} {{contact.last_name}} - {{contact.timeline}}`

```
{{contact.name}} rang about a {{contact.service_and_job_type}}. Olivia took the details and they are expecting a call back from the team.

CUSTOMER

Name: {{contact.first_name}} {{contact.last_name}}

Telephone: {{contact.phone}}

Ring instead: {{contact.callback_number}}

Email: {{contact.email}}

Address: {{contact.property_address}}

Best time to call: {{contact.preferred_timecallback}}

THE ENQUIRY

Current boiler: {{contact.boiler_condition}}

Fuel: {{contact.type_of_fuel}}

Make and model: {{contact.appliance_make}}

How soon: {{contact.timeline}}

Anything else they mentioned: {{contact.issue_reported}}

Next action: {{contact.next_action}}

CALL SUMMARY

{{contact.call_summery}}

Olivia gives the published starting figure and nothing else, so no price has been quoted on this call and no survey has been booked.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

**"How soon" is the triage line.** `As soon as possible` with `Not working` above it is a household
with no heating waiting on a quote, and it moves to the top of the callback list.

**Three lines are missing on purpose**, because their keys are not confirmed - quote form status,
brand asked about, and whether they asked about finance. Quote form status is the one worth adding
first: without it nobody knows whether the caller already has the link and a rough price, which
changes how the callback opens. Once the keys are read out of Settings, Custom Fields, add:

```
Quote form: {{contact.<quote form status key>}}

Brand asked about: {{contact.<brand key>}}

Asked about finance: {{contact.<finance key>}}
```

Zero percent finance is Worcester Bosch and air conditioning only. If the finance line ever says
yes against another brand, that is a conversation to have carefully.

---

## 4. New boiler - they turned the link down

**Subject:** `New boiler - {{contact.first_name}} {{contact.last_name}} declined the quote form - needs a call`

```
{{contact.name}} rang about a new boiler and did not want the online quote form. They would rather speak to somebody, so this one needs a phone call.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Area:       {{contact.voice_town_or_postcode}}

Best time to call:  {{contact.voice_callback_preference}}

THE ENQUIRY

Current boiler:  {{contact.boiler_condition}}

How soon:  {{contact.timeline}}

Brand asked about:  {{contact.voice_brand_requested}}

Asked about finance:  {{contact.voice_finance_interest}}

Olivia offered the form once and did not push it a second time, so nothing further has been sent to them.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 5. Quote link sent - no action needed

**Subject:** `Quote form link sent - {{contact.first_name}} {{contact.last_name}}`

```
{{contact.name}} rang about a new boiler and Olivia has texted them the online quote form. No action needed for now - they get their rough price and book their own survey from the results page.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Email:      {{contact.email}}

Area:       {{contact.voice_town_or_postcode}}

THE ENQUIRY

Current boiler:  {{contact.boiler_condition}}

How soon:  {{contact.timeline}}

Brand asked about:  {{contact.voice_brand_requested}}

Asked about finance:  {{contact.voice_finance_interest}}

If they have not filled the form in by tomorrow you will get a second email asking you to ring them.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 6. Quote form not completed after 24 hours

**Subject:** `Quote form not completed - {{contact.first_name}} {{contact.last_name}} - ring them`

```
{{contact.name}} was sent the online quote form yesterday and has not filled it in. They have had one reminder text and nothing further will be sent, so this one needs a phone call.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Email:      {{contact.email}}

Area:       {{contact.voice_town_or_postcode}}

THE ENQUIRY

Current boiler:  {{contact.boiler_condition}}

How soon:  {{contact.timeline}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 7. Boiler repair

Fires when `service_and_job_type` is `Boiler Repair`. Central heating faults and power flushing use
this same template - they are fault calls with the same shape.

**Subject:** `Boiler repair - {{contact.first_name}} {{contact.last_name}} - {{contact.timeline}}`

```
{{contact.name}} rang about a {{contact.service_and_job_type}} job. Olivia took the details and they are expecting a call back from the team.

CUSTOMER

Name: {{contact.first_name}} {{contact.last_name}}

Telephone: {{contact.phone}}

Ring instead: {{contact.callback_number}}

Email: {{contact.email}}

Address: {{contact.property_address}}

Best time to call: {{contact.preferred_timecallback}}

THE FAULT

The problem: {{contact.issue_reported}}

Fuel: {{contact.type_of_fuel}}

Make and model: {{contact.appliance_make}}

How soon: {{contact.timeline}}

Next action: {{contact.next_action}}

Olivia does not diagnose faults or quote for repairs, so nothing has been said to them about the cause or the cost.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

**The problem is in their words.** Olivia records the description the caller gave and never
interprets it, so "it's making a banging noise when the hot water goes on" is what you get, not a
diagnosis. Treat it as a symptom, not a fault code.

**Make and model is often blank.** Most callers do not know it and Olivia is told not to press for
it. A blank line there is normal.

---

## 8. Boiler service

Fires when `service_and_job_type` is `Boiler Service`. A landlord gas safety certificate uses this
same template - it is the same visit with a certificate at the end.

**Subject:** `Boiler service - {{contact.first_name}} {{contact.last_name}} - {{contact.timeline}}`

```
{{contact.name}} rang to arrange a {{contact.service_and_job_type}}. Olivia took the details and they are expecting a call back from the team.

CUSTOMER

Name: {{contact.first_name}} {{contact.last_name}}

Telephone: {{contact.phone}}

Ring instead: {{contact.callback_number}}

Email: {{contact.email}}

Best time to call: {{contact.preferred_timecallback}}

THE JOB

Property to visit: {{contact.property_address}}

Fuel: {{contact.type_of_fuel}}

Make and model: {{contact.appliance_make}}

How soon: {{contact.timeline}}

Anything else they mentioned: {{contact.issue_reported}}

Next action: {{contact.next_action}}

Nothing has been booked and no date or time has been given to them, so the appointment is settled on your call.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

**The address is under THE JOB here, not under CUSTOMER.** On a service - and on every landlord
certificate - the property being visited is often not where the caller lives. Keeping it beside the
job is what stops an engineer driving to the billing address.

**"Anything else they mentioned" is usually empty, and that is the point.** A service is a routine
booking with no fault attached. When something does appear there - a noise, a pressure drop, a
radiator that will not heat - the visit is a service *and* a fault, and it is worth allowing more
time before you set off.

---

## 9. Plumbing

**Subject:** `Plumbing - {{contact.first_name}} {{contact.last_name}} - {{contact.voice_town_or_postcode}}`

```
{{contact.name}} rang about a plumbing job. Olivia took the details and they are expecting a call back from the team.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Address:    {{contact.full_address}}

Best time to call:  {{contact.voice_callback_preference}}

THE JOB

The problem:  {{contact.voice_issue_reported}}

How soon:  {{contact.timeline}}

Next action:  {{contact.next_action}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 10. Air conditioning or heat pump

**Subject:** `{{contact.voice_service_type}} enquiry - {{contact.first_name}} {{contact.last_name}} - {{contact.voice_town_or_postcode}}`

```
{{contact.name}} rang about {{contact.voice_service_type}}. There is no online quote form for this one, so a phone call from the team is the only way it moves forward.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Address:    {{contact.full_address}}

Best time to call:  {{contact.voice_callback_preference}}

THE ENQUIRY

What they want:  {{contact.voice_issue_reported}}

Brand asked about:  {{contact.voice_brand_requested}}

How soon:  {{contact.timeline}}

Asked about finance:  {{contact.voice_finance_interest}}

Next action:  {{contact.next_action}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 11. Existing customer query

**Subject:** `Customer query - {{contact.first_name}} {{contact.last_name}}`

```
{{contact.name}} rang with a question about a job already in progress. Olivia cannot look anything up, so she took the question exactly as they asked it and told them the team would come back to them.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Best time to call:  {{contact.voice_callback_preference}}

THEIR QUESTION

{{contact.voice_issue_reported}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 12. Coverage check - possibly outside the area

**Subject:** `Confirm coverage - {{contact.first_name}} {{contact.last_name}} - {{contact.voice_town_or_postcode}}`

```
{{contact.name}} rang from {{contact.voice_town_or_postcode}}, which Olivia could not confirm is in the area. She did not turn them away and did not promise anything, so somebody needs to check the postcode and ring them either way.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Email:      {{contact.email}}

Address:    {{contact.full_address}}

THE ENQUIRY

What they want:  {{contact.voice_issue_reported}}

Service:  {{contact.voice_service_type}}

How soon:  {{contact.timeline}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 13. Wanted a person and did not get one

**Subject:** `Asked for a person - {{contact.first_name}} {{contact.last_name}} - ring back first`

```
{{contact.name}} asked to be put through to somebody and the call did not connect. Olivia took their details instead and told them somebody would get back to them. Ring this one before the rest of the list.

CUSTOMER

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Ring instead:  {{contact.voice_callback_number}}

Email:      {{contact.email}}

Best time to call:  {{contact.voice_callback_preference}}

WHAT IT IS ABOUT

{{contact.voice_issue_reported}}

Service:  {{contact.voice_service_type}}

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

---

## 13a. General query

The catch-all. It fires for any query that does not belong to a service line, and for calls that
produced no usable enquiry at all - a poor line, a caller who never explained what they wanted, a
drop-out mid-sentence. **Nothing else routes here.** If a call matches template 1 to 13, it uses
that one.

The wording stays neutral on purpose. The same email covers a genuine question and a call nobody
could make sense of, and "query" is true of both - telling the team a call was unintelligible puts
them off ringing back, which is the one thing this template exists to make them do.

**Subject:** `Query - {{contact.first_name}} {{contact.last_name}} - ring them back`

```
{{contact.name}} rang with a query that does not fit the usual service lines. Olivia took what details she could and they are expecting a call back from the team.

CUSTOMER

Name: {{contact.first_name}} {{contact.last_name}}

Telephone: {{contact.phone}}

Ring instead: {{contact.callback_number}}

Email: {{contact.email}}

Address: {{contact.property_address}}

Best time to call: {{contact.preferred_timecallback}}

THE JOB

What they wanted: {{contact.service_and_job_type}}

What they said: {{contact.issue_reported}}

Fuel: {{contact.type_of_fuel}}

Make and model: {{contact.appliance_make}}

How soon: {{contact.timeline}}

Next action: {{contact.next_action}}

CALL SUMMARY

{{contact.call_summary}}

Most of the lines above will be empty on this one, and that is the point - nothing was confirmed on the call. The summary is the only reliable account of what happened, so read it before you ring.

Their enquiry and a recording of the call have been saved to their contact record in LeadsHub.

Essex Heating Experts

Automated notification
```

**`{{contact.call_summary}}` is the one field on this template that has to work.** It is Retell's
own summary, at `call.call_analysis.call_summary` in the post-call payload - see
[post-call-analysis-fields.md](post-call-analysis-fields.md). The key above follows the client's naming
convention but has **not** been confirmed in LeadsHub. Two ways to fill it, in order of preference:

1. Map `call.call_analysis.call_summary` into a contact field and use that field's real key here.
2. If the email is sent from the same workflow the post-call webhook triggers, skip the field
   entirely and read the payload directly with
   `{{inboundWebhookRequest.call.call_analysis.call_summary}}`.

**Watch the spelling of the key.** GHL builds the key from the field *name*, so a field created as
"Call Summery" has the key `call_summery` and `{{contact.call_summary}}` renders blank against it -
and the reverse. Copy the key from Settings, Custom Fields rather than typing it.

**`call_summary` is not one of the 27 analysis fields.** Retell produces it natively, outside
`custom_analysis_data`, so a workflow that only maps
`call.call_analysis.custom_analysis_data.<field>` will never fill it no matter how the key is
spelled. It has to be mapped from `call.call_analysis.call_summary` specifically.

**This is the only template where empty fields are not a defect.** Everywhere else a blank line
means a broken merge key; here it means the caller never said. Do not chase them.

**One line worth adding later:** `unanswered_question` - the thing the caller asked that Olivia
could not answer - fits directly under `What they said` and is the single most useful field on an
"other query" call. It is one of the three analysis fields never pushed to Retell, so it would
render blank today.

---

## 14. Partnership or job application - daily digest

Not per call. One email a day, office address only, never Jamie's mobile.

**Subject:** `Voice agent - partnership and job enquiries - {{right_now.date}}`

```
These came in through Olivia since yesterday. Nobody is waiting on an urgent answer - they were all told it would be passed on.

{{! repeat per contact }}

Name:       {{contact.first_name}} {{contact.last_name}}

Telephone:  {{contact.phone}}

Email:      {{contact.email}}

What it is about:  {{contact.voice_issue_reported}}

Type:  {{contact.voice_caller_type}}

Essex Heating Experts

Automated notification
```

GHL will not loop contacts inside one email. Build this as a scheduled workflow that sends one
email per contact tagged since yesterday, or export the list - one email each is simpler and there
will not be many.

---

## 15. SMS to Jamie - emergencies only

The only thing that reaches a mobile. Keep it under 160 characters so it arrives as one message.

```
URGENT - {{contact.first_name}} {{contact.last_name}} rang with an emergency. {{contact.voice_town_or_postcode}}. Ring {{contact.phone}}. Details in LeadsHub.
```

And the complaint escalation, when the caller mentioned Gas Safe, Trading Standards, a solicitor,
an insurer or a chargeback:

```
Complaint from {{contact.first_name}} {{contact.last_name}} and they have mentioned taking it further. Ring {{contact.phone}} today. Details in LeadsHub.
```

---

## 16. Messages to the caller

Only two, and one of them is not signed off yet.

**Quote form reminder** - fires 24 hours after the link went out, only if the form is still not
completed. One reminder, then a person rings them.

```
Hi {{contact.first_name}}, Olivia from Essex Heating Experts here. Here's the boiler quote form again if you'd still like a rough price - it only takes a few minutes and you can book a free survey from the results. [LINK]
```

**"We've got your details"** - *recommended, needs Jamie's sign-off before you build it.* Not in
the original spec, and Olivia already says this out loud on the call.

```
Hi {{contact.first_name}}, thanks for calling Essex Heating Experts. We've got your details and one of the team will be in touch. No need to do anything.
```

Never send either of these to an emergency caller, a complaint, anyone marked do not contact, or
anyone who turned the link down.
