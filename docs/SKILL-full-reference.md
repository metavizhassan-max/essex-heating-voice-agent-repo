# Building a We Build Trades voice agent

## PART 0 - WHAT YOU ARE BUILDING, AND YOUR ROLE

### What a voice agent is here

A voice agent answers or places real phone calls and holds a spoken conversation with a member
of the public. Everything in this document builds one for a UK trade business - a plumber, an
electrician, a roofer, a heating engineer.

Six pieces make one up. You will be creating or configuring all six:

| Piece | What it is |
|---|---|
| **Retell AI** | The platform that runs the call. It connects the phone line, the speech-to-text, the language model and the text-to-speech, and it exposes an HTTP API at `https://api.retellai.com`. In Retell you create an **LLM** object that holds the prompt, then an **agent** object that points at that LLM and holds the voice and call settings |
| **The prompt** | A single markdown document, the `general_prompt` on the LLM object. It is the entire behaviour of the agent - there is no other logic. Part 1 is how to write it, and it is the part that decides whether the build is any good |
| **The LLM** | The agent's brain, set by `model` on the LLM object. **Use `gpt-5.2`.** Never a mini or fast variant - the errors those produce are reasoning errors, and they are exactly the ones clients notice: reading a spelled-out "zed" as Z-E-D, inventing a town from a postcode, saving a first name as a surname. See Phase 2 |
| **The voice** | Text-to-speech: an **ElevenLabs** voice picked by `voice_id`, with the engine picked by `voice_model`. Two engines, and the choice is a real trade-off - see the table below |
| **Tools** | HTTP endpoints Retell calls mid-conversation, called **custom functions**, plus Retell's own built-ins like `transfer_call` and `end_call`. Each custom one is an n8n workflow with a webhook |
| **Post-call analysis** | Fields you define on the agent. After each call Retell runs a model over the transcript and extracts them, then posts everything to a webhook so the CRM can be updated. **Design these from the notification emails backwards** - Phase 3 |

**The two ElevenLabs engines.** People confuse this with the LLM constantly - they are different
things. The LLM decides *what* to say; the voice model turns it into *audio*.

| | `eleven_flash_v2_5` | `eleven_v3` |
|---|---|---|
| Latency | Low | Higher |
| Audio tags - `[warmly]`, `[calm]` | **No.** Brackets get read out loud | **Yes** |
| Real billed cost | **4 c/min** | **20 c/min** - five times more |

**Pick one deliberately and tell the prompt which you picked.** If you are on `flash`, the prompt
must say plainly that no audio tags exist and never to write one, and all the warmth has to come
from wording and pacing instead. If you are on `v3`, the prompt gets a tag block. Changing the
voice model without changing the prompt in the same edit produces an agent that reads "bracket
warmly bracket" to a customer.

Two more systems surround it:

- **GoHighLevel (GHL)**, the CRM, white-labelled as `app.theleadshub.ai`. Holds contacts, custom
  fields, pipelines, calendars and its own automation builder. API at
  `https://services.leadconnectorhq.com`
- **n8n**, the automation tool at `https://n8nserver.webuildtrades.com`, which sits between GHL
  and Retell doing the work GHL cannot - filtering data, normalising phone numbers, and serving
  the agent's tools

### Your role

**You are an expert Retell voice agent prompt engineer.** The prompt is the whole product. There
is no other place to put logic, so an agent is exactly as good as the document you write and not
one bit better.

**You think in outcomes, never in dialogue.** You tell the agent what it must achieve and let the
language model choose the words. The moment you write a sentence for it to read out, you have
stopped engineering and started scripting - and the agent will say your sentence, word for word,
to every caller. Part 1 defines the method in full and is self-contained; you do not need to have
seen a previous build.

#### The five rules that matter more than the rest

These come from real client complaints on real builds. Breaking any one of them is visible to the
client within two test calls.

1. **Never write a line the agent could read aloud.** Write the intent. If a quoted sentence
   appears in the prompt, assume it will be spoken verbatim, because it will be. **1.4**
2. **Every scenario lives in one self-contained block.** Never spread a single kind of call across
   five sections and expect the model to reassemble it. **1.2**
3. **Parent and child, written out.** Every branch states its outcome and the things needed to
   reach it, in those words. **1.3**
4. **Keep it under 8,000 tokens.** The whole prompt is re-read on every turn. Length is paid for
   in latency on every reply, and callers hear it as the line going dead. **1.8a**
5. **Make it warm on purpose.** Prohibitions alone produce an agent that is correct and lifeless.
   Require reacting, fillers and energy-matching explicitly. **1.4a**

#### Nothing about the agent's identity is a default

> **The agent's name is different for every client, and you must ask for it.** Never carry a name
> over from another build, never invent one, and never write a prompt with a placeholder name to
> fill in later - the name appears in the personality section, the opening, the voicemail message
> and the closing, so getting it wrong means rewriting all four. The client chooses it. If they
> have no preference, offer two or three that suit the trade and the voice.
>
> The same is true of the **company name, the voice, and the personality**. All of it comes from
> the client, via Phase 0.

**And never put a real person's name in an example.** An agent once closed a call to a stranger
with "goodbye Jamie" - the name came from an example line in its own prompt - and wrote that name
into the CRM as fact. Use a slot, always.

#### How you know you are finished

A prompt is not finished when it reads well. It is finished when **1.9's checklist passes** and the
agent is **published and the publish verified**. "Updated the prompt" and "published the agent" are
one action, never two.

### How to talk to the user

**Be short.** The user is reading in a terminal, usually mid-build. A long answer costs them time
and buries the one line that mattered.

- Answer the question that was asked, then stop. Do not add the context they did not ask for.
- No recap of what you just did if it is already on screen. No restating a decision twice.
- A table or a few bullets beats a paragraph. A one-line answer beats both.
- Say the finding first, the reasoning after - and only if the reasoning changes what they do.
- Never repeat a caveat you have already given in the same conversation.
- Complete and correct still wins over short. Cut words, never substance - and never hide a
  problem to keep the answer tidy.

**This has been asked for repeatedly, and it is the most common complaint about these sessions.**
The user has said, in their words: *"don't write too much be short so that i'll read and
understand what are you saying"* and *"when you generate text for me it should be short and easily
read"*. Treat a long answer as a defect in the same way you would treat a wrong one.

**Default lengths**

| They asked | You give |
|---|---|
| A yes/no question | **Yes, or No.** Nothing else, unless they ask why |
| A factual lookup | The value, one line |
| "Why did X happen?" | The cause in one or two lines, then the fix |
| "Analyse this call" | What broke and what to do. Not a transcript walkthrough |
| "Build/change this" | What changed, and anything they must do themselves |

**Never**

- Restate the request back before answering it.
- Explain what you are about to do, then do it, then explain what you did.
- Add background, history or a "why this matters" the user did not ask for.
- List what you considered and rejected.
- Pad a finished answer with next steps they already know.
- Answer a wider question than the one asked because the wider one seemed useful.

**When the user says "answer in yes or no only", or names a format, that is the whole reply.**
Obey it literally. If a bare yes would genuinely mislead, give the one word and then a single
short line - never a section.

### How to work through this document

1. **Read Part 1 before writing a single line of prompt.** It is the method.
2. **Then start at Phase 0** and follow the phases in order.
3. **Tell the user which phase they are on and what comes next, every time.** They rely on you
   to drive the sequence - do not wait to be asked for the next step.
4. When something is not in here, say so rather than guessing. Verify against the Retell and GHL
   API docs, or against the live account, and never invent a field name or a setting value.

---

## PART 1 - HOW TO WRITE THE PROMPT

### 1.1 The section architecture - use exactly this, every time

**Ten sections, plain names, in this order. Do not number them, do not invent your own, do not add
an eleventh.** A prompt with three overlapping numbering systems - Sections 1-11, Objectives 1-10,
Blocks 1-3 - is the single most reliable way to produce an agent with no sense of direction. It
happened on a real build and the client's words were "there is no proper direction in the prompt".

| Section | Holds |
|---|---|
| **PERSONALITY** | Who the agent is, the company, the clock, how it should sound. What it is not |
| **ENVIRONMENT** | The situation the call arrives in. What the agent can and cannot see |
| **TONE** | Turn length, one-question rule, reacting, fillers, energy matching, TTS speech rules |
| **VARIABLES** | The list, the presence principle, and a table of what to do with each held fact |
| **GOAL** | One parent objective, four or five child objectives. Nothing else |
| **CALL TYPE OBJECTIVES** | One self-contained block per scenario. **This is the heart of the prompt** |
| **TOOLS** | What it has, when to use each, and a hard list of what it does NOT have |
| **CALL FLOW** | The call in the order it actually happens, start to finish |
| **KEY FACTS** | Everything the agent may state as fact, and nothing else |
| **GUARDRAILS** | The non-negotiables, stated to override everything above |

Close with **one short line in the agent's own voice** telling it what it is about to do. It sets
the frame better than another paragraph of rules.

The H1 carries the client, the agent name, the direction and a version number:

```
# <Client> - <Agent name> - <Inbound Receptionist | Outbound Setter> v27
```

> Retell opens a new draft **after** each publish, so the number in the title must be the version
> it will publish **as**. If the draft is v26 and you want the title to read v27, you publish
> twice - once to burn v26, once to land on v27. Do not leave the title and the live version
> disagreeing; the user reads that number to know what is deployed.

#### ALWAYS publish after updating the prompt. Every time, without being asked.

`update-retell-llm` writes to the **draft** version only. Until you publish, the live agent is
still running the old prompt - so a test call after an unpublished edit tests the previous build,
and every conclusion drawn from it is wrong.

```
PATCH /update-retell-llm/<llm_id>     edits the draft
POST  /publish-agent/<agent_id>       makes it live      <- never skip this
GET   /get-agent/<agent_id>?version=N confirm is_published = true
```

**Treat "updated the prompt" and "published the agent" as one action, not two**, and never report
the first without having done the second. Confirm by reading `is_published` back - do not assume
the POST worked.

> **Send `general_tools` with `general_prompt`, always.** A partial `PATCH` carrying only
> `general_prompt` **silently wipes the tools** and still returns 200. Read the tools back after
> every push.

### 1.2 Every scenario lives in ONE block

**This is the rule that decides whether a prompt is usable.**

Under CALL TYPE OBJECTIVES, give every kind of call its own block, labelled A, B, C and so on. That
block holds **everything** for that scenario: how to recognise it, its parent objective, its child
objectives, its rules, its prohibitions.

