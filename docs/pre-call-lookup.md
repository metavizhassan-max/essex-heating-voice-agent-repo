# Pre-call lookup - the shared inbound webhook

What Olivia knows before she says a word, where it comes from, and what every variable is called.

Workflow `TIMKmtA5hS1Hbclk` · `POST /webhook/reid_precall` ·
[live backup](../functions/n8n/precall-TIMKmtA5hS1Hbclk.backup-2026-09-16.json) ·
[proposed](../functions/n8n/precall-TIMKmtA5hS1Hbclk.proposed.json)

---

## One workflow serves every agent

It is multi-tenant by construction and there is **no limit of two**. The chain resolves the client
from the call itself:

```
agent_id  --(datatable xQoeAdJAp7DTlnkc)-->  location_id
          --(datatable kCjYHcPq7VtcvoAl)-->  access_token
          --(GHL /locations/{id}/customFields)-->  the live field map
          --(GHL /contacts/search/duplicate)-->  the caller
```

Nothing in the workflow names a client. **Adding an agent is one datatable row** - never a new
workflow, never a per-client branch. Six agents are mapped today:

| Agent | Location |
|---|---|
| `agent_9556e6431bd8908e98ce6782ee` - Essex Heating | `VCFkxyU795AVyhNsQSkC` |
| `agent_84b6fb202e22f71e5ca5b27aa0` - Reid Energy | `MPAwPfhGDRu1D8bJaMgJ` |
| `agent_66875b6b8ddb3c269aa663674c` | `IlZXI8ZIa52DnRL8JSpu` |
| `agent_86c4055c0847d08ae9ad5789cd` | `jI9IslW7DnCUQPTaZff8` |
| `agent_8723481aabebe0f2c322b519cb` | `bOG5MiKlFULmPo7RZAy8` |
| `agent_eb9c14adf169c1fd4bdac9126d` | `vMH8pegQDIQrn6RAyuAS` |

Clone it only if a client needs different **logic**. Different values are what the datatables are
for. Per [SKILL.md 4.5](../SKILL.md), a per-client clone of a working multi-tenant workflow is the
thing to avoid.

> The webhook path is still `reid_precall` and the workflow was still named after Reid, which
> misleads everyone who opens it. The name is now `Voice pre-call lookup (shared - all agents)`.
> **Renaming the path would break every number pointed at it**, so that is a separate change:
> rename, then repoint Reid and Essex in the same sitting.

---

## Every filled custom field reaches the agent

`Build Result` reads the live GHL field map, walks the contact's custom fields, and **drops
anything empty** - `''`, `n/a`, `none`, `null`, `not established`, `-`. What survives goes out
three ways:

| Form | Example | Why it exists |
|---|---|---|
| `customer_<key>` | `customer_issue_reported` | The original shared convention. Reid's prompt depends on it |
| `<key>` | `issue_reported` | The bare key, so a GHL field lands under **the same name the post-call analysis field uses** |
| `known_details` | `Issue reported: boiler making a banging noise` | One block, `Label: value` per line, every filled field in it |

**`known_details` is the one that makes this work.** A Retell prompt can only read a variable it
names, and no prompt can name a custom field somebody adds next month. The roll-up means
everything the CRM holds reaches Olivia whether or not the prompt knows the key - which is exactly
the presence principle in [SKILL.md 1.5](../SKILL.md): a line that is there is a real answer,
anything absent is a question nobody has answered.

### Why the names match the analysis fields

A fact captured before the call and a fact extracted after it now carry **one name**:
`caller_full_name`, `caller_email`, `property_address`, `issue_reported`, `quote_form_status`.
The same string is the GHL field key, the pre-call dynamic variable, the post-call analysis field
and the notification merge tag. Nothing is remapped at any hop, so nothing can be remapped wrong -
which is the failure in [SKILL.md Part 3](../SKILL.md): *"agent re-asks what it just captured -
read and write pointed at different custom fields."*

A custom field can never shadow an identity variable; `RESERVED` in `Build Result` blocks that.
`property_address` is deliberately **not** reserved, because a GHL field of that name beats
`address1` and `postalCode` stitched together.

### What goes out on every call

Both conventions, always, as strings:

```
first_name          customer_name      customer_email     customer_phone
customer_tags       customer_address   customer_post_code property_address
caller_first_name   caller_full_name   caller_email       lead_tags
known_details       quote_form_status  from_number        current_datetime
```

plus `customer_<key>` and `<key>` for every filled custom field.

**Empty string, never an omitted key.** Retell leaves an unsent variable in the prompt as the
literal text `{{caller_first_name}}`, and the agent then reads the braces out to the caller. That
is why `Build Not Found` sends the identical key list on the failure paths - `agent_not_mapped`,
`no_token_for_location`, `no_caller_number` - and why `REQUIRED` in `Build Result` backfills any
key the merge did not produce. The two lists must stay identical.

`from_number` and `current_datetime` come from the call and the clock rather than the CRM, so they
are still true even when the lookup fails completely.

---

## Office hours are worked out by the agent, not the webhook

`office_status` was removed from `Build Result` on 16 September. Hours differ per client, so a
shared workflow deciding them is a per-client value in a multi-tenant file - the thing this design
exists to avoid. The webhook sends `current_datetime` (London) and each prompt works its own hours
out from it.

Olivia v2 does this in Objective 8 and defaults to **closed** when `current_datetime` is missing,
so she can never offer a transfer she cannot make. Note that `Extract Args` still computes a
Reid-shaped Mon-Fri 8-5 `office_status` that nothing reads - dead code, harmless, worth deleting
next time the file is open.

> **Essex's opening days are still unconfirmed.** The sheet and the transcript both say 8am to 5pm
> and neither says which days. The prompt deliberately states the hours with no days attached.

---

## Traps

- **A partial `PATCH` to the LLM wipes `general_tools`.** Sending only `general_prompt` to
  `update-retell-llm` left the LLM with `end_call` alone - `get_user` and `send_quote_link` were
  both silently dropped, HTTP 200, no warning. This is almost certainly how `get_user` went missing
  the first time while the build notes recorded it as pushed. **Always send `general_tools`
  alongside `general_prompt`, and read the tools back afterwards.**
- **Retell reads the response, not the status code.** Pre-call must answer
  `{ call_inbound: { dynamic_variables: {...} } }`. Any other shape is ignored without an error.
- **10 second budget, 3 retries.** Then Retell starts the call with no variables at all. Both
  GHL calls carry short timeouts and `onError: continueRegularOutput` for this reason.
- **`args.phone` is not the caller.** The number comes from `call_inbound.from_number`, off the
  phone network. A model-supplied number mis-hears digits or sends the literal `{{from_number}}`.
- **A withheld number is legitimate**, not an error - it arrives as `no_caller_number` and the
  agent treats them as a new caller.
