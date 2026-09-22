# Post-call analysis fields - Essex Heating Experts inbound ("Olivia")

Phase 3 of the build. These are the fields Retell extracts from the transcript after each call
and posts to the post-call webhook, which writes them into GoHighLevel and into the summary email
to `essexheatingexperts@outlook.com`.

## Rules these fields were designed under

- **Only fields with somewhere to go.** Every field below has either a GHL destination or a
  workflow condition that branches on it. Anything else is noise.
- **Every text field ends with the empty-not-placeholder instruction**, because the value is
  written straight into the CRM and shown in an email, so a placeholder reads as though the
  customer said it.
- **Service-line-neutral names.** `issue_reported`, not `boiler_issue` - the latter stays empty on
  an air conditioning or plumbing call and nothing gets written.
- **One enum carries the routing.** `service_and_job_type` combines service line and job type so a
  single GHL condition covers both, with fixed and exact vocabulary.
- **No duplication.** Two fields that capture the same sentence both get the same sentence.

## Retell's own fields - do not recreate these

Retell already produces these on every call. There is no custom field for any of them.

| Retell field | Path on the webhook payload |
|---|---|
| Call summary | `call.call_analysis.call_summary` |
| Caller sentiment | `call.call_analysis.user_sentiment` |
| Call successful | `call.call_analysis.call_successful` |
| Voicemail detected | `call.call_analysis.in_voicemail` |
| Recording, transcript | `call.recording_url`, `call.transcript` |
| Why the call ended | `call.disconnection_reason` |
| The caller's number | `call.from_number` |

Everything below is at
`call.call_analysis.custom_analysis_data.<field_name>`.

---

## The fields

### Routing and outcome - these three drive every workflow branch

| # | Field | Type | Destination |
|---|---|---|---|
| 1 | `call_outcome` | enum | `Voice: Call Outcome` (new) - drives stage move, tags, which email template fires |
| 2 | `caller_type` | enum | `Voice: Caller Type` (new) - separates customers from spam, jobseekers and suppliers |
| 3 | `service_and_job_type` | enum | Existing service/enquiry-type field if one exists, else `Voice: Service And Job Type` (new) - picks the email template and the tag |

`call_outcome` choices. **This field definition is the only place the outcome vocabulary lives** -
the prompt used to carry a duplicate mapping table in Section 10 and it was removed, because the
analysis model reads this description rather than the prompt. A workflow matching these strings
must match them exactly:

```
Quote Link Sent
Details Taken For Callback
Emergency Escalated
Complaint Logged
Transferred To Team
Out Of Scope
Partnership Enquiry
Job Application
Spam Or Sales
Do Not Contact
Incomplete
```

`caller_type` choices, matching Section 5 of the prompt:

```
New Boiler Or Installation Enquiry
Boiler Repair Or Service
Emergency Or Gas Escape
Complaint
Existing Customer Query
Partnership Or Supplier
Job Application
Spam Or Scam
Out Of Scope Or Out Of Area
Not Established
```

`service_and_job_type` choices:

```
Boiler Installation
Boiler Repair
Boiler Service
Landlord Gas Safety Certificate
Central Heating
Power Flushing
Plumbing
Air Conditioning
Heat Pump Installation
Not Established
```

`Not Established` is the honest signal that a call went nowhere. It is not a failure state to
hide - a workflow should be able to see it and do nothing.

### Contact and location

| # | Field | Type | Destination |
|---|---|---|---|
| 4 | `caller_full_name` | string | Contact first/last name - **only if the contact name is currently empty** |
| 5 | `callback_number` | string | `Voice: Callback Number` (new). Only populated when it differs from the number they rang from |
| 6 | `caller_email` | string | Contact email - **only if empty** |
| 7 | `property_address` | string | Contact address fields - **only if empty** |
| 8 | `service_area_town_or_postcode` | string | `Voice: Town Or Postcode` (new) - the quick area check, populated even when there is no full address |
| 9 | `in_service_area` | enum `Yes` / `Possibly, Needs Checking` / `No` / `Not Established` | `Voice: In Service Area` (new) - `Possibly, Needs Checking` is the one the team must action |

### The job

| # | Field | Type | Destination |
|---|---|---|---|
| 10 | `issue_reported` | string | Existing free-text enquiry field - **only if empty** - else `Voice: Issue Reported` (new). Carries the fault on a repair call and the account of the complaint on a complaint call |
| 11 | `fuel_type` | enum `Gas` / `LPG` / `Oil` / `Not Established` | `Voice: Fuel Type` (new) - an `Oil` value means the job was declined |
| 12 | `appliance_make_and_model` | string | `Voice: Make And Model` (new) |
| 13 | `current_boiler_condition` | enum `Working Fine` / `Working But Unreliable` / `Not Working` / `No Boiler Yet` / `Not Established` | `Voice: Current Boiler Condition` (new) - installation calls only |
| 14 | `timeframe` | enum `As Soon As Possible` / `Within A Week` / `One To Two Months` / `Three Months Or More` / `Not Urgent` / `Not Established` | `Voice: Timeframe` (new) - the single best predictor of whether the lead is worth ringing first |
| 15 | `brand_requested` | string | `Voice: Brand Requested` (new) - matters because 0% finance is Worcester Bosch only |

### Quote form - the primary conversion path on this build

| # | Field | Type | Destination |
|---|---|---|---|
| 16 | `quote_form_status` | enum `Already Completed` / `Link Sent On Call` / `Caller Declined Link` / `Not Applicable` / `Not Established` | `Voice: Quote Form Status` (new) - drives the follow-up. `Caller Declined Link` is the one that needs a human call |
| 17 | `finance_interest` | boolean | `Voice: Asked About Finance` (new) - tags the lead for the finance conversation |

