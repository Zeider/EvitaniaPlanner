# Talent Tree Review

Please correct any errors below. Nodes marked with `*` are active skills. Numbers in parentheses are max points.

Each tier flows left-to-right. Nodes within a tier are listed top-to-bottom.

---

## Novice (shared, all classes) Novice only has 3 columns, if a row only has 1 column it should be centered, for example T0_0 should be at the same horizontal position as T1_1 which is the middle of the tree

```mermaid
graph LR
    T0["T0"]
    T1["T1"]
    T2["T2"]
    T3["T3"]

    T0_0["Attack Damage<br/>ATK +1<br/>(1)"]

    T1_0["More Hp<br/>HP +5<br/>(1)"]
    T1_1["Attack Damage<br/>ATK +1<br/>(1)"]
    T1_2["More Defence<br/>DEF +1<br/>(1)"]

    T2_0["More Levels<br/>BonusXP +5<br/>(1)"]
    T2_1["Attack Damage<br/>ATK +1<br/>(1)"]
    T2_2["More Loot<br/>MF +5<br/>(1)"]

    T3_0["Attack Damage<br/>ATK +1<br/>(1)"]

    T0_0 --> T1_1 & T1_0 & T1_2
    T1_0 --> T2_0
    T1_1 --> T2_1
    T1_2 --> T2_2
    T2_0 --> T3_0
    T2_1 --> T3_0
    T2_2 --> T3_0
```

**Total: 8 nodes**

---

## Rogue

```mermaid
graph LR
    T0_0["T0: Piercing Arrow*<br/>Launches an arrow that pierces through enemies dealing 100% ATK daamge. CD: 5 Mana: 6<br/>(1)"]

    T1_0["T1: Crit Chance<br/>+2% per pt<br/>(2)"]
    T1_1["T1: Attack!<br/>+1 per pt<br/>(2)"]
    T1_2["T1: Defence<br/>+1 per pt<br/>(2)"]
    T1_3["T1: Attack Speed<br/>+1% per pt<br/>(3)"]

    T2_0["T2: Maximum Mana<br/>+5 per pt<br/>(2)"]
    T2_1["T2: Maximum HP<br/>+5 per pt<br/>(2)"]
    T2_2["T2: Attack!<br/>+1 per pt<br/>(2)"]

    T3_0["T3: Magic Find<br/>+1 per pt<br/>(5)"]
    T3_1["T3: Defence<br/>+1 per pt<br/>(3)"]
    T3_2["T3: Crit Chance<br/>+1% per pt<br/>(3)"]
    T3_3["T3: Mana Regen<br/>+1 per pt<br/>(1)"]

    T4_0["T4: Defence<br/>+1 per pt<br/>(2)"]
    T4_1["T4: Movespeed<br/>+10% per pt<br/>(3)"]
    T4_2["T4: Movement Speed*<br/>Increases Movement Speed by 20% for 15 seconds. CD: 60 Mana: 3<br/>(1)"]

    T5_0["T5: ATK Speed<br/>+1% per pt<br/>(7)"]
    T5_1["T5: Attack!<br/>+1 per pt<br/>(5)"]
    T5_2["T5: Critical Damage<br/>+2% per pt<br/>(10)"]
    T5_3["T5: Improved Arrow<br/>Increases Piercing Arrow ATK +85% scaling<br/>(1)"]

    T6_0["T6: Mana Regen<br/>+1 per pt<br/>(1)"]
    T6_1["T6: Attack!<br/>+1 per pt<br/>(5)"]
    T6_2["T6: Maximum Mana<br/>+5 per pt<br/>(3)"]
    T6_3["T6: Magic Find<br/>+1 per pt<br/>(5)"]

    T7_0["T7: Maximum HP<br/>+10 per pt<br/>(5)"]
    T7_1["T7: Crit Chance<br/>+1% per pt<br/>(5)"]
    T7_2["T7: Defence<br/>+1 per pt<br/>(5)"]
    T7_3["T7: Rapid Fire*<br/>EMpowers the caster, significantly increasing Attack Speed by 50% for 20 seconds. CD: 120, Mana:3<br/>(1)"]

    T8_0["T8: ATK%<br/>+1% per pt<br/>(5)"]
    T8_1["T8: Defence<br/>+1 per pt<br/>(5)"]
    T8_2["T8: ATK Speed<br/>+1% per pt<br/>(10)"]
    T8_3["T8: Arrow Barrage<br/>Creates an Arrow Rain that deals 80% ATK damage to all enemies in an area each second, lasts for 5 seconds. CD: 15, Mana: 6<br/>(1)"]

    T9_0["T9: Magic Find<br/>+1 per pt<br/>(10)"]
    T9_1["T9: Mana Regen<br/>+1 per pt<br/>(3)"]
    T9_2["T9: Crit Chance<br/>+1% per pt<br/>(10)"]

    T10_0["T10: ATK%<br/>+1% per pt<br/>(10)"]
    T10_1["T10: Crit Damage<br/>+2% per pt<br/>(10)"]
    T10_2["T10: Improved Arrow<br/>Increases Piercing Arrow ATK +85% scaling<br/>(1)"]
    T10_3["T10: Movespeed<br/>+10% per pt<br/>(2)"]

    T0_0 --> T1_0 & T1_1 & T1_2 & T1_3
    T1_1 --> T2_0 & T2_1
    T1_2 --> T2_1 & T2_2
    T1_3
    T2_0 --> T3_0 & T3_1
    T2_1 --> T3_1 & T3_2
    T2_2 --> T3_2 & T3_3
    T3_0
    T3_1 --> T4_0
    T3_2
    T3_3 --> T4_0 & T4_2
    T4_0 --> T4_1 & T5_0 & T5_1 & T5_2
    T4_1
    T4_2 --> T5_3
    T5_0
    T5_1 --> T6_0 & T6_1 & T6_2
    T5_2 --> T6_3
    T5_3
    T6_0 --> T7_0
    T6_1 --> T7_1
    T6_2 --> T7_1 & T7_2 & T7_3
    T6_3
    T7_0 --> T8_0 & T8_1
    T7_1
    T7_2 --> T8_1 & T8_2 & T8_3
    T7_3
    T8_0 --> T9_0 & T9_1
    T8_1 --> T9_1 & T9_2
    T8_2
    T8_3
    T9_0
    T9_1 --> T10_0 & T10_1 & T10_2
    T9_2 --> T10_3
```



