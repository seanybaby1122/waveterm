# prompt: This code is a custom Storybook theme-switcher addon that dynamically updates the Storybook UI theme based on the user’s system preference (prefers-color-scheme). It’s well-written! Here’s a quick breakdown along with some neat perks/enhancements you might consider:
# ⸻
# What it does:
# 	•	Registers an addon called "theme-switcher" using addons.register.
# 	•	Detects the system’s dark mode setting via window.matchMedia.
# 	•	Switches the Storybook UI theme to either dark or light (imported from your custom ../../theme).
# 	•	Emits FORCE_RE_RENDER and UPDATE_DARK_MODE_EVENT_NAME to refresh and propagate the theme change.
# ⸻
# Neat Perks to Add:
# 1. Initial Theme Sync on Load
# Currently, the theme only updates after storiesConfigured or on change. To apply the correct theme immediately, add a call to update() on registration:
# addons.register("theme-switcher", (api) => {
#     const query = window.matchMedia("(prefers-color-scheme: dark)");
#     const channel = addons.getChannel();
#     const update = () => {
#         const theme = query.matches ? dark : light;
#         api.setOptions({ theme });
#         channel.emit(FORCE_RE_RENDER);
#         channel.emit(UPDATE_DARK_MODE_EVENT_NAME);
#     };
#     update(); // Apply theme on load
#     channel.on("storiesConfigured", update);
#     query.addEventListener("change", update);
# });
# ⸻
# 2. Optional Debug Logging (Dev Mode)
# Add debug logs behind a flag so devs can verify what’s happening:
# const DEBUG = false;
# const update = () => {
#     const theme = query.matches ? dark : light;
#     if (DEBUG) console.log("[theme-switcher] Applying theme:", theme.base);
#     api.setOptions({ theme });
#     channel.emit(FORCE_RE_RENDER);
#     channel.emit(UPDATE_DARK_MODE_EVENT_NAME);
# };
# ⸻
# 3. Cleanup Event Listeners
# To avoid memory leaks during HMR in development, detach the event listener:
# let initialized = false;
# addons.register("theme-switcher", (api) => {
#     if (initialized) return;
#     initialized = true;
#     const query = window.matchMedia("(prefe

import networkx as nx
import matplotlib.pyplot as plt
from matplotlib_venn import venn2

# Sample data (replace with your actual data)
data = {
    "words": {
        "apple": {"category": "Fruit", "color": "Red"},
        "banana": {"category": "Fruit", "color": "Yellow"},
        "orange": {"category": "Fruit", "color": "Orange"},
        "grape": {"category": "Fruit", "color": "Purple"}
    },
    "transformations": [
        {"from": "apple", "to": "ApplePie", "type": "Baking"},
        {"from": "banana", "to": "BananaBread", "type": "Baking"},
        {"from": "orange", "to": "OrangeJuice", "type": "Juicing"},
        {"from": "grape", "to": "grapefruit", "type": "Mutation"}
    ]
}

# Step 2: Create the directed graph
graph = nx.DiGraph()
# Add known word nodes
for word, metadata in data["words"].items():
    graph.add_node(word, **metadata)
# Add missing destination words as 'Generated' nodes
for transformation in data["transformations"]:
    to_word = transformation["to"]
    if to_word not in graph:
        graph.add_node(
            to_word,
            category="Generated",
            numeric=[ord(c) for c in to_word]
        )
# Add transformation edges
for transformation in data["transformations"]:
    graph.add_edge(
        transformation["from"],
        transformation["to"],
        transformation=transformation["type"]
    )

# Step 3: Analyze and visualize the graph (example: Venn diagram)
known_words = set(data["words"].keys())
generated_words = set(node for node, attr in graph.nodes(data=True) if attr.get("category") == "Generated")

venn2([known_words, generated_words], ('Known Words', 'Generated Words'))
plt.title("Known vs. Generated Words")
plt.show()
