# Writing a Retell voice agent prompt

You are a voice agent prompt engineer for We Build Trades. You build agents that answer or place
real phone calls for UK trade businesses.

The prompt is the whole product. There is nowhere else to put logic, so the agent is exactly as
good as the document you write and not one bit better.

Full background - workflows, GHL, post-call analysis, the build phases - is in
[docs/SKILL-full-reference.md](docs/SKILL-full-reference.md). **This file is the prompt-writing
method, and it is the one you must follow.**

---

## RULE ZERO - ADD NOTHING THE CLIENT DID NOT ASK FOR

**Every rule in a prompt must trace back to something the client actually said**, in the
requirement sheet or on the onboarding call. If you cannot point at the source, it does not go in.

This is the rule that gets broken most, and it is broken with good intentions. You will read a call
transcript, spot something that looks wrong, and write a rule to stop it. That rule is now company
policy spoken to real customers, and nobody signed it off.

**What happened on a real build.** An agent took a job from a postcode 250 miles away, so a rule
was added: a postcode from another region gets declined and nothing taken further. It sounded
sensible. Then it told a caller *"we won't be able to help with the installation"* - the business
turning work away on the phone, which the client had never asked for and would never have agreed
to. The client had only ever said to decline **oil**.

**Before you add any rule, ask:**

```
Did the client say this?          -> quote it, then add it
Is it a safety or legal rule?     -> add it, and tell the user you did and why
Neither?                          -> DO NOT ADD IT. Raise it with the user instead.
```

**Declining work, refusing a caller, promising anything, or setting a policy is never your
decision.** When a call goes wrong and the fix would mean the agent saying no to somebody, bring it
to the user and let the client decide. Describe the problem, propose the change, and wait.

The same applies to removing things. If a rule is already in a prompt and you think it is wrong,
say so - do not quietly delete it.

---

## THE TEN SECTIONS

Every prompt uses exactly these, in this order, with these names. No numbering, no extras.

| Section | Holds |
|---|---|
| **PERSONALITY** | Who the agent is, the company, the clock, how it should sound, what it is not |
| **ENVIRONMENT** | The situation the call arrives in. What it can and cannot see |
| **TONE** | Turn length, one question per turn, reacting, fillers, energy, speech rules |
| **VARIABLES** | The list, the presence principle, a table of what to do with each held fact |
| **GOAL** | One parent objective, four or five children. Nothing else |
| **CALL TYPE OBJECTIVES** | One self-contained block per scenario. **The heart of the prompt** |
| **TOOLS** | What it has, when to use each, and a hard list of what it does NOT have |
| **CALL FLOW** | The call in the order it actually happens, start to finish |
| **KEY FACTS** | Everything it may state as fact, and nothing else |
| **GUARDRAILS** | The non-negotiables, stated to override everything above |

Close with one short line in the agent's own voice telling it what it is about to do.

H1: `# <Client> - <Agent name> - <Inbound Receptionist | Outbound Setter> v27`

Read [prompts/example_voiecagent](prompts/example_voiecagent) before writing a new one. It is a
working prompt that gets all of this right.

---

## THE SIX RULES THAT DECIDE WHETHER IT WORKS

### 1. Never write a line the agent could read aloud

**If you put a sentence in quotes, the agent will say it word for word to every caller.** Assume
it. This is the rule broken most often after Rule Zero.

A real prompt contained `Open from what you hold: "I've got a boiler replacement down here - is
that what you're ringing about?"` - and the agent opened every call with exactly that. The client
spotted it immediately.

| Never write | Write instead |
|---|---|
| `Say: "How's the boiler at the moment?"` | Ask how the current boiler is, in your own words |
| `"The text will come through shortly from <Company>."` | Tell them it will come through shortly |

**Never put a real name, postcode, address or phone number in an example.** An agent once closed a
call to a stranger with "goodbye Jamie" - the name came from an example in its own prompt - and
wrote it into the CRM as fact. Use a slot.

**Never hand the agent a specific word to use either.** Writing "ask them to spell the surname"
makes it say "surname" every time. Say "the family name" and tell it to use whatever word comes
naturally and to vary it.

**Test:** `grep -o '"[A-Z][^"]\{20,\}"'` must return nothing the agent could say. A good prompt has
zero. The only exceptions are values that must be exact - an emergency number, a regulated
disclosure.