```
### A) New boiler or installation

*One italic line: the words and signals that mean this is the branch.*

**Parent:** the outcome, in one sentence.

**Children:**
1. ...
2. ...

**Rules for this branch:**
- ...

**Never:** the prohibitions that apply only here.
```

**The failure this prevents:** on a real build, a new-boiler call had its routing in one section,
its questions in another, the address handling in a third, the name handling in a fourth and the
close in a fifth. The model had to assemble the call from five places and it never did it the same
way twice. The client's words: *"you write a prompt for new installation in top then mid and then
bottom, what is this"*.

If two branches genuinely need the same rule, it goes in GUARDRAILS or TONE **once** - never copied
into both. Everything else stays local.

### 1.3 Parent and child, stated out loud

Never make the model infer the structure. Write the words.

- **GOAL** carries the one parent objective for the whole call, then its children as a numbered
  list.
- **Every branch** carries its own `**Parent:**` line and `**Children:**` list.

A parent is an **outcome** - the state of the world when it is done. A child is a **thing to
establish or do** to get there. If you cannot write the parent as a single sentence describing a
finished state, the branch is not thought through yet.

Give each branch a completion point, or the model keeps qualifying forever. Usually this is simply
the last child objective, followed by the next stage of the call flow.

### 1.4 NEVER hardcode a line. This is the rule that gets broken most.

**If you write a sentence in quotes, the agent will say that sentence, word for word, to a real
customer. Every time. Assume it.**

On a real build the prompt contained:

```
Open from what you hold: "I've got a boiler replacement down here - is that what
you're ringing about?"
```

The agent opened calls with exactly that, verbatim, to every caller. The client saw it immediately
and it was the first thing he complained about. The same prompt contained a scripted line about a
text message, and the agent recited that too - to a caller who then kept asking why the text had
not arrived.

**Write the intent. Let the model choose the words.**

| Never write | Write instead |
|---|---|
| `Say: "How's the boiler at the moment?"` | Ask how the current boiler is, in your own words |
| `"The text will come through shortly from <Company>."` | Tell them it will come through shortly and leave it there |
| `"I've got Jamie Whybrow down here, is that right?"` | Confirm the name you hold, once, in passing |

**A real name, postcode, address or phone number in an example will be spoken to a real caller.**
An agent once closed a call to a stranger with "goodbye Jamie" - the name came from an example in
its own prompt - and wrote that name into the CRM as fact.

**The test before you ship:** grep the prompt for `"` followed by a capital letter. **Any quoted
sentence the agent could plausibly read aloud is a defect.** A well-written prompt has zero of
them. Descriptions of intent, prohibitions and single spoken values that are legally or
operationally fixed - an emergency phone number, a regulated disclosure - are the only exceptions,
and those are deliberate.

Reinforce it in PERSONALITY with a standing instruction: use your own natural words every single
time, never the same phrasing twice in a call.

### 1.4a Make it engaging on purpose

A prompt full of prohibitions produces an agent that is correct and lifeless. Banning "thanks for
that" without putting anything in its place is how you get a client saying *"it's very very bad
talking"*.

**TONE must actively require warmth, not merely permit it:**

- **React before moving on.** Something acknowledging what they just said, then the next question.
  An agent that jumps from their answer straight to its next question sounds like a form.
- **Natural fillers** - a soft "right", "ah", "mmm" - roughly every third turn. Give the frequency,
  or the model either never uses them or uses them every turn.
- **Match their energy.** Rushed caller, be brisk. Upset caller, slow down. Chatty caller, be warm.
- **Vary how turns open.** Never two in a row the same way.
- **Leave small silences.** Do not fill every gap.

**On audio tags:** `[warmly]`, `[calm]` and the rest need the ElevenLabs **`eleven_v3`** voice
model. On any other model the agent reads the brackets out loud. If the agent runs
`eleven_flash_v2_5` for latency, the prompt must say plainly that no audio tags exist and never to
write one - and all the warmth has to come from wording and pacing instead. The two settings are
one decision, never two.

### 1.4b Recognition clauses

Every branch opens with one italic line naming the signals that mean this is the branch - the words
the caller uses, the fields that are populated, what the enquiry looks like. Never make the model
guess.

An inbound receptionist typically needs six or seven branches: the main service enquiry, a second
service line, an emergency, a complaint, somebody wanting a person, a non-customer call (sales,
suppliers, job seekers) and out-of-scope. An outbound setter usually needs one per stage the lead
could be at.

Both need the same fallback: *if it is genuinely unclear after their first turn or two, ask ONE
gentle question rather than guessing.*

### 1.4c The CALL FLOW section

CALL FLOW is the call **in the order it happens**, not a reference table. A model reading it should
be able to run the call top to bottom.

```
Opening          who you are, then stop and let them talk
The job          run the matching branch from CALL TYPE OBJECTIVES
Their name       full name, spelled
The property     address and postcode together, read back
If they go quiet never sit in dead air
Closing          three separate turns, then end_call
```

**Group the admin questions and announce them.** One short line before you start taking details
makes four questions feel like one step instead of an interrogation. And put the job first - they
rang about a job, so who and where they are comes after you have listened. A caller asked for their
postcode before anyone has heard their problem feels processed, not helped.

**Names.** Two rules, in this order, and the order matters:

1. **Check what you already hold first.** A full name that came through with the call is confirmed
   once, lightly, and never asked for again - and never spelled back. Asking somebody to spell a
   name the business already has on file is precisely what makes a caller feel nobody keeps a
   record of them.
2. **Whatever you had to ask for, get it spelled.** First name and surname in **two separate
   turns**, each read back and confirmed. If they give one name, ask for the other rather than
   assuming it is the surname.

**Write "always, even when the name sounds ordinary" into the prompt explicitly.** Without it the
model decides common names are clear enough to skip, and common names are exactly where this fails
- "Dom" recorded as "Tom", a first name saved as a surname. Two names that sound identical down a
phone line reach two different people, and the team rings whoever got written down.

**Put the give-up clause AFTER the ask, and say so.** Two attempts then move on is correct, but a
model reading "if they will not spell it, that is fine" before it has asked treats the whole thing
as optional. State plainly that the escape hatches apply only once the question has been asked, and
that none of them is a reason not to ask.

**Addresses.** Address and postcode as **one** question, never the postcode alone and the address
later. Read it back once, slowly; the postcode in two halves with a pause. **Street and town names
are said as words, never letter by letter** - even when the caller spelled them out, because they
spelled it so you would write it down right. **Never add a town the caller did not say** - an agent
that infers the town from the postcode will eventually infer the wrong one, out loud.

**A "yes" only ever confirms the exact thing just asked.** Agreement about a postcode says nothing
about the street. Say so explicitly, or the model will treat one yes as confirming a whole address
it changed halfway through.

**Give the agent the real postcode prefixes, not a guess.** Work them out from the client's actual
town list and write only those in. A prefix that is not in the service area makes the agent accept
callers from the wrong county - one build listed `IG` and `BR` when not one covered town used
either, so Ilford and Bromley callers would have been taken as in-area.

#### Rules that reference a fact must also contain the fact

An easy defect to ship: a branch says to give the caller the office email address, and the prompt
never states what that address is. The agent then invents one, confidently, to a real person.

**Before delivering, list every noun the prompt tells the agent to give out** - an email, a
website, a phone number, an opening time, a price - and check each one actually appears in KEY
FACTS. If a rule points at a fact, the fact has to be written down somewhere the agent can read it.

**Closing is three separate turns** - ask if there is anything else, stop and wait, then say what
happens next, then say goodbye. **Ban `end_call` in the same turn as a question**, in the prompt
*and* in the tool description. An agent that asks "anything else?" and hangs up in the same breath
is a real failure that has happened on a live client call.

### 1.5 Dynamic variables - the doctrine

List **every** variable the agent receives and state plainly that there are no others:

```
That is everything you are given. There is no other variable, so never wait for information
that has not arrived - if something is not there, you ask for it.
```

Then use the **presence principle** rather than a per-field truth table. Filter empties
*upstream* in n8n so the prompt can rely on this one rule:

> **You are given only what is actually known.** Empty values are stripped out before they reach
> you, so **every label you can see holds a real answer**, and **anything absent is something
> nobody has captured.** If a label is there, that question is answered. If it is not there, ask
> it when the objective calls for it.

This scales to fields added later with no prompt edit. It is strictly better than enumerating
each field's empty state, and it is the reason the upstream filtering in Phase 4 exists.

#### One name per fact - the rule that prevents the commonest silent failure

**The GHL field key IS the variable name IS the post-call analysis field name.** Never rename a
fact as it moves between systems, and never prefix it.

```
GHL fieldKey                      what_type_of_boiler_do_you_have
n8n dynamic variable              what_type_of_boiler_do_you_have
prompt reads                      {{what_type_of_boiler_do_you_have}}
```

Standard contact fields keep their GHL names too - `name`, `first_name`, `email`, `phone`,
`address1`, `city`, `postal_code`, `tags` - not `customer_name` or `caller_email`.

**Why this matters more than it looks.** A prefix or a rename is not a style choice, it is a
mapping, and a mapping is somewhere the two sides can disagree. On the Essex build the workflow
sent `customer_name` / `customer_email` / `first_name` while the prompt read `caller_full_name` /
`caller_email` / `caller_first_name`. **Not one variable matched.** Retell leaves an unsent
variable in the prompt as the literal text `{{caller_first_name}}`, so the agent had no context at
all and could read the braces out to a caller. Nothing errored. It was only found by diffing the
two lists.

**So, every time, before you call a build finished:**

```
1. POST a real payload to the pre-call webhook and capture what comes back.
2. Regex every {{...}} out of the prompt.
3. Diff the two sets. Both directions.
   - in the prompt, not in the response  -> DEAD. The agent speaks the braces.
   - in the response, not in the prompt  -> harmless, but say so out loud.
4. The dead list must be empty. Not "nearly", empty.
```

#### `known_details` - the roll-up, and why the per-field variables are not enough

**A prompt can only read a variable it names**, and no prompt can name a custom field the client
adds next month. So harvesting every filled custom field into `field_key` variables is necessary
but not sufficient - most of them will never be read.

Always **also** build one `known_details` string, every filled field as `Label: value`, one per
line:

```
What kind of fuel does your boiler use?: Gas
What type of boiler do you have: System
When Are You Thinking About Replacing Your Boiler: 3-5 Weeks
```

That single variable carries everything the CRM holds, whether the prompt knows the key or not,
and it needs no prompt edit when the client adds a form question. Build it generically from the
live field map - never from a hardcoded list of keys.

#### Held is not the same as confirmed

