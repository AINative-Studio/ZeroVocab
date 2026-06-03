For AINative, I would structure this as a **ZeroDB-native, agent-first backlog** following your Semantic Seed Coding Standards V2.0, with every story being independently testable using BDD and TDD.

# Release Plan

| Release | Goal                       |
| ------- | -------------------------- |
| MVP-1   | Vocabulary Capture         |
| MVP-2   | ZeroMemory Integration     |
| MVP-3   | AI Learning Coach          |
| MVP-4   | GraphRAG Knowledge Graph   |
| MVP-5   | MCP & Agent Ecosystem      |
| MVP-6   | Enterprise & Team Learning |

---

# EPIC 1: User Management & Personal Learning Profile

## Goal

Allow users to create a personalized vocabulary memory system.

---

## Story 1.1 Create User Profile

### User Story

As a user

I want a profile

So that my vocabulary memories are associated with me.

### Acceptance Criteria

Given a new user

When account creation completes

Then:

* user record exists
* default language is stored
* learning preferences are initialized
* profile is linked to ZeroMemory namespace

### Tables

```txt
users
memory_refs
```

---

## Story 1.2 Configure Learning Languages

### User Story

As a learner

I want to define source and target languages

So that vocabulary is categorized correctly.

### Acceptance Criteria

Given profile settings

When language pair selected

Then:

* source language saved
* target language saved
* future captures inherit defaults

---

## Story 1.3 Manage Learning Preferences

### Acceptance Criteria

User can configure:

* review frequency
* reminder schedule
* daily word target
* difficulty preferences

---

# EPIC 2: Vocabulary Capture Engine

## Goal

Capture vocabulary from Google Translate and other sources.

---

## Story 2.1 Google Translate Auto Capture

### User Story

As a user

I want translated words automatically captured

So that I never lose them.

### Acceptance Criteria

Given Google Translate page

When translation completes

Then:

* translation_event created
* vocabulary_entry created or updated
* event published

Tables:

```txt
translation_events
vocabulary_entries
```

---

## Story 2.2 Browser Selection Capture

### User Story

As a user

I want to highlight text

So I can save vocabulary manually.

### Acceptance Criteria

Given highlighted text

When Save to Memory clicked

Then:

* capture created
* context recorded
* enrichment workflow triggered

---

## Story 2.3 Keyboard Shortcut Capture

### Acceptance Criteria

Given selected text

When CMD+SHIFT+M pressed

Then capture occurs.

---

## Story 2.4 Duplicate Detection

### Acceptance Criteria

Given word already exists

When captured again

Then:

* existing record updated
* lookup count incremented
* no duplicate created

---

# EPIC 3: Vocabulary Repository

## Goal

Create canonical vocabulary storage.

---

## Story 3.1 Create Vocabulary Entry

### Acceptance Criteria

Entry stores:

* source word
* translation
* languages
* metadata
* timestamps

---

## Story 3.2 Update Existing Entry

### Acceptance Criteria

Existing entries receive:

* last_seen update
* confidence update
* frequency update

---

## Story 3.3 Favorite Vocabulary

### Acceptance Criteria

User can:

* favorite
* unfavorite

Entries appear in favorites filter.

---

## Story 3.4 Archive Vocabulary

### Acceptance Criteria

Archived items:

* hidden by default
* preserved in memory

---

# EPIC 4: Context Collection

## Goal

Capture where the word was learned.

---

## Story 4.1 Save Sentence Context

### Acceptance Criteria

Store:

* original sentence
* translated sentence

in:

```txt
vocabulary_contexts
```

---

## Story 4.2 Save Page Context

Store:

* page title
* URL
* source application

---

## Story 4.3 Multiple Context Support

Vocabulary may have many contexts.

---

# EPIC 5: AI Enrichment Engine

## Goal

Convert raw vocabulary into intelligent knowledge.

---

## Story 5.1 Generate Definition

Acceptance Criteria

AI creates:

* concise definition
* extended definition

---

## Story 5.2 Detect Part of Speech

Acceptance Criteria

Identify:

* noun
* verb
* adjective
* adverb
* phrase

---

## Story 5.3 Generate Pronunciation

Acceptance Criteria

Store:

* IPA
* phonetic spelling

---

## Story 5.4 Generate Example Sentences

Acceptance Criteria

Minimum:

* 3 examples
* source language
* translated version

---

## Story 5.5 Generate Synonyms

Acceptance Criteria

Store related vocabulary.

---

## Story 5.6 Generate Antonyms

Acceptance Criteria

Store opposite vocabulary.

---

# EPIC 6: Vector Search

## Goal

Semantic vocabulary retrieval.

---

## Story 6.1 Vectorize Vocabulary

Acceptance Criteria

Every vocabulary item:

* embedded
* stored in namespace

```txt
zerovocab:vocabulary:user_id
```

---

## Story 6.2 Semantic Search

### User Story

As a user

I want to search by meaning

So I can find forgotten words.

Acceptance Criteria

Query:

```txt
Spanish word for learning
```

returns:

```txt
aprender
```

---

## Story 6.3 Similar Vocabulary

Acceptance Criteria

System recommends related concepts.

---

# EPIC 7: ZeroMemory Integration

