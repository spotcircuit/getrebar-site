---
title: "Hello, Rebar"
slug: "hello-rebar"
description: "Why we built Rebar, what it does, and why Claude Code's session amnesia is worth fixing."
date: "2026-04-16"
author: "SpotCircuit"
tags: ["rebar", "claude-code", "intro"]
---

Claude Code is remarkable at writing code — and catastrophic at remembering what it wrote yesterday.

Every session starts from zero. You re-explain the architecture. You re-explain the conventions. You re-explain *why* the auth middleware is structured the way it is. Then the next day, you do it all again.

## What Rebar is

Rebar is 23 slash commands that give Claude Code long-term project memory. Not chat history. Not vector search over old transcripts. **Structural memory**: configuration files the model reads every session, plus a validation loop that keeps them honest.

The key files:

- `expertise.yaml` — project state, facts, decisions, gotchas
- `.claude/memory/` — user and feedback memories, lightweight
- `wiki/` — durable, human-readable knowledge

Before every session, Claude reads these. It already knows. You get to skip the 15-minute reintroduction and start making changes.

## The validation loop

Memory that isn't validated rots. A six-month-old note that says `getCwd()` lives in `utils/path.ts` is worse than useless once someone renames it — Claude will confidently use the wrong name.

Rebar's `/improve` command checks observations against live code. Promotes what's true. Discards what's stale. Your context gets *more accurate* over time, not less.

## What's next

This blog is where we'll document the patterns that come out of running Rebar across real engagements:

- When structural memory beats retrieval, and when it doesn't
- Patterns for capturing non-obvious decisions without bloating context
- Workflows that compound across sessions instead of restarting them
- What we got wrong and had to fix

Thanks for reading. If you want to try Rebar, clone [the repo](https://github.com/spotcircuit/rebar) — the commands work out of the box.
