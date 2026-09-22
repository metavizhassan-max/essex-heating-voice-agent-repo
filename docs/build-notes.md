# Build notes - Essex Heating Experts inbound ("Olivia")

## Where the spec came from

| Source | Used for |
|---|---|
| `Template Bot and voiceagents Objectives for All Industries.xlsx`, sheet **Essex Heating Experts** | Services, areas, brands, prices, finance, hours, stages, email, caller handling |
| `meeting transcription.txt` - Jamie Whybrow onboarding, 8 September | The decisions that changed during the call, and the intent behind them |

**Where the two disagree, the transcript wins**, because it is the later conversation and it is
where Jamie changed his mind. Two places that matters:

1. **Booking.** Sheet row B63 still names `BOOK YOUR FREE BOILER SURVEY` as the action on a new
   boiler enquiry. At 27:50 to 33:20 in the transcript Jamie moved off that: he does not want
   surveys booked for people who only want a rough price. The agreed flow is the online quote form
   first, the customer books their own survey from the results page, and anyone who will not use
   the form goes to Jamie for a call. The row's own objective text was updated to that wording -
   only the calendar in column C is left over. **Built to the transcript. Worth confirming in one
   line.**
2. **Air conditioning and heat pumps.** At 11:09 Zain removed air conditioning from the *chatbot*
   question set because the funnel is boilers only. Jamie confirmed at 11:20 that the business does
   do both. So they are in scope as services Olivia can talk about and capture, but they get no
   quote form and no booking - details go to the team.

## Agent config - pushed

The agent `agent_9556e6431bd8908e98ce6782ee` shipped on Retell's defaults, which are American and
would have broken things on a live UK call. It is now configured for a UK business on an
ElevenLabs voice.

**Voice: `custom_voice_98809374398e80f9c864a0b0bd` - "Lucy - Fresh & Casual" - on
`eleven_flash_v2_5`.** A custom ElevenLabs voice added to the Retell account and chosen by the
client over the stock options. It replaced `11labs-Willa`, which was the pick while the choice was
limited to Retell's stock British female voices (Dorothy, Amy and Maren, the other British options,
all read young). Voice is a one-field change, so this can be swapped again without touching
anything else.

**Audio tags were removed, deliberately.** The first build used `eleven_v3`, which is what audio
tags require, and the prompt carried a tag block plus `[slow]` on the gas emergency number and
`[serious]` on a complaint. The first test call was slow, so the voice model moved to
`eleven_flash_v2_5` - the low-latency model in the same family - and **every tag had to come out of
the prompt in the same change**, because on any model but `eleven_v3` the agent reads the bracket
out loud. Section 2 now carries the opposite instruction: no tags exist, never write one, convey
delivery through wording and pacing. The delivery matrix is untouched and still does most of the
work.

> **If anyone puts `eleven_v3` back**, the tag block has to go back into Section 2 at the same
> time, or the expressive delivery is simply unavailable. The two settings are one decision, not
> two.

