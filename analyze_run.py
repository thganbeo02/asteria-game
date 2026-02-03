import json

with open('docs/tracked-runs/asteria_camira_medium_20260202_160411.json', 'r') as f:
    data = json.load(f)

run = data['run']
decisions = data['decisions']
combat_log = data.get('combatLog', [])

print(f"--- DETAILED RUN BREAKDOWN: {run['heroId'].upper()} ({run['difficulty'].upper()}) ---")
print(f"Total Encounters: {run['encounter']}")
print(f"Current Level: {run['currentLevel']}")
print(f"Crystals Earned: {run['crystalsEarned']}")
print(f"Crystals Spent: {run['crystalsSpent']}")
print(f"Items Bought: {len(run['purchasedItems'])}")

# Decision analysis
decision_types = {}
for d in decisions:
    kind = d['kind']
    decision_types[kind] = decision_types.get(kind, 0) + 1

print("\n--- DECISION STATS ---")
for kind, count in sorted(decision_types.items(), key=lambda x: x[1], reverse=True):
    print(f"- {kind}: {count}")

# Health trend
print("\n--- HEALTH TREND ---")
health_history = [d['payload'].get('heroHp', 0) for d in decisions if 'payload' in d and 'heroHp' in d['payload']]
if health_history:
    print(f"Starting HP: {health_history[0]}")
    print(f"Lowest HP: {min(health_history)}")
    print(f"Avg HP: {sum(health_history) // len(health_history)}")

# Ability usage
abilities = {}
for d in decisions:
    if d['kind'] == 'cast_ability':
        a_id = d['payload'].get('abilityId')
        abilities[a_id] = abilities.get(a_id, 0) + 1

print("\n--- ABILITY USAGE ---")
for a_id, count in abilities.items():
    print(f"- {a_id}: {count}")

# Shop efficiency
spent = run['crystalsSpent']
items = len(run['purchasedItems'])
avg_cost = spent / items if items > 0 else 0
print(f"\n--- ECONOMY ---")
print(f"Avg Item Cost: {avg_cost:.2f}")
print(f"Potions Used: {run['healthPotionsUsedThisLevel']}")
print(f"Shops Skipped: {run['shopsSkipped']}")

# Monster scaling
print("\n--- MONSTER SCALING (End State) ---")
for m_id, stats in run['monsterSnapshots'].items():
    print(f"- {m_id}: HP {stats['hp']}, ATK {stats['atk']}, DEF {stats['def']}")

