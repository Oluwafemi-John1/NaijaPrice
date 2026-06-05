# Security Specification & Test Harness (NaijaPrice Reports)

## 1. Data Invariants

1. **Price Integrity**: A `PriceReport` must contain a positive price (`price > 0`). Price cannot be negative or zero.
2. **Key Constraints**: Exactly the fields described in the `firebase-blueprint.json` schema must be present on creation to avoid shadow/ghost fields injection.
3. **Immutability of Key Ownership**: On create, the `ownerId` must exactly equal the authenticated user's UID (`request.auth.uid`). Once set, it cannot be modified.
4. **Verifications concept**: Only admins (specifically tracked via `/admins/{adminId}`) can toggle the `verified` badge. General contributors cannot self-verify reports.
5. **Vote Fairness**: The `upvotes`, `downvotes`, and `voters` fields can be updated by signed-in users, but strictly constrained to prevent self-assigned double-voting.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads representing exploits or invalid states targeting the `/reports/{reportId}` collection:

1. **Payload 1: Unauthenticated Creation**
   - *Exploit*: Anonymous/Unauthenticated user attempting to submit a new report.
   - *Expectation*: Rejected (must be signed in).

2. **Payload 2: Identity Spoofing (Owner ID Hijack)**
   - *Exploit*: Authenticated user `user-123` setting `ownerId: "other-user"` to impersonate someone else.
   - *Expectation*: Rejected (ownerId must match auth.uid).

3. **Payload 3: Negative Price Injection**
   - *Exploit*: Setting `price: -2500` to poison price index.
   - *Expectation*: Rejected (price must be positive).

4. **Payload 4: Empty Product Name**
   - *Exploit*: Product name size = 0.
   - *Expectation*: Rejected (productName must be a non-empty string).

5. **Payload 5: Invalid Category Enums**
   - *Exploit*: Setting `category: "luxury"` which is not in the allowed list of categories.
   - *Expectation*: Rejected.

6. **Payload 6: Ghost Field Injection (Shadow Update)**
   - *Exploit*: Adding a non-existent field `ghost_field_exploited` on create.
   - *Expectation*: Rejected (strict schema verification on keys).

7. **Payload 7: Self-Verification (Privilege Escalation)**
   - *Exploit*: Standard contributor submitting with `verified: true`.
   - *Expectation*: Rejected (only verified: false is allowed on creation).

8. **Payload 8: Immutable Field Tampering (Date change on update)**
   - *Exploit*: Tampering with `createdAt` or `dateObserved` during updates.
   - *Expectation*: Rejected (immutable fields).

9. **Payload 9: Upvote Spammer (Unconstrained increment)**
   - *Exploit*: A user attempting to update the report by increasing `upvotes` by `500` in a single update.
   - *Expectation*: Rejected (upvotes must increase or decrease strictly by 1 via correct voting rules).

10. **Payload 10: State Bypass (Deleting reports without privileges)**
    - *Exploit*: Standard user trying to delete a verified/unverified report belonging to somebody else.
    - *Expectation*: Rejected (only the original creator can delete unverified reports, and verified reports are locked).

11. **Payload 11: Mass ID Poisoning (Junk Character Strings as IDs)**
    - *Exploit*: Creating a report with key `${'/'.repeat(50)}` or a 10KB random junk string.
    - *Expectation*: Rejected by `isValidId()` check on keys.

12. **Payload 12: Fake Trend Manipulation**
    - *Exploit*: User attempting to set arbitrary trends e.g. `trend: "apocalyptic"` instead of "up" | "down" | "stable".
    - *Expectation*: Rejected by check.

---

## 3. The Test Runner Reference

A representation of `firestore.rules.test.ts` or automated test rules structure:

```ts
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

// Standard security rules verification test suite
describe("NaijaPrice Security Rules", () => {
  it("forces unauthenticated write to Fail", async () => {
    await assertFails(db.collection("reports").add({ productName: "Rice" }));
  });

  it("fails when ownerId is mismatched", async () => {
    const authDb = getAuthenticatedApp({ uid: "user_abc" });
    await assertFails(authDb.collection("reports").add({
      id: "1",
      productName: "Rice",
      category: "food",
      unit: "Mudu",
      price: 1500,
      trend: "stable",
      marketName: "Bodija",
      state: "Oyo",
      verified: false,
      contributor: "Femi",
      ownerId: "user_hijacked",
      dateObserved: "2026-06-05",
      icon: "🌾",
      upvotes: 0,
      downvotes: 0
    }));
  });

  it("rejects negative pricing", async () => {
    const authDb = getAuthenticatedApp({ uid: "user_abc" });
    await assertFails(authDb.collection("reports").add({
      id: "1",
      productName: "Rice",
      category: "food",
      unit: "Mudu",
      price: -100, // Invalid Neg!
      trend: "stable",
      marketName: "Bodija",
      state: "Oyo",
      verified: false,
      contributor: "Femi",
      ownerId: "user_abc",
      dateObserved: "2026-06-05",
      icon: "🌾",
      upvotes: 0,
      downvotes: 0
    }));
  });
});
```