> **Correction to the skill doc.** The WBT skill says to set `fallback_voice_ids` to "one
> same-provider voice". Retell rejects that outright: `Cannot have main voice and fallback voices
> from the same provider.` The fallback must be a **different** provider, so it is set to
> `cartesia-Willa`. That was chosen when the main voice was `11labs-Willa`, to keep the same voice
> identity across an ElevenLabs outage; now that the main voice is the custom "Lucy" it is simply a
> British female stand-in on another provider, and it still satisfies Retell's rule.

**`pronunciation_dictionary` is deliberately still unset.** It needs IPA or CMU phonemes, and
guessing them for `Vaillant`, `Baxi` and `Billericay` would be inventing setting values. The
26 `boosted_keywords` cover the speech-to-text side, which is the half that actually fumbles
trade vocabulary. Set the dictionary after listening to a test call and hearing which words the
agent actually gets wrong.

| Setting | Was | Now | Why |
|---|---|---|---|
| `voice_id` | `retell-Cimo`|**`custom_voice_98809374398e80f9c864a0b0bd`** ("Lucy - Fresh & Casual") - pushed|Custom ElevenLabs voice picked by the client; replaced `11labs-Willa`. Audio tags would need `eleven_v3`, which was rejected on latency - see above |
| `voice_model` | unset|**`eleven_flash_v2_5`** - pushed|Low-latency ElevenLabs model. `eleven_v3` was tried first for audio tags and was too slow on a test call |
| `language` | `en-US`|**`en-GB`** - pushed|UK caller, UK vocabulary, UK number recognition |
| `timezone` | `America/Los_Angeles`|**`Europe/London`** - pushed|Every timestamp on every call record was eight hours out |
| `max_call_duration_ms` | `3600000`|**`600000`** - pushed|An hour was the default. Ten minutes stops a stuck call burning credit |
| `interruption_sensitivity` | `0.9`|**`0.3`** - pushed|High values let background noise stop the agent mid-sentence. Callers ring from cars and building sites |
| `voice_speed` | unset|**`0.9`** - pushed|Slightly slower reads as calmer and more competent |
| `voice_temperature` | unset|**`1.1`** - pushed|Some delivery variation between calls |
| `enable_backchannel` | unset | **pushed** with `0.7` and `["mm-hm","right","okay","I see"]` | UK backchannel words, not "uh-huh" |
| `responsiveness` | unset|**`0.8`** - pushed| |
| `stt_mode` | unset|**`accurate`** - pushed|Trade vocabulary is exactly what general speech-to-text fumbles |
| `boosted_keywords` | unset | **26 keywords pushed** - `combi, flue, LPG, power flush, Worcester Bosch, Vaillant, Glow-worm, Baxi, Daikin, Billericay, Wickford, Rayleigh, Stanford-le-Hope, Benfleet, Canvey Island, Rochford, Essex Heating Experts` | |
| `pronunciation_dictionary` | unset | **still unset, see above** - `Olivia`, `Glow-worm`, `Baxi`, `Vaillant`, `Daikin`, `Billericay`, `Rayleigh`, `Stanford-le-Hope`, `Canvey`, `Rochford` | Native fix, more reliable than a prompt instruction |
| `begin_message_delay_ms` | unset|**`700`** - pushed|Stops the agent talking over "hello" |
| `end_call_after_silence_ms` | unset|**`20000`** - pushed| |
| `reminder_trigger_ms` / `reminder_max_count` | unset | **`9000` / `1`** - pushed | One nudge, not three |
| `post_call_analysis_model` | `gpt-4.1` | fine as is | |

**On the LLM object** (`llm_28a152a3544f44d8425688bd17de`):

| Setting | Was | Now | Why |
|---|---|---|---|
| `start_speaker` | `user` | **`agent`** - pushed | See the silent-agent section below |
| `begin_message` | `""` | **not set** - pushed | An empty string is not the same as unset. See below |
| `model` | `gpt-5.2` | **`gpt-4.1-mini`** - pushed | A reasoning-class model spends time thinking before the first token, which on a phone call is dead air. This prompt is instruction-following work - the objectives do the thinking |
| `model_high_priority` | `false` | **`true`** - pushed | Docs: "will use high priority pool with more dedicated resource to ensure lower and more consistent latency" |

## The agent was silent on the first test call

Not a TTS fault. The LLM object shipped with `start_speaker: 'user'` and `begin_message: ''`, and
the Retell docs are explicit about what that means:

> "First utterance said by the agent in the call. If not set, LLM will dynamically generate a
> message. **If set to `""`, agent will wait for user to speak first.**"

...and with no `begin_after_user_silence_ms` set, the agent "will wait indefinitely for the user to
speak". So Olivia was waiting for the caller, forever.

**`""` is not the same as unset.** An earlier version of these notes said to "leave `begin_message`
unset", which was read as leaving the empty string in place - it is not the same thing. `null`
means the model generates the greeting from Objective 1, which is what lets it use the caller's
first name when there is one and greet plainly when there is not. A hardcoded begin message with
`{{caller_first_name}}` in it reads badly for every unknown caller, so it stays unset.

## Test call review, and the prompt changes it forced

Eleven web test calls exist on `agent_9556e6431bd8908e98ce6782ee`. Only one (`call_53701daf...`,
two and a half minutes, a new boiler enquiry) got far enough to test the objectives. Four faults
in that single call, all now fixed in the prompt:

| Fault on the call | What it looked like | Fix |
|---|---|---|
| **Objective 10 never ran** | The call closed with no name and no address. Only the quote-link text went out, to `{{from_number}}` | A hard gate in Section 11: never close a job call without name, number and location, and on a visit a confirmed address |
| **Address never taken or confirmed** | The only location captured was a garbled "in the star line", accepted without a check | New read-back block in Objective 10 - see below |
| **Same acknowledgement every turn** | "Thanks for that" opened six consecutive turns | Section 2 now names that exact failure. Vary it or drop it |
| **A question asked twice** | The timeframe question was repeated after a part-answer | Global rule 5 rewritten as **Ask once** |

**Reading the address back.** The old rule was "the address not twice", written to keep the call
short. That is the wrong trade: an engineer drives to whatever gets written down, and a wrong
house costs a visit. Objective 10 now takes the address in one go, reads the whole thing back once
- number and street, town, then the postcode in two parts with the letters said as letters,
"C-M-one-two, three-A-B" - asks "have I got that right?" and **stops talking until they answer**.
If a part is wrong, only that part is re-read, never the whole address again. Once confirmed it is
never read out a second time, including at the close.

**Nothing that arrives from the backend is ever asked again.** Section 3 held the presence
principle - present means known, absent means ask - but it only told the agent how to *read* the
context, not that reading it settles the question. It now says so outright: a variable that
arrived, or anything `get_user` returns, is a question that is done, and it is never re-opened,
"just checked", or asked again in a softer form later in the call. Per field: a name is confirmed
in one line and never asked; an email is not raised at all; the service in `{{known_details}}`
becomes the opening ("I've got a boiler replacement down here - is that what you're ringing
about?") rather than a question; an address on the record is read back rather than asked for; a
completed `{{quote_form_status}}` is never offered again. Exactly two things reopen one of these:
the caller changes it, or they do not recognise it - and then the existing drop-it-instantly rule
takes over. The `get_user` tool block carries the same line so it is not only in Section 3.

**Ask once.** Global rule 5 used to point only at Section 3, which covered data from the C-R-M but
said nothing about what the caller had already said out loud. It now covers both, explicitly
including details given early, out of order, or buried inside another answer. Where certainty is
needed the agent confirms in one line rather than re-asking an open question. The single exception
is a reply that was genuinely not heard, and then the agent says so. Objective 10 also no longer
asks for the town when it was already given at Objective 2 - it asks for the house number and
street alone.

These are prompt-only changes, pushed to `llm_28a152a3544f44d8425688bd17de`. They need a fresh
test call to confirm, ideally one where the caller gives the town early and the address late.

## Latency

Ranked by contribution, as diagnosed on the first test call:

1. **`model: gpt-5.2`** - reasoning-class model on a voice turn. Now `gpt-4.1-mini`.
2. **`voice_model: eleven_v3`** - the expressive model, not the low-latency one. Now
   `eleven_flash_v2_5`, at the cost of the audio tags.
3. **`model_high_priority: false`** - the setting that exists for exactly this. Now `true`.
4. **The prompt itself**, re-read every turn. Already cut 29 percent; see below.
5. **`stt_mode: accurate`** - genuinely costs some latency, and is **kept on purpose**. It is what
   stops the transcriber fumbling "combi", "flue", "power flush" and "Stanford-le-Hope". Do not
   turn this off to chase milliseconds without listening to what it does to the transcripts.

**Everything in the table above is now on the agent.** The full push record:

| Pushed | Object | Result |
|---|---|---|
| `general_prompt` | LLM `llm_28a152a3544f44d8425688bd17de` | 35,654 chars, byte-identical to `prompts/essex-heating-inbound-olivia.md`. Verified against `get-retell-llm` on 16 September |
| `general_tools` | same LLM | `end_call`, `get_user`, `send_quote_link`. **`get_user` was missing until 16 September** - this row claimed it was pushed and it was not. `get-retell-llm` showed only `end_call` and `send_quote_link`, so every call ran with no caller lookup while Objective 1 and Section 8 both described one. Added and verified. **Read the tools back off the LLM after any push**, the same way the analysis fields are counted off the agent |
| `post_call_analysis_data` | agent `agent_9556e6431bd8908e98ce6782ee` | 27 fields - 10 enum, 11 string, 6 boolean. **Only 24 landed on the first push**; `gas_safety_advice_given`, `unanswered_question` and `next_action_for_team` were silently absent and were pushed separately on 11 September, taking the agent to version 3. Retell returns 200 on a partial array without reporting what it dropped, so **count the fields on `get-agent` after any push** rather than trusting the response code |

**`transfer_call` was deliberately not pushed.** Its `transfer_destination.number` is still the
placeholder `+44XXXXXXXXXX`, and a tool that could dial a non-existent number does not belong on
an agent. Add Jamie's mobile to `functions/retell-tools.json` and push again. Until then the agent
has no transfer tool while Section 8 of the prompt still describes one, so Parent Objective 8 is
the one place the agent could claim a capability it does not have. It is a draft with no phone
number attached, so nothing can reach it - but do not publish in this state.

**The agent has not been published.** Per house convention that is on request. Note that
`create-phone-call` uses the agent's latest version rather than the latest published one, so the
prompt is already live for test calls without publishing.

> **Reading the live objects back on Windows.** `get-retell-llm` and `get-agent` return UTF-8. If
> you save the response and open it in Python without `encoding='utf-8'`, Windows decodes it as
> cp1252 and every `·` in the prompt comes back as `Â·`. That is a reading artifact, not drift -
> do not "fix" it with a re-push. The live prompt has been byte-identical to the repo throughout.

## Prompt length

The first draft ran to 45,571 characters, roughly 11,000 tokens, which is paid on every single
turn in latency and cost and measurably degrades instruction-following. It is now 32,454
characters, a 29 percent cut, with **no behavioural rule removed** - the saving came from prose
turned into bullet fragments, rationale sentences dropped, and the four non-customer caller types
merged into one objective with a per-type table instead of four near-identical objectives.

Two structural cuts worth remembering:

- **The outcome-mapping table came out of Section 10.** It duplicated the `call_outcome` enum
  choices in the post-call analysis field definition, and the analysis model reads that field
  description rather than the prompt. The prompt now only tells the agent how to keep the record
  honest.
- **Objectives 9 to 12 became a single Objective 9.** Partnership, job application, spam and
  out-of-scope calls kept their own recognition clauses in Section 5 and their own prohibitions,
  but they no longer each carry a full objective block.

Cutting further means removing rules rather than words. Before any further compression, check the
critical phrases still resolve - the gas emergency number, "never call it a fixed price", "drop it
instantly", "Do NOT escalate", "NO booking tools", the empty-not-placeholder rule and the
either/or answer rule.

## Dynamic variables - one decision to make

The prompt reads `{{caller_first_name}}`, `{{caller_full_name}}`, `{{caller_email}}`,
`{{known_details}}`, `{{quote_form_status}}`, `{{lead_tags}}`, `{{business_hours_status}}`,
`{{current_datetime}}` and `{{from_number}}`.

On an inbound call these have to be supplied by an **inbound call webhook** on the phone number,
which Retell calls before it answers and which returns `retell_llm_dynamic_variables`. That is the
recommended route, because it is the only way the very first sentence can use the caller's name -
which is what Jamie asked for at 26:08.

`get_user` covers the same ground *during* the call, so if the inbound webhook is not built, the
agent still works: the greeting is simply generic and the details arrive a second later. **Do not
build both to write the same values** - if the inbound webhook is skipped, the variables above
become dead variables, and dead variables are silent. Cross-check the prompt against whatever gets
built.

`business_hours_status` and `current_datetime` are cheap to compute in that webhook and both
matter - the first gates `transfer_call`, the second is the only thing letting the agent talk about
time without inventing a date.

## Open items before go-live

**Needed from the client**

1. **Jamie's mobile number** in E.164 for `transfer_call`. Without it Parent Objective 8 falls back
   to taking details on every call.
2. **The exact URL of the online quote form.** It is hardcoded in the `send_quote_link` workflow,
   never spoken, so it never enters the prompt.
3. **Which days the 8am to 5pm hours apply to.** The sheet and the transcript both give the hours
   and neither gives the days. The prompt deliberately says "from eight in the morning until five
   in the afternoon" with no days attached, because inventing "Monday to Friday" would be a
   guarantee the business might not keep. Add the days once confirmed.
4. **Confirm the booking decision** in [functions.md](functions.md) - quote form only, no survey
   booked on the call.
5. **Confirm the office email** for summaries: `essexheatingexperts@outlook.com`.

**Build work still outstanding**

- Phase 4a: fill the website quote form with test data and audit the real GHL custom field names
  before creating any `Voice:` field. Every "only if empty" destination in
  [post-call-analysis-fields.md](post-call-analysis-fields.md) needs a real field id.
- Add the `agent_id` to `location_id` row in datatable `xQoeAdJAp7DTlnkc` by hand. Nothing works
  until it is there.
- Client adds the **AI Inbound** stage to the Lead Pipeline. It does not exist yet.
- `get_user`: switch to `body.call.from_number` and add `quote_form_status` to the returned shape.
- Build the `send_quote_link` workflow.
- Post-call analysis workflow, and the internal notification templates - one per service line, not
  one generic template.
- Point all four LeadsHub numbers at the agent, with staff ringing for fifteen seconds first.