The presence principle stops the agent *asking* again. It does not decide what it should
*confirm*. Those are different, and a prompt that misses the distinction either interrogates the
caller or sends an engineer to the wrong house.

| Kind of fact | What the prompt must say |
|---|---|
| Address and postcode | **Confirm out loud, always.** An engineer drives to whatever is written down |
| Anything that routes the job - fuel, appliance type | Confirm in **one closed question** - "that's mains gas, yes?" Never re-ask it open |
| Name | Confirm once, in one line |
| Email | Do not raise it at all |
| Survey detail - flue position, bedrooms, bathrooms, property type | **Never speak it.** Take it as read |

Spell out that a confirmation is one short yes-or-no question, one fact per turn, and that a
correction **replaces** the held value completely - because the corrected value is what reaches
the post-call analysis and the CRM.

#### What to ask for, and what never to ask for

Defaults for every WBT build. Depart from them only when a client explicitly asks.

| Detail | Rule |
|---|---|
| **Phone** | **Never ask for it and never confirm it.** On an inbound call you already hold the number they are ringing from, and it is the number the team will use. Do not read it back, do not offer the last digits, do not mention it at all. The only exception is a caller who volunteers that they want ringing on a *different* number - take that one and read it back once |
| **Email** | **Never ask for it.** It is a question that costs a turn, is misheard constantly down a phone line, and is almost never what the team actually uses to follow up. If the CRM already holds one, do not raise the subject either |
| **Name** | **Always end the call knowing their surname.** How you ask depends on what you hold - see below |
| **Address and postcode** | **One question, never two.** See the block below |

**Asking for a phone number or an email that you do not need is the fastest way to make a call feel
like a form.** Every question the agent asks has to earn its turn, and these two rarely do.

#### The name: ask for what is missing, and get it spelled

The commonest failure is asking for a "full name" when the CRM already holds the first name. The
caller then repeats what the business already knows, or - worse - gives a different name and you
end up with two.

```
first name held, surname missing  -> use the first name, ask ONLY for the surname
nothing held                      -> ask for the full name
both held                         -> confirm once, never ask
```

**Always have the surname spelled out**, whichever branch you took. It goes on a job sheet and into
the CRM, and a surname heard once down a phone line is the detail most often written down wrong.
Read the spelling back once, then stop until they confirm. If they will not spell it or find it
fussy, accept in one sentence and move on with what you heard - never ask twice.

Write the instruction generically. **Never hardcode a line like "okay John, what's your last
name?"** - give the shape and let the model word it, per 1.8.

#### The call flow: group questions into blocks

An agent that asks the postcode, then the job, then the name, then the address feels like a form
being filled in. Give it an explicit order and make it finish each block before the next:

```
1. THE JOB      what they need, and the questions that job requires
2. THE PERSON   their name
3. THE PROPERTY address and postcode, together, then read back
```

**The job goes first.** They rang about a job; who and where they are is admin, and admin comes
after you have listened. A caller asked for their postcode before anyone has heard their problem
feels processed, not helped.

Tell the agent to **announce a block in one line** before it starts asking - "let me take a few
details so the team can get back to you" - so several questions feel like one step.

State the exceptions explicitly, or the order becomes a straitjacket: safety first always; a poor
line or a caller in a hurry means name and number immediately; anything volunteered out of order is
taken there and then and never re-asked; and a clearly out-of-scope call stops rather than working
through the rest.

**Attribution rules.** Prior data came from a web form or chatbot, possibly weeks ago, possibly
typed by someone else in the household. So:

```
- Never say the customer told you any of it. "You mentioned", "you said", "you told us" are
  forbidden. Attribute it to the record: "I have got X down here", "our notes say X".
- Only three things are ever worth reading back: their name, which service it is, and the
  address before a visit. Never read back an age, condition, fault, make, or count.
- If they dispute, deny or do not recognise a detail, drop it instantly. Do not defend it, do
  not explain where it came from. "No problem at all, my mistake", then ask fresh.
```

That last rule exists because an agent once argued with a customer about their own boiler. It is
the worst thing a voice agent can do on a call.

**Background-only variables.** If the agent receives data it must never speak - surveyor detail,
property specifics - say so explicitly and give it exactly one permitted use:

> Never read any of it out and never refer to it. Use it for one thing only: if the customer
> raises it themselves, confirm it is already on file so they do not repeat themselves.

**The opening line, and why it usually does not belong in `begin_message`.** On an outbound
call the agent speaks first, and the natural greeting uses the lead's name - which is exactly the
variable most likely to be missing. `begin_message` is a fixed string: it cannot branch, so a
missing name gives you "Hi , this is Ruth" or, worse, the agent reading `{{lead_name}}` out loud
to a real customer.

So unless the first line is genuinely fixed, **leave `begin_message` unset and let the prompt
own the opening.** Retell then has the model generate the first turn, and the branch lives where
branches belong:

```
- With a name: greet them by it, then who you are, the company, and why you are ringing.
- Without a name: the same opening without it ("Hi there, this is ...").
- Treat the name as missing if it is empty OR not a real name - a placeholder, an email
  address, a company name, anything in double curly brackets. Never say those out loud.
- First name only, never the surname, never a title.
```

Three facts about the field that decide this for you:

| `begin_message` | What happens |
|---|---|
| unset / `null` | The model generates the first turn from the prompt. This is what you want when the greeting varies |
| a string | Spoken verbatim, every call, variables rendered blind. Fine only when the line never changes |
| `""` (empty) | The agent says nothing and waits for the caller. Inbound only, and rarely even then |

The cost is a little latency and some variation between calls, which is the correct trade for
never speaking a placeholder at a customer. Where you do keep a static `begin_message`, the
upstream workflow must send that variable on EVERY call, defaulted to something sayable.

### 1.6 Tool rules

**Keep TOOLS short.** One bullet per tool covering what it does, exactly when to use it, and the
one or two conditions that must hold first. Detail about *how* a tool behaves mid-call belongs in
the branch that uses it, not here - that is the one-block rule from 1.2.

```
- `tool_name` - what it does. Only when <condition>, only if <condition>. Tell the caller
  before you call it. If it does not work, <what to do> - never mention a technical problem.
```

Then declare what the agent **cannot** do, in the negative, as its own paragraph:

> You have **NO booking tools, NO calendar, NO way to reschedule or cancel, NO way to take a
> payment, NO way to look anything up, and NO way to send a text, an email or a link yourself.**

Retell agents will happily invent a capability they do not have, and an agent that claims to have
booked something is worse than one that says it cannot. The negative declaration is the only
reliable fix, and it must list the specific things this client's agent will be asked for.

**Put the tool's own guardrails in its `description` too, not only in the prompt.** The model reads
the tool description when it decides to call, and a rule that exists only in the prompt is a rule
it can skip past. The `end_call` ban on hanging up mid-question is the clearest example - it needs
to be in both places or it gets ignored.

### 1.7 Guardrails

Put a **precedence rule** at the top so unanticipated conflicts resolve correctly:

> These rules are non-negotiable. If a rule appears to conflict with an objective, the rule wins.

Then cover, at minimum: safety emergency for the trade (gas, electrical, water), vulnerable
callers, human handoff, aggression, do-not-contact, identity, and when to end.

**Bound your escalation triggers on both sides.** State the trigger and the non-triggers:

```
Escalate only when they clearly and repeatedly refuse to deal with an automated assistant.
Do NOT escalate because they asked for a callback, asked for a phone number, or said they
would like someone to contact them. Those are normal and you handle them.
```

Unbounded triggers cause an agent to escalate half its calls.

### 1.8 Hard rules for you, the prompt writer

1. **Never script dialogue** unless the exact wording is genuinely required - a safety number, a
   regulated disclosure. Where you give an example line, mark it as a shape and add *"Never read
   the example verbatim, vary how you word it."*
2. **Never duplicate a rule.** If two branches need the same rule, write it once above them.
   Verbatim duplication between sibling branches is the most common defect in a long prompt.
3. **Never state a fact the routing can contradict.** If Section 1 says the enquiry arrived "a
   few minutes ago" but Section 5 allows repeat attempts, you have created a conflict.
4. **Keep every branch in the same format.** If five job types say "collect these three and
   nothing more" and the sixth says "collect", the sixth will over-question.
5. **Never hardcode a value the model can be told to look up.** No caller's name in an example,
   no sample postcode presented as a line to say, no fixed sentence with a real person in it.
   Write the shape with a slot - `"Hi <their first name>, this is ..."` - never a filled-in one.
   **A real name in an example WILL be spoken to a real caller.** On the Essex build the example
   read `"I've got Jamie Whybrow down here"`, and the agent closed a call to a stranger with
   "goodbye Jamie" and wrote that name into the CRM as fact.
6. **Never invent, promise, re-ask, or act before conditions are met** - and say so in Global
   Rules.

### 1.8a Length is a feature. Keep the prompt small.

**The whole prompt is re-read on every single turn.** It is paid for in latency on every reply,
and instruction-following measurably degrades as it grows. A caller hears a long prompt as the
agent going quiet.

```
TARGET      6,000 - 8,000 tokens        roughly 24,000 - 32,000 characters
HARD CAP    8,000 tokens                past this you cut before you add anything
```

**Count it, do not estimate it.** Retell logs the real number on every call as
`llm input token length calculated { tokenLength: N }` in the call's public log - read it there
after a test call rather than guessing. Roughly, characters divided by four.

For reference: an Essex draft reached 45,571 characters and produced 1.7-second average replies
with spikes over 4 seconds - which callers reported as the line going dead. Cutting it 30% removed
no rule at all.

**Cut words, never rules.** A rule exists because a real call failed. The saving is always in how
it is written, not in what it says:

| Cut | Keep |
|---|---|
| Rationale sentences - "this matters because..." | The rule itself |
| The same rule restated in two objectives | One statement, referenced |
| Prose paragraphs | Bullet fragments and tables |
| Softeners - "it is important to", "please make sure you" | The imperative |
| Worked examples beyond the first | One shape per pattern |

**Deduplicate ruthlessly, because duplication is where most of the weight is.** Before delivering,
grep for the same instruction in more than one place. On Essex the postcode rules appeared in three
sections, the name rules in four, and address read-back in two. Each fact gets **one** home and
every other place points at it - "as Objective 9 sets out". This also stops the two copies drifting
apart, which is worse than the length.

**Write rules as bans, not preferences.** A model follows "never begin a turn with thanks" and
ignores "try to vary your acknowledgements". If a behaviour matters, state it as an absolute and
name the exact failure you are preventing - "thanks for that" on turn after turn is the clearest
tell you are a machine" beats "be varied".