### Urgency and safety

| # | Field | Type | Destination |
|---|---|---|---|
| 18 | `urgency_level` | enum `Emergency` / `Urgent` / `Routine` / `Not Established` | `Voice: Urgency` (new) - `Emergency` fires the urgent email template immediately |
| 19 | `gas_safety_advice_given` | boolean | `Voice: Gas Safety Advice Given` (new) - a record that the national gas emergency number was given. Keep this; it is the one field that may matter after the fact |
| 20 | `vulnerable_person_flagged` | boolean | `Voice: Vulnerable Person` (new) - changes how the team prioritises |

### Follow-up handling

| # | Field | Type | Destination |
|---|---|---|---|
| 21 | `callback_requested` | boolean | Tag `voice callback requested`, and the stage move to `AI Inbound` |
| 22 | `callback_preference` | string | `Voice: Callback Preference` (new) - the day and rough time in the caller's own words. Deliberately free text, not a datetime, because the agent is only ever passing on a preference, never confirming one |
| 23 | `transfer_attempted` | boolean | `Voice: Transfer Attempted` (new) - shows whether the caller wanted a person and did not get one |
| 24 | `do_not_contact_requested` | boolean | Sets DND on the contact and applies tag `voice do not contact`. **The most important boolean here** |
| 25 | `out_of_scope_reason` | enum `Oil Fuelled` / `Service Not Offered` / `Outside Service Area` / `None` | `Voice: Out Of Scope Reason` (new) - stops declined enquiries sitting in a follow-up queue forever |
| 26 | `unanswered_question` | string | `Voice: Unanswered Question` (new) - what the caller asked that Olivia could not answer. Read this weekly; it is the list of things to add to the prompt |
| 27 | `next_action_for_team` | string | `Voice: Next Action` (new) - one line, top of the summary email |

---

## Considered and deliberately not created

| Not created | Why |
|---|---|
| `caller_sentiment` | Retell produces `user_sentiment` natively. A duplicate would disagree with it |
| `call_summary` | Retell produces it natively at `call_analysis.call_summary` |
| `complaint_details` | Would capture the same sentences as `issue_reported` on a complaint call. Folded in; `caller_type` and `call_outcome` say it is a complaint |
| `survey_booked`, `survey_datetime` | Olivia has no booking tool on this build. Fields with nothing to write them are dead fields |
| `boiler_issue`, `aircon_issue` | Service-line-specific names. `issue_reported` covers every line |
| `number_of_radiators`, `number_of_bathrooms`, `property_type` | The online quote form and the survey collect these properly. The prompt explicitly forbids Olivia asking |
| `is_existing_customer` | `get_user` already establishes it before the call, and `caller_type` carries it where it matters |

---

## What the fields do on arrival in GHL

The intake automation is built by the client in GHL. These are the four things about *these
fields* that bite when you wire them up - kept here because they are properties of the fields,
not of any one workflow.

**Retell fires the webhook three times per call** - `call_started`, `call_ended`, `call_analyzed`.
Only the third carries the analysis. The first step inside the automation must be:

> **If `event` is not `call_analyzed`, stop.**

Miss it and every call runs three times, and the first two branch on empty fields - which means an
emergency notification that fires with no address in it.

The agent's `webhook_url` currently points at:

```
https://services.leadconnectorhq.com/hooks/VCFkxyU795AVyhNsQSkC/webhook-trigger/lYauTL4F19y6nPhwFu0h
```

**Make the destination custom fields single-line text, not dropdowns.** If Retell ever writes a
value that is not in a GHL dropdown's option list, GHL drops it silently and you get an empty
field with no error. Text always lands.

**Empty is a real state, not an error.** Every string field is instructed to come back completely
empty rather than "unknown" or "n/a", so the conditions must treat empty as meaningful. Related:
**GHL writes merge values verbatim, including blanks** - a call that captured nothing will
overwrite good form data with empty strings unless the branch exits before the update step.

**Branch on the webhook payload, not on the contact fields you just wrote.** Same run, and it
avoids any question of whether the field has been re-read.

**GHL's inbound webhook trigger cannot map fields until it has seen a request.** Make a test call,
let it finish, wait a few seconds for the analysis to run, then use **Fetch Sample Request** in
the trigger and map from that.

---

## Text field instruction - appended to every string field

Every `string` field's description ends with this, verbatim:

> Leave this COMPLETELY EMPTY if it was not established on the call - do not write 'not
> mentioned', 'unknown', 'n/a' or any other placeholder. The value is written straight into the
> CRM and shown in an email, so a placeholder reads as though the customer said it.

---

## Before these fields go live

1. **Run the Phase 4a field audit.** Fill the Essex Heating Experts website quote form with test
   data, read the contact it creates, and map the real custom field names and keys. Every "only if
   empty" destination above needs a real field id. **Do not create a `Voice:` field where a form
   field already exists** - it splits the same fact across two fields and the team keeps looking
   at the empty one.
2. **Count fills per field** before writing to any existing field. A field with zero fills across
   all contacts is dead, and writing to it loses data.
3. **Never overwrite what the customer typed themselves.** The four "only if empty" fields above
   hold the customer's own words from the website form. Only fields describing *this call* -
   outcome, urgency, quote form status, next action - are safe to always overwrite.
4. **Namespace the tags.** A chatbot will be writing into the same sub-account. `voice callback
   requested` and `voice do not contact` cannot collide with a chat tag; `callback requested`
   can.

The machine-readable definitions are in
[post-call-analysis-fields.json](../functions/post-call-analysis-fields.json).