## Goal

Turn vocabulary into durable memory.

---

## Story 7.1 Store Memory

Acceptance Criteria

Every vocabulary item becomes:

```txt
memory_type=vocabulary
```

Stored via:

```txt
remember()
```

---

## Story 7.2 Recall Memory

Acceptance Criteria

Agent retrieves prior vocabulary.

---

## Story 7.3 Memory Reflection

Acceptance Criteria

Memory service discovers:

* forgotten concepts
* emerging themes

---

# EPIC 8: GraphRAG Vocabulary Network

## Goal

Build a knowledge graph.

---

## Story 8.1 Create Relationships

Acceptance Criteria

Generate:

* synonym
* antonym
* root word
* topic

relationships

---

## Story 8.2 Graph Traversal

Acceptance Criteria

User can navigate:

```txt
Learning
 ├─ Learn
 ├─ Study
 ├─ School
 └─ Education
```

---

## Story 8.3 Relationship Visualization

Acceptance Criteria

Interactive graph rendered.

---

# EPIC 9: Review Engine

## Goal

Prevent forgetting.

---

## Story 9.1 Review Scheduler

Acceptance Criteria

Create review schedule:

```txt
1
3
7
14
30
90
365
```

days

---

## Story 9.2 Confidence Tracking

Acceptance Criteria

Correct answer:

confidence increases

Incorrect:

confidence decreases

---

## Story 9.3 Next Review Calculation

Acceptance Criteria

Review date recalculated.

---

# EPIC 10: Flashcards

## Goal

Interactive learning.

---

## Story 10.1 Generate Flashcards

Acceptance Criteria

Vocabulary automatically converted.

---

## Story 10.2 Reverse Flashcards

Acceptance Criteria

Both directions supported.

---

## Story 10.3 Context Flashcards

Acceptance Criteria

Sentence shown with blank word.

---

# EPIC 11: AI Learning Coach

## Goal

Create agentic tutoring.

---

## Story 11.1 Daily Review Agent

Acceptance Criteria

Agent generates:

```txt
Today's Review
```

based on memory state.

---

## Story 11.2 Weakness Detection

Acceptance Criteria

Agent identifies:

* weak vocabulary
* forgotten concepts

---

## Story 11.3 Personalized Recommendations

Acceptance Criteria

Suggest:

* words
* topics
* lessons

---

# EPIC 12: Analytics

## Goal

Measure learning progress.

---

## Story 12.1 Vocabulary Dashboard

Metrics:

* total words
* mastered
* learning
* forgotten

---

## Story 12.2 Language Breakdown

Metrics by language.

---

## Story 12.3 Memory Strength Dashboard

Metrics:

* recall score
* confidence
* retention

---

# EPIC 13: Browser Extension

## Goal

Primary capture interface.

---

## Story 13.1 Chrome Extension

Acceptance Criteria

Capture vocabulary.

---

## Story 13.2 Firefox Extension

Acceptance Criteria

Same functionality.

---

## Story 13.3 Edge Extension

Acceptance Criteria

Same functionality.

---

# EPIC 14: MCP Server

## Goal

Allow agents to access vocabulary memory.

---

## Story 14.1 Search Vocabulary Tool

Example

```txt
Find all French finance terms
```

---

## Story 14.2 Memory Recall Tool

Example

```txt
What Japanese words have I learned?
```

---

## Story 14.3 Review Suggestions Tool

Example

```txt
What should I study today?
```

---

# EPIC 15: Agent Workflows

## Goal

Fully automate vocabulary lifecycle.

---

## Story 15.1 Capture Agent

Trigger:

```txt
vocabulary.captured
```

---

## Story 15.2 Enrichment Agent

Trigger:

```txt
vocabulary.normalized
```

---

## Story 15.3 Vector Agent

Trigger:

```txt
vocabulary.enriched
```

---

## Story 15.4 Memory Agent

Trigger:

```txt
vocabulary.vectorized
```

---

## Story 15.5 Review Agent

Trigger:

```txt
memory.created
```

---

# EPIC 16: Future Knowledge Capture Platform

This is where the product evolves beyond vocabulary.

## Story 16.1 Technical Concepts

Capture:

* APIs
* Frameworks
* Commands

---

## Story 16.2 Research Capture

Capture:

* Articles
* PDFs
* Notes

---

## Story 16.3 Meeting Capture

Capture:

* Zoom
* Meet
* Teams

---

# MVP Sprint Recommendation

### Sprint 1

* User Profiles
* Vocabulary Capture
* Translation Events
* Browser Extension
* Vocabulary Repository

### Sprint 2

* Context Collection
* AI Enrichment
* Vector Storage
* Semantic Search

### Sprint 3

* ZeroMemory Integration
* Review Engine
* Flashcards

### Sprint 4

* Learning Coach
* Analytics
* MCP Server

### Sprint 5

* GraphRAG
* Agent Workflows
* Relationship Visualization

This backlog translates to approximately **16 Epics, 67 User Stories, ~250–300 story points**, which is about **8–10 weeks of development for a 3-agent AINative swarm (Frontend, Backend, AI Agent)** using ZeroDB, ZeroMemory, and AIKit as the primary infrastructure.