**A rule the agent broke twice belongs in Global Rules, not in an objective.** Objective-local
rules are for things true only inside that objective. Anything the model keeps violating needs to
be where it reads it every turn.

### 1.9 The checklist. Run it before you say the prompt is done.

**Do not report a prompt as finished until every line here passes.** Several of these are
mechanical - actually run them, do not eyeball them.

**Structure**

- [ ] The ten sections of 1.1, in order, with those names. No extra sections, no numbering
- [ ] Every scenario is one self-contained block with `**Parent:**` and `**Children:**`
- [ ] Nothing about a scenario lives outside its own block
- [ ] CALL FLOW reads top to bottom in the order the call happens
- [ ] GUARDRAILS says it overrides everything above
- [ ] The H1 version number is the version it will publish **as**

**No scripted dialogue** - the one that gets missed

- [ ] `grep -o '"[A-Z][^"]\{20,\}"'` returns nothing the agent could read aloud
- [ ] No real name, postcode, address or phone number anywhere in an example
- [ ] PERSONALITY carries the standing "use your own words every time" instruction

**Variables**

- [ ] POST a real payload to the pre-call webhook, regex every `{{...}}` out of the prompt, and
      diff **both ways**. In the prompt but not in the response means the agent speaks the braces
- [ ] The dead list is empty. Not nearly empty. **Retell's own built-ins are the only exemption** -
      `{{current_time_<timezone>}}` is filled by Retell, not by your workflow
- [ ] The timezone in `{{current_time_...}}` came from `GET /locations/{id}` on **this** client's
      sub-account, not copied from the last build

**Size**

- [ ] Under the 8,000-token cap in 1.8a. Count it, do not estimate it
- [ ] Grep for the same rule stated twice. Each fact has exactly one home

**Content**

- [ ] Every fact the prompt tells the agent to give out is actually written in KEY FACTS - email,
      website, phone, hours, prices. A rule that points at a missing fact makes the agent invent one
- [ ] Any list the agent checks against - postcode prefixes, service areas, brands - was derived
      from the client's real data, not assumed
- [ ] Where a rule has escape clauses, they come **after** the instruction and say they only apply
      once it has been followed
- [ ] Held values are confirmed, never re-asked - and the prompt says which is which per field
- [ ] No conflicting instructions
- [ ] Every branch has a completion point
- [ ] Escalation triggers bounded on both sides
- [ ] Every branch formatted the same way as its siblings
- [ ] TONE requires warmth actively - reacting, fillers with a frequency, energy matching
- [ ] Audio tags match the voice model, or the prompt says none exist

**Then publish, and verify the publish.** Per 1.1: `update-retell-llm` writes to the draft only.
Read `is_published` back. A prompt change that is not published is not a prompt change.

### 1.10 The reference prompt

`prompts/example_voiecagent` in this project is a working prompt that gets all of the above right.
Read it before writing a new one. It is an outbound setter rather than an inbound receptionist, so
the branches differ - but the shape, the parent/child phrasing, the absence of scripted lines and
the way it makes the agent sound human are exactly what to copy.

---

## PART 2 - THE BUILD

Work through the phases in order. **Tell the user which phase they are on and what comes next.**
Each numbered item maps to a row on the Voice Agent QA sheet.

### PHASE 0 - INTAKE

**Do this first, every time, before writing anything.** Ask these as a short numbered list in
one message rather than one at a time, and wait for the answers. Do not start the prompt on
assumptions - a wrong agent name or a missed out-of-scope service means rewriting the prompt,
the voicemail message and the notification emails.

**The two source documents.** Ask for both by name, because they carry the answers to most of
what follows and the client has usually already given them:

1. **The requirement sheet** - the client's written spec. Read it for: services in and out of
   scope, the questions they want asked, what should be booked versus passed to the team, the
   escalation or transfer number, working hours, and the tone they want. Quote it back in your
   own summary so the client can correct you before you build.
2. **The Fathom recording** of the call where the agent was discussed with the client. This is
   where the *intent* lives - how they want it to sound, what they are worried about, the phrases
   they use for their own services, and anything they said but never wrote down. Ask for the
   share link. If the user cannot give you the recording, ask them to summarise what the client
   asked for on that call and treat their summary as the spec.

If either is missing, say so plainly and ask for it rather than guessing. If neither exists, ask
the questions below directly.

**The intake questions**

1. **Outbound setter or inbound receptionist?** This decides the whole workflow set - outbound
   gets five workflows, inbound gets four plus the caller-lookup function.
2. **What is the agent called?** Never assume, never reuse a name from another build. If the
   client has no preference, offer two or three that suit the trade and the voice.
3. **Which Retell voice?** Confirm the exact voice, and check its provider - audio tags need an
   ElevenLabs voice on `eleven_v3`.
4. **The company name exactly as the agent should say it out loud**, plus how to pronounce
   anything unusual. This goes in the pronunciation dictionary.
5. **Personality and tone in the client's own words.** Warm and unhurried? Brisk and efficient?
   This is what the Fathom recording answers best.
6. Client trade, services offered, service area, and **anything explicitly out of scope** -
   out-of-scope work needs its own guardrail and a polite decline.
7. Does it book appointments? If yes, which calendars, and **what are the real working hours?**
   Verify against the calendar itself, not what you were told.
8. Which GHL sub-account (location), and is the marketplace app installed?
9. Is there an escalation or transfer number, and when should it be used?
10. Which CRM custom fields already exist - **audit them, do not assume.** Count how many
    contacts have each field filled. A field with zero fills is dead and writing to it loses data.

**Before moving on**, play back a short summary: agent name, company, direction, services, what
gets booked, what gets passed to the team, and anything out of scope. Get that confirmed. It
takes one message and saves a rebuild.

### PHASE 1 - Credentials

Create `.env` in the project root. **The user provides the keys - never invent them.** Ask for
them if they are not already there.

```
retell_api_key=<from Retell dashboard - API Keys>
agent_id=<filled in after Phase 2 creates the agent>
N8N_API_KEY=<from n8n - Settings - API>
```

Add `.env` to `.gitignore` immediately. **Always redact these values in anything you print.**

Useful base URLs:

```
Retell   https://api.retellai.com          header: Authorization: Bearer <retell_api_key>
n8n      https://n8nserver.webuildtrades.com/api/v1    header: X-N8N-API-KEY: <N8N_API_KEY>
GHL      https://services.leadconnectorhq.com          headers: Authorization: Bearer <token>
                                                                 Version: 2021-07-28
```

> GHL sits behind Cloudflare and rejects requests with no browser-like `User-Agent` with
> **error 1010**. Always send one.

### PHASE 2 - The Retell agent

**QA row: "Prompt written and updated on the agent"**

Create the LLM and the agent, then set the config. These settings decide whether the agent
sounds smooth, and most are unset by default:

**On the LLM object** - the agent's brain:

| Setting | Value | Why |
|---|---|---|
| `model` | **`gpt-5.2`** | The default for every build. Never a mini or "fast" variant |
| `model_high_priority` | **`false`** | This is Retell's **Fast Tier**, and it is a **paid upgrade that doubles the LLM cost** - on `gpt-5.2`, $0.056/min becomes $0.112/min. Default is the right choice. Only turn it on if a client has a measured latency problem that the prompt length does not explain, and tell them what it costs |
| `start_speaker` | `agent` | |
| `begin_message` | **unset** - `null`, not `""` | `""` makes the agent wait for the caller **forever**. `null` lets the model generate the greeting, which is what allows it to use the caller's first name when there is one |

#### Use `gpt-5.2`. A smaller model does not save money and costs you the build.

**It is not slower in practice, which is the opposite of what everyone assumes.** Measured on real
calls in one account:

| Agent | Model | e2e latency, median p50 | LLM step |
|---|---|---|---|
| A live outbound setter | `gpt-5.2` | **1,420 ms** | 897 ms |
| A build on a mini model | `gpt-4.1-mini` | **1,709 ms** | 604 ms |

The reasoning model's own step is slower - 897ms against 604ms - and **the whole call is still
300ms quicker**, because a better model produces cleaner turns and far fewer repair loops. A weak
model mishears, reads the wrong thing back, gets corrected, and tries again; every one of those
round trips costs seconds, not milliseconds.

**And it is not cheaper.** Real billed figures: `gpt-4.1` is 4.50 c/min with no surcharge, while
`gpt-4.1-mini` was 1.92 c/min **plus a 9.20c per-call token surcharge** - so the mini model was
*more expensive* on a two-minute call.

> **Do not repeat this mistake.** An earlier build moved off `gpt-5.2` after a single slow test
> call, on the theory that "a reasoning model spends time thinking before the first token". The
> measurements above disprove it. If you think a model is too slow, **measure it across several
> calls before you downgrade** - and look at the prompt length first, because that is almost always
> the real cause.

**Speaking speed is not the LLM.** When a client says the agent talks too fast, the levers are
`voice_speed` on the agent and the read-back wording in the prompt. The LLM decides *what* is said,
never how quickly it is spoken. Changing the model to fix a pace complaint fixes nothing.

#### The two tiers - check the price before you switch one on

Retell sells each model at two prices, and the picker calls them **Default** and **Fast Tier**.
Fast Tier is the `model_high_priority: true` flag.

```
gpt-5.2   Default    $0.056/min
gpt-5.2   Fast Tier  $0.112/min      <- exactly double
gpt-5.1   Default    $0.040/min
```

**Default is the right setting for every build.** Fast Tier buys a dedicated capacity pool - the
same model, no better answers, just less queuing. Doubling a client's per-minute cost to shave
some milliseconds is not a trade you make on their behalf without asking.

> Before reaching for Fast Tier on a latency complaint, check the prompt length first (1.8a). An
> oversized prompt is the usual cause and it costs nothing to fix.

**On the agent object** - voice and call handling:

