# prompt: {
#     "name": "waveterm",
#     "author": {
#         "name": "Command Line Inc",
#         "email": "info@commandline.dev"
#     },
#     "productName": "Wave",
#     "description": "Open-Source AI-Native Terminal Built for Seamless Workflows",
#     "license": "Apache-2.0",
#     "version": "0.11.2",
#     "homepage": "https://waveterm.dev",
#     "build": {
#         "appId": "dev.commandline.waveterm"
#     },
#     "private": true,
#     "main": "./dist/main/index.js",
#     "type": "module",
#     "browserslist": [
#         "Chrome >= 128"
#     ],
#     "scripts": {
#         "dev": "electron-vite dev",
#         "start": "electron-vite preview",
#         "build:dev": "electron-vite build --mode development",
#         "build:prod": "electron-vite build --mode production",
#         "storybook": "storybook dev -p 6006 --no-open",
#         "build-storybook": "storybook build",
#         "coverage": "vitest run --coverage",
#         "test": "vitest",
#         "postinstall": "electron-builder install-app-deps"
#     },
#     "devDependencies": {
#         "@chromatic-com/storybook": "^3.2.4",
#         "@eslint/js": "^9.20.0",
#         "@rollup/plugin-node-resolve": "^16.0.0",
#         "@storybook/addon-essentials": "^8.5.8",
#         "@storybook/addon-interactions": "^8.5.8",
#         "@storybook/addon-links": "^8.5.8",
#         "@storybook/blocks": "^8.5.8",
#         "@storybook/builder-vite": "^8.5.8",
#         "@storybook/react": "^8.5.8",
#         "@storybook/react-vite": "^8.5.8",
#         "@storybook/test": "^8.5.8",
#         "@storybook/theming": "^8.5.8",
#         "@tailwindcss/vite": "^4.0.6",
#         "@types/color": "^4.2.0",
#         "@types/css-tree": "^2",
#         "@types/debug": "^4",
#         "@types/electron": "^1.6.12",
#         "@types/node": "^22.13.4",
#         "@types/papaparse": "^5",
#         "@types/pngjs": "^6.0.5",
#         "@types/prop-types": "^15",
#         "@types/react": "^18.3.13",
#         "@types/react-dom": "^18.3.1",
#         "@types/semver": "^7",
#         "@types/shell-quote": "^1",
#         "@types/spr

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



# Assuming 'data' and 'graph' are defined from the previous code

# Step 3: Analyze and visualize the graph (example: Venn diagram)
known_words = set(data["words"].keys())
generated_words = set(node for node, attr in graph.nodes(data=True) if attr.get("category") == "Generated")

venn2([known_words, generated_words], ('Known Words', 'Generated Words'))
plt.title("Known vs. Generated Words")
plt.show()
