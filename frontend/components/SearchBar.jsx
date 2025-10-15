import { useState } from "react";
import algoliasearch from "algoliasearch/lite";

const searchClient = algoliasearch(
  "O3ZGE4UMEP",
  "5a7fe612e8e1990438e8e0c0f1975225"
);
const index = searchClient.initIndex("products-stg-copy-1");

// 🔹 Custom synonym map (expand karte raho as needed)
const synonymMap = {
  bug: "mug",
  coffe: "coffee",
  laptp: "laptop",
  tshrt: "tshirt",
  moblie: "mobile",
};

// 🔹 Normalize query with synonyms
const normalizeQuery = (q) => {
  return q
    .split(" ")
    .map((word) => synonymMap[word.toLowerCase()] || word)
    .join(" ");
};

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (q) => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/get-suggestions?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Suggestions error:", err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);

    if (q.trim().length === 0) {
      onResults([]);
      setSuggestions([]);
      return;
    }

    fetchSuggestions(q); // 🔹 fetch suggestions while typing

    // Step 1: Normalize query with synonyms
    const normalizedQuery = normalizeQuery(q);

    // Step 2: Full query search with typo tolerance
    let { hits } = await index.search(normalizedQuery, {
      typoTolerance: "min",
      minWordSizefor1Typo: 4,
      minWordSizefor2Typos: 8,
    });

    // Step 3: Fallback word-by-word if still no results
    if (hits.length === 0) {
      const words = normalizedQuery.split(" ").filter(Boolean);
      let combinedResults = [];

      for (const word of words) {
        const { hits: wordHits } = await index.search(word, {
          typoTolerance: "min",
        });
        combinedResults = [...combinedResults, ...wordHits];
      }

      let { hits: fallbackHits } = await index.search(q, {
        removeWordsIfNoResults: "allOptional",
      });

      // Remove duplicates
      const uniqueResults = Array.from(
        new Map([...combinedResults, ...fallbackHits].map((item) => [item.objectID, item])).values()
      );

      hits = uniqueResults;
    }

    onResults(hits);
  };

  const handleSuggestionClick = (s) => {
    setQuery(s);
    setSuggestions([]);
    index.search(s).then(({ hits }) => {
      onResults(hits);
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="🔍 Search products..."
        value={query}
        onChange={handleSearch}
        style={{
          padding: "10px",
          width: "300px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "20px",
        }}
      />

      {/* 🔹 Suggestion Dropdown */}
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "60px",
            left: 0,
            width: "300px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
            listStyle: "none",
            padding: "5px",
            margin: 0,
            zIndex: 10,
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
