        items_tuple = tuple(sorted(itemset))
        items_set = frozenset(items_tuple)

        # Get all rules for this itemset
        itemset_rules = []
        for r in rules:
            antec_set = set(r["antecedent"])
            conseq_set = set(r["consequent"])
            if antec_set | conseq_set == items_set:
                itemset_rules.append(r)
