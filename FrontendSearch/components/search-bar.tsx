"use client"

import { useState, useCallback } from "react"
import algoliasearch from "algoliasearch/lite"
import { Search } from "lucide-react"

const searchClient = algoliasearch("O3ZGE4UMEP", "5a7fe612e8e1990438e8e0c0f1975225")
const index = searchClient.initIndex("products-stg-copy-1")

// 🔹 Custom synonym map
const synonymMap: Record<string, string> = {
  bug: "mug",
  coffe: "coffee",
  laptp: "laptop",
  tshrt: "tshirt",
  moblie: "mobile",
}

const normalizeQuery = (q: string) =>
  q
    .split(" ")
    .map((word) => synonymMap[word.toLowerCase()] || word)
    .join(" ")

interface SearchBarProps {
  onResults: (results: any[]) => void
}

export default function SearchBar({ onResults }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [filter, setFilter] = useState("all") // all | withGeo | withoutGeo
  const [isSearching, setIsSearching] = useState(false)

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timer)
      timer = setTimeout(() => func(...args), delay)
    }
  }

  const fetchSuggestions = async (q: string) => {
    if (!q) return setSuggestions([])

    try {
      const res = await fetch(`http://localhost:5000/get-suggestions?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error("Suggestions error:", err)
      setSuggestions([])
    }
  }

  const performSearch = async (q: string, currentFilter: string) => {
    if (!q.trim()) {
      onResults([])
      setSuggestions([])
      return
    }

    setIsSearching(true)

    const normalizedQuery = normalizeQuery(q)
    fetchSuggestions(q)

    try {
      let { hits } = await index.search(normalizedQuery, {
        typoTolerance: "min",
        minWordSizefor1Typo: 4,
        minWordSizefor2Typos: 8,
        filters:
          currentFilter === "withGeo"
            ? "hasGeo:true"
            : currentFilter === "withoutGeo"
            ? "hasGeo:false"
            : undefined,
      })

      onResults(hits)
    } catch (err) {
      console.error("Search error:", err)
      onResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = useCallback(debounce(performSearch, 300), [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    handleSearch(e.target.value, filter)
  }

  const handleFilterChange = (value: string) => {
    setFilter(value)
    handleSearch(query, value)
  }

  const handleSuggestionClick = async (s: string) => {
    setQuery(s)
    setSuggestions([])

    const normalized = normalizeQuery(s)
    try {
      const { hits } = await index.search(normalized, { typoTolerance: "min" })
      onResults(hits)
    } catch (err) {
      console.error(err)
      onResults([])
    }
  }

  const fixGeoLoc = async () => {
    try {
      const res = await fetch("http://localhost:5000/fix-geoloc", { method: "POST" })
      const data = await res.json()
      alert(`✅ Updated: ${data.updatedCount}, Skipped: ${data.skippedCount}`)
    } catch (err) {
      console.error("GeoLoc fix error:", err)
    }
  }

  return (
    <div className="relative mb-8">
      {/* Filters Row */}
      <div className="mb-4 flex items-center gap-4">
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="all">All Products</option>
          <option value="withGeo">With GeoLoc</option>
          <option value="withoutGeo">Without GeoLoc</option>
        </select>

        <button
          onClick={fixGeoLoc}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Fix Missing GeoLoc
        </button>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={handleInputChange}
          className="w-full rounded-full border-2 py-3 pl-12 pr-4 text-gray-900 shadow-md outline-none transition-all duration-200 placeholder:text-gray-400 border-gray-200 hover:border-gray-300"
        />
      </div>

      {/* Suggestion Dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="cursor-pointer border-b border-gray-100 px-4 py-3 text-gray-700 transition-colors last:border-b-0 hover:bg-blue-50 hover:text-blue-600"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