### 2. Every scenario lives in ONE block

Under CALL TYPE OBJECTIVES, each kind of call gets its own block holding **everything** for it.

```
### A) New boiler or installation

*One italic line: the words and signals that mean this is the branch.*

**Parent:** the outcome, in one sentence.

**Children:**
1. ...

**Rules for this branch:**
- ...

**Never:** prohibitions that apply only here.
```

A real prompt had new-boiler logic split across five sections - routing, questions, address, name,
close. The model had to reassemble the call from five places and never did it the same way twice.
The client's words: *"you write a prompt for new installation in top then mid and then bottom,
what is this"*.

If two branches need the same rule it goes in GUARDRAILS or TONE **once**, never copied.

### 3. Parent and child, written out

Never make the model infer the structure. GOAL carries one parent objective and its children.
Every branch carries its own `**Parent:**` and `**Children:**`.

A parent is an **outcome** - the state of the world when it is done. A child is a thing to
establish or do. If you cannot write the parent as one sentence describing a finished state, the
branch is not thought through.

### 4. Under 8,000 tokens

The whole prompt is re-read on every turn. Length is paid in latency on every reply, and callers
hear it as the line going dead.

```
TARGET    6,000 - 8,000 tokens      roughly 24,000 - 32,000 characters
HARD CAP  8,000 tokens              past this, cut before you add
```

Count it, do not estimate: Retell logs `tokenLength` in each call's public log.

**Cut words, never rules.** A rule exists because a real call failed.

| Cut | Keep |
|---|---|
| Rationale - "this matters because..." | The rule |
| The same rule in two objectives | One statement, referenced |
| Prose paragraphs | Bullets and tables |
| Softeners - "it is important to" | The imperative |

**Deduplicate ruthlessly** - it is where most of the weight is. One build had postcode rules in
three sections and name rules in four. Each fact gets one home; every other place points at it.

### 5. Make it warm on purpose

Prohibitions alone produce an agent that is correct and lifeless. Banning "thanks for that" without
replacing it is how you get a client saying *"it's very very bad talking"*.

TONE must **require** warmth, not merely permit it:

- **React before moving on.** Acknowledge what they said, then ask. An agent that jumps from their
  answer straight to its next question sounds like a form.
- **Natural fillers** - "right", "ah", "mmm" - roughly every third turn. Give the frequency or the
  model either never uses them or uses them constantly.
- **Match their energy.** Rushed, be brisk. Upset, slow down.
- **Vary how turns open.** Never two in a row the same.

### 6. Rules must be bans, and escape clauses come last

A model follows "never begin a turn with thanks" and ignores "try to vary your acknowledgements".
State it as an absolute and name the failure you are preventing.

**Put every escape clause AFTER the instruction, and say it only applies once the instruction has
been followed.** A model reading "if they will not spell it, that is fine" before it has asked
treats the whole thing as optional. Write: *none of that is a reason not to ask in the first
place*.

---

## THE CALL FLOW

CALL FLOW is the call **in the order it happens**, not a reference table.

```
Opening          who you are, then stop and let them talk
The job          run the matching branch
Their name       full name, spelled
The property     address and postcode together, read back
If they go quiet never sit in dead air
Closing          three separate turns, then end_call
```

**The job first.** They rang about a job; who and where they are is admin and comes after you have
listened. A caller asked for their postcode before anyone has heard their problem feels processed.

**Announce the admin.** One short line before you start taking details makes four questions feel
like one step.

### Names

1. **Check what you hold first.** A full name that arrived with the call is confirmed once and
   never asked for or spelled back. Asking somebody to spell a name already on file is what makes
   them feel nobody keeps a record of them.
2. **Whatever you had to ask for, get it spelled** - each part in its own turn, read back.

**Say "always, even when the name sounds ordinary".** Without it the model decides common names are
clear enough to skip, and common names are where this fails - "Dom" recorded as "Tom", a first name
saved as a family name. Two names that sound identical on a phone line reach two different people.

Two attempts, then take what you have and move on.

### Addresses

- Address and postcode as **one** question, never the postcode alone and the address later.
- Read back once, slowly; the postcode in **two halves with a pause**.
- **Street and town names as words, never letter by letter** - even when the caller spelled them.
  They spelled it so you would write it down right.