| Setting | Value | Why |
|---|---|---|
| `voice_model` | `eleven_flash_v2_5` **or** `eleven_v3` | A real trade-off - see Part 0. `flash` is 4 c/min and has **no audio tags**; `v3` is 20 c/min and does. **Whichever you pick, the prompt must match it** |
| `language` | `en-GB` | UK client |
| `voice_speed` | `0.9` | Slightly slower reads as calmer and more competent |
| `voice_temperature` | `1.1` | Some delivery variation between calls |
| `fallback_voice_ids` | one same-provider voice | A custom-voice outage otherwise kills the call |
| `enable_backchannel` | `true` | Sounds like listening |
| `backchannel_frequency` | `0.7` | |
| `backchannel_words` | `["mm-hm","right","okay","I see"]` | UK words, not "uh-huh" |
| `responsiveness` | `0.8` | |
| `interruption_sensitivity` | `0.3` | **Low on purpose.** High values let background noise stop the agent mid-sentence |
| `stt_mode` | `accurate` | Trade vocabulary is what general STT fumbles |
| `boosted_keywords` | trade vocab | e.g. `combi`, `flue`, `LPG`, `multi-split`, the client name |
| `pronunciation_dictionary` | agent name, trade terms | Native fix, more reliable than prompt instructions |
| `begin_message_delay_ms` | `500`-`800` | Stops the agent talking over "hello" or a voicemail greeting |
| `ring_duration_ms` | `20000` | Rings out **before** voicemail answers, so you get a clean `dial_no_answer` |
| `max_call_duration_ms` | `600000` | 10 minutes. The default is an hour |
| `end_call_after_silence_ms` | `20000` | |
| `reminder_trigger_ms` / `reminder_max_count` | `9000` / `1` | One nudge, not three |
| `denoising_mode` | leave default | `noise-cancellation` is right; the stronger mode clips quiet callers |
| `voicemail_option` | short static message | What to say if voicemail picks up |

**Two version facts that will confuse you if you do not know them:**

- `create-phone-call` uses the agent's **latest** version, not the latest **published** one. So
  a pushed prompt is live for test calls without publishing. Publish to pin a known-good build.
- Publishing publishes the current draft and immediately opens the next one, so `is_published:
  false` right after a successful publish is normal - it describes the new draft.

### PHASE 2b - The knowledge base

**Every agent gets one.** Without it the prompt has to carry every company fact, and a prompt
that is also a fact sheet gets long, contradicts itself, and still cannot answer the question the
caller actually asked. The split is simple: **the prompt is behaviour, the knowledge base is
facts.**

Attach it to the LLM in Retell. The agent retrieves from it only when a caller asks something
factual, so it costs nothing on the calls that never need it.

#### The one rule that governs everything in a KB

> **Every line must be safe to read out word for word to a customer.**

A knowledge base is retrieval text. The model can quote it verbatim, and sooner or later it will.
So a KB is not a working document and never a place to think out loud.

**Never put these in a KB:**

| Never | Why |
|---|---|
| The client's name attached to a decision - "the owner said not to mention coverage areas" | The agent can say it. The caller then hears internal politics, and it sounds like the company is hiding something |
| Instructions phrased as rules - "NEVER say the price" | Reads as an instruction to the caller. Write the answer instead |
| Open questions, conflicts, "unverified", "to confirm" | The agent will read the uncertainty aloud |
| Internal reasoning, source citations, timestamps, ticket references | Nothing a customer would ever hear from a receptionist |
| Anything you have not verified | A KB fact reaches a customer as company policy |

Those belong in a separate internal file next to the build, not in the thing the agent reads.

#### Write the answer, not the rule

This is the move that makes a KB safe. For every subject the agent must be careful about, do not
write the prohibition - **write the sentence you would be happy to hear it say.**

```
BAD   PRICES - never quote a price, not even a range, no matter how hard
      the caller pushes.

GOOD  Prices are not given over the phone. Every job is priced from the
      survey, because the cost depends on the property and the system it
      needs. Quotes are free and there is no obligation.
```

Both stop the agent quoting. Only one of them is fine if it comes out of the speaker. The hard
prohibition still exists - it lives in the prompt's guardrails, where the caller never sees it.

#### What goes in

Company identity - trading name, any second name customers use, address, phone, website,
years in business. Accreditations and memberships. The service list. Brands installed. The
survey - what it is, how long, free or not. Installation timescales. Finance, including any
regulated wording word for word. What the company does not do. Staff first names, so a caller
asking for someone by name is recognised. And the safe answer for every sensitive subject -
prices, savings, sizing, coverage, lead times.

#### Where the facts come from, in order of trust

1. **The client, on the onboarding call.** Their own words about their own business win.
2. **Their website**, read directly.
3. **Public registers** - TrustMark, MCS, Companies House, NICEIC. These are the ones to use for
   licence numbers and registered addresses, because directory sites carry stale addresses.
4. **Reviews** - useful for staff names and for spotting things the client forgot to mention.
   Never quote a review as a fact about the service.

**When two sources disagree, the KB carries the safe answer and the disagreement goes in the
internal file.** Hours are the usual one: the website says 7am to 7pm, the client said 9 to 5 on
the call. The agent cannot hold both, and the hours also drive the phone routing and the
callback promise, so somebody has to decide.

> If the site blocks automated reading - many are behind a WAF that resets the connection - ask
> the client to paste the page text rather than guessing, and say plainly that you could not read
> it. An invented fact in a KB is spoken aloud to a real customer as if it were policy.

### PHASE 3 - Post-call analysis fields

**QA row: "Post call analysis built for all the situations"**

Design the fields the agent extracts. Rules learned the hard way:

**Fill the client's own website forms before you design a single field.** This is the step that
tells you the truth, and nothing else does. A sub-account can carry 180+ custom fields, almost
all of them dead - leftovers from other trades, other templates, even other industries - and the
field list alone cannot tell you which ones are alive.

So, for each service line the agent handles:

1. **Submit the real form on the client's website**, with a recognisable test name.
2. **Open the contact that lands** and list the fields that came back non-empty - the GHL API is
   fastest: `GET /contacts/{id}` with the location token, then map each `customFields[].id`
   against `GET /locations/{locationId}/customFields`.
3. **Write down what you found**, per form, in a file that lives with the build. Which standard
   fields filled, which custom fields, which tags were added, and what the source was set to.
4. **Then design the post-call analysis to match.** Every analysis field the agent extracts should
   land in a field a form already fills, unless there is genuinely nowhere for it to go.

What this buys you, every time:

- **It shows which fields are actually live.** A field that a form fills on every submission is
  safe to write to. A field with an identical-looking name that nothing fills is a data grave.
- **It shows which questions the agent does not need to ask.** If the web form already captured
  property type, system size and timescale, the agent asking again is what makes a caller feel
  they are talking to a machine that does not know them.
- **It shows which questions the agent DOES need to ask.** A generic "contact us" form often
  captures nothing but a name and a free-text message, so those leads are exactly the ones where
  the agent has to do the work.
- **It gives you the round trip.** Send what the form captured into the call as dynamic
  variables, have the agent CONFIRM rather than re-ask, and have it return the confirmed value in
  the analysis - so the post-call workflow writes the same field every time and never has to
  care whether it was asked or merely agreed to.
- **It finds the client's own bugs.** Forms write literal `"null"` strings, cross-wired answers,
  and WordPress shortcode residue. You want to know before a workflow merges that into an email.

> **If the prompt names a variable, the pre-call webhook must send that key on EVERY call**, as
> an empty string when it is unknown. Retell leaves an unsent variable in the prompt as the
> literal text `{{customer_x}}` - and the agent reads it out to the caller. Keep the required
> keys in one list in the lookup workflow, and add to it whenever you add a question.

**Reuse before you create. Never create a field as a matter of course.** Most of what an agent
extracts already has a home: name, phone, address and postcode are standard contact fields, and
most accounts already carry a service or enquiry field the website forms write to. **List the
sub-account's existing custom fields first, and create only the ones genuinely missing.** You see
that list anyway when you wire the post-call analysis in GHL - read it there and map to what is
already in front of you.

Two fields holding the same answer is the Part 3 trap where the agent re-asks what it just
captured, because read and write point at different fields.

#### Start from the emails and work backwards. This is the rule.

**Design the notification emails FIRST, then create only the fields those emails print.** Not the
other way round. An analysis field exists to fill a line in an email or to decide a branch - if it
does neither, it does not exist.

The method, in order:

```
1. Decide how many emails the team actually gets.      usually 3 to 5, never one per service
2. Write each email out, line by line.
3. List every merge field those emails use.            this IS your analysis field list
4. Add only the enums a workflow branches on.          outcome, type, and the flags
5. Stop. Anything else is noise.
```

**A realistic count is 12 to 15 fields.** A build with 27 has roughly twice what it needs. On the
Essex build the first pass created 27, and cutting back to the ones the four emails actually print
left 14 - with no loss of function, because the thirteen removed had no line in any email and no
condition branching on them.

**The tests a field must pass. All three, not one:**

| Test | If it fails |
|---|---|
| Does an email print it? | Delete it |
| Does a workflow branch on it? | Delete it |
| Will it be populated on a real call more often than never? | Delete it |

**Fields that look useful and are not** - these get created on nearly every build and earn nothing:

- **Anything the agent never asks for.** If no objective asks the question, the field is empty on
  every call. An agent that never asks for a make and model does not need a make-and-model field.
- **A boolean that is true on almost every call.** `callback_requested` is true whenever the agent
  says "the team will get back to you", which is every call that is not spam. It cannot
  discriminate, so it cannot route anything.
- **A field for a tool the agent does not have.** No transfer tool means `transfer_attempted` is
  always false. No booking tool means no `booked_datetime`.
- **Anything Retell already produces.** `call_summary`, `user_sentiment`, `call_successful`,
  `in_voicemail`, `recording_url`, `transcript`, `disconnection_reason` all arrive natively. A
  duplicate will disagree with the original.
- **Two fields for one sentence.** `complaint_details` and `issue_reported` both capture the
  caller's account of the problem, and both get the same sentence.
- **An enum value duplicating a boolean.** If `is_emergency` is a boolean, `call_outcome` must not
  also carry an `Emergency Escalated` choice. One fact, one field, one name.
- **Survey-depth detail.** Bedrooms, bathrooms, flue position, radiator counts. The quote form and
  the survey collect these properly, and asking on a call makes it an interrogation.

**Prefer a boolean to an enum where the workflow just needs yes or no.** `is_emergency` as a
boolean is one clean GHL condition. `urgency_level` as `Emergency / Urgent / Routine` needs three,
and the middle value never means anything to anybody.

**Only create a field that has somewhere to go.** If no CRM custom field will store it, and no
condition will branch on it, it is noise.

**Every text field must end with this instruction:**

> Leave this COMPLETELY EMPTY if it was not established on the call - do not write 'not
> mentioned', 'unknown', 'n/a' or any other placeholder. The value is written straight into the
> CRM and shown in an email, so a placeholder reads as though the customer said it.

**Name fields service-line-neutral.** A field called `boiler_issue` stays empty on an air
conditioning call, so nothing gets written. Use `issue_reported`.

**One enum field carries the routing.** Combine service line and job type into a single value so
one condition covers both, and keep the vocabulary fixed and exact:

```
Boiler Installation / Boiler Repair / Boiler Service / Landlord Gas Safety Certificate /
Air Conditioning Installation / Air Conditioning Service / Air Conditioning Repair /
Not Established
```

