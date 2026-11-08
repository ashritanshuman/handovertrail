# HandoverTrail - Hackathon Round 3 Presentation & Demo Script

> **Theme**: Trustworthy Knowledge Continuity in Software Engineering  
> **Team**: TchieSharks (Ashrit Anshuman Pradhan, Kush Tayal, Amreesh Sharma)

---

## 1. The 60-Second Pitch

> "Every time a senior engineer resigns, months of undocumented architectural decisions, tribal knowledge, unreviewed pull requests, and hidden risks walk out the door with them.
> 
> Existing AI summarizers make things worse: they hallucinate details, expose confidential HR notes to incoming juniors, and present vague guesses as verified facts.
> 
> **HandoverTrail** is an evidence-first, permission-aware knowledge handover platform. It parses all project sources, extracts structured claims, deterministically verifies every single claim against exact source quotes, quarantines conflicts, redacts secrets, and requires human lead sign-off before a successor ever sees a word."

---

## 2. Live Demo Script (Step-by-Step for Judges)

### Step 1: Ingest & The Three Clearance Realities (Start as Lead `Maya`)
1. Click **"Reset & Load CampusConnect Demo"**.
2. Notice the top-right user pill is currently on **Maya Patel (Lead, Clearance 2)**.
3. Observe the raw evidence repository: 52 units spanning GitHub PRs, Jira tasks, meeting minutes, and Slack threads.
4. Switch user to **Arjun Rao (Successor, Clearance 1)**.
   - Instantly show judges that the Level 2 HR thread (Riya's confidential compensation & transition notes) disappears from the feed. The server filtered it *before* returning data.

### Step 2: AI Claim Extraction & Verifier Breakdown
1. Switch back to **Riya Sharma (Leaver)** and click **"Run Extraction & Verification"**.
2. Point out the deterministic status badges:
   - **Green (`Verified`)**: The exact quote exists character-for-character in the ingested evidence.
   - **Yellow (`Inferred`)**: An assumption extracted by AI without a verbatim quote.
   - **Red (`Conflicting`)**: A planted discrepancy is flagged immediately.

### Step 3: Resolving the Conflict & Abandoned PR
1. Filter claims by **"Conflicting"**:
   - Highlight **Claim #4**: *"Inconsistent API key rotation policy."*
   - Show the two evidence citations: GitHub Issue #42 says 30 days; Architecture Meeting Notes say 90 days.
2. Maya clicks **"Resolve & Edit"**, selects 90 days quarterly rotation, and confirms the claim.
3. Switch to **Knowledge Gaps**:
   - Show the auto-flagged gap on **PR #88** (WebSocket reservation leak).
   - Riya types the leaver answer: *"PR #88 has socket leaks. We deployed HTTP SSE polling in PR #94 instead."*

### Step 4: Final Sign-off & Successor Onboarding
1. Maya reviews the readiness percentage (100% verified/resolved) and clicks **"Approve & Freeze Handover v1.0.0"**.
2. Switch user to **Arjun Rao (Successor)**:
   - The Handover tab is now unlocked.
   - Arjun reads the role-tailored handover (Level 1 only, no secrets, no unconfirmed drafts).
   - Arjun clicks **"Acknowledge Handover"**.
   - An immutable audit trail entry is logged.

---

## 3. What Makes HandoverTrail Different?

| Conventional AI Summarizers | HandoverTrail |
|---|---|
| Generates plausible-sounding fiction | **Zero tolerance for unquoted verification** |
| Dumps entire chat history into context | **Deterministic masking of API keys & phone numbers** |
| One flat view for everyone | **Strict clearance boundary (Level 1 vs Level 2 vs Level 3)** |
| Automatic raw publishing | **Lead approval gate with frozen cryptographic snapshots** |