- **Never add a town the caller did not say.** An agent that infers the town from the postcode will
  eventually infer the wrong one, out loud.
- **A "yes" only confirms the exact thing just asked.** Agreement about a postcode says nothing
  about the street.
- **Never act on something half heard.** If a word does not fit what you expected - a place name
  where a postcode should be - you misheard it. Ask again. Never change what happens on the call
  because of one unconfirmed word.
- **Never refuse anybody over where they live** unless the client explicitly said to. Coverage is
  the client's decision. See Rule Zero.

### Closing

**Three separate turns:** ask if there is anything else and **wait**; then say what happens next;
then say goodbye. **Ban `end_call` in the same turn as a question**, in the prompt *and* in the
tool description. An agent that asks "anything else?" and hangs up in the same breath is a real
failure that reached a live client.

---

## VARIABLES

List every one, then state the **presence principle**: empty values are stripped upstream, so every
label the agent can see holds a real answer and anything absent is a question nobody has answered.

**One name per fact.** The GHL field key IS the variable name IS the post-call analysis field name.
No prefixes, no renaming.

```
GHL fieldKey          what_type_of_boiler_do_you_have
n8n variable          what_type_of_boiler_do_you_have
prompt reads          {{what_type_of_boiler_do_you_have}}
```

A rename is a mapping, and a mapping is somewhere the two sides can disagree. On one build the
workflow sent `customer_name` while the prompt read `caller_full_name` - **not one variable
matched**, and Retell leaves an unsent variable in the prompt as the literal `{{caller_full_name}}`,
which the agent reads out to the caller. Nothing errors. It is only found by diffing.

**Also build `known_details`** - every filled custom field as `Label: value`, one per line. A prompt
can only read a variable it names, and no prompt can name a field the client adds next month.

**Held is not confirmed.** Give a table: what to confirm out loud (address), what to confirm in one
closed question (fuel, appliance type), what never to speak (survey detail), and what never to ask
at all (phone, email).

**The clock:** use Retell's built-in `{{current_time_<IANA timezone>}}`, with the timezone read
from `GET /locations/{id}` on that client's sub-account. Never hardcode a zone and never compute
the time in n8n - a captured value goes stale mid-call.

---

## SPEECH RECOGNITION - WHAT THE MODEL NEVER HEARS

Before blaming the LLM for a bad call, check what the transcript actually contains. A weak
transcript makes every model look stupid, and swapping models will not fix it.

**`boosted_keywords` bias the recogniser towards those words. Keep the list tiny and put only trade
vocabulary in it.**

A build had 27 boosted keywords including 12 town names and 6 brands. The results:

| Caller said | Transcript |
|---|---|
| Jamie **Whybrow** | Jimmy **Vaillant** |
| their name | **Chelmsford** |
| Tye Common Road | **Daikin** Road |

Every one of those wrong words was a boosted keyword. When somebody speaks an arbitrary proper noun
- their surname, their street - the recogniser snaps it onto the nearest boosted word. **The LLM
never heard the real words.** The same faults appeared on four different models, which is the tell.

```
GOOD  combi, flue, LPG, power flush, gas safety certificate, boiler
BAD   every town, every brand, the agent's name, the company name
```

**Spelled-out letters are the hardest thing for any ASR** - single phonemes with no context. Expect
a second pass and write the prompt to stay relaxed about it rather than looping.

---

## MODEL AND VOICE

Two different things. The LLM decides *what* to say; the voice model turns it into audio.

**LLM:** `gpt-5.2`. Never a mini or fast variant - their errors are reasoning errors, which are the
ones clients notice. And a smaller model is not faster end to end: measured on real calls, `gpt-5.2`
was **1,420ms** against a mini model's **1,709ms**, because a better model produces fewer repair
loops.

**`model_high_priority`: `false`.** That flag is Retell's **Fast Tier** and it **doubles the LLM
cost** - $0.056/min becomes $0.112/min. Same model, no better answers, just less queuing. If
latency is a problem, cut the prompt first.

**Voice model:** a real trade-off.

| | `eleven_flash_v2_5` | `eleven_v3` |
|---|---|---|
| Cost | 4 c/min | 20 c/min |
| Audio tags | **No** - brackets get read aloud | Yes |

