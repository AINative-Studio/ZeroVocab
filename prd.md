# PRD: ZeroVocab

### AI-Native Vocabulary Capture & Memory Platform

Version: 1.0

Product Owner: Toby Morning

Platform: AINative Studio

Backend: ZeroDB + ZeroMemory

Frontend: Browser Extension + Mobile App + MCP Server

---

# Executive Summary

ZeroVocab is an AI-native vocabulary and knowledge capture platform that automatically captures words, phrases, translations, definitions, and contextual learning moments from:

* Google Translate
* DeepL
* ChatGPT
* Claude
* Gemini
* Browser selections
* PDFs
* YouTube transcripts
* Kindle highlights
* Emails

Every captured item is transformed into a structured memory and stored in ZeroDB.

The system continuously builds a user's personal knowledge graph and uses spaced repetition, semantic recall, and AI coaching to improve retention.

---

# Problem Statement

Most language learners:

* Forget 80%+ of vocabulary
* Lose words after looking them up
* Have knowledge scattered across tools
* Cannot search prior learning effectively

Current vocabulary apps:

* Require manual entry
* Lack contextual memory
* Don't connect concepts
* Don't leverage AI agents

---

# Product Vision

Create the world's first:

### Personal Vocabulary Memory Layer

that remembers everything a user learns.

Users should never have to look up the same word twice.

---

# Core Value Proposition

Instead of:

Google Translate
↓
Read definition
↓
Forget

We do:

Google Translate
↓
Capture automatically
↓
Store in ZeroMemory
↓
Generate flashcards
↓
Build relationships
↓
Recall when needed
↓
Never forget

---

# User Personas

## Language Learners

Learning Spanish

Learning French

Learning Japanese

Learning Mandarin

---

## Students

Technical terms

Scientific terms

Academic language

---

## Professionals

Industry jargon

Legal terms

Medical terminology

Finance terminology

---

## Developers

Programming concepts

Framework terms

API terminology

---

# MVP Scope

## Feature 1

Translation Capture

---

### User Story

As a learner

I want translated words automatically saved

So I don't lose them.

---

### Acceptance Criteria

Given:

User looks up a word in Google Translate

When:

Translation occurs

Then:

Word is saved to ZeroDB

Original language stored

Target language stored

Timestamp stored

Source URL stored

---

## Feature 2

Context Capture

---

Store:

Word

Translation

Sentence

Paragraph

Page Title

URL

Language

Date

AI Summary

---

Example

Original:

"Aprender"

Translation:

"To Learn"

Context:

"Quiero aprender español"

Stored as memory object.

---

## Feature 3

Browser Extension

Chrome

Brave

Arc

Edge

Firefox

---

Capture Methods

### Method A

Google Translate Detection

Automatically detect translated text.

---

### Method B

Right Click

Save to Memory

---

### Method C

Keyboard Shortcut

CMD+SHIFT+M

Save Selection

---

# Feature 4

AI Enrichment Pipeline

Every captured word triggers:

Agent Workflow

Capture Agent
↓
Language Agent
↓
Memory Agent
↓
Graph Agent

---

Generated Metadata

Part of Speech

Verb

Noun

Adjective

Pronunciation

Difficulty Score

Frequency Score

Root Word

Synonyms

Antonyms

Related Concepts

Example Sentences

---

# Feature 5

Knowledge Graph

Stored in ZeroDB

Example

Spanish
└── Aprender
├── Education
├── Learning
├── Study
├── School
└── Knowledge

Relationships automatically generated.

---

# Feature 6

ZeroMemory Integration

Every word becomes:

Memory Type

VocabularyMemory

Example

```json
{
  "memory_type":"vocabulary",
  "term":"aprender",
  "translation":"to learn",
  "language":"es",
  "confidence":0.92
}
```

---

# Feature 7

Semantic Search

User asks:

"What was that Spanish word for learning?"

Agent searches memory.

Returns:

Aprender

Translation

Context

Examples

---

# Feature 8

AI Vocabulary Coach

User:

"What words should I review today?"

Agent queries:

Recently forgotten

Low confidence

High importance

Frequently encountered

Returns personalized lesson.

---

# Feature 9

Spaced Repetition Engine

Intervals

1 Day

3 Days

7 Days

14 Days

30 Days

90 Days

180 Days

365 Days

---

Memory confidence updated after every review.

---

# Feature 10

Vocabulary MCP Server

Expose memory via MCP.

Claude Code

ChatGPT

Cursor

Cody

Windsurf

can access vocabulary memories.

Example

```text
What French words have I learned related to finance?
```

Agent retrieves from ZeroMemory.

---

# Data Model

## vocabulary_entries

```sql
CREATE TABLE vocabulary_entries (
    id UUID PRIMARY KEY,
    user_id UUID,
    source_word TEXT,
    translated_word TEXT,
    source_language TEXT,
    target_language TEXT,
    context TEXT,
    pronunciation TEXT,
    difficulty_score FLOAT,
    frequency_score FLOAT,
    created_at TIMESTAMP
);
```

---

## vocabulary_relationships

```sql
CREATE TABLE vocabulary_relationships (
    id UUID PRIMARY KEY,
    source_entry_id UUID,
    target_entry_id UUID,
    relationship_type TEXT
);
```

---

## review_sessions

```sql
CREATE TABLE review_sessions (
    id UUID PRIMARY KEY,
    user_id UUID,
    vocabulary_id UUID,
    confidence_before FLOAT,
    confidence_after FLOAT,
    reviewed_at TIMESTAMP
);
```

---

## memory_embeddings

```sql
CREATE TABLE memory_embeddings (
    id UUID PRIMARY KEY,
    vocabulary_id UUID,
    embedding VECTOR(1536)
);
```

---

# ZeroDB Collections

```yaml
Vocabulary
Languages
Translations
Examples
Relationships
Reviews
Embeddings
```

---

# API Endpoints

## Capture

```http
POST /api/v1/vocabulary/capture
```

---

## Search

```http
GET /api/v1/vocabulary/search
```

---

## Review

```http
POST /api/v1/vocabulary/review
```

---

## Graph

```http
GET /api/v1/vocabulary/graph
```

---

## Recommendations

```http
GET /api/v1/vocabulary/recommendations
```

---

# AI Agents

### Capture Agent

Monitors sources

Captures vocabulary

---

### Enrichment Agent

Creates metadata

---

### Memory Agent

Stores in ZeroMemory

---

### Review Agent

Schedules review

---

### Tutor Agent

Creates quizzes

---

### Graph Agent

Builds semantic relationships

---

# Future Roadmap

## Phase 2

Voice Vocabulary Capture

Speak a word

Store automatically

---

## Phase 3

Meeting Vocabulary

Capture unknown words from Zoom

Google Meet

Teams

---

## Phase 4

Technical Knowledge Capture

Programming concepts

API docs

Framework documentation

Stack Overflow answers

Claude conversations

---

## Phase 5

Life Memory Layer

Not just vocabulary.

Capture:

* Ideas
* Facts
* Names
* Companies
* Books
* Meetings
* Research

At this point ZeroVocab becomes a specialized front-end for **ZeroMemory**, where language learning is simply the first use case for a lifelong AI-native memory system. This aligns strongly with the AINative vision because every lookup becomes training data for the user's personal knowledge graph and can be surfaced later by Cody, MCP clients, Claude, ChatGPT, or any agent connected to ZeroDB.
