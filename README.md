# ZeroVocab

AI-native vocabulary capture, translation memory, and learning system powered by **ZeroDB**, **ZeroMemory**, and the AINative platform.

ZeroVocab automatically captures words, phrases, translations, and learning moments from Google Translate and other browser-based workflows, enriches them with AI, stores them in ZeroDB, and turns them into durable personal memories through ZeroMemory.

---

## What This App Does

ZeroVocab turns every vocabulary lookup into structured long-term memory.

Instead of:

```txt
Look up word → understand it once → forget it
```

ZeroVocab creates:

```txt
Lookup → Capture → Enrich → Embed → Store → Remember → Review → Recall
```

The goal is simple:

> Users should never have to look up the same word twice.

---

## Core Features

### MVP Features

* Google Translate vocabulary capture
* Browser text selection capture
* Keyboard shortcut capture
* Vocabulary entry storage in ZeroDB
* Translation event tracking
* Sentence and page context capture
* AI enrichment for definitions, examples, synonyms, antonyms, and pronunciation
* Vector search for semantic recall
* ZeroMemory integration
* Spaced repetition review engine
* Flashcard generation
* Daily AI vocabulary coach
* GraphRAG-style vocabulary relationships
* MCP-compatible agent access

---

## Product Architecture

```txt
Browser Extension
    ↓
Capture API
    ↓
ZeroDB Tables
    ↓
AI Enrichment Agent
    ↓
ZeroDB Vectors
    ↓
ZeroMemory
    ↓
Review Engine / Coach / MCP Tools
```

---

## Recommended Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Browser Extension Manifest V3

### Backend

* Node.js / Express or FastAPI
* ZeroDB REST APIs
* ZeroMemory APIs
* AIKit / AINative Models API

### Data Layer

* ZeroDB NoSQL Tables
* ZeroDB Vector Search
* ZeroDB Events
* ZeroMemory
* GraphRAG relationships

---

## Repository Structure

```txt
zerovocab/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── tests/
│   │
│   ├── extension/
│   │   ├── manifest.json
│   │   ├── background/
│   │   ├── content-scripts/
│   │   ├── popup/
│   │   └── tests/
│   │
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── agents/
│       │   ├── clients/
│       │   ├── schemas/
│       │   └── tests/
│
├── packages/
│   ├── zerodb-client/
│   ├── zeromemory-client/
│   ├── shared-types/
│   └── testing/
│
├── docs/
│   ├── PRD.md
│   ├── DATA_MODEL.md
│   ├── BACKLOG.md
│   ├── API.md
│   └── ARCHITECTURE.md
│
├── scripts/
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file:

```bash
ZERODB_API_BASE_URL=https://api.ainative.studio
ZERODB_API_KEY=your_zerodb_api_key
ZERODB_PROJECT_ID=your_project_id

ZEROMEMORY_API_BASE_URL=https://api.ainative.studio
ZEROMEMORY_API_KEY=your_zeromemory_api_key

AINATIVE_MODELS_API_KEY=your_models_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Never commit `.env` files.

---

## ZeroDB Tables

The application expects the following ZeroDB tables:

```txt
users
capture_sources
vocabulary_entries
translation_events
vocabulary_contexts
vocabulary_enrichments
vocabulary_relationships
vocabulary_reviews
learning_sessions
agent_workflows
memory_refs
```

---

## Core Data Flow

### 1. Capture Vocabulary

A user looks up a word in Google Translate.

The browser extension detects:

```json
{
  "source_text": "aprender",
  "translated_text": "to learn",
  "source_language": "es",
  "target_language": "en",
  "source_app": "google_translate"
}
```

The app creates:

* `translation_events`
* `vocabulary_entries`
* `vocabulary_contexts`

---

### 2. Enrich Vocabulary

The enrichment agent adds:

* definition
* part of speech
* pronunciation
* example sentences
* synonyms
* antonyms
* root words
* difficulty score
* frequency score

Stored in:

```txt
vocabulary_enrichments
```

---

### 3. Vectorize Vocabulary

The system creates semantic embeddings for:

```txt
source word
translation
definition
examples
context
```

Stored in ZeroDB Vector Search under namespace:

```txt
zerovocab:vocabulary:{user_id}
```

---

### 4. Store in ZeroMemory

Each vocabulary item becomes a durable memory:

```json
{
  "memory_type": "vocabulary",
  "memory_tier": "semantic",
  "content": "The Spanish verb aprender means to learn."
}
```

Mapped back through:

```txt
memory_refs
```

---

### 5. Schedule Review

The review engine creates spaced repetition records in:

```txt
vocabulary_reviews
```

Default intervals:

```txt
1 day
3 days
7 days
14 days
30 days
90 days
365 days
```

---

## Main API Routes

### Capture

```http
POST /api/v1/vocabulary/capture
```

Creates or updates a vocabulary entry from a captured translation.

---

### Search

```http
GET /api/v1/vocabulary/search?q=learning
```

Searches vocabulary entries using structured filters and semantic search.

---

### Entry Detail

```http
GET /api/v1/vocabulary/:id
```

Returns the vocabulary entry, enrichment, contexts, relationships, and review state.

---

### Review

```http
POST /api/v1/vocabulary/:id/review
```

Updates confidence, mastery score, and next review date.

---

### Daily Review

```http
GET /api/v1/reviews/today
```

Returns vocabulary due for review.

---

### Coach

