# DATA_PIPELINE.md

## NFL Prospect Stats Data Pipeline

### Objective

Define a reliable and maintainable data pipeline for prospect-related data in the NFL Draft Board Social platform.

This document exists to prevent poor architectural decisions around external data, especially the common mistake of treating all “prospect stats” as if they came from a single clean source.

They do not.

---

## Core conclusion

There is **no single public source** that cleanly and reliably provides all of the following in one consistent pipeline:

- prospect identity
- draft metadata
- college production stats
- combine measurements
- pro day testing
- scouting grades

Because of that, the system must be designed around **multiple source types**, each with its own trust level and ingestion path.

---

## Recommended source strategy

### 1. Draft identity and prospect metadata
Use a licensed provider as the primary source of truth for:

- prospect identity
- draft class participation
- draft status
- top prospect metadata
- external source linkage

Recommended source:
- **Sportradar NFL Draft feeds**

Why:
- gives structured prospect records
- supports draft-specific entities
- includes identifiers that can be linked to college player records

---

### 2. College production stats
Use a college football data provider for:

- player season stats
- player profile
- historical statistical production
- school/team alignment by season

Recommended source:
- **Sportradar NCAA Football**

Why:
- college production is a different domain from draft metadata
- should not be scraped or inferred from news or profile pages
- must be modeled independently from draft rankings and testing

---

### 3. Official combine measurements
Use official combine results as the highest-confidence source for:

- forty-yard dash
- vertical jump
- broad jump
- bench press
- shuttle
- three-cone
- measurements published as part of NFL combine reporting

Recommended source:
- **NFL Combine official tracker / official NFL source**

Why:
- these are the closest thing to official testing truth
- this data should be labeled separately from pro day numbers

Important:
- treat combine metrics as a dedicated measurement stream
- do not mix combine and pro day values into one field without provenance

---

### 4. Pro day testing
Treat pro day data as a separate, lower-confidence stream.

Why:
- pro day data is often inconsistent
- methodology varies
- timing/reporting is less standardized
- media-reported values may conflict with official combine values

Rule:
- never overwrite official combine data with pro day numbers

Instead:
- store pro day data independently
- mark source and confidence clearly

---

## Source confidence model

Every imported metric should carry a confidence level.

### Confidence levels

#### `official`
Use for:
- official NFL combine measurements
- directly published league-originated structured data

#### `licensed`
Use for:
- trusted commercial sports data providers
- structured feeds from vendors like Sportradar

#### `editorial`
Use for:
- rankings
- analyst grades
- top prospect lists
- narrative scouting reports

#### `reported`
Use for:
- media-reported pro day numbers
- non-official measurements
- social/media aggregation

#### `manual`
Use for:
- internal curation
- admin-entered corrections
- fallback imports

---

## Domain separation rules

The platform must never collapse all player data into one flat object.

Keep these categories separate:

### 1. Identity
Who the player is.

Examples:
- full name
- college
- position
- height
- weight
- age
- hometown
- identifiers

### 2. Draft metadata
How the player exists in the draft context.

Examples:
- draft year
- consensus rank
- top prospect status
- projected round
- draft status

### 3. College production
What the player did on the field.

Examples:
- passing yards
- sacks
- receptions
- tackles
- interceptions
- rushing touchdowns

### 4. Athletic testing
How the player tested.

Examples:
- 40-yard dash
- vertical jump
- shuttle
- broad jump

### 5. Editorial/scouting
What analysts think about the player.

Examples:
- grades
- strengths
- weaknesses
- comp players
- role projection

These are different data classes and must remain modeled separately.

---

## Internal data model

## Main entities

### `prospects`
Core internal identity record for a prospect.

Suggested fields:
- `id`
- `full_name`
- `slug`
- `position`
- `college`
- `height`
- `weight`
- `age`
- `hometown`
- `bio`
- `draft_year`
- `status`
- `image_url`
- `created_at`
- `updated_at`

---

### `prospect_external_ids`
Maps internal prospects to external systems.

Suggested fields:
- `id`
- `prospect_id`
- `provider`
- `external_id`
- `external_type`
- `created_at`

Examples:
- `sportradar_prospect_id`
- `ncaa_player_id`
- `nfl_profile_id`

Rule:
- external IDs must never replace internal IDs
- internal IDs are the application contract

---

### `prospect_measurements`
Stores testing and measurable values.

Suggested fields:
- `id`
- `prospect_id`
- `metric_type`
- `metric_value`
- `metric_unit`
- `event_type`
- `source_type`
- `source_name`
- `confidence`
- `recorded_at`
- `draft_year`
- `created_at`

Examples:
- `metric_type = forty_yard`
- `event_type = combine`
- `source_type = official`
- `confidence = official`

Important:
- multiple rows per metric are allowed
- different events must coexist
- do not force a single “best value” into the base prospect table

---

### `prospect_college_stats`
Stores production stats by season.

Suggested fields:
- `id`
- `prospect_id`
- `season`
- `team_name`
- `stat_category`
- `stat_name`
- `stat_value`
- `source_name`
- `confidence`
- `created_at`

Examples:
- `stat_category = receiving`
- `stat_name = receiving_yards`
- `stat_value = 1243`

Rule:
- stats should be normalized enough to compare by season and category
- avoid storing giant raw blobs as the only representation