---

## Warrior

```mermaid
graph LR
    T0_0["T0: Cleave*<br/>Strikes enemies in front of the caster, dealing 100% ATK damage. CD:3, Mana:3<br/>(1)"]

    T1_0["T1: Bonus XP<br/>+5% per pt<br/>(3)"]
    T1_1["T1: Defence<br/>+1 per pt<br/>(3)"]
    T1_2["T1: Attack!<br/>+1 per pt<br/>(2)"]
    T1_3["T5: Movespeed<br/>+10% per pt<br/>(2)"]

    T2_0["T2: Last Stand*<br/>Grants the cast a burst of vitality, instantly increasing HP by 500 and healing the caster for the same amount. CD: 60, Mana: 3<br/>(1)"]
    T2_1["T2: Magic Find<br/>+1 per pt<br/>(5)"]
    T2_2["T2: Mana Regen<br/>+1 per pt<br/>(1)"]
    T2_3["T2: Maximum mana<br/>+5 per pt<br/>(2)"]

    T3_0["T3: Attack!<br/>+1 per pt<br/>(3)"]
    T3_1["T3: Maximum Mana<br/>+5 per pt<br/>(3)"]
    T3_2["T3: Improved Cleave<br/>Increase Cleave ATK Scaling +125% per pt<br/>(1)"]
    T3_3["T3: Defence<br/>+1 per pt<br/>(5)"]

    T4_0["T4: Magic Find<br/>+1 per pt<br/>(5)"]
    T4_1["T4: Mana Regen<br/>+1 per pt<br/>(1)"]
    T4_2["T4: Defence<br/>+1 per pt<br/>(5)"]
    T4_3["T4: Crit Chance<br/>+2% per pt<br/>(5)"]

    T5_0["T5: Defence<br/>+2 per pt<br/>(2)"]
    T5_1["T5: Attack Speed<br/>+1% per pt<br/>(5)"]
    T5_2["T5: Critical Damage<br/>+2% per pt<br/>(5)"]

    T6_0["T6: Attack!<br/>+1 per pt<br/>(5)"]
    T6_1["T6: Magic Find<br/>+1 per pt<br/>(5)"]
    T6_2["T6: Max HP<br/>+5 per pt<br/>(4)"]
    T6_3["T6: Defence<br/>+1 per pt<br/>(5)"]

    T7_0["T7: Dragon Soul*<br/>Empowers the caster with the soul of a dragon, temporarily increasing ATK by 50% for 20 seconds. CD: 120, Mana: 3<br/>(1)"]
    T7_1["T7: Crit Chance<br/>+2% per pt<br/>(5)"]
    T7_2["T7: Movespeed<br/>+10% per pt<br/>(2)"]
    T7_3["T7: Blade Strike*<br/>Strikes enemies with huge strike, dealing 150% ATK damage to all enemies in front of the warrior. CD: 15, Mana: 6<br/>(1)"]

    T8_0["T8: Critical Damage<br/>+2% per pt<br/>(10)"]
    T8_1["T8: Bonus XP<br/>+5% per pt<br/>(7)"]
    T8_2["T8: Max HP<br/>+5 per pt<br/>(5)"]
    T8_3["T8: Mana Regen<br/>+1 per pt<br/>(3)"]

    T9_0["T9: Attack Percent<br/>+1% per pt<br/>(5)"]
    T9_1["T9: Defence<br/>+1 per pt<br/>(5)"]
    T9_2["T9: Attack Speed<br/>+1% per pt<br/>(10)"]
    T9_3["T9: Attack Percent<br/>+1% per pt<br/>(5)"]

    T10_0["T10: Defence<br/>+1 per pt<br/>(10)"]
    T10_1["T10: Crit Chance<br/>+2% per pt<br/>(5)"]
    T10_2["T10: Improved Cleave<br/>Increases Cleave ATK scaling +125% per pt<br/>(1)"]

    T0_0 --> T1_0 & T1_1 & T1_2
    T1_1 --> T2_0 & T2_1
    T1_2 --> T2_2 & T2_3 & T1_3
    T2_0 --> T3_0
    T2_2 --> T3_1
    T2_3 --> T3_2 & T3_3
    T3_0 --> T4_0
    T3_1 --> T4_1
    T3_2 --> T4_2 & T4_3
    T3_3 --> T4_2 & T4_3
    T4_1 --> T5_0 & T5_1
    T4_2 --> T5_2
    T5_0 --> T6_0 & T6_1 & T6_2 & T6_3
    T6_0 --> T7_1
    T6_2 --> T7_1 & T7_3
    T7_1 --> T8_0 & T8_1 & T8_2 & T8_3 & T7_0 & T7_2
    T8_2 --> T9_0
    T8_3 --> T9_1 & T9_2 & T9_3
    T9_0 --> T10_0
    T9_1 --> T10_0
    T9_3 --> T10_1 & T10_2
```


