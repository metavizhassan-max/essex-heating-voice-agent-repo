# Notification and link routing - Essex Heating Experts inbound ("Olivia")

What the GHL workflows have to do with each call. Every condition below matches a post-call
analysis field from [post-call-analysis-fields.md](post-call-analysis-fields.md) - the strings are
exact and case sensitive, because that is what the enum writes into the field.

Three questions, answered separately:

1. **Does the team get notified?** - and how loudly.
2. **Does the caller get sent anything?**
3. **Does anything get booked?** - short answer, no, see the last section.

---

## 0. The suppression gate - build this first, put it in front of everything

Two conditions kill every customer-facing send, no exceptions, whatever else the call produced:

| Condition | Effect |
|---|---|
| `do_not_contact_requested` = `true` | Set DND on the contact, tag `voice do not contact`, **no SMS, no email, no nurture, ever.** No internal notification either beyond the record |
| `call_outcome` = `Spam Or Sales` | No notification, no customer message, no stage move. Tag and stop |

Build this as the first branch of every workflow rather than remembering it in each one. A quote
link texted to someone who asked not to be contacted is the single worst output this build can
produce.

Also silent, for a different reason: `call.call_analysis.in_voicemail` = `true`. The agent talked
to an answerphone. Nothing to notify, nobody to text.

---

## 1. Internal notification matrix

"Instant" means fire on the post-call webhook. "Digest" means collect and send once a day - these
are real but nobody needs to stop what they are doing.

| # | Fires when | Priority | Channel | Template |
|---|---|---|---|---|
| 1 | `call_outcome` = `Emergency Escalated` **or** `urgency_level` = `Emergency` | **Instant, highest** | SMS to Jamie **and** email to the office - both, and out of hours as well | Emergency |
| 2 | `call_outcome` = `Complaint Logged` | **Instant, high** | Email to the office, marked urgent. SMS to Jamie if `issue_reported` mentions Gas Safe, Trading Standards, a solicitor, an insurer or a chargeback | Complaint - **never** send the caller anything automated |
| 3 | `call_outcome` = `Details Taken For Callback` **and** `service_and_job_type` = `Boiler Installation` | Instant | Email to the office | New boiler lead |
| 4 | `call_outcome` = `Details Taken For Callback` **and** `service_and_job_type` in `Boiler Repair`, `Boiler Service`, `Landlord Gas Safety Certificate`, `Central Heating`, `Power Flushing`, `Plumbing` | Instant | Email to the office | Repair / service - one template per line, see below |
| 5 | `call_outcome` = `Details Taken For Callback` **and** `service_and_job_type` in `Air Conditioning`, `Heat Pump Installation` | Instant | Email to the office | AC / heat pump - **no quote form exists for these**, so the team calling is the only path |
| 6 | `call_outcome` = `Quote Link Sent` | Instant, low | Email to the office | Quote link sent - informational. The lead is working itself; the team only acts if the form is not completed, see row 12 |
| 7 | `quote_form_status` = `Caller Declined Link` | **Instant, high** | Email to the office, flagged "needs a call" | Declined the form - **this is the one that needs a human.** They want a new boiler and they want to talk to a person |
| 8 | `in_service_area` = `Possibly, Needs Checking` | Instant | Email to the office | Coverage check - the agent deliberately did not decline. Somebody has to confirm and ring back |
| 9 | `caller_type` = `Existing Customer Query` | Instant | Email to the office | Customer query - the agent could not look anything up, so this is pure message-taking |
| 10 | `transfer_attempted` = `true` **and** `call_outcome` is not `Transferred To Team` | Instant | Email to the office, flagged | Wanted a person, did not get one. Ring back first |
| 11 | `call_outcome` = `Partnership Enquiry` **or** `Job Application` | **Digest** | Office email only. **Never** Jamie's mobile | Partnership / Careers |
| 12 | `quote_form_status` = `Link Sent On Call` **and** the form is still not completed after 24 hours | Instant at the 24h mark | Email to the office | Form not completed - ring them |

**Escalate one level, whatever the row:** `vulnerable_person_flagged` = `true`. A vulnerable person
on a routine repair is not a routine repair.

**Silent - no notification at all:**

| Condition | Why |
|---|---|
| `call_outcome` = `Spam Or Sales` | Section 0 |
| `call_outcome` = `Do Not Contact` | Section 0 |
| `call_outcome` = `Out Of Scope` **and** `out_of_scope_reason` = `Oil Fuelled`, `Service Not Offered` or `Outside Service Area` | The agent already declined it on the call and explicitly did **not** offer a callback. A notification here creates a queue item nobody is allowed to action |
| `call_outcome` = `Transferred To Team` | A human took the call and knows what was said |
| `call_outcome` = `Incomplete` **and** no name and no number captured | Nothing to act on |

`call_outcome` = `Incomplete` **with** a name or a number is a judgement call - notify, low
priority, so somebody can decide whether to ring back. A dropped call from a real customer looks
exactly like this.

**One template per service line, not one generic template.** The person reading it needs different
facts each time:

