import assert from "node:assert/strict";
import { test } from "node:test";
import { agentDeletionBlocker, formatAgentName, splitAgentName } from "./agent-logic";

test("nom d’agent : Prénom NOM", () => {
  assert.equal(formatAgentName(" Neisse ", "engani"), "Neisse ENGANI");
  assert.equal(formatAgentName("Élodie", "kabila  mbuyi"), "Élodie KABILA MBUYI");
  assert.equal(formatAgentName("Neisse", ""), "Neisse");
});

test("découpe le nom pour l’édition", () => {
  assert.deepEqual(splitAgentName("Neisse ENGANI"), { firstName: "Neisse", lastName: "ENGANI" });
  assert.deepEqual(splitAgentName("Élodie KABILA MBUYI"), { firstName: "Élodie", lastName: "KABILA MBUYI" });
  assert.deepEqual(splitAgentName(""), { firstName: "", lastName: "" });
});

test("un agent avec historique ne peut pas être supprimé", () => {
  assert.equal(agentDeletionBlocker({ activities: 0, tasks: 0 }), null);
  assert.match(agentDeletionBlocker({ activities: 3, tasks: 1 }) ?? "", /3 activités, 1 tâche/);
  assert.match(agentDeletionBlocker({ activities: 0, tasks: 2 }) ?? "", /2 tâches/);
});