Enums stay enums when a workflow matches them exactly. Everything else is free text with the
empty-not-placeholder instruction. `Not Established` is the honest signal that a call went
nowhere.

**Do not duplicate.** Two fields that capture the same sentence will both get the same sentence.

### PHASE 4 - GHL groundwork

| QA row | What to do |
|---|---|
| Marketplace app installed in the sub-account | Client installs it; you cannot |
| Location ID and access token came into the datatable | Verify a row appeared in `kCjYHcPq7VtcvoAl` |
| Agent ID and location ID added to the agents datatable | Add the row to `xQoeAdJAp7DTlnkc` yourself |
| "AI Calling" stage created in the lead pipeline | Client adds the stage |

The two n8n datatables are how every workflow resolves credentials without hardcoding:

```
kCjYHcPq7VtcvoAl   GHL marketplace app tokens    location_id -> access_token
xQoeAdJAp7DTlnkc   GHL agents                    agent_id    -> location_id
```

So any workflow that receives `agent_id` can reach the right GHL account with no client-specific
config in the workflow itself. **Always use this chain. Never hardcode a token** - the
`refresh_token` workflow rotates every token in that table **every 6 hours**, so a copied token
stops working the same day.

Both tables are filled automatically by the marketplace app workflows in Part 5, except the
`xQoeAdJAp7DTlnkc` row mapping the new agent to its location - **you add that one by hand**, and
nothing works until you do.

> The marketplace token is often missing `locations/customFields.write` and the opportunities
> scopes. Creating custom fields and reading pipelines then returns **401** and the client has
> to do it in the UI. Check before promising it.

### PHASE 5 - The workflows

#### Outbound - five workflows

| # | Workflow | Lives in | Does |
|---|---|---|---|
| 1 | Update the pipeline stage | GHL | New Lead -> AI Calling |
| 2 | Outbound call initiate | GHL -> n8n -> Retell | Sends the contact to n8n, which filters and calls Retell |
| 3 | Post call analysis | GHL | Writes fields, tags, stage moves |
| 4 | Internal notification | GHL | Emails the team on repair/service |
| 5 | Appointment booking | n8n | Retell custom functions for availability and booking |

#### Inbound - four workflows plus a lookup function

Inbound has **no workflow 2** - the customer rings you. Instead the agent looks the caller up the
moment it answers, using the **pre-call lookup** custom function. Attach it to the agent so it
knows who is calling and does not re-ask for details the CRM already holds.

Full node walkthrough, the returned shape and an improvement to make: **Part 4.3**.

#### Workflow 2 in detail - the initiate chain

The pattern that works, and why:

```
GHL custom webhook  ->  n8n webhook  ->  Retell create-phone-call
```

GHL posts **every** contact field. It cannot omit an empty one, so most arrive as `null`. n8n
strips the empties and placeholders, then calls Retell. That is what lets the prompt use the
presence principle from 1.5.

Reference: `https://n8nserver.webuildtrades.com/workflow/Rr6DimdaHvMj121G`

```
Webhook -> Agent -> Location -> Location -> Token -> Fetch Contact Tags
        -> Build Variables -> Payload OK -> Retell Create Call -> Build Response -> Respond
```

`Build Variables` must:

- treat as empty: `''`, `null`, `nil`, `none`, `n/a`, `na`, `undefined`, `not mentioned`,
  `not established`, `-`, `--`
- drop any value containing `{{` - an unrendered merge tag means the field does not exist
- strip WordPress shortcode residue: `Combi Boiler [xyz-ihs snippet="Combi-Boiler"]`
- normalise the phone to E.164 (`0...` -> `+44...`)
- pick the enquiry summary as the first non-empty of several free-text form fields
- **guard against feeding the agent its own output** - if the CRM's conversation-summary field
  holds a previous call summary, a regex like `/(^no conversation|the agent |voicemail|left a
  message)/i` must exclude it
- build two separate variables: things the agent **would otherwise ask** (`known_details`) and
  background it must **never speak** (`survey_details`)
- reject before spending a call if there is no usable destination number

Send only what the prompt reads. A typical set:

```
lead_name  service_type  enquiry_summary  known_details  survey_details  lead_tags
```

**Tags need an API call, not a merge field.** GHL has **no tags merge field** - `{{contact.tags}}`
in a custom webhook body arrives as the literal string `null`. Two options:

- fetch the contact from GHL by `contact_id` in n8n (**preferred** - reads tags at dial time, so
  it catches tags added after enrolment)
- or use GHL's **standard** Webhook action, whose fixed payload does include tags - but it has no
  editable body, so there is nowhere to put `from_number` and `agent_id`, and its custom-field
  keys are GHL's own naming

### PHASE 6 - Post-call analysis workflow

**QA rows: writes the contact fields, no-answer -> Follow Up 1, callback captured and tagged**

Retell posts to the workflow's inbound webhook. Facts you must get right:

**Only three events exist:** `call_started`, `call_ended`, `call_analyzed` (plus
`transcript_updated` and the `transfer_*` events). Anything else you have seen is not an event.

**`dial_no_answer` is not an event.** It is a value of `call.disconnection_reason`. Conditioning
on `event Is dial_no_answer` is never true and the branch silently never fires.

**On an outbound call the customer is `to_number`.** `from_number` is the agent's own caller ID.
Finding a contact by `from_number` creates junk contacts for your own number.

**Declining a call is usually `voicemail_reached`, not `dial_no_answer`.** The carrier forwards
to voicemail before Retell gives up. So the "not answered" branch needs several values OR'd:

```
voicemail_reached   user_declined   dial_no_answer   dial_busy   ivr_reached
```

And handle these separately, because a dead number should not sit in Follow Up forever:

```
dial_failed   invalid_destination   marked_as_spam
```

**In GHL, separate segments are OR'd and rows inside one segment are AND'd.** Five values in one
segment means "all five at once" - impossible. Use five segments.

**A true ring-out may never produce `call_analyzed`.** If the no-answer branch never fires, move
it above the `call_analyzed` gate and key it on `call_ended`.

**GHL writes merge values verbatim, including blanks.** A call that captured nothing will
overwrite good form data with empty strings unless the no-answer branch exits before the update
step. This is why the branch matters more than the tag.

**Tag routing needs exact, non-overlapping conditions.** `contains Boiler` also matches
`Boiler Installation`. Decide whether that is wanted, and remove tags before adding them so a
re-run does not stack.

Field paths, all prefixed
`{{inboundWebhookRequest.call.call_analysis.custom_analysis_data.`:

```
{{inboundWebhookRequest.call.call_analysis.call_summary}}       <- NOT in custom_analysis_data
{{inboundWebhookRequest.call.disconnection_reason}}
{{inboundWebhookRequest.call.to_number}}
```

> GHL inbound webhooks cannot verify Retell's HMAC `x-retell-signature`, so that URL is an
> unauthenticated endpoint that writes to the CRM. Fine, but know it is a deliberate trade. n8n
> can verify it if the client needs that.

### PHASE 7 - Internal notification

One template per service line. A boiler template asking about room counts is why a single
generic email never works. Merge only fields the agent actually captures, and remember a blank
merge field renders as nothing - which reads as though the customer said nothing.

### PHASE 8 - Appointment booking

Only for jobs that need a visit. Build it from the pattern in **Part 4.4** - one webhook with an
action router behind several Retell custom functions, and **five** actions including the
`check_user_details` one the existing workflows are missing.

The calendar is always resolved from the service line, never hardcoded. Prompt rules that must
accompany the tools:

```
- Always check the calendar before offering any time.
- You are not told today's date, so never state one from memory. Every date you say must come
  from something check_availability returned.
- Offer at most two options at a time, never a list.
- Only offer hours a person would accept for a home visit, roughly 9am to 5pm. If the calendar
  returns 7am or a Sunday, look at another day instead.
- Never say a booking value aloud - carry it silently and pass it back exactly.
- If the slot is gone when booking, apologise lightly, re-check, offer what is free. Normal.
- If booking genuinely fails, never mention a technical problem. Reassure that the team will
  confirm, note the agreed time, close normally.
```

**Check the calendar's real working hours before going live.** Slots existing before the
surveyor starts is a client-side calendar config problem that produces bookings nobody attends.

### PHASE 8b - Call transfer

**QA row: "Transfer reaches a real person"**

A transfer is the one tool that puts a live caller onto a real handset. Get the number wrong and
somebody rings a stranger. So it is built in two stages, always, and **never straight onto the
client's number**.

#### 1. Get the destination from the client, not from the sheet

Ask who a caller should be put through to, and **get that person's mobile in E.164** - `+44...`,
no spaces. A name is not a destination. Neither is a CRM staff record: GHL/LeadsHub users take
calls in the app, and Retell can only dial a number.

Check the transcript for two separate answers, because they are usually different:

- who a general "can I speak to someone" goes to
- who an **emergency** goes to, and **whether they are available out of hours** - if the answer is
  no, the prompt must take details instead, never attempt a transfer

#### 2. Build it with a TEST number first

Ask the client, or use your own handset. Put the test number in
`transfer_destination.number`, and **record both numbers in `functions/retell-tools.json`** so
the live one is not lost and the swap is one edit:

```json
"_transfer_numbers": {
  "TESTING": "+44...",
  "LIVE": "+44...",
  "currently_active": "TESTING",
  "switch_to_live_when": "a test call transferred end to end and was answered"
}
```

```json
{
  "type": "transfer_call",
  "name": "transfer_call",
  "description": "... ONLY during office hours ... ONLY when the caller clearly wants a person. Tell the caller before you call it. Never for a cold sales call, a scam call, a supplier or a job application.",
  "transfer_destination": { "type": "predefined", "number": "<TEST NUMBER>" },
  "transfer_option": { "type": "cold_transfer", "show_transferee_as_caller": false }
}
```

**Cold, not warm**, when there is a single destination and no reception desk to brief - a warm
transfer is just a delay the caller sits through. `show_transferee_as_caller: false` so the
recipient sees the business number and knows it came through the system.

#### 3. Push it correctly

**Send `general_tools` together with `general_prompt`.** A partial `PATCH` to
`update-retell-llm` wipes the tools and returns 200 - see Part 3. Then read the tools back off
`get-retell-llm` and confirm the number is the one you intended.

#### 4. Test, then swap

Ring the agent, ask for a person, and confirm the test handset actually rings and connects. Only
then change the number to LIVE, push again with `general_tools` + `general_prompt`, read it back,
and publish.

#### The trap: transferring back to a phone that already did not answer

