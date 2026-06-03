# ZeroDB Data Model: ZeroVocab / Vocabulary Capture

## 1. Core ZeroDB Collections / Tables

Use ZeroDB NoSQL Tables because they support project-scoped schema-free records at:

```http
/api/v1/projects/{project_id}/database/tables/...
```

Rows are stored as `row_data`, queried with filters, sorting, pagination, and projections. ([docs.ainative.studio][2])

Recommended tables:

```txt
users
capture_sources
vocabulary_entries
translation_events
vocabulary_contexts
vocabulary_enrichments
vocabulary_reviews
vocabulary_relationships
learning_sessions
agent_workflows
memory_refs
```

---

# 2. Main Table: `vocabulary_entries`

This is the canonical object for every captured word, phrase, idiom, technical term, or translated sentence.

```json
{
  "id": "vocab_01H...",
  "user_id": "user_123",
  "project_id": "zerodb_project_id",

  "entry_type": "word",
  "source_text": "aprender",
  "normalized_text": "aprender",
  "translated_text": "to learn",

  "source_language": "es",
  "target_language": "en",

  "detected_language": "es",
  "translation_provider": "google_translate",

  "status": "active",
  "is_favorite": false,
  "is_archived": false,

  "difficulty_level": "beginner",
  "difficulty_score": 0.31,
  "importance_score": 0.72,
  "confidence_score": 0.44,
  "mastery_score": 0.18,

  "first_seen_at": "2026-06-02T10:00:00Z",
  "last_seen_at": "2026-06-02T10:00:00Z",
  "created_at": "2026-06-02T10:00:00Z",
  "updated_at": "2026-06-02T10:00:00Z",

  "tags": ["spanish", "verb", "learning"],
  "source": {
    "source_type": "browser_extension",
    "source_app": "google_translate",
    "source_url": "https://translate.google.com",
    "page_title": "Google Translate"
  },

  "zero_memory": {
    "memory_id": "mem_123",
    "memory_tier": "semantic",
    "memory_type": "vocabulary",
    "namespace": "zerovocab:user_123"
  },

  "vector": {
    "vector_id": "vec_123",
    "namespace": "zerovocab:vocabulary:user_123",
    "embedded_text": "Spanish word aprender means to learn. Example: Quiero aprender español."
  }
}
```

---

# 3. `translation_events`

Every time the user looks something up, store the raw lookup event separately from the canonical vocabulary entry.

```json
{
  "id": "event_123",
  "user_id": "user_123",
  "vocabulary_entry_id": "vocab_01H...",

  "source_text": "aprender",
  "translated_text": "to learn",
  "source_language": "es",
  "target_language": "en",

  "provider": "google_translate",
  "capture_method": "dom_observer",
  "browser": "chrome",
  "device_id": "device_abc",

  "url": "https://translate.google.com",
  "page_title": "Google Translate",

  "captured_at": "2026-06-02T10:00:00Z",
  "raw_payload": {
    "input_selector": "...",
    "output_selector": "...",
    "detected_language": "Spanish"
  }
}
```

This lets you distinguish “the word” from every time the user looked it up.

---

# 4. `vocabulary_contexts`

Stores sentence-level and page-level context.

```json
{
  "id": "ctx_123",
  "user_id": "user_123",
  "vocabulary_entry_id": "vocab_01H...",

  "context_type": "sentence",
  "original_sentence": "Quiero aprender español.",
  "translated_sentence": "I want to learn Spanish.",

  "surrounding_text": "Estoy tomando clases porque quiero aprender español.",
  "url": "https://example.com/spanish-lesson",
  "page_title": "Spanish Lesson",

  "content_hash": "sha256_hash",
  "created_at": "2026-06-02T10:00:00Z"
}
```

---

# 5. `vocabulary_enrichments`

AI-generated linguistic metadata.