| Line | The fields that matter in the body |
|---|---|
| Boiler Installation | `current_boiler_condition`, `timeframe`, `brand_requested`, `finance_interest`, `quote_form_status`, `service_area_town_or_postcode` |
| Boiler Repair / Central Heating / Power Flushing | `issue_reported`, `fuel_type`, `appliance_make_and_model`, `timeframe`, `property_address` |
| Boiler Service / Landlord Gas Safety Certificate | `property_address` - often not their own home - `fuel_type`, `appliance_make_and_model`, `timeframe` |
| Plumbing | `issue_reported`, `property_address`, `timeframe` |
| Air Conditioning / Heat Pump | `issue_reported`, `property_address`, `timeframe`, `brand_requested` |
| Emergency | `issue_reported`, `property_address`, `callback_number`, `gas_safety_advice_given`, `vulnerable_person_flagged` - and nothing else, so it reads in three seconds |
| Complaint | `issue_reported` **verbatim**, `property_address`, `callback_number` |

Every template carries `next_action_for_team` as the first line and `callback_preference` where it
is populated, plus Retell's own `call_summary` and `recording_url` at the bottom.

---

## 2. What gets sent to the caller

### The quote form link - sent during the call, not by GHL

The link goes out **mid-call** from the n8n `send_quote_link` workflow, the moment the caller
agrees. GHL does not send it. See [functions.md](functions.md).

It is sent **only** when all of these are true:

- `caller_type` = `New Boiler Or Installation Enquiry`, that is a new boiler or a replacement
- the caller **explicitly agreed** to be texted it - the agent asks, it never assumes
- `quote_form_status` is not `Already Completed`

It is **never** sent for a repair, a service, a landlord gas safety certificate, a power flush,
central heating, plumbing, air conditioning or a heat pump. There is no quote form for those jobs
and one does not get invented.

That workflow writes `quote_form_status = Link Sent On Call` and applies tag `voice quote link
sent` itself rather than waiting for post-call analysis, because a caller who hangs up immediately
may never trigger the analysis.

### Everything GHL sends afterwards

| Send | Fires when | Notes |
|---|---|---|
| **One** quote form reminder SMS | `quote_form_status` = `Link Sent On Call` and not completed after 24h | One reminder, then stop and let the team ring - notification 12 |
| Nothing | `quote_form_status` = `Caller Declined Link` | They said no and the agent was instructed not to ask twice. Texting it anyway overrides the caller. **A person rings them** |
| Nothing | `quote_form_status` = `Already Completed` | They have already been through it |
| Nothing | `caller_type` = `Emergency Or Gas Escape` | They need a phone call, not an automated text. An auto-reply on an emergency reads as being fobbed off |
| Nothing | `caller_type` = `Complaint` | Same, more so |
| Nothing | `call_outcome` = `Out Of Scope`, `Spam Or Sales`, `Do Not Contact`, `Partnership Enquiry` or `Job Application` | |

**Recommended, needs Jamie's sign-off:** a short "we've got your details, one of the team will be
in touch" SMS on `call_outcome` = `Details Taken For Callback` where `caller_type` is
`New Boiler Or Installation Enquiry`, `Boiler Repair Or Service` or `Existing Customer Query`. It
is not in the spec and it is not in the prompt - the agent already tells them this out loud - so it
is an addition, not a gap.

---

## 3. Booking - there is none, and that is deliberate

**No GHL booking workflow is triggered by this agent.** Olivia has no calendar and no booking tool,
and Section 8 of the prompt states that in the negative so the model does not invent one.

The agreed flow from the onboarding call: the caller gets the quote form link, gets a rough price,
and **books their own free survey from the results page**. Jamie's concern was turning up to
surveys for people who only wanted a ballpark figure. Anyone who will not use the form goes to
Jamie for a call, which is notification 7 above.

So the only booking on this build happens on the website, by the customer, after the call has
ended. The three LeadsHub calendars - `BOOK YOUR FREE BOILER SURVEY`, `BOOK A BOILER REPAIR
ONLINE`, `BOOK YOUR BOILER INSTALLATION` - stay untouched by the voice agent.

**Confirm this with Jamie in one line before go-live.** Row B63 of the requirement sheet still
names the survey calendar against the new boiler objective; that row predates the decision made
later in the same call. If he does want booking on the call it is a prompt and tool change, not a
workflow change - see the bottom of [functions.md](functions.md).

---

## 4. Tags and stage moves, for completeness

| Condition | Action |
|---|---|
| `callback_requested` = `true` | Tag `voice callback requested`, move to stage **AI Inbound** |
| `quote_form_status` = `Link Sent On Call` | Tag `voice quote link sent` - written by n8n during the call |
| `do_not_contact_requested` = `true` | Set DND, tag `voice do not contact` |
| `finance_interest` = `true` | Tag for the finance conversation. 0% is **Worcester Bosch only** - the team must not be prompted to offer it on a Vaillant |
| `unanswered_question` non-empty | No notification. Collect into a weekly digest for the build team - it is the list of things to add to the prompt |

Namespace every tag with `voice`. A chatbot is writing into the same sub-account and
`callback requested` on its own will collide.

---

## Decisions still needed

1. **Confirm no booking on the call** - the stale sheet row above.
2. **Jamie's mobile in E.164** - notification 1 sends him an SMS, and `transfer_call` cannot be
   created without it either.
3. **The 24 hour window** in notification 12 and the reminder SMS - a sensible default, not
   something the client specified.
4. **Whether the "we've got your details" SMS is wanted at all** - Section 2.
5. **Which days the 8am to 5pm hours apply to** - this gates whether an out-of-hours notification
   is even out of hours.