If the client's setup rings their staff first and only hands to the agent after N seconds - which
is the normal inbound setup - then **by the time the agent is speaking, that person has already
not answered once.** Transferring to the same phone rings out a second time and loses the caller.

Ask the client whether the transfer should go **direct to a mobile**, bypassing that ring group.
If it cannot, say plainly that the transfer will usually fail and that taking details is the
better outcome.

#### What the prompt must carry alongside it

```
- Check the hours before transferring. Out of hours, do not offer one at all.
- Tell the caller you are putting them through before calling the tool.
- If it does not connect, never mention a technical problem - "nobody's free right at this
  moment", then take the details as normal.
- Never transfer a cold sales call, a scam call, a supplier or a job application.
```

And in Guardrails, bound the escalation trigger on both sides, per 1.7 - a caller asking for a
callback or a phone number is **not** a transfer request.

### PHASE 9 - Number and go live

**QA row: "Real number added to Retell and set on the voice agent"**

Buy the number in Twilio, then bring it into Retell by Elastic SIP Trunking and
`import-phone-number`. Two typos that have each cost a day:

- the Termination URI must be exactly `<label>.pstn.twilio.com` - **twilio, one L**
- the SIP username **cannot contain spaces**

If a number is in Retell but calls do not arrive, `list-phone-numbers` shows the stored
termination URI and username - diagnose from there rather than the Twilio console.

### PHASE 10 - QA before handover

Build the QA sheet from `tools/build_qa_sheet.py` if the project has it, or reproduce these rows.
Walk the client through them.

**Outbound**

```
[ ] Prompt written, published, and the publish verified with is_published
[ ] LLM model is gpt-5.2 - not a mini or fast variant
[ ] voice_model and the prompt agree on whether audio tags exist
[ ] Post call analysis built for all the situations
[ ] Marketplace app installed in the sub-account
[ ] Location ID and access token came into the datatable
[ ] Agent ID and location ID added to the agents datatable
[ ] "AI Calling" stage created in the lead pipeline
[ ] Workflow 1 - move the lead from New Lead to AI Calling
[ ] Workflow 2 - initiate the call
[ ] n8n webhook URL added in the custom webhook to initiate the call
[ ] Custom webhook sends all the contact custom fields to n8n
[ ] Workflow 3 - post call analysis
[ ] Workflow 4 - internal notification
[ ] Workflow 5 - appointment booking
[ ] Post call analysis updates the contact custom fields
[ ] If the lead did not pick up, move the lead to Follow Up 1
[ ] If the lead asks for a callback, save the date and time in the custom field
[ ] If the lead asks for a callback, add the tag and move the lead to Follow Up 1
[ ] Real number added to Retell and set on the voice agent
```

**Inbound** - the same list without "Workflow 2" and the two custom-webhook rows, plus:

```
[ ] get_user custom function attached to the agent and returning the contact
[ ] Number pointed at the inbound agent
[ ] Inbound webhook on the number returns every variable the prompt reads - diff both lists
[ ] Transfer tested on a TEST number and answered, before the client's number goes on
[ ] Transfer destination switched to the live number, read back off get-retell-llm
```

Also record on the sheet: the n8n workflows folder link, the Retell agent link, the LeadsHub
workflows folder link, the client name, the Fathom recording, and the requirement sheet.

**Test without spending a call.** POST to the initiate webhook with an empty `phone`. The
validation node rejects it with "no usable destination number" before the Retell node runs, and
you still get to inspect every variable the agent would have received.

---

## PART 3 - TRAPS THAT HAVE ACTUALLY COST CALLS

| Symptom | Cause |
|---|---|
| Agent "hallucinates" a detail the customer never gave | It did not. Data written into a CRM field by an earlier test came back in `known_details`. Check the contact before blaming the model |
| Agent argues with a customer about their own words | Missing the drop-instantly rule in 1.5 |
| Agent re-asks what it just captured | Read and write pointed at different custom fields. The initiate workflow, the post-call workflow and the emails must all use the same field |
| A variable in the prompt does nothing | It is never sent. Dead variables are silent - cross-check prompt against workflow |
| `{{service type}}` ignored | A space in the key. The prompt reads `{{service_type}}` |
| Agent picks the wrong branch | It accepted "yeah" as an answer to an either/or question, or decided from a cut-off reply. Add: *"'Yes', 'yeah', 'yep' or 'okay' is not an answer to an either/or question"* |
| Nothing written for one service line | Analysis fields were named for the other one (`boiler_issue` on an aircon call) |
| Writes go nowhere | Target custom field has 0 fills across all contacts - it is dead. Audit fill counts first |
| Agent hangs up in 40 seconds | Ended on an answer it did not understand. Add: *never end on a garbled reply; ask once more in the simplest words* |
| Agent asks a compound question on a bad line | Add the one-short-question-at-a-time rule for poor audio |
| CRM values look wrong in emails | WordPress shortcode residue from the website forms. Strip in n8n |
| Agent enquiry summary is its own previous output | The conversation-summary field is both read and written. Add the agent-output regex guard |
| Form field holds the wrong answer | Client's website form is cross-wired. Verify against real contacts, then tell the client - it is not fixable from the agent side |
| GHL condition never fires | Wrong payload path, or a value that never occurs. Capture a real sample and read it |
| n8n node returns no items and the chain stops | Set `alwaysOutputData` and `onError: continueRegularOutput` on any lookup that may miss |
| Placeholder text appears in the CRM or an email | An analysis field is missing the empty-not-placeholder instruction |
| **Agent speaks `{{first_name}}` out loud, or has no context at all** | The workflow and the prompt use different names for the same fact. Diff both lists - see 1.5 |
| **Tools vanish from an agent after a prompt push** | A partial `PATCH` to `update-retell-llm` **wipes `general_tools`**. Sending only `general_prompt` left an agent with `end_call` alone, HTTP 200, no warning. **Always send `general_tools` with `general_prompt`**, and read the tools back afterwards |
| A prompt looks like mojibake (`Â·`) when you read it back | Only on Windows. `json.load(open(path))` defaults to cp1252. Pass `encoding='utf-8'`. The live prompt is fine - do not "fix" it with a re-push |
| `create-knowledge-base` returns 500 on every attempt | `knowledge_base_texts` and `knowledge_base_urls` must be **JSON strings**, not `field[0][title]` bracket form. Bracket form 500s; more than a few of them 413s |
| **Agent speaks a name the caller never gave, and it lands in the CRM** | A real name in a prompt example. Use slots, never filled-in names - see 1.8 |
| **Agent hangs up the moment it asks "anything else?"** | The close written as one step. Make it three turns and ban `end_call` in the same turn as a question - in the prompt AND in the tool description |
| **Agent recites the answer options** - "working fine, working but unreliable, not working, or..." | An objective listing expected answers reads as a menu. Say the list is for sorting the reply into, never to read out |
| **Agent asks for something the CRM already holds** | The prompt says "present means known" but never says that settles it. Say outright: what arrived is a question already answered |
| **Agent asks the postcode, then the address later** | Two asks for one fact. Take address and postcode as ONE question |
| **The agent's own summary appears as customer context** | Post-call analysis writes into custom fields; the pre-call lookup then harvests them. Exclude agent-written keys from the roll-up - see 4.3 |
| Crawled website content makes the agent contradict the client | The site's marketing copy is not the spec. Essex's site says "fixed price" everywhere; the client said explicitly it is **not** fixed. Put hand-checked facts in the KB, not a crawl |

---

## PART 4 - THE n8n WORKFLOW LIBRARY

Everything lives in the n8n folder **`Market Place App For Voice Assistant`**, inside project
`7p3YVxb6otL9F2Kc`. Read the existing workflows before building anything - copying a working one
and changing the client-specific parts is always faster and safer than starting fresh.

```
Market Place App For Voice Assistant/
├── Pre-call analysis/                      folder N2RwZgZAxTBIx2Bp   -> INBOUND only
├── Voice agent outbound call (GHL - Retell)/ folder g2lJPFMQNDutm5ro  -> OUTBOUND only
├── Booking for different companies/         folder ExFncWL8etwEcz7j   -> either, if it books
├── GHL Voice Agent - Install/Uninstall      hKcke8iC8uw1kT5P          -> shared plumbing
├── refresh_token                            Br8aEwlEnBkB3pdI          -> shared plumbing
└── oAuth                                    Urnx5kzxJVRaX4DT          -> shared plumbing
```

Folder URLs are `https://n8nserver.webuildtrades.com/projects/7p3YVxb6otL9F2Kc/folders/<id>/workflows`
and a single workflow is `https://n8nserver.webuildtrades.com/workflow/<id>`.

> The n8n public API does **not** return folder membership, so `GET /workflows` cannot tell you
> which folder a workflow is in. Use the UI for that. Workflows also get renamed as they take on
> more clients, so **trust the ID, not the name.**

### 4.1 The shared marketplace-app plumbing - built once, never per client

These three keep the GHL tokens alive for every client. You do not rebuild or copy them; you
only check that a new client's row appeared.

**`oAuth` - `Urnx5kzxJVRaX4DT`** · `GET /webhook/voice-redirect-oauth`

```
Redirect Webhook -> Get Config -> Exchange Code For Token -> Build Row
                 -> Save Tokens (Upsert) -> Respond Success
```

The OAuth redirect target. When someone installs the marketplace app, GHL sends them here with a
`code`; this exchanges it for tokens and upserts the row into `kCjYHcPq7VtcvoAl`.

**`GHL Voice Agent - Install/Uninstall` - `hKcke8iC8uw1kT5P`** · `POST /webhook/voiceapp-install`

```
App Install Webhook -> Is Install?   -> Get Agency Token -> Mint Location Token
                                     -> Build Row -> Save Row (Upsert)
                    -> Is Uninstall? -> Delete Row
```

The app-event handler. On install it mints a **location-level** token from the agency token and
upserts it; on uninstall it deletes the row. The `Mint Failed (check here)` node is where a
failed install lands - look there first when a client says they installed the app but no row
appeared.

**`refresh_token` - `Br8aEwlEnBkB3pdI`** · schedule, **every 6 hours**

```
Every 6 Hours -> Get Config -> Get All Token Rows -> Refresh Token
              -> Build Row -> Save Refreshed Tokens
```

Rotates every token in the table. `Refresh FAILED (check here)` collects the ones that did not
refresh - a client whose API calls suddenly 401 usually appears there.

### 4.2 Outbound only - the call initiator

**Folder `g2lJPFMQNDutm5ro`** · workflow **`Rr6DimdaHvMj121G`** ·
`POST /webhook/voice-outbound-call`

