# Ideological Turing Test game ("OneOfUs")


## AI planning
- https://claude.ai/chat/574ff6bb-737a-4973-ad8f-4f225ae809f4
- https://gemini.google.com/app/7631690d434090cb
- https://chatgpt.com/c/6924aa6a-c87c-832d-a9cd-6f3c94d5cbc0


## Existing work
- www.ituringtest.com but you have to judge others' work, not submit your own responses. Also not very fun
  (no instant results, need to fill out info to get score, etc)
- www.debate-devil.com and deepgram.com/ai-apps/opinionate on debating side
- Anthropic putting Claude and other models through ITT: https://www.anthropic.com/news/political-even-handedness
- not-v-interesting-seeming but on the topic: https://arxiv.org/pdf/2506.14645 

## Plan
- We can have a singleplayer version where there's an LLM grader
- A multiplayer mode where you submit responses and other humans judge is further along the roadmap.
  - You need to rely on self-reports of political alignment
  - Would need LLM moderator to prevent profanity
  - User account management, etc

### Mechanics
- We should frame the task ina  more interesting way than "write a 200-word response from the position of P 
  about XYZ". 
  - Some Claude-generated ideas:
    - Tweet battle: "You're a [conservative/progressive] account with 50k followers. Tweet thread (3 tweets) about [issue]"
    - Letters to MPs/representatives: "Write to your MP as a concerned [demographic] asking them to vote [for/against] - [specific bill]"
    - Reddit comment: "You're in r/[relevant_sub]. Someone just posted [provocative take]. Write a response defending [opposite position]"
    - WhatsApp family group: "Your [politically-opposite relative] just sent [hot take] in the family group. Respond without starting a fight"
    - Dating profile political question: "Hinge asks: 'What's a political cause you care about?' Answer as someone who [position]"
    - Pub argument: "You're at the pub. Someone says [claim]. Make the case for why they're wrong, from a [position] perspective"
    - Think-piece headline: "Write the opening paragraph of a Guardian/Telegraph opinion piece titled: '[provocative headline]'"
    - Protest sign: "You're at a [type] protest. Your sign needs to be punchy but authentic. What does it say? (+ one sentence explaining why)"
    - Comment under a news article: "You're commenting under [recent news story]. Make the [left/right] case in a way that gets upvoted"
    - Talk radio call-in: "You've got 30 seconds on [host]'s show. Make your point about [issue] from a [position] view"
- Gemini had a nice idea that the user could be dropped into a chatroom with several other NPC LLMs from P position,
  and they need to be the "undercover agent" that doesn't get ratted out over an extended conversation i.e. 
  repeated game, rather than one-shot. I think this could be a lot of fun.
    - However, high inference costs? Also Gemini points out latency could make UX terrible.
    - Some similar Gemini suggestions:
      - You are in a #general Slack channel at a large tech company. The CEO posts a vague, "neutral" update about a controversial policy.
        The Task: You must signal support/dissent to your specific political faction without alerting HR or the "normies."
          - However, not necessarily very _political_
      - Family WhatsApp group with Misguided Uncle Dave
      - Dating app simulator (hmm, not sure how natural this one feels. But sth about men vs women divide would be interesting)
      - The Reply Guy (Twitter) -- You are a covert [Liberal] trying to build clout in a [Conservative] Twitter circle (or vice versa),
        replying to a viral tweet from a major figure. (this now stretches into "how well can you dryly parody people")
- ChatGPT ideas:
  - Diary entry in response to headline
  - Agony aunt column from a particular political orientation
- Various LLMs suggest "level up" mechanics, e.g. "you unlocked Liberal, now try XXX"

### Grading
- See the Anthropic paper for some thoughts.
  - Can I use their "paired prompt evals?"
  - Might be helpful to switch between different LLMs as grader. Although Claude is free for me and others not...
- Design a rubric and system prompt
  - Should consider whether it's a steelman, length of answer, tone, vocabulary & use of shibboleths/in-group language, 



## Notes
- Would be good to collect self-reports on political alignment etc from the start, since then you can use
  the v1 resposnes as training etc.