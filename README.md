# Patient Roster Matching

A system for matching patient records across two CSV files, identifying potential duplicate or corresponding patients based on demographic fields.

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/hiddenderek/patient-roster-matching.git
   cd patient-roster-matching
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## How the Matching Algorithm Works

The matching algorithm compares two patient records and produces a **confidence score** between 0 and 1 indicating the likelihood that they refer to the same patient.

### Overview

The algorithm uses three mechanisms to compute a match score:

1. **Weighted field similarity**
2. **Interaction boosts**
3. **Mismatch penalties**

---

### 1. Field Normalization & Similarity

Each field in a patient record (name, DOB, address, phone, etc.) is first [**normalized**](app/api/patient/matches/normalizers.ts) to remove formatting inconsistencies (e.g., casing, whitespace, punctuation). Then a [**similarity score**](app/api/patient/matches/patientMatchScore/similarity.ts) (0 to 1) is computed between the two normalized values.

- **Addresses, first names, and last names** use [`getHybridSimilarity`](app/api/patient/matches/patientMatchScore/similarity.ts#L69) with **token subset scoring**. if all tokens of the shorter value appear in the longer one (e.g. `"352 Chelsea Freeway"` vs `"352 Chelsea Freeway Apt 592"`, or `"John"` vs `"John Michael"`), a high similarity is returned rather than penalising the extra tokens. A size penalty scales the score down as the token count gap grows, preventing a single-token value from matching a long string.

- **Phone numbers** are [normalized to space-separated digits](app/api/patient/matches/normalizers.ts#L8) (e.g. `"(555) 123-4567"` -> `"555 123 4567"`), then compared with token subset scoring. This lets a 7-digit local number match a 10-digit number as the 7 digits of the local number are a subset of the full number's digit tokens.

- **All other fields** use [`getHybridSimilarity`](app/api/patient/matches/patientMatchScore/similarity.ts#L69) with **token overlap scoring**, combining Levenshtein distance and Jaccard token overlap.

A field is only considered a "match" if its similarity meets a [**per-field threshold**](app/api/patient/matches/patientMatchScore/index.ts#L39-L48).

### 2. Weighted Field Scoring

Each matched field contributes to the score proportional to its [**discriminatory power**](app/api/patient/matches/patientMatchScore/index.ts#L5-L16):

The base score is the sum of [weight × similarity](app/api/patient/matches/patientMatchScore/index.ts#L102) for all matched fields. This is so that fields are penalized for partial matches (e.g., a 0.8 similarity on a field with weight 0.2 contributes only 0.16 to the total score).

### 3. Interaction Boosts

Certain [**combinations of fields**](app/api/patient/matches/patientMatchScore/index.ts#L18-L30) together are far more identifying than the sum of their parts. For example, matching on first name + last name + date of birth is near-conclusive, but the individual weights alone would only produce a score of ~0.39.

The algorithm checks for known high-value field combinations and applies the [**single largest applicable boost**](app/api/patient/matches/patientMatchScore/index.ts#L112-L129) to the score.

### 4. Mismatch Penalty

For [certain fields](app/api/patient/matches/patientMatchScore/index.ts#L32-L35), a mismatch can be a strong indicator that two records do not match. If such a field is present and does not match, a [penalty is applied](app/api/patient/matches/patientMatchScore/index.ts#L126-L149) to reduce the overall score.

### 5. Scanning

The algorithm is applied to every possible pair of patients across the two files, resulting in a list of potential matches with their confidence scores.

[Indexing and efficient data structures](app/api/patient/matches/scanForPatientMatches.ts#L27-L47) are used to minimize the number of comparisons needed, such as [blocking on certain fields](app/api/patient/matches/scanForPatientMatches.ts#L62-L93) (e.g., only comparing patients with the same last name or DOB).

### Output

The [`getPatientMatchConfidenceScore`](app/api/patient/matches/patientMatchScore/index.ts#L50-L110) function returns:

- A **confidence score** between 0 and 1
- A **list of matched fields** that contributed to the score

The default confidence score threshold is 60% to minimize false positives, but this can be adjusted through a range input.

Confirming a match will add it to the potential matches list which can be reviewed and exported as a CSV for further analysis.

Rejecting a match will remove it from the potential matches list.