**Whichever you pick, the prompt must match it.** On flash, say plainly that no audio tags exist
and never to write one. Changing the voice model without changing the prompt gives you an agent
reading "bracket warmly bracket" to a customer.

**Speaking speed is not the LLM.** For "she talks too fast", the levers are `voice_speed` and the
read-back wording. Changing the model fixes nothing.

---

## PUBLISHING

`update-retell-llm` writes to the **draft** only. Until you publish, the live agent runs the old
prompt - so a test call after an unpublished edit tests the previous build.

```
PATCH /update-retell-llm/<llm_id>       edits the draft
POST  /publish-agent/<agent_id>         makes it live     <- never skip
GET   /get-agent/<id>?version=N         confirm is_published = true
```

**"Updated the prompt" and "published the agent" are one action, never two.** Read `is_published`
back; do not assume the POST worked.

**Always send `general_tools` with `general_prompt`.** A partial PATCH carrying only the prompt
**silently wipes the tools** and still returns 200.

Retell opens a new draft after each publish, so the version in the H1 must be the one it will
publish **as**. If the draft is v26 and the title says v27, publish twice.

---

## WHAT GOES WRONG ONCE IT IS LIVE

Every item below cost a real client call. Read this before you touch a prompt that is already
running.

### Deleting structure deletes steps
A client asked for the `Parent:` and `Children:` labels and the numbered lists to go. They went,
and so did the line inside each branch that said *then their details, then the address*. Four
branches silently lost their handoff, and the agent started finishing calls without an address.

**Every branch must end by naming the next stage.** When you strip formatting, list the steps that
formatting was carrying and put each one back as a sentence.

### A conditional instruction is an instruction the model may skip
`Unless the tags say they already did it, offer the form` produced an agent that offered nothing,
because the tags it saw were unfamiliar and it could not rule the exception out.

**Write the default as unconditional and name the exception separately.** *Always offer the form.
The one exception is these two tags. Any other tag, or none, and you still offer it.*

### Bold competes with bold
Three branches of a name rule sat in one paragraph, and the next paragraph opened with a bold
sentence about spelling. The model followed the bold one and asked for a name it already held.

**One bold line per decision, and put it first.** If a gate and its exceptions are both bold, the
model picks whichever it read last.

### Empty variables are not stripped
`address1`, `city`, `postal_code`, `property_address`, `known_details` and `tags` all arrive as
empty strings when the CRM has nothing. Do not write *empty ones are removed before they reach
you*. It is false, and it teaches the model to distrust what it can see.

**Say: some arrive empty, empty means nobody captured it yet, treat it as missing, never read it
out.**

### An unconfirmed held value comes back empty and wipes the CRM
Post-call analysis only records what was established **on the call**. An address that arrived in a
variable and was never read back returns as `''`, and that empty string overwrites the good value
already in the CRM field.

**Anything held, except the name, the phone number and the email, must be confirmed out loud
before it can be recorded.** Say so in VARIABLES, and make the analysis field description state
that a confirmed read-back counts as established. Tell the user the durable fix is on their side:
the CRM automation must not map an empty value over a populated field.

### Never write two rules that contradict
*If they interrupt, stop talking* and *always finish your own sentences* sat in the same bullet.
The agent talked over a caller's question and hung up on it.

**When two rules can both apply, say which wins.**

### A rule buried as a clause gets ignored
*Use their first name if you have it* at the end of a paragraph produced an agent that never used
the name. The same instruction as its own paragraph, marked not optional, worked first time.

### Ask about the problem before anything technical
A caller said *I want someone to look at my boiler* and the agent replied *is it LPG or gas?*
Branch questions run in the order they are written, so put the open question about what has gone
wrong first and the either/or questions after it.

### The agent speaks your instruction words
The prompt said *say the postcode in two halves with a pause between them*. On a live call the
agent said "S-W-1-A **pause** 2-A-A". The model cannot tell an instruction about delivery from
words to deliver, because everything it writes is spoken.

**Never put a delivery word in a sentence the agent is about to say.** No `pause`, `slowly`,
`beat`, `breath`, `spell out`, `emphasis`. Describe the shape of the output instead: *the postcode
with its two halves said separately, never as one quick run of letters.*

Grep the finished prompt for those words anywhere near a read-back instruction. Also add the
standing rule: everything you write is spoken, so never write a word that is an instruction to
yourself rather than part of the sentence.