---

## Mage

```mermaid
graph LR
    T0_0["T1: Lightning Orb*<br/>Launches a lightning orb dealing 100% ATK +50 damage to enemies in its path. CD: 5, Mana: 6<br/>(10)"]

    T1_0["T1: Maximum mana<br/>+5 per pt<br/>(1)"]
    T1_1["T1: Attack!<br/>+1 per pt<br/>(2)"]
    T1_2["T1: Bonus XP<br/>+5% per pt<br/>(5)"]

    T2_0["T2: Magic Find<br/>+1 per pt<br/>(5)"]
    T2_1["T2: Movespeed<br/>+5% per pt<br/>(2)"]

    T3_0["T3: Attack!<br/>+1 ATK<br/>(5)"]
    T3_1["T3: Maximum mana<br/>+5 per pt<br/>(2)"]
    T3_2["T3: Magic Find<br/>+1 per pt<br/>(5)"]
    T3_3["T3: Ice Armor*<br/>Covers caster with ice for 15 seconds increasing Phys. Defence by 50. CD: 60, Mana: 3<br/>(1)"]

    T4_0["T4: Critical Damage<br/>+2% per pt<br/>(5)"]
    T4_1["T4: Mana Regen<br/>+1 per pt<br/>(2)"]
    T4_2["T4: Max HP<br/>+5 per pt<br/>(5)"]
    T4_3["T4: Defence<br/>+1 per pt<br/>(3)"]

    T5_0["T5: Lightning Strike*<br/>Calls for 5 Lightning Strikes, each dealing 30% ATK damage to random enemy. CD: 15, Mana: 6<br/>(1)"]
    T5_1["T5: Maximum mana<br/>+5 per pt<br/>(5)"]

    T6_0["T6: Bonus XP<br/>+5% per pt<br/>(10)"]
    T6_1["T6: Attack Speed<br/>+1% per pt<br/>(10)"]
    T6_2["T6: Defence<br/>+1 per pt<br/>(4)"]
    T6_3["T6: Improved Lightning Orb<br/>Increases Lightning orb ATK scaling<br/>(1)"]

    T7_0["T7: Attack!<br/>+1 per pt<br/>(5)"]
    T7_1["T7: Crit Chance<br/>+1% per pt<br/>(5)"]
    T7_2["T7: Mana Regen<br/>+1 per pt<br/>(5)"]
    T7_3["T7: Mage Supremacy*<br/>Gathers lightning around the caster for 20 seconds making all attacks deal critical damage. CD: 120, Mana3<br/>(1)"]

    T8_0["T8: Attack Percent<br/>+1% per pt<br/>(5)"]
    T8_1["T8: Magic Find<br/>+1 per pt<br/>(10)"]
    T8_2["T8: Maximum mana<br/>+5 per pt<br/>(5)"]
    T8_3["T8: Critical Damage<br/>+2% per pt<br/>(5)"]

    T9_0["T9: Crit Chance<br/>+1% per pt<br/>(5)"]
    T9_1["T9: Defence<br/>+1 per pt<br/>(10)"]
    T9_2["T9: Mana Regen<br/>+1 per pt<br/>(7)"]

    T10_0["T10: Improved Lightning Orb<br/>Increases Lightning orb ATK Scaling +85%<br/>(1)"]
    T10_1["T10: Magic Find<br/>+1 per pt<br/>(10)"]
    T10_2["T10: Attack Perfect<br/>+1% per pt<br/>(5)"]

   T0_0 --> T1_0 & T1_1 & T1_2
   T1_0 --> T2_0
   T1_1 --> T2_0
   T2_0 --> T3_0 & T3_1 & T3_2 & T2_1
   T2_1 --> T3_3
   T3_0 --> T4_0 & T4_1 & T4_2
   T3_1 --> T4_2 & T4_3
   T4_1 --> T5_1
   T4_2 --> T5_1
   T4_3 --> T5_1
   T5_1 --> T5_0 & T6_0 & T6_1 & T6_2 & T6_3
   T6_2 --> T7_0 & T7_1 & T7_2 & T7_3
   T7_0 --> T8_0 & T8_1
   T7_2 --> T8_1 & T8_2 & T8_3
   T8_0 --> T9_0
   T8_2 --> T9_0 & T9_1 & T9_2
   T9_0 --> T10_0 & T10_1
   T9_1 --> T10_1 & T10_2
   T9_2 --> T10_2
```