```http
GET /api/v1/coach/daily
```

Returns AI-generated study recommendations.

---

### Graph

```http
GET /api/v1/vocabulary/:id/graph
```

Returns related vocabulary and semantic relationships.

---

## Example Capture Payload

```json
{
  "user_id": "user_123",
  "source_text": "aprender",
  "translated_text": "to learn",
  "source_language": "es",
  "target_language": "en",
  "context": {
    "original_sentence": "Quiero aprender español.",
    "translated_sentence": "I want to learn Spanish.",
    "url": "https://translate.google.com",
    "page_title": "Google Translate"
  },
  "source": {
    "source_type": "browser_extension",
    "source_app": "google_translate",
    "capture_method": "dom_observer"
  }
}
```

---

## Agent Workflow

ZeroVocab uses an event-driven agent pipeline.

```txt
vocabulary.captured
    ↓
capture.agent
    ↓
vocabulary.normalized
    ↓
enrichment.agent
    ↓
vocabulary.enriched
    ↓
vector.agent
    ↓
vocabulary.vectorized
    ↓
memory.agent
    ↓
vocabulary.memory_stored
    ↓
review.agent
    ↓
vocabulary.review_scheduled
```

---

## Agents

### Capture Agent

Responsible for normalizing captured vocabulary and preventing duplicates.

### Enrichment Agent

Generates definitions, examples, pronunciation, synonyms, antonyms, and difficulty scores.

### Vector Agent

Creates embeddings and stores them in ZeroDB vector namespaces.

### Memory Agent

Stores vocabulary as ZeroMemory records.

### Review Agent

Schedules spaced repetition reviews.

### Coach Agent

Creates personalized study recommendations.

### Graph Agent

Creates semantic relationships between vocabulary entries.

---

## Browser Extension

The extension supports:

* Google Translate auto-capture
* Highlight-to-save
* Right-click capture
* Keyboard shortcut capture
* Popup dashboard
* Recent captures
* Manual correction before save

Default shortcut:

```txt
CMD + SHIFT + M
```

---

## Testing Standards

This project follows Semantic Seed Coding Standards V2.0.

All features should include:

* Unit tests
* Integration tests
* BDD acceptance tests
* API contract tests
* Agent workflow tests

Recommended test structure:

```txt
tests/
├── unit/
├── integration/
├── bdd/
├── api/
└── agents/
```

---

## Example BDD Scenario

```gherkin
Feature: Google Translate Capture

  Scenario: Capture translated word from Google Translate
    Given I am viewing Google Translate
    And I translate "aprender" from Spanish to English
    When the translation result appears
    Then a translation event should be created
    And a vocabulary entry should be created
    And the vocabulary item should be stored in ZeroMemory
    And a review should be scheduled
```

---

## Development Setup

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run BDD tests:

```bash
npm run test:bdd
```

Build extension:

```bash
npm run build:extension
```

Build web app:

```bash
npm run build:web
```

---

## Suggested Scripts

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:bdd": "cucumber-js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "build:web": "npm --workspace apps/web run build",
    "build:extension": "npm --workspace apps/extension run build"
  }
}
```

---

## MVP Milestones

### Sprint 1: Capture Foundation

* Browser extension MVP
* Google Translate DOM capture
* Capture API
* ZeroDB table writes
* Duplicate detection

### Sprint 2: AI Enrichment

* Definition generation
* Example generation
* Part-of-speech detection
* Enrichment storage
* Agent workflow events

### Sprint 3: ZeroMemory + Search

* Vectorization
* ZeroMemory storage
* Semantic search
* Memory recall

### Sprint 4: Review System

* Spaced repetition
* Flashcards
* Daily review dashboard
* Confidence tracking

### Sprint 5: Coach + GraphRAG

* AI coach
* Vocabulary graph
* Relationship generation
* MCP tools

---

## Security Requirements

* API keys must stay server-side
* User data must be scoped by `user_id`
* ZeroDB namespaces must be user-specific
* Extension must request minimum permissions
* Raw browser context should only be stored when user enables context capture
* No sensitive page content should be captured without explicit consent

---

## Privacy Requirements

Users must be able to:

* View all captured vocabulary
* Delete vocabulary
* Delete memory references
* Disable auto-capture
* Disable page context capture
* Export vocabulary data
* Clear review history

---

## Success Metrics

### Product Metrics

* Captures per user per week
* Review completion rate
* Search recall success rate
* Vocabulary retention improvement
* Daily active learners

### Technical Metrics

* Capture latency under 500ms
* Enrichment completion under 10 seconds
* Vector search under 1 second
* ZeroMemory recall under 1 second
* 90%+ backend test coverage

---

## Future Roadmap

### Phase 2

* DeepL support
* ChatGPT and Claude capture
* YouTube transcript capture
* PDF vocabulary extraction
* Kindle highlights import

### Phase 3

* Team vocabulary decks
* Teacher dashboards
* Shared word packs
* Public language packs

### Phase 4

* Voice capture
* Meeting transcript capture
* Technical concept memory
* Full personal knowledge graph

---

## Product Vision

ZeroVocab starts as a vocabulary capture tool.

But the bigger vision is a personal AI-native memory layer.

Every word, phrase, concept, idea, and learning moment becomes searchable, reviewable, and reusable through ZeroDB, ZeroMemory, and agentic workflows.

ZeroVocab is the first wedge into lifelong personal memory.