---

### `prospect_rankings`
Stores ranking and grade data.

Suggested fields:
- `id`
- `prospect_id`
- `source_name`
- `ranking_type`
- `ranking_value`
- `grade_value`
- `draft_year`
- `created_at`

Examples:
- consensus rank
- provider rank
- position rank
- analyst grade

Rule:
- rankings are editorial data, not performance data

---

### `prospect_reports`
Stores scouting text or structured evaluation.

Suggested fields:
- `id`
- `prospect_id`
- `source_name`
- `summary`
- `strengths`
- `weaknesses`
- `projection`
- `created_at`

Rule:
- scouting text should not be mixed with stat tables

---

## Canonical rules

### Canonical prospect record
Each player has one internal `prospects` record.

### Canonical identity source
Use the licensed draft provider as the main source for prospect identity and draft presence.

### Canonical college stats source
Use a college football provider as the default source for season production.

### Canonical combine source
Use official NFL combine data whenever available.

### Canonical pro day rule
Store separately. Never overwrite combine data.

---

## Ingestion architecture

## Pipeline stages

### 1. Fetch
Import raw data from external providers.

Sources may include:
- draft provider
- college stats provider
- official combine source
- curated pro day source

### 2. Stage
Store raw payloads or normalized intermediate records in a staging layer.

Purpose:
- debugging
- replaying imports
- verifying field changes from providers

Suggested staging entities:
- `staging_prospects_raw`
- `staging_measurements_raw`
- `staging_stats_raw`

### 3. Normalize
Transform external fields into internal domain schema.

Tasks:
- clean names
- standardize units
- assign `metric_type`
- assign `source_type`
- assign `confidence`
- map external IDs

### 4. Match
Resolve external records to internal prospects.

Matching order:
1. exact external ID match
2. known mapped source ID
3. strict name + school + position match
4. manual review queue if uncertain

Rule:
- do not fuzzy-merge uncertain players automatically

### 5. Upsert
Write normalized records to production tables.

Rules:
- deterministic upserts
- preserve provenance
- preserve historical records where needed
- do not silently delete prior data

### 6. Publish
Expose application-ready records to:
- prospect pages
- rankings
- board tools
- filters
- search

---

## Sync policy

### Prospect identity sync
Frequency:
- daily during draft season
- less frequent off-season

### College stats sync
Frequency:
- scheduled refreshes
- heavier use during college season and draft cycle

### Combine sync
Frequency:
- event-driven during combine period
- then stable archival refreshes

### Pro day sync
Frequency:
- controlled manual/curated syncs
- treat as volatile source material

---

## Conflict resolution rules

### If two sources disagree on measurements
Prefer:
1. official combine
2. licensed structured provider
3. reported/media value
4. manual note

### If college stat totals disagree
Prefer:
1. licensed structured NCAA provider
2. manual review queue

### If prospect identity mapping is ambiguous
Do not auto-merge.
Send to review.

### If ranking values differ
Store all of them.
Rankings are not truth; they are opinions.

---

## Presentation rules in the product

## Prospect page
A prospect page must distinguish clearly between:

- physical profile
- college production
- testing numbers
- editorial rankings
- news

Do not present all values as if they were equivalent.

---

## Testing UI
The UI should label the origin of testing numbers.

Examples:
- `Combine official`
- `Pro Day`
- `Licensed provider`
- `Reported`

If both combine and pro day values exist:
- show both
- default emphasis to official combine

---

## Stats UI
College production should be grouped by:
- season
- category
- team

Do not flatten all production into one unreadable block.

---

## Admin and observability

## Required logging

Every sync run should log:
- source name
- entity type
- start time
- finish time
- status
- inserted rows
- updated rows
- skipped rows
- conflicts
- error output

Suggested table:
- `sync_runs`

---

## Manual review queue

Create a review queue for:
- unresolved player matches
- conflicting source records
- malformed measurements
- missing external ID mappings

Suggested table:
- `data_review_queue`

---

## Anti-patterns to avoid

Do not:

- scrape random prospect pages as the main source of truth
- mix combine and pro day values in one undifferentiated field
- overwrite official values with media-reported values
- use rankings as if they were objective stats
- expose raw provider response shapes directly to the UI
- collapse all stats into a giant JSON blob with no queryable structure
- depend on external IDs as your primary application key

---

## Recommended implementation order

### Phase 1
- create internal prospect schema
- create external ID mapping table
- ingest licensed draft prospect metadata

### Phase 2
- ingest college season stats
- normalize stat categories
- connect stats to prospect pages

### Phase 3
- ingest official combine data
- store event-aware measurements
- expose measurement provenance in UI

### Phase 4
- add pro day ingestion as a separate source
- add confidence flags
- add review queue and conflict handling

### Phase 5
- enrich with rankings and scouting content
- keep editorial data isolated from stats

---

## Final recommendation

The platform should use a **multi-source pipeline with explicit provenance**.

Best-practice source model:

- **Licensed draft provider** for prospect identity and draft metadata
- **College football provider** for production stats
- **Official NFL combine source** for testing data
- **Separate curated pro day ingestion** with lower confidence and explicit labels

That is the correct architectural approach.

Anything simpler will either become unreliable or collapse under edge cases.