---

## Ash Tree (Act 2 Bonfire)

This is what we currently have in `ash-upgrades.json`. Please correct everything — order, names, effects, max ranks, connections, and costs.

**Cost note:** The save file doesn't store ash costs, so I can't extract them. For nodes you've already bought, write "cost: ?" and we'll fill in later. For unpurchased nodes, record the ash cost shown in-game.

```mermaid
graph LR
    T0_0["T0: Attack Increase<br/>+30% per pt<br/>(1) cost: ?"]

    T1_0["T1: Fuel Efficiency<br/>-5% consumption per pt<br/>(3) cost: ?"]
    T1_1["T1: Attack Increase<br/>+30% per pt<br/>(1) cost: ?"]
    T1_2["T1: Smeltery Speed<br/>+10% per pt<br/>(1) cost: ?"]

    T2_0["T2: Maximum Fuel<br/>+10000 capacity<br/>(1) cost: ?"]
    T2_1["T2: More Ash<br/>+15% ash odds per pt<br/>(3) cost: ?"]
    T2_2["T2: Fiery Defence<br/>+5 phys def per pt<br/>(4) cost: ?"]
    T2_3["T2: Hunter Cost Reduction<br/>-50% hunter costs per pt<br/>(5) cost: ?"]

    T3_0["T3: Crit Damage<br/>+10% crit dmg per pt<br/>(3) cost: ?"]
    T3_1["T3: Ash Discount<br/>-10% ash costs<br/>(1) cost: ?"]
    T3_2["T3: Smeltery Speed<br/>+10% per pt<br/>(1) cost: ?"]
    T3_3["T3: Movespeed<br/>+5% per pt<br/>(2) cost: ?"]

    T4_0["T4: Crit Chance<br/>+1% crit chance per pt<br/>(4) cost: ?"]
    T4_1["T4: Rune Overload<br/>Runes stack in inventory<br/>(1) cost: ?"]

    T5_0["T5: Defence Increase<br/>+5% phys def per pt<br/>(5) cost: ?"]
    T5_1["T5: Attack Increase<br/>+30% per pt<br/>(1) cost: ?"]

    T6_0["T6: Fuel Efficiency<br/>-5% consumption per pt<br/>(3) cost: ?"]
    T6_1["T6: More Ash<br/>+15% ash odds per pt<br/>(3) cost: ?"]

    T7_0["T7: Attack Increase<br/>+30% per pt<br/>(1) cost: ?"]
    T7_1["T7: More Ash<br/>+15% ash odds per pt<br/>(3) cost: ?"]

    T8_0["T8: Maximum Fuel<br/>+10000 capacity<br/>(6) cost: ?"]
    T8_1["T8: Smeltery Speed<br/>+10% per pt<br/>(3) cost: ?"]

    T9_0["T9: Auto Runes<br/>Runes auto-enter inventory<br/>(1) cost: ?"]

    T10_0["T10: Smeltery Speed<br/>+7% per pt<br/>(4) cost: ?"]

    T0_0 --> T1_0 & T1_1 & T1_2
    T1_0 --> T2_0
    T1_1 --> T2_1 & T2_2
    T1_2 --> T2_3
    T2_0 --> T3_0
    T2_1 --> T3_0
    T2_2 --> T3_0
    T2_3 --> T3_3
    T3_0 --> T4_0 & T4_1 & T3_1
    T3_1 --> T3_2
    T4_0 --> T5_0 & T5_1
    T5_0 --> T6_0
    T5_1 --> T6_1
    T6_0 --> T7_0
    T6_1 --> T7_1
    T7_0 --> T8_0
    T7_1 --> T8_0 & T8_1
    T8_1 --> T9_0
    T9_0 --> T10_0
```

**Total: 16 nodes across 6 rows**

**What to correct:**
- Node names, effects, max ranks
- Add/remove/reorder nodes
- Fix connections (I guessed 1-to-1 down each column — probably wrong)
- Add ash cost per rank where you can see it

---

## How to correct

Edit this file and:
1. Add/remove/move nodes to the correct tier
2. Fix stat names or maxPoints values
3. Fix skill names
4. Note any connection patterns that aren't "all nodes in prev tier connect to all in next tier"

Save and tell me when done — I'll reingest into talents.json.