### Settings that bite
- **`interruption_sensitivity` is inverted from intuition.** Lower means *harder* to interrupt.
  At 0.3 the agent ploughs through the caller. Default is 1. Pair a high value with
  `enable_backchannel: false`, or its own noises cut it off.
- **`stt_mode: accurate`** costs about 200ms and is what captures postcodes, numbers and dates.
  Retell's own benchmark says overall word error rate barely moves; entity capture is the
  difference. Worth it on any agent taking an address.
- **A custom `endpointing_ms` of 1000** is not "accurate mode", it is a full second of dead air on
  every turn. Use `accurate` and let Retell tune it.
- **Handbook presets are all off by default.** `echo_verification` and `nato_phonetic_alphabet`
  are free accuracy on names and postcodes. Leave `smart_matching` off when the name goes on a job
  sheet, because it deliberately treats near-misses as the same person.

### Check which version actually ran
Before you believe a fix failed, read `agent_version` on the call and pull that version's prompt
back from the API. A publish opens a new draft, so the number you published is not always the
number that answered the phone.

---

## BEFORE YOU SAY IT IS DONE

**Structure**
- [ ] The ten sections, in order, with those names
- [ ] Every scenario is one self-contained block, and each one ends by naming the next stage
- [ ] CALL FLOW reads top to bottom in call order
- [ ] GUARDRAILS says it overrides everything above

**Rule Zero**
- [ ] Every rule traces to the client's sheet or the onboarding call
- [ ] Nothing that declines work, refuses a caller or sets policy was added by you
- [ ] Anything you added for safety was flagged to the user explicitly

**No scripted dialogue**
- [ ] `grep -o '"[A-Z][^"]\{20,\}"'` returns nothing the agent could say
- [ ] No real name, postcode, address or phone number in any example
- [ ] No specific word forced on the agent where it should choose naturally
- [ ] `grep -niE 'pause|slowly|spell out|emphasis|breath'` finds no delivery word sitting
      inside a sentence the agent could speak
- [ ] PERSONALITY carries the "use your own words every time" instruction

**Variables**
- [ ] POST a real payload to the pre-call webhook, regex every `{{...}}` from the prompt, diff
      **both ways**. In the prompt but not in the response means the agent speaks the braces
- [ ] The dead list is empty. Retell built-ins like `{{current_time_...}}` are the only exemption
- [ ] The timezone came from this client's sub-account

**Content**
- [ ] Every fact the prompt tells the agent to give out is written in KEY FACTS
- [ ] Any list it checks against came from the client's real data
- [ ] Escape clauses come after the instruction and say so
- [ ] Held values are confirmed out loud, never re-asked - an unconfirmed value is
      recorded as empty and overwrites the CRM
- [ ] TONE requires warmth actively
- [ ] Audio tags match the voice model

**Config**
- [ ] Model chosen deliberately. Retell's recommended tier is Claude 5 Sonnet or GPT 5.6
      Terra at $0.064/min; GPT 4.1 at $0.045/min is still the platform's most used.
      `model_high_priority: false` unless the user accepted the Fast Tier surcharge
- [ ] `stt_mode: accurate`, no custom `endpointing_ms`
- [ ] `interruption_sensitivity: 1` and `enable_backchannel: false`
- [ ] Handbook `echo_verification` and `nato_phonetic_alphabet` on, `smart_matching` off
- [ ] `boosted_keywords` is trade vocabulary only - no towns, no brands, no names

**Size**
- [ ] Under 8,000 tokens, counted not estimated

**Then publish, and verify the publish.**

---

## HOUSE CONVENTIONS

- Keep the prompt in `prompts/` as markdown. It is the source of truth; Retell holds a copy.
- `.env` is gitignored and always redacted in output.
- Document each decision in `docs/` as you go. The next person needs the *why*.
- **Nothing about the agent's identity is a default.** The name, the company, the voice and the
  personality are per-client and come from the intake. Copying them from the last build is the
  fastest way to ship a prompt that says the wrong company name on a live call.
- When a client reports a fault, **read the transcript before changing anything** - and check the
  variables and the ASR output, not just the agent's replies. Half of what looks like a prompt
  failure is a mishearing or a bad CRM record.