```json
{
  "id": "enrich_123",
  "vocabulary_entry_id": "vocab_01H...",

  "part_of_speech": "verb",
  "lemma": "aprender",
  "pronunciation": "ah-pren-DEHR",
  "ipa": "apɾenˈdeɾ",

  "definition": "to acquire knowledge or skill",
  "example_sentences": [
    {
      "source": "Quiero aprender español.",
      "translation": "I want to learn Spanish."
    }
  ],

  "synonyms": ["estudiar", "asimilar"],
  "antonyms": ["olvidar"],
  "root_words": [],
  "related_terms": ["estudiante", "escuela", "conocimiento"],

  "frequency_score": 0.86,
  "difficulty_score": 0.31,

  "model_provider": "ainative",
  "model_name": "selected-enrichment-model",
  "created_at": "2026-06-02T10:00:00Z"
}
```

---

# 6. `vocabulary_relationships`

This powers GraphRAG-style traversal. ZeroDB’s docs describe GraphRAG as hybrid vector plus knowledge graph search, with recursive CTEs used for graph traversal. ([docs.ainative.studio][1])

```json
{
  "id": "rel_123",
  "user_id": "user_123",

  "from_entry_id": "vocab_aprender",
  "to_entry_id": "vocab_estudiar",

  "relationship_type": "semantic_related",
  "relationship_label": "related learning concept",

  "weight": 0.82,
  "source": "ai_enrichment",
  "created_at": "2026-06-02T10:00:00Z"
}
```

Relationship types:

```txt
synonym
antonym
translation_variant
same_root
same_topic
same_part_of_speech
seen_in_same_context
user_confuses_with
reviewed_together
```

---

# 7. `vocabulary_reviews`

Spaced repetition and memory confidence.

```json
{
  "id": "review_123",
  "user_id": "user_123",
  "vocabulary_entry_id": "vocab_01H...",

  "review_type": "flashcard",
  "prompt": "What does aprender mean?",
  "expected_answer": "to learn",
  "user_answer": "learn",

  "result": "correct",
  "confidence_before": 0.44,
  "confidence_after": 0.62,

  "ease_factor": 2.5,
  "interval_days": 3,
  "next_review_at": "2026-06-05T10:00:00Z",

  "reviewed_at": "2026-06-02T10:00:00Z"
}
```

---

# 8. `learning_sessions`

Groups reviews into coaching sessions.

```json
{
  "id": "session_123",
  "user_id": "user_123",

  "session_type": "daily_review",
  "language_pair": {
    "source_language": "es",
    "target_language": "en"
  },

  "entry_ids": ["vocab_1", "vocab_2"],
  "total_cards": 20,
  "correct_count": 15,
  "incorrect_count": 5,

  "session_score": 0.75,
  "started_at": "2026-06-02T10:00:00Z",
  "ended_at": "2026-06-02T10:20:00Z"
}
```

---

# 9. `memory_refs`

Maps ZeroVocab records to ZeroMemory.

ZeroMemory supports working, episodic, and semantic memory tiers, with automatic consolidation and blended scoring based on similarity, importance, and recency. ([docs.ainative.studio][3])

```json
{
  "id": "memory_ref_123",
  "user_id": "user_123",
  "vocabulary_entry_id": "vocab_01H...",

  "zero_memory_id": "mem_123",
  "memory_type": "vocabulary",
  "memory_tier": "semantic",

  "content": "User learned that the Spanish verb aprender means to learn.",
  "importance": 0.72,
  "recency": 1.0,

  "created_at": "2026-06-02T10:00:00Z",
  "last_recalled_at": null
}
```

Store memory with:

```http
POST /api/v1/public/memory/v2/remember
```

Recall with:

```http
POST /api/v1/public/memory/v2/recall
```

ZeroMemory also exposes `reflect`, `profile`, `relate`, and `process` endpoints. ([docs.ainative.studio][3])

---

# 10. Vector Storage Model