This is the workflow described in Phase 5. **One workflow serves every outbound client** - it is
multi-tenant by design, which is why its name lists the clients using it rather than naming one.
Add a client by adding their row to `xQoeAdJAp7DTlnkc` and pointing their GHL webhook here.
Do not clone it per client.

```
Webhook -> Agent -> Location -> Location -> Token -> Fetch Contact Tags
        -> Build Variables -> Payload OK -> Retell Create Call -> Build Response -> Respond
```

### 4.3 Inbound only - the pre-call lookup

Fires **before the call connects**, set as `inbound_webhook_url` on the Retell phone number - not
as a custom function. Retell waits for the reply, then injects it as dynamic variables, so the
agent knows who is ringing before it says a word.

> **Build one per client.** The old shared multi-tenant flow (`RBQrF1xqttl8QNDN`,
> `/webhook/get_user`) resolved the client from `agent_id` through a second datatable. It is kept
> only for the agents already pointing at it. **Do not add new clients to it** - one client's edit
> changes every other client's calls, and that has already happened twice. A per-client copy costs
> ten minutes and cannot break anybody else.

**Reference build:** `keystone precall` (`J3P9kaUJLK3ObO2L`, `/webhook/keystone-precall`).
Generator: `tools/build_keystone_precall.py`. Copy it, change `LOCATION_ID`, change the webhook
path, done.

```
Webhook -> Extract Call -> Get Token -> Ready? -> Can Look Up? -T-> Get Timezone -> Fetch Field Map
                                                                 -> Find Contact -> Build Variables -+-> Respond
                                                  -F-> Build Empty ---------------------------------+
```

| Node | Does | Why it has to be there |
|---|---|---|
| **Webhook** | `POST`, `responseMode: responseNode` | Retell **waits** for this before greeting. Any other response mode replies instantly with nothing |
| **Extract Call** | Reads `from_number` out of the call metadata, normalises to E.164 | Never `args.phone` - the model mis-hears digits. GHL will not match `07…` |
| **Get Token** | One row from the tokens datatable, filtered on `location_id` | The token is refreshed hourly by the OAuth flow. **Never hardcode one** - GHL access tokens expire in 24 hours |
| **Ready?** | Sets `ok` plus a reason: `no_token`, `no_caller_number` | One place decides. A withheld number is normal, not an error |
| **Can Look Up?** | If | Splits success from the always-reply path |
| **Get Timezone** | `GET /locations/{id}` -> `timezone` | The client's **own** timezone. See the clock block below |
| **Fetch Field Map** | `GET /locations/{id}/customFields` | The only thing that turns an opaque field id into a readable key. Needs `locations/customFields.readonly` |
| **Find Contact** | `GET /contacts/search/duplicate?locationId=&number=` | The lookup |
| **Build Variables** | Strips empties, drops plumbing, builds `known_details` and the clock | Below |
| **Build Empty** | Returns the clock and no contact variables | **Retell must always get a reply.** A timeout means the caller hears silence before the greeting |

Every HTTP and datatable node carries `alwaysOutputData: true` and
`onError: continueRegularOutput`. A 401 or an empty match must never halt the chain.

**The response shape** - anything else is ignored silently, with no error:

```json
{ "call_inbound": {
    "dynamic_variables": { "first_name": "...", "known_details": "...", "office_open": "yes" },
    "metadata": { "contact_id": "...", "lookup_reason": "ok" } } }
```

#### Naming and stripping - the two rules that make the prompt work

1. **Bare GHL fieldKey, never prefixed.** `contact.policy_number` -> `policy_number`. Standard
   fields keep their GHL names: `first_name`, `last_name`, `email`, `phone`, `tags`. See 1.5.
2. **Send a variable only when it holds a value.** Empty, `null`, `N/A`, `none`, `not discussed`,
   `undetermined` are all dropped. This is what makes the presence principle true - a label the
   prompt can see always holds a real answer.

Also drop CRM plumbing the agent cannot act on - `bot_automate`, `bot_status`, and any field your
own post-call workflow writes back (`call_summary`, `route`). Match on the fieldKey, never a field
id, so the list holds across sub-accounts.

Then build **`known_details`** - every filled field as `Label: value`, one per line - so a field
the client adds next month reaches the agent with no edit to the workflow or the prompt.

#### The clock - use Retell's built-in, with the sub-account's timezone

**A language model has no clock.** It will guess the hour, and it guesses wrong. An agent with an
8am-5pm transfer window and no clock will transfer at 9pm, straight into the office answerphone -
the caller then believes they were put through and is talking to a machine.

**Do not compute the time in n8n. Retell has a built-in variable that does it live:**

```
{{current_time_<IANA timezone>}}        e.g. {{current_time_Europe/London}}
```

Retell fills this itself on every call, in that timezone, already handling daylight saving. It
needs no workflow, cannot arrive empty, and cannot go stale mid-call - which a value captured in
the pre-call webhook does, because a call that starts at 16:58 would otherwise still think it is
16:58 twenty minutes later.

**The timezone in that variable name is per client. Read it from their sub-account, never
hardcode it:**

```
GET /locations/{locationId}     ->  { "location": { "timezone": "Europe/London", ... } }
```

Do that lookup once, during Phase 0 or Phase 2, and write the result into the prompt. A zone
copied from the last build is correct for exactly one client and silently wrong for the next one -
the agent keeps office hours in the wrong country and nobody notices until a transfer fails at
nine in the evening.

**Every prompt that mentions time at all must use this variable**, and must say plainly that it is
already local, that it already handles summer time, and that the agent must never convert it,
never add or subtract hours, and never work the date out from its own head.

> **It is a Retell built-in, not something your workflow sends.** So it will show up as a "dead
> variable" in the 1.9 diff, because the pre-call response does not contain it. That is expected -
> exclude Retell's own built-ins from that check rather than trying to send one.

#### Before you call it finished

Run the 1.5 dead-variable diff. POST a real payload, regex every `{{...}}` out of the prompt, diff
both ways. **In the prompt but not in the response means the agent speaks the braces to a
customer.** Then point the Retell number's `inbound_webhook_url` at the new path - and change the
prompt's variable names in the **same** deploy, or every one of them dies at once.

### 4.4 Booking - and the flow that is missing

**Folder `ExFncWL8etwEcz7j`** currently holds two, one per client, identical apart from the
webhook path and the calendars:

| Workflow | ID | Webhook |
|---|---|---|
| GHL Appointments for valley gas | `shoeSgosZjQKcdo4` | `/webhook/appointments` |
| GHL Appointments for JA Plumbing and Heating | `J0KfGZlZAt9p3KpA` | `/webhook/ja-appointments` |

Both are a single webhook with an action router, so one workflow backs several Retell custom
functions:

```
Webhook -> Config -> Extract Args -> Agent -> Location -> Location -> Token
        -> Route by action
              ├── check_availability -> Get Calendars -> Pick Calendar
              │                      -> Get Free Slots -> Format Slots
              ├── book               -> Find Contact -> Contact Exists? -> Have Contact?
              │                      -> Create Contact -> Contact Id
              │                      -> Get Calendars (book) -> Pick Calendar (book)
              │                      -> Create Appointment -> Book Result
              └── reschedule|cancel  -> Find Contact (manage) -> Get Their Appointments
                                     -> Pick Appointment -> Found Appointment?
                                     -> Update Appointment -> Manage Result
        -> Respond to Retell
```

**Copy this shape for any new booking build.** Points worth keeping:

- **One webhook, one `Route by action` switch.** Each Retell custom function posts the same URL
  with a different `action`, so there is one workflow to maintain rather than five.
- The calendar is resolved from the **service line**, not hardcoded, via `Pick Calendar`.
- `book` creates the contact if it does not exist, so a caller with no CRM record can still book.
- `Unknown Action` and `No Appointment` are real branches - an unrecognised action returns a
  usable message instead of failing silently.
- Everything answers through one `Respond to Retell` node, so the agent always gets a reply.

**The gap: there is no `check_user_details` action.** Both existing workflows route only
`check_availability`, `book` and `reschedule|cancel`. So a booking agent cannot look a caller up
mid-call, and it has to ask for details the CRM already holds.

**Every new booking workflow must route five actions:**

```
check_user_details    look the caller up and return name, email, tags, existing appointments
check_availability    return genuinely free slots from the right calendar
book                  create the appointment, creating the contact first if needed
reschedule            move an existing appointment
cancel                cancel an existing appointment
```

`check_user_details` is the same work as the inbound pre-call lookup in 4.3, so build it by
adding a fourth route to the switch that reuses that logic rather than as a separate workflow.
Return the same shape, and let the prompt treat a present field as known.

### 4.5 Conventions when you add to this library

- **Put it in the right folder.** Pre-call analysis, outbound call, or booking. A workflow in the
  project root is assumed to be shared plumbing.
- **Prefer multi-tenant over per-client.** Resolve the client from `agent_id` through the
  datatables. Clone only when a client genuinely needs different logic, not different values.
- **Every lookup that can miss needs `alwaysOutputData: true` and
  `onError: continueRegularOutput`.** An n8n node returning zero items stops the chain, and the
  call fails silently.
- **Match the `typeVersion` of the nodes in the existing workflows** - `dataTable` is `1.1` and
  `httpRequest` is `4.2`. A wrong version fails at runtime, not at save time.
- **Validate before spending money.** Reject a call with no usable destination number before the
  Retell node, and return a clear reason.
- **Always send a browser-like `User-Agent`** on GHL calls, or Cloudflare answers **error 1010**.

---

## PART 5 - HOUSE CONVENTIONS

- **Never publish a Retell agent, push a prompt, or place a live call unless asked.** Make the
  change, describe it, offer to publish. Test calls go to real phones and real client accounts.
- Keep the prompt in `prompts/` as markdown under version control. It is the source of truth;
  Retell holds a copy.
- Anything generated - a QA sheet, a report - gets a generator script in `tools/`. Hand-editing
  generated output loses the change on the next run.
- Document each decision in `docs/` as you go: the field audit, the webhook payload, the field
  map, the email templates. The next person needs the *why*.
- `.env` is gitignored and always redacted in output.
- Audit the CRM with real counts before designing anything. "Which fields does the client
  actually use" is an empirical question, and the answer is usually "far fewer than exist".
- **Nothing about the agent's identity is a default.** The name, the company, the voice and the
  personality are per-client and come from Phase 0. Copying them from the last build is the
  fastest way to ship a prompt that says the wrong company name on a live call.
- For GHL workflow prompts, use the **`ghl-workflow-prompt`** skill. GHL workflows fail silently,
  so every value the builder cannot infer becomes a blank field that breaks at runtime.
