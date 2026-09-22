# Functions - Essex Heating Experts inbound ("Olivia")

Three tools total. Two custom functions served by n8n, one Retell built-in. The machine-readable
definitions are in [functions/retell-tools.json](../functions/retell-tools.json) and go on the
**LLM object**, not the agent.

The design principle: **the fewer tools the better.** A tool the agent can misuse mid-call is a
liability, and every one of these earns its place. This build has no booking tool at all, which
is a deliberate decision explained at the bottom.

| # | Tool | Type | Backing |
|---|---|---|---|
| 1 | `get_user` | custom function | n8n `POST /webhook/get_user` - workflow `RBQrF1xqttl8QNDN`, already built and multi-tenant |
| 2 | `send_quote_link` | custom function | n8n - **new workflow, needs building** |
| 3 | `transfer_call` | Retell built-in | Jamie Whybrow's mobile - **number still needed** |

Plus Retell's `end_call`, which is implicit and needs no definition.

---

## 1. `get_user` - the pre-call lookup

Already exists. Add the agent to the datatable and point the function at the existing webhook -
do **not** clone the workflow.

```
POST https://n8nserver.webuildtrades.com/webhook/get_user
```

**What it does.** Resolves the GHL location from `agent_id` via datatable `xQoeAdJAp7DTlnkc`,
gets the location token from `kCjYHcPq7VtcvoAl`, searches GHL for a contact on the caller's
number, and returns:

```json
{ "found": true, "contact_id": "...", "name": "...", "email": "...", "tags": "..." }
```

**Two changes to make for this build**

1. **Read `body.call.from_number`, not `body.args.phone`.** The existing workflow takes the number
   from the arguments, which means the language model has to supply it and can get it wrong. On an
   inbound call `from_number` *is* the caller, so reading it from the call object removes the
   guesswork entirely. This is why the function below is declared with **no parameters**.
2. **Return `quote_form_status`.** Whether this contact has already completed the website boiler
   quote form is the single most useful thing the agent can know before it speaks, because it
   decides whether Parent Objective 3 offers the form or skips it. The field name comes out of the
   Phase 4a audit.

**Configuration**

- `speak_during_execution: false` - the agent must not narrate a lookup.
- `speak_after_execution: false` - it uses the result silently.
- `timeout_ms: 8000` - short. A slow lookup must not delay the greeting.

**Prerequisite:** the row mapping `agent_9556e6431bd8908e98ce6782ee` to the Essex Heating Experts
location must be added to `xQoeAdJAp7DTlnkc` **by hand**. Nothing works until it is there.

---

## 2. `send_quote_link` - the primary conversion path

This is the workflow that makes this build work the way Jamie asked for on the onboarding call.
It does not exist yet.

```
POST https://n8nserver.webuildtrades.com/webhook/essex-send-quote-link
```

**What it does.** Texts the caller the link to the Essex Heating Experts online boiler quote form,
where they get a rough price and can pick their own free survey slot from the results page.

**Suggested node chain**, following the house pattern:

```
Webhook -> Extract Args -> Agent (datatable) -> Location -> Token
        -> Find Contact -> Contact Exists? -> Create Contact
        -> Send SMS (GHL conversations)
        -> Tag + Field Update -> Respond to Retell
```

**Points that matter**

- **Fall back to `body.call.from_number`** if the model does not supply a mobile number. Same
  reasoning as `get_user`.
- **Normalise to E.164** before sending - `07...` to `+447...`.
- **Create the contact if it does not exist.** A first-time caller with no CRM record must still
  get the link.
- **Write `quote_form_status = Link Sent On Call`** and apply tag `voice quote link sent` from
  inside this workflow, not only from post-call analysis. If the caller hangs up straight after,
  the post-call analysis may never run, and the team still needs to know the link went out.
- **Return a plain success or failure**, nothing the agent could read aloud by accident.

**Configuration**

- `speak_during_execution: true` - the SMS send takes a moment and the caller should hear
  something rather than silence. Message: *"Just getting that sent over to you now."*
- `speak_after_execution: false` - the prompt already governs what the agent says next.
- `timeout_ms: 12000`.

**Still needed from the client:** the exact URL of the online quote form. Hardcode it in the n8n
workflow, not in the prompt - the agent texts it and never reads it out, so it never needs to be
a prompt variable, and it can be changed without touching the agent.

---

## 3. `transfer_call` - Retell built-in

```
transfer_destination: { type: "predefined", number: "<Jamie Whybrow's mobile, E.164>" }
transfer_option:      { type: "cold_transfer", show_transferee_as_caller: false }
```

**Cold transfer, not warm.** Jamie is the only destination and there is no reception desk to brief
him, so a warm transfer would just add a delay the caller sits through.

`show_transferee_as_caller: false` so Jamie's phone shows the business number and he knows the
call came through the system rather than looking like an unknown mobile.

**Guarded to office hours in the prompt.** Parent Objective 8 forbids attempting a transfer
outside eight to five. This matters because the LeadsHub setup already rings staff for fifteen
seconds before Olivia picks up - so if Olivia is on the call, Jamie has *already* not answered
once. Transferring back to the same phone out of hours would ring out a second time and lose the
caller. Out of hours the agent takes the details instead, which is exactly what Jamie asked for.

**Still needed from the client:** Jamie's mobile number in E.164. Without it this tool cannot be
created, and Parent Objective 8 falls back to taking details on every call - which works, it is
just not what was agreed.

---

## Deliberately not built: booking

Olivia has **no calendar and no booking tool**, and Section 8 of the prompt declares that in the
negative because Retell agents will otherwise invent the capability.

That is what Jamie settled on during the onboarding call. His concern was turning up to home
surveys for people who only wanted a rough idea of price, so the agreed flow became: offer the
online quote form, the customer gets their rough price, and the customer books their own survey
from the results page. If they will not use the form, the details go to the team and Jamie rings
them himself.

The Essex Heating Experts LeadsHub account does have calendars - `BOOK YOUR FREE BOILER SURVEY`
at one hour, `BOOK A BOILER REPAIR ONLINE` at thirty minutes, and `BOOK YOUR BOILER INSTALLATION`
at eight hours - and the requirement sheet still lists the survey calendar against the new boiler
objective. **That row is stale**; it predates the decision made later in the same call. Worth
confirming with Jamie in one line before go-live.

**If he does want booking on the call**, the work is: build the booking workflow from the pattern
in Part 4.4 with all five actions (`check_user_details`, `check_availability`, `book`,
`reschedule`, `cancel`), add `check_availability` and `book` as custom functions, replace the
"What you cannot do" block in Section 8 with the booking tool rules, and add
`survey_booked` / `survey_datetime` analysis fields plus the stage move to `Survey Booked
(Home/Video)`. The prompt is structured so that is a change to Parent Objective 3 and Section 8
only.