ZeroDB vector storage accepts `texts`, optional `metadata`, optional `namespace`, and auto-generates embeddings using TEI / BAAI bge models if no vector is provided. ([docs.ainative.studio][4])

Recommended namespace pattern:

```txt
zerovocab:vocabulary:{user_id}
zerovocab:contexts:{user_id}
zerovocab:sessions:{user_id}
```

Vector payload:

```json
{
  "texts": [
    "Spanish verb aprender means to learn. Example: Quiero aprender español."
  ],
  "metadata": [
    {
      "user_id": "user_123",
      "vocabulary_entry_id": "vocab_01H...",
      "source_language": "es",
      "target_language": "en",
      "entry_type": "word",
      "tags": ["spanish", "verb", "learning"]
    }
  ],
  "namespace": "zerovocab:vocabulary:user_123",
  "ids": ["vec_vocab_01H"]
}
```

Search example:

```json
{
  "query": "What was the Spanish word for learning?",
  "limit": 5,
  "min_score": 0.7,
  "namespace": "zerovocab:vocabulary:user_123",
  "filter_metadata": {
    "source_language": "es",
    "target_language": "en"
  }
}
```

---

# 11. Event Streaming Model

Use ZeroDB Events for capture audit logs, enrichment workflows, review updates, and agent orchestration. Events support `type`, `data`, `source`, and `correlation_id`. ([docs.ainative.studio][5])

Event types:

```txt
vocabulary.captured
vocabulary.normalized
vocabulary.enriched
vocabulary.vectorized
vocabulary.memory_stored
vocabulary.relationships_created
vocabulary.review_scheduled
vocabulary.review_completed
agent.enrichment_completed
agent.review_plan_created
```

Example:

```json
{
  "type": "vocabulary.captured",
  "source": "chrome_extension",
  "correlation_id": "capture_workflow_123",
  "data": {
    "user_id": "user_123",
    "source_text": "aprender",
    "translated_text": "to learn",
    "source_language": "es",
    "target_language": "en",
    "provider": "google_translate"
  }
}
```

---

# 12. Recommended MVP Tables

Build these first:

```txt
vocabulary_entries
translation_events
vocabulary_contexts
vocabulary_enrichments
vocabulary_relationships
vocabulary_reviews
memory_refs
learning_sessions
```

Skip until later:

```txt
team_vocabularies
shared_decks
teacher_assignments
public_word_packs
file_imports
youtube_transcripts
kindle_highlights
```

---

# 13. Capture Write Flow

```txt
Google Translate lookup
↓
Browser extension detects source + translated text
↓
POST row to translation_events
↓
Upsert canonical vocabulary_entries record
↓
Create vocabulary_contexts record
↓
Publish vocabulary.captured event
↓
Enrichment agent creates vocabulary_enrichments
↓
Vector stored in ZeroDB vectors
↓
Memory stored in ZeroMemory
↓
Relationships created for GraphRAG
↓
Review scheduled
```

---

# 14. Best ZeroDB-Native Architecture

Use:

```txt
NoSQL Tables = structured app state
Vectors = semantic recall
ZeroMemory = durable agent memory
Events = workflow orchestration and audit trail
GraphRAG = relationship-based discovery
MCP = external agent access
```

This keeps the app thin and lets ZeroDB/ZeroMemory do the heavy lifting.

[1]: https://docs.ainative.studio/docs/zerodb/overview "ZeroDB Overview | AINative Studio Docs"
[2]: https://docs.ainative.studio/docs/zerodb/tables "NoSQL Tables | AINative Studio Docs"
[3]: https://docs.ainative.studio/docs/zeromemory/overview "ZeroMemory Overview | AINative Studio Docs"
[4]: https://docs.ainative.studio/docs/zerodb/vectors "Vector Search | AINative Studio Docs"
[5]: https://docs.ainative.studio/docs/zerodb/events "Event Streaming | AINative Studio Docs"